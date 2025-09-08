const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { hashPassword, hashToken, compareTokenHash } = require('../utils/crypto');
const { generateAccessToken, generateRefreshToken, calculateExpiry } = require('../utils/tokens');
const auditLogger = require('../utils/auditLogger');

async function signup(req, res) {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    let passwordHash = ""
    try {
      passwordHash = await hashPassword(password);
    }
    catch {
      console.log("failed to hash the pass")
    }


    const user = new User({
      email,
      passwordHash,
      name,
  credits: 50
    });

    const userCreated = await user.save();
    if (userCreated) {
      console.log("user created successfully");
    }
    else {
      console.log("user failed to be created successfully");
    }

    const creditTransaction = new CreditTransaction({
      userId: user._id,
      type: 'signup_bonus',
      amount: 50,
      balanceAfter: 50,
      description: 'Signup bonus credits'
    });

    const transactionCreated = await creditTransaction.save();
    if (transactionCreated) {
      console.log("transaction created successfully");
    }
    else {
      console.log("transaction failed to be created successfully");
    }

    await auditLogger.log('user', user._id.toString(), 'signup', {
      email: user.email,
      name: user.name
    }, req.ip, req.get('User-Agent'));

    const accessToken = await generateAccessToken(user._id, user.role);
    const refreshToken = await generateRefreshToken();
    const refreshTokenHash = await hashToken(refreshToken);
    const refreshTokenExpiry = await calculateExpiry(7); // 7 days

    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiry
    });

    await user.save();


    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
  maxAge: 15 * 60 * 1000
    });

    res.status(201).json({
      message: 'User created successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    await auditLogger.log('user', user._id.toString(), 'login', {
      email: user.email
    }, req.ip, req.get('User-Agent'));

  const accessToken = await generateAccessToken(user._id, user.role);
  const refreshToken = await generateRefreshToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const refreshTokenExpiry = await calculateExpiry(7); // 7 days

    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiry
    });

    await user.save();


    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
  maxAge: 15 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const users = await User.find({ 'refreshTokens.expiresAt': { $gte: new Date() } });
    let tokenOwner = null;
    let tokenIndex = -1;

    for (const user of users) {
      for (let i = 0; i < user.refreshTokens.length; i++) {
        const tokenData = user.refreshTokens[i];
        const isMatch = await compareTokenHash(refreshToken, tokenData.tokenHash);

        if (isMatch) {
          tokenOwner = user;
          tokenIndex = i;
          break;
        }
      }
      if (tokenOwner) break;
    }

    if (!tokenOwner) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    tokenOwner.refreshTokens.splice(tokenIndex, 1);

  const newAccessToken = await generateAccessToken(tokenOwner._id, tokenOwner.role);
  const newRefreshToken = await generateRefreshToken();
  const newRefreshTokenHash = await hashToken(newRefreshToken);
  const newRefreshTokenExpiry = await calculateExpiry(7); // 7 days

    tokenOwner.refreshTokens.push({
      tokenHash: newRefreshTokenHash,
      expiresAt: newRefreshTokenExpiry
    });

    await tokenOwner.save();

    await auditLogger.log('user', tokenOwner._id.toString(), 'token_refreshed', {}, req.ip, req.get('User-Agent'));

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      const users = await User.find({});
      let found = false;
      for (const user of users) {
        for (let i = 0; i < user.refreshTokens.length; i++) {
          const tokenData = user.refreshTokens[i];
          if (await compareTokenHash(refreshToken, tokenData.tokenHash)) {
            user.refreshTokens.splice(i, 1);
            await user.save();
            found = true;
            break;
          }
        }
        if (found) break;
      }
      res.clearCookie('refresh_token');
      if (req.user && req.user._id) {
        await auditLogger.log('user', req.user._id.toString(), 'logout', {}, req.ip, req.get('User-Agent'));
      }
      return res.json({ message: 'Logged out successfully' });
    } else {
      return res.status(401).json({ error: 'Please login first' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  signup,
  login,
  refreshToken,
  logout
};