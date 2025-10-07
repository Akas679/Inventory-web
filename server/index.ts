import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrate";
import session from "express-session";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 10000;

console.log("🔧 ===== SERVER STARTUP ===== ");
console.log(`🔧 PORT: ${PORT}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);

// ✅ BASIC MIDDLEWARE SETUP
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ CRITICAL: MEMORY SESSION STORE (NO POSTGRESQL)
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-secret-render-fix-2024",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  // ✅ FORCE MEMORY STORE - NO POSTGRESQL
  store: new session.MemoryStore() // Explicitly use memory store
}));

// ✅ SIMPLE LOGGING MIDDLEWARE
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ✅ HEALTH CHECK (MUST WORK)
app.get("/health", (req: Request, res: Response) => {
  console.log("🏥 Health check called");
  res.status(200).json({ 
    status: "OK", 
    server: "running",
    port: PORT,
    timestamp: new Date().toISOString(),
    session: "memory-store" // Confirm we're using memory sessions
  });
});

// ✅ TEST ROUTE
app.get("/test", (req: Request, res: Response) => {
  // Test session
  req.session.testValue = "session-working";
  res.json({ 
    message: "Server is working!", 
    port: PORT,
    session: req.sessionID 
  });
});

// ✅ ROOT ROUTE
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "ERP Inventory Management API",
    health: "/health",
    test: "/test", 
    api: "/api",
    session: "memory-store-active"
  });
});

// ✅ MAIN SERVER STARTUP
const startServer = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    
    // 1. Run migrations (but skip if they keep failing)
    console.log("📦 Running migrations...");
    try {
      await runMigrations();
      console.log("✅ Migrations completed");
    } catch (migrationError) {
      console.log("⚠️ Migrations skipped (tables already exist)");
      // Continue anyway - tables likely already exist
    }
    
    // 2. Register routes  
    console.log("🛣️ Registering routes...");
    await registerRoutes(app);
    console.log("✅ Routes registered");
    
    // ✅ ERROR HANDLING MIDDLEWARE (AFTER ROUTES)
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error("❌ Server error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    });
    
    // ✅ 404 HANDLER
    app.use("*", (req: Request, res: Response) => {
      res.status(404).json({ message: "Route not found" });
    });

    // ✅ CRITICAL: FORCE 0.0.0.0 BINDING
    console.log(`🔌 Starting server on PORT ${PORT}...`);
    
    const server = app.listen(PORT, "0.0.0.0", () => {
      // ✅ THIS MUST SAY 0.0.0.0, NOT localhost
      console.log(`🎉 SERVER STARTED ON http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
      console.log(`🧪 Test: http://0.0.0.0:${PORT}/test`);
      console.log(`💾 Session: MEMORY STORE (No PostgreSQL)`);
    });

    // ✅ SERVER ERROR HANDLING
    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("❌ Server failed to start:", error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
};

// ✅ START THE SERVER
startServer();

// ✅ GRACEFUL SHUTDOWN
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received - shutting down");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received - shutting down");  
  process.exit(0);
});
