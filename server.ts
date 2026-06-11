import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ==========================================
 * SECURE MICROSERVICE CONFIGURATION (SSDF)
 * ==========================================
 */
const app = express();
const PORT = 3000;

// Initialize Supabase lazily to prevent startup crashes if environment variables are missing
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required');
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// 1. Helmet: Implements secure HTTP Headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled only for Vite dev server compatibility
  crossOriginOpenerPolicy: false,
  frameguard: false, // AI Studio needs to embed this in an iframe
}));

// 2. CORS Configurations
app.use(cors());

// 3. Body Parsing
app.use(express.json({ limit: '10kb' })); // Mitigate DOS via large payloads

// 4. Rate Limiting: Prevent Brute Force Attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

/**
 * ==========================================
 * INJECTION-FREE IMPLEMENTATION (ZOD VALIDATION)
 * ==========================================
 */
const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
});

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).default('user'),
});

/**
 * ==========================================
 * AUDIT LOGGING FUNCTIONALITY
 * ==========================================
 */
async function logAuditRecord(action: string, performedBy: string, details: string) {
  // OWASP ASVS V7: Securely logging security-relevant events
  await getSupabase().from('audit_logs').insert({
    action,
    performed_by: performedBy,
    details,
  });
}

/**
 * ==========================================
 * MIDDLEWARE: AUTH & RBAC (OWASP ASVS V4)
 * ==========================================
 */
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing token' });

  const { data: { user }, error } = await getSupabase().auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized: Invalid token' });

  // Attach user to context
  (req as any).user = user;
  
  // Fetch user role
  const { data: profile } = await getSupabase().from('profiles').select('role').eq('id', user.id).single();
  (req as any).role = profile?.role || 'user';
  
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ((req as any).role !== 'admin') {
    void logAuditRecord('UNAUTHORIZED_ADMIN_ACCESS', (req as any).user.id, 'Failed RBAC challenge for Admin');
    return res.status(403).json({ error: 'Forbidden: Requires Admin Role' });
  }
  next();
};

/**
 * ==========================================
 * ROUTES - AUTHENTICATION (ASVS V2)
 * ==========================================
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role } = authSchema.parse(req.body);
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    
    if (error) throw new Error(error.message);
    
    if (data.user) {
      await getSupabase().from('profiles').insert({ id: data.user.id, email, role });
      await logAuditRecord('USER_REGISTERED', data.user.id, `Role assigned: ${role}`);
    }
    
    res.status(201).json({ message: 'User registered successfully', user: data.user });
  } catch (err: any) {
    res.status(400).json({ error: err.issues || 'Validation error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    
    if (error) {
      await logAuditRecord('FAILED_LOGIN', email, 'Invalid credentials');
      return res.status(401).json({ error: 'Invalid username or password' }); // Generic error
    }
    
    await logAuditRecord('SUCCESSFUL_LOGIN', data.user.id, 'User accessed the system');
    res.json({ session: data.session });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid payload' });
  }
});

/**
 * ==========================================
 * ROUTES - USER PROFILE & TASKS CRUD (API)
 * ==========================================
 */
app.get('/api/profile', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { data, error } = await getSupabase().from('profiles').select('*').eq('id', userId).single();
  
  if (error) return res.status(500).json({ error: 'Failed to retrieve profile' });
  res.json(data);
});

// TASK: Create
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const validated = taskSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const { data, error } = await getSupabase()
      .from('tasks')
      .insert({ ...validated, user_id: userId })
      .select()
      .single();
      
    if (error) throw error;
    await logAuditRecord('TASK_CREATED', userId, `Task ID: ${data.id}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: 'Invalid task parameters' });
  }
});

// TASK: Read
app.get('/api/tasks', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  // Principle of least privilege: user can only query their own tasks
  const { data, error } = await getSupabase().from('tasks').select('*').eq('user_id', userId);
  
  if (error) return res.status(500).json({ error: 'Database error' });
  res.json(data);
});

// TASK: Update
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const validated = taskSchema.parse(req.body);
    const userId = (req as any).user.id;
    const taskId = req.params.id;
    
    // Prevent IDOR: Query specifically matching ID + user_id
    const { data, error } = await getSupabase()
      .from('tasks')
      .update(validated)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error || !data) return res.status(404).json({ error: 'Task not found or unauthorized' });
    
    await logAuditRecord('TASK_UPDATED', userId, `Task ID: ${taskId}`);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Invalid parameters' });
  }
});

// TASK: Delete
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const taskId = req.params.id;
  
  const { error } = await getSupabase()
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
    
  if (error) return res.status(500).json({ error: 'Failed to delete' });
  
  await logAuditRecord('TASK_DELETED', userId, `Task ID: ${taskId}`);
  res.status(204).send();
});

/**
 * ==========================================
 * ROUTES - AUDIT LOGS (ADMIN ONLY)
 * ==========================================
 */
app.get('/api/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await getSupabase().from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Database error' });
  
  res.json(data);
});

/**
 * ==========================================
 * SERVER STARTUP / VITE INTEGRATION
 * ==========================================
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = await import('vite');
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
