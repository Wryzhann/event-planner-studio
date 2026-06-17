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
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
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
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Schema Setup (Supabase SQL Editor):**
   To leverage database storage for user profiles, tasks, and audit logs, execute the following SQL script in your **Supabase SQL Editor**:

   ```sql
   -- Create Profiles Table (ASVS V4 least privilege profile registry)
   CREATE TABLE IF NOT EXISTS public.profiles (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     email TEXT NOT NULL,
     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
     created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Create Audit Logs Table (ASVS V7 secure event-trail tracking)
   CREATE TABLE IF NOT EXISTS public.audit_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     action TEXT NOT NULL,
     performed_by UUID NULL,
     details TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Create Tasks Table (ASVS V4 secure CRUD validation schema)
   CREATE TABLE IF NOT EXISTS public.tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     title TEXT NOT NULL,
     description TEXT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
     created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Enable Row Level Security (RLS) across all tables to enforce data privacy
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

   -- Profile Security Policies
   CREATE POLICY "Allow users to read their own profile" 
     ON public.profiles FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Allow admins to read all profiles" 
     ON public.profiles FOR SELECT USING (
       (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
     );

   -- Tasks Security Policies: Strict ownership matching (Prevents IDOR)
   CREATE POLICY "Users can fully manage their own tasks"
     ON public.tasks FOR ALL USING (auth.uid() = user_id);

   -- Audit Logs Security Policies: Write-only for users/system, selective read for Admins
   CREATE POLICY "Users and microservice can insert logs"
     ON public.audit_logs FOR INSERT WITH CHECK (true);

   CREATE POLICY "Only admins can query audit trail logs"
     ON public.audit_logs FOR SELECT USING (
       (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
     );
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

## 6. Screenshot(s) of system

> **Note to developer:** Please replace the paths below with the actual screenshots of your running system before submitting to your repository.

### Public Booking Interface
![Booking System Screenshot](./docs/screenshots/booking.png)

### Administrative Dashboard & Audit Logs
![Admin Dashboard Screenshot](./docs/screenshots/admin-dashboard.png)

### Secure Authentication Screen
![Login Screenshot](./docs/screenshots/login.png)
