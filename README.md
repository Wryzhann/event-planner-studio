# Secure Microservice-Based Web Application

This repository contains the source code for a mini-project developed for the course **"Secure Software Development" (IKB 21503)**. 

The application is a Secure Task Management and Consultation Booking System built with a focus on implementing OWASP-compliant development practices. It prevents common vulnerabilities such as XSS, CSRF, Injection, IDOR, and brute-force attacks via industry-standard security headers and validation libraries.

## 1. Project Description

The system provides dual functionality:
- **Task Management System:** Users can perform Secure CRUD (Create, Read, Update, Delete) operations.
- **Role-Based Access Control (RBAC):** Distinct privileges for `admin` and `user` roles to enforce the Principle of Least Privilege.
- **User Authentication:** Registration and login secured via Supabase Auth.
- **Audit Logging:** An administrative Audit Log feature that tracks sensitive system interactions (e.g., failed logins, task modifications) to conform with OWASP security logging guidelines.
- **Client & Admin Portal:** A booking module allowing clients to book sessions and administrators to manage slots, appointments, and business settings.

## 2. Installation Steps

1. **Clone the repository:**
   ```bash
   https://github.com/Wryzhann/event-planner-studio.git
   cd event-planner-studio
   ```

2. **Install node modules:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the root directory.
   - Using `.env.example` as a reference, provide your Supabase connection strings:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
   ```

## 3. Security Features Summary

The application heavily integrates OWASP Top 10 mitigations and OWASP ASVS guidelines:

- **Helmet.js (Secure HTTP Headers):** Configured to protect against Cross-Site Scripting (XSS) and clickjacking.
- **Rate Limiting:** Protects the login and API endpoints against brute force and DDoS attacks (`express-rate-limit`).
- **Input Validation:** Complete parameter and payload validation using `zod` to prevent SQL/NoSQL Injection and ensure type safety.
- **IDOR Prevention:** Ensures users can only perform CRUD operations on records directly matching their user ID and authenticated token.
- **RBAC (Role-Based Access Control):** Dedicated middleware verifying the authentication token and explicitly checking the 'admin' permission before rendering or serving sensitive routes (like the Audit Logs).

## 4. How to run the app

### Development Mode
To run the server and frontend concurrently in development mode (with Hot Module Replacement via Vite):
```bash
npm run dev
```
The application standard port output will specify the server location (usually `http://localhost:3000` or `http://0.0.0.0:3000`).

### Production Mode
To build the client assets and compile the Express microservice:
```bash
npm run build
npm run start
```

## 5. Dependencies

**Frontend:**
- **React (v19) & React DOM**: UI Library.
- **Vite & @vitejs/plugin-react**: Build tool and bundler.
- **Framer Motion**: Smooth component transitions.
- **Tailwind CSS**: Utility-first CSS styling framework.
- **React Router DOM**: Client-side routing.
- **Lucide React**: Clean iconography.
- **React Hook Form & Zod**: Client-side secure form validation.

**Backend & Security:**
- **Express.js**: Backend framework for building RESTful APIs.
- **Helmet**: Secures Express apps by setting various HTTP headers.
- **Express Rate Limit**: Basic rate-limiting middleware for Express.
- **Cors**: Enables Cross-Origin Resource Sharing.
- **Supabase JS**: PostgreSQL Database, Row-Level Security, and Authentication provider.
- **Zod**: TypeScript-first schema validation for incoming payloads.
- **xss**: Mitigation tool to sanitize untrusted HTML.

