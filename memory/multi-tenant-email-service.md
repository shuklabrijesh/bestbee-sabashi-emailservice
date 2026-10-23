---
name: multi-tenant-email-service
description: Multi-tenant Node.js Express email service integrating with Zoho Mail and JWT authentication.
metadata:
  type: project
---

# Multi-Tenant Email Service

- **Tech Stack**: Node.js, Express, SQLite, Nodemailer, JSON Web Tokens (JWT), bcrypt.
- **Features**:
  - Client Registration & Secure Secret Hashing (`/api/admin/clients`)
  - OIDC/OAuth2-style Token Lifecycle (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`)
  - Bearer Token Authentication Middleware
  - Zoho Mail Integration via SMTP / Configurable Sender Accounts (`/api/email/send`)
  - Admin APIs for auditing, delivery logs, failure tracking, usage statistics, and SMTP configuration (`/api/admin/*`)
