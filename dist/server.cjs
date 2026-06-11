var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var import_zod = require("zod");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var supabaseClient = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL and Key are required");
    }
    supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}
app.use((0, import_helmet.default)({
  contentSecurityPolicy: false,
  // Disabled only for Vite dev server compatibility
  crossOriginOpenerPolicy: false,
  frameguard: false
  // AI Studio needs to embed this in an iframe
}));
app.use((0, import_cors.default)());
app.use(import_express.default.json({ limit: "10kb" }));
var limiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});
app.use("/api", limiter);
var taskSchema = import_zod.z.object({
  title: import_zod.z.string().min(1).max(255),
  description: import_zod.z.string().optional(),
  status: import_zod.z.enum(["pending", "in_progress", "completed"]).default("pending")
});
var authSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(8),
  role: import_zod.z.enum(["user", "admin"]).default("user")
});
async function logAuditRecord(action, performedBy, details) {
  await getSupabase().from("audit_logs").insert({
    action,
    performed_by: performedBy,
    details
  });
}
var requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });
  const { data: { user }, error } = await getSupabase().auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized: Invalid token" });
  req.user = user;
  const { data: profile } = await getSupabase().from("profiles").select("role").eq("id", user.id).single();
  req.role = profile?.role || "user";
  next();
};
var requireAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    void logAuditRecord("UNAUTHORIZED_ADMIN_ACCESS", req.user.id, "Failed RBAC challenge for Admin");
    return res.status(403).json({ error: "Forbidden: Requires Admin Role" });
  }
  next();
};
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role } = authSchema.parse(req.body);
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) {
      await getSupabase().from("profiles").insert({ id: data.user.id, email, role });
      await logAuditRecord("USER_REGISTERED", data.user.id, `Role assigned: ${role}`);
    }
    res.status(201).json({ message: "User registered successfully", user: data.user });
  } catch (err) {
    res.status(400).json({ error: err.issues || "Validation error" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      await logAuditRecord("FAILED_LOGIN", email, "Invalid credentials");
      return res.status(401).json({ error: "Invalid username or password" });
    }
    await logAuditRecord("SUCCESSFUL_LOGIN", data.user.id, "User accessed the system");
    res.json({ session: data.session });
  } catch (err) {
    res.status(400).json({ error: "Invalid payload" });
  }
});
app.get("/api/profile", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await getSupabase().from("profiles").select("*").eq("id", userId).single();
  if (error) return res.status(500).json({ error: "Failed to retrieve profile" });
  res.json(data);
});
app.post("/api/tasks", requireAuth, async (req, res) => {
  try {
    const validated = taskSchema.parse(req.body);
    const userId = req.user.id;
    const { data, error } = await getSupabase().from("tasks").insert({ ...validated, user_id: userId }).select().single();
    if (error) throw error;
    await logAuditRecord("TASK_CREATED", userId, `Task ID: ${data.id}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: "Invalid task parameters" });
  }
});
app.get("/api/tasks", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await getSupabase().from("tasks").select("*").eq("user_id", userId);
  if (error) return res.status(500).json({ error: "Database error" });
  res.json(data);
});
app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const validated = taskSchema.parse(req.body);
    const userId = req.user.id;
    const taskId = req.params.id;
    const { data, error } = await getSupabase().from("tasks").update(validated).eq("id", taskId).eq("user_id", userId).select().single();
    if (error || !data) return res.status(404).json({ error: "Task not found or unauthorized" });
    await logAuditRecord("TASK_UPDATED", userId, `Task ID: ${taskId}`);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: "Invalid parameters" });
  }
});
app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { error } = await getSupabase().from("tasks").delete().eq("id", taskId).eq("user_id", userId);
  if (error) return res.status(500).json({ error: "Failed to delete" });
  await logAuditRecord("TASK_DELETED", userId, `Task ID: ${taskId}`);
  res.status(204).send();
});
app.get("/api/audit-logs", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await getSupabase().from("audit_logs").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Database error" });
  res.json(data);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = await import("vite");
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Secure Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
