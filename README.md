# Multi-Tenant Email Service API

A centralized, secure Multi-Tenant Email Service API built with **Node.js**, **Express**, **SQLite**, and **Nodemailer**, integrating with **Zoho Mail**. It provides OIDC/OAuth2-style token authentication (JWT access tokens and refresh tokens) and a complete suite of Admin and Email Dispatch APIs.

---

## Features

- **Client Registration & Management**: Securely register client applications with hashed secrets (`bcrypt`).
- **Token-Based Authentication**: Login flow providing short-lived JWT access tokens and long-lived refresh tokens.
- **Zoho Mail Integration**: Send emails via Zoho SMTP with support for custom SMTP/sender overrides.
- **Admin & Monitoring APIs**: Track usage statistics, email delivery logs, delivery failures, audit trails, and manage SMTP credentials.

---

## Project Structure

```text
bestbee-sabashi-emailservice/
├── data/                    # SQLite database storage
├── src/
│   ├── config/              # Configuration & environment loader
│   ├── controllers/         # Request handlers (Auth, Admin, Email)
│   ├── database/            # SQLite schema & connection initialization
│   ├── middleware/          # JWT authentication & admin authorization
│   ├── routes/              # Express API routers (auth, admin, email)
│   ├── app.js               # Express application setup
│   └── server.js            # Server entry point
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── test.js                  # Integration test suite
└── README.md                # Documentation
```

---

## Getting Started

### 1. Installation

Clone or download the repository, then install dependencies:

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and configure your settings:

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_DAYS=30

# Default Zoho Mail SMTP Configuration
ZOHO_EMAIL=support@example.com
ZOHO_PASSWORD=your_zoho_app_password
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587

# Admin Protection Header Key
ADMIN_KEY=admin_secret_key
```

### 3. Running the Application

- **Production / Normal Mode**:
  ```bash
  npm start
  ```
- **Development Mode (with auto-restart)**:
  ```bash
  npm run dev
  ```
- **Run Tests**:
  ```bash
  node test.js
  ```

---

## API Endpoints Reference

### 1. Authentication APIs (`/api/auth`)

#### **Login**

- **URL**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "clientId": "client_abc123",
    "clientSecret": "your_client_secret"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "a3f8c...hash",
    "expiresIn": "60m"
  }
  ```

#### **Refresh Access Token**

- **URL**: `POST /api/auth/refresh`
- **Body**:
  ```json
  {
    "refreshToken": "a3f8c...hash"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": "60m"
  }
  ```

#### **Logout / Revoke Session**

- **URL**: `POST /api/auth/logout`
- **Body**:
  ```json
  {
    "refreshToken": "a3f8c...hash"
  }
  ```

---

### 2. Email Service APIs (`/api/email`)

_Requires Bearer Token in headers: `Authorization: Bearer <access-token>`_

#### **Send Email**

- **URL**: `POST /api/email/send`
- **Headers**:
  - `Authorization: Bearer <access-token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "sender": "support@example.com",
    "to": "recipient@example.com",
    "subject": "Hello from Multi-Tenant Email Service",
    "text": "This is a test email sent via Zoho Mail.",
    "html": "<p>This is a test email sent via <b>Zoho Mail</b>.</p>"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "messageId": "<some-message-id@zoho.com>"
  }
  ```

---

### 3. Admin APIs (`/api/admin`)

_Requires Admin header: `x-admin-key: admin_secret_key`_

| Method | Endpoint                               | Description                                                |
| :----- | :------------------------------------- | :--------------------------------------------------------- |
| `POST` | `/api/admin/clients`                   | Create a new client application (`{ "name": "App Name" }`) |
| `POST` | `/api/admin/clients/:clientId/disable` | Disable a client application                               |
| `POST` | `/api/admin/clients/:clientId/revoke`  | Revoke all refresh tokens for a client                     |
| `GET`  | `/api/admin/logs`                      | View email transmission history logs                       |
| `GET`  | `/api/admin/failures`                  | View email delivery failures                               |
| `POST` | `/api/admin/smtp`                      | Configure SMTP settings & sender accounts                  |
| `GET`  | `/api/admin/audit`                     | View system audit logs                                     |
| `GET`  | `/api/admin/stats`                     | Monitor API usage statistics & client counts               |

---

Step 1: Create a New Client (Admin Action)

First, the administrator registers a new client application (e.g., admin_client or my-crm-app).

- Request:
  POST http://localhost:3000/api/admin/clients
  Content-Type: application/json
  x-admin-key: admin_secret_key

{
"name": "admin_client"
}

- Sample Response:
  {
  "message": "Client created successfully. Save clientSecret securely as it will not be shown again.",
  "clientId": "client_8f9c2d1e",
  "clientSecret": "sec_7a4b2c1f9e8d...",
  "name": "admin_client"
  }
  ⚠️ Important: Save the returned clientId and clientSecret. The secret will never be shown again!

---

Step 2: Authenticate & Get Access/Refresh Tokens (Login)

The client exchanges its clientId and clientSecret for a JWT Access Token (expires in 60 minutes) and a Refresh Token (expires in 30 days).

- Request:
  POST http://localhost:3000/api/auth/login
  Content-Type: application/json

{
"clientId": "client_8f9c2d1e",
"clientSecret": "sec_7a4b2c1f9e8d..."
}

- Sample Response:
  {
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI...",
  "refreshToken": "4d2b9a7c3e1f5...",
  "expiresIn": "60m"
  }
  ⚠️ Important: Save the accessToken and refreshToken.

---

Step 3: Send an Email using the Access Token

Now the client uses the accessToken in the Authorization: Bearer <token> header to send an email through Zoho Mail.

- Request:
  POST http://localhost:3000/api/email/send
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI...

{
"to": "recipient@example.com",
"subject": "Hello from Admin Client",
"text": "This email was sent via our secure multi-tenant email service.",
"html": "<p>This email was sent via our secure <b>multi-tenant email service</b>.</p>"
}

- Sample Response:
  {
  "success": true,
  "messageId": "<12345678-abcd-ef01-2345-6789abcdef01@zoho.com>"
  }

---

Step 4: Refresh Access Token (When Access Token Expires)

When the 60-minute Access Token expires, the client can use its stored refreshToken to obtain a brand new accessToken without re-entering client credentials.

- Request:
  POST http://localhost:3000/api/auth/refresh
  Content-Type: application/json

{
"refreshToken": "4d2b9a7c3e1f5..."
}

- Sample Response:
  {
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newlyGeneratedToken...",
  "expiresIn": "60m"
  }

---

Step 5: Send Another Email using the New Access Token

Using the newly obtained accessToken from Step 4, the client can continue sending emails normally.

- Request:
  POST http://localhost:3000/api/email/send
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newlyGeneratedToken...

{
"to": "another-recipient@example.com",
"subject": "Follow up email",
"text": "Sending another email after refreshing the token."
}

- Sample Response:
  {
  "success": true,
  "messageId": "<87654321-fedc-ba09-8765-4321fedcba09@zoho.com>"
  }
