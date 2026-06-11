# Secure Software Development (IKB 21503) - Technical Report & Security Checklist

## 1. Architecture Design & Technology Stack
**Project Title**: Secure Microservice-Based Web Application
**Module**: Task Management System
**Stack**: Node.js, Express.js, TypeScript, Helmet.js

This microservice handles secure User Registration & Login, Role-Based Access Control (RBAC), secure Task CRUD operations, User Profiles, and Audit Logging.

## 2. Secure Software Deployment Framework (SSDF) Alignment
Aligned with NIST SSDF principles:
- **PO (Prepare the Organization)**: Security requirements defined upfront (OWASP ASVS), strict environment constraints (dotenv for credentials).
- **PS (Protect the Software)**: All code is version-controlled, dependency vulnerabilities are scanned, and secret leakage is prevented.
- **PW (Produce Well-Secured Software)**: Continuous security checks, input validation (Zod), output encoding, using `Helmet` for secure headers.
- **RV (Respond to Vulnerabilities)**: Audit logging captures all critical state changes and failures for intrusion detection and forensic response.

## 3. OWASP ASVS Checklists (Application Security Verification Standard)
### V2: Authentication Verification
- [x] Verify that passwords are hashed dynamically (e.g., bcrypt/Argon2) before storage. *(Supabase Auth handles this implicitly, or custom bcrypt logic)*
- [x] Verify that generic error messages are used during login (e.g., "Invalid username or password").
- [x] Verify implementation of rate-limiting for failed authentication attempts.

### V4: Access Control Verification (RBAC)
- [x] Verify all API endpoints check authorization contexts, separating `Admin` from `Normal User`.
- [x] Implement Principle of Least Privilege: Normal users can only interact with their own tasks.
- [x] Prevent Insecure Direct Object Reference (IDOR) by validating resource ownership before updates/deletes.

### V5: Validation, Sanitization, and Encoding (Injection-Free)
- [x] Verify all user input is validated against a strict schema (e.g., Zod).
- [x] Verify parameterized queries or safe ORMs are used to prevent SQL/NoSQL Injection.
- [x] Prevent Cross-Site Scripting (XSS) by encoding untrusted data correctly.

### V7: Error Handling and Logging Verification
- [x] Verify sensitive information (passwords, tokens) is not recorded in logs.
- [x] Verify all relevant authorization functions (login, password changes, authorization failures, data creation/deletion) generate a secure audit log.

### V14: Configuration Verification
- [x] Implement HTTP Strict Transport Security (HSTS).
- [x] Ensure `Helmet.js` is employed to establish robust Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options.

## 4. Manual Code Review Checklist
Use this checklist when reviewing Pull Requests for the Task Management System:
- **Injection:** Are ORMs used correctly, or are SQL statements 100% parameterized? No string concatenation for queries!
- **Auth & RBAC:** Does the route use the proper `isAuthenticated` and `requireRole(roles)` middleware?
- **Validation:** Is inbound request data (body, params, query) parsed through strict validation schemas (Zod)?
- **Logging:** Does this route mutate data? If yes, is the action recorded in the `audit_logs` service?
- **Headers:** Is `helmet()` active on the Express app? 
- **Error Handling:** Are exceptions caught and sanitized using a centralized error handler so internal paths/traces don't leak?
