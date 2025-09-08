Got it 🚀 You want me to turn your route list + flow into a **README-style architecture doc**. Here’s a clean version:

---

# 🔐 Backend API Architecture

This project provides a modular and scalable backend API with authentication, user management, admin utilities, and payments integration. The architecture is designed around Express.js, JWT authentication, Stripe for payments, and Mongoose for database operations.

---

## 📌 Core Architecture

```
Client (Frontend / SDK / API Client)
   ↓
Route (Express Router)
   ↓
Middleware (auth, rateLimit, upload, validation, etc.)
   ↓
Controller (Business logic, DB operations, audit logs)
   ↓
Model (Mongoose Schemas: User, ApiKey, CreditTransaction, etc.)
   ↓
Response (JSON, status codes, cookies if needed)
```

---

## 🔑 Authentication Routes (`/api/auth`)

### **POST /signup**

* **Controller**: `authController.signup(req, res)`
* **Input**: `{ email, password, name }`
* **Output**: `{ message, accessToken, user }`

### **POST /login**

* **Controller**: `authController.login(req, res)`
* **Input**: `{ email, password }`
* **Output**: `{ accessToken, user }`

### **POST /refresh**

* **Controller**: `authController.refreshToken(req, res)`
* **Input**: *(refresh\_token cookie)*
* **Output**: `{ accessToken }`

### **POST /logout**

* **Controller**: `authController.logout(req, res)`
* **Input**: *(refresh\_token cookie)*
* **Output**: `{ message }`

---

## 👤 User Routes (`/api/user`)

### **GET /profile**

* **Controller**: `userController.getProfile(req, res)`
* **Input**: `(access_token)`
* **Output**: `{ user }`

### **GET /credits**

* **Controller**: `userController.getCredits(req, res)`
* **Input**: `(access_token)`
* **Output**: `{ credits }`

### **POST /upload**

* **Middleware**: `uploadMiddleware`
* **Controller**: `userController.uploadFile(req, res)`
* **Input**: `(access_token, file in form-data)`
* **Output**: `{ message, credits, file }`

### **POST /report**

* **Controller**: `userController.generateReport(req, res)`
* **Input**: `(access_token, report params)`
* **Output**: `{ message, credits, reportId }`

### **GET /transactions**

* **Controller**: `userController.getCreditTransactions(req, res)`
* **Input**: `(access_token, pagination)`
* **Output**: `{ transactions, pagination }`

---

## 🛠 Admin Routes (`/api/admin`)

### **POST /credits**

* **Controller**: `adminController.addCredits(req, res)`
* **Input**: `{ userId, amount }`
* **Output**: `{ message, credits }`

### **POST /api-key**

* **Controller**: `adminController.createApiKey(req, res)`
* **Input**: `{ name, scopes, expiresInDays }`
* **Output**: `{ apiKey, expiresAt }`

### **GET /users**

* **Controller**: `adminController.getUsers(req, res)`
* **Input**: `(access_token)`
* **Output**: `{ users, pagination }`

---

## 💳 Payments Routes (`/api/payments`)

### **POST /create-checkout-session**

* **Controller**: `paymentController.createCheckoutSession(req, res)`
* **Input**: `{ credits, amount, currency }`
* **Output**: `{ sessionId, url }`

### **POST /webhook**

* **Controller**: `paymentController.handleWebhook(req, res)`
* **Input**: *(Stripe webhook payload)*
* **Output**: `{ received: true }`

### **GET /history**

* **Controller**: `paymentController.getPaymentHistory(req, res)`
* **Input**: `(access_token, pagination)`
* **Output**: `{ transactions, pagination }`

---

## 🏗 Tech Stack

* **Framework**: Express.js
* **Database**: MongoDB + Mongoose
* **Auth**: JWT (Access + Refresh tokens)
* **Payments**: Stripe (Checkout + Webhooks)
* **File Uploads**: Multer / Cloud Storage
* **Middleware**: Auth, Rate Limiting, Upload, Logging

---

## ⚡ General Flow

1. **Request** hits route (`/api/...`).
2. **Middleware** validates authentication, rate limits, or processes uploads.
3. **Controller** executes business logic, interacts with DB, and logs events.
4. **Models (Mongoose)** handle persistence (Users, ApiKeys, Credits, Transactions).
5. **Response** is returned as JSON, with appropriate status codes & cookies (if needed).

## FOLDER STRUCTURE
--------------------------------------------
credit-saas-backend/
├── config/
│   ├── database.js
│   └── stripe.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── adminController.js
│   ├── paymentController.js
│   └── serviceController.js
├── middleware/
│   ├── auth.js
│   ├── rateLimit.js
│   ├── validation.js
│   └── apiKeyAuth.js
├── models/
│   ├── User.js
│   ├── ApiKey.js
│   ├── Audit.js
│   └── CreditTransaction.js
├── routes/
│   ├── auth.js
│   ├── user.js
│   ├── admin.js
│   ├── payments.js
│   └── service.js
├── utils/
│   ├── crypto.js
│   ├── tokens.js
│   └── auditLogger.js
├── .env
├── package.json
├── server.js
└── README.md

-------------------------------------------