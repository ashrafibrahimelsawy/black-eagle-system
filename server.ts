import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "black-eagle-secret-key";

// Database initialization
const db = new Database("database.sqlite");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('employee', 'project_manager', 'admin', 'super_admin')),
    status TEXT DEFAULT 'active',
    base_salary REAL DEFAULT 0,
    position TEXT,
    phone TEXT,
    avatar TEXT,
    permissions TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_info TEXT,
    email TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    client_id INTEGER,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    budget REAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATE NOT NULL,
    check_in DATETIME,
    check_out DATETIME,
    status TEXT DEFAULT 'present',
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    due_date DATE,
    project_id INTEGER,
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS finance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('invoice', 'payment', 'expense')),
    amount REAL NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    project_id INTEGER,
    client_id INTEGER,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    month TEXT NOT NULL,
    base_salary REAL NOT NULL,
    deductions REAL DEFAULT 0,
    bonuses REAL DEFAULT 0,
    net_salary REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Add missing columns if they don't exist
const migrate = () => {
  const tables = {
    users: ['base_salary', 'position', 'phone', 'avatar', 'permissions'],
    clients: ['email', 'phone'],
    projects: ['budget', 'start_date', 'end_date'],
    attendance: ['status']
  };

  for (const [table, columns] of Object.entries(tables)) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const existingColumns = info.map((c: any) => c.name);
    
    for (const column of columns) {
      if (!existingColumns.includes(column)) {
        console.log(`Adding column ${column} to table ${table}`);
        try {
          db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`).run();
          // Set default for numeric columns
          if (column === 'base_salary' || column === 'budget') {
            db.prepare(`UPDATE ${table} SET ${column} = 0 WHERE ${column} IS NULL`).run();
          }
        } catch (e) {
          console.error(`Failed to add column ${column} to ${table}:`, e);
        }
      }
    }
  }
};

migrate();

// Seed initial super_admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'super_admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role, base_salary) VALUES (?, ?, ?, ?, ?)").run(
    "Super Admin",
    "admin@blackeagle.com",
    hashedPassword,
    "super_admin",
    10000
  );
}

app.use(express.json());

// API 404 handler to prevent HTML responses for API calls
app.use("/api/*", (req, res, next) => {
  // If we reach here, it means no API route matched
  // But we only want to handle it if it's not handled by the routes below
  next();
});

// Middleware for auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, name, email, role, avatar, position, phone, permissions FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
  const { name, email, avatar, phone } = req.body;
  db.prepare("UPDATE users SET name = ?, email = ?, avatar = ?, phone = ? WHERE id = ?").run(
    name, email, avatar, phone, req.user.id
  );
  res.json({ message: "Profile updated" });
});

// User Management (Super Admin only)
app.get("/api/users", authenticateToken, (req: any, res) => {
  // Employees can only see their own profile
  if (req.user.role === 'employee') {
    const user = db.prepare("SELECT id, name, email, role, status, base_salary, position, phone, permissions FROM users WHERE id = ?").get(req.user.id);
    return res.json([user]);
  }
  
  // Admins and PMs can see users but Super Admin sees all details
  const users = db.prepare("SELECT id, name, email, role, status, position, phone, permissions" + (req.user.role === 'super_admin' || req.user.role === 'admin' ? ", base_salary" : "") + " FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: "Only Super Admin can manage users" });
  const { name, email, password, role, base_salary, position, phone, permissions } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (name, email, password, role, base_salary, position, phone, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      name, email, hashedPassword, role, base_salary || 0, position || '', phone || '', JSON.stringify(permissions || [])
    );
    res.status(201).json({ message: "User created" });
  } catch (e) {
    res.status(400).json({ message: "Email already exists" });
  }
});

app.put("/api/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: "Only Super Admin can manage users" });
  const { name, email, role, status, base_salary, position, phone, permissions } = req.body;
  db.prepare("UPDATE users SET name = ?, email = ?, role = ?, status = ?, base_salary = ?, position = ?, phone = ?, permissions = ? WHERE id = ?").run(
    name, email, role, status, base_salary, position, phone, JSON.stringify(permissions || []), req.params.id
  );
  res.json({ message: "User updated" });
});

// Client Management
app.get("/api/clients", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') return res.status(403).json({ message: "Access denied" });
  const clients = db.prepare("SELECT * FROM clients").all();
  res.json(clients);
});

app.post("/api/clients", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') return res.status(403).json({ message: "Access denied" });
  const { name, contact_info, email, phone } = req.body;
  db.prepare("INSERT INTO clients (name, contact_info, email, phone) VALUES (?, ?, ?, ?)").run(name, contact_info, email, phone);
  res.status(201).json({ message: "Client created" });
});

app.put("/api/clients/:id", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') return res.status(403).json({ message: "Access denied" });
  const { name, contact_info, email, phone } = req.body;
  db.prepare("UPDATE clients SET name = ?, contact_info = ?, email = ?, phone = ? WHERE id = ?").run(
    name, contact_info, email, phone, req.params.id
  );
  res.json({ message: "Client updated" });
});

// Project Management
app.get("/api/projects", authenticateToken, (req: any, res) => {
  let projects;
  if (req.user.role === 'employee') {
    projects = db.prepare(`
      SELECT p.*, c.name as client_name,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'expense') as total_expenses,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'payment') as total_received
      FROM projects p 
      JOIN clients c ON p.client_id = c.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
    `).all(req.user.id);
  } else if (req.user.role === 'project_manager') {
    projects = db.prepare(`
      SELECT p.*, c.name as client_name,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'expense') as total_expenses,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'payment') as total_received
      FROM projects p 
      JOIN clients c ON p.client_id = c.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
    `).all(req.user.id);
  } else {
    projects = db.prepare(`
      SELECT p.*, c.name as client_name,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'expense') as total_expenses,
      (SELECT SUM(amount) FROM finance WHERE project_id = p.id AND type = 'payment') as total_received
      FROM projects p 
      JOIN clients c ON p.client_id = c.id
    `).all();
  }
  
  // Get members for each project
  projects = projects.map((p: any) => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.role 
      FROM users u 
      JOIN project_members pm ON u.id = pm.user_id 
      WHERE pm.project_id = ?
    `).all(p.id);
    return { ...p, members };
  });

  res.json(projects);
});

app.post("/api/projects", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee' || req.user.role === 'admin') return res.status(403).json({ message: "Access denied" });
  const { name, description, client_id, budget, start_date, end_date, memberIds } = req.body;
  const info = db.prepare("INSERT INTO projects (name, description, client_id, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)").run(
    name, description, client_id, budget || 0, start_date, end_date
  );
  const projectId = info.lastInsertRowid;

  if (memberIds && Array.isArray(memberIds)) {
    const insertMember = db.prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)");
    memberIds.forEach((uid: number) => insertMember.run(projectId, uid));
  }
  res.status(201).json({ id: projectId });
});

app.put("/api/projects/:id", authenticateToken, (req: any, res) => {
  const { name, description, client_id, status, progress, budget, start_date, end_date, memberIds } = req.body;
  
  // Check if user is member
  const isMember = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?").get(req.params.id, req.user.id);
  
  if (req.user.role === 'employee') {
    if (!isMember) return res.status(403).json({ message: "Not a member of this project" });
    // Employee can only update progress
    db.prepare("UPDATE projects SET progress = ?, status = ? WHERE id = ?").run(progress, status, req.params.id);
  } else {
    if (req.user.role === 'admin') return res.status(403).json({ message: "Admins cannot edit projects" });
    
    db.prepare("UPDATE projects SET name = ?, description = ?, client_id = ?, status = ?, progress = ?, budget = ?, start_date = ?, end_date = ? WHERE id = ?").run(
      name, description, client_id, status, progress, budget, start_date, end_date, req.params.id
    );
    
    if (memberIds && Array.isArray(memberIds)) {
      db.prepare("DELETE FROM project_members WHERE project_id = ?").run(req.params.id);
      const insertMember = db.prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)");
      memberIds.forEach((uid: number) => insertMember.run(req.params.id, uid));
    }
  }
  res.json({ message: "Project updated" });
});

// Tasks
app.get("/api/tasks", authenticateToken, (req: any, res) => {
  let tasks;
  if (req.user.role === 'employee') {
    tasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assigned_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = ?
      ORDER BY t.due_date ASC
    `).all(req.user.id);
  } else {
    tasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assigned_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.due_date ASC
    `).all();
  }
  res.json(tasks);
});

app.post("/api/tasks", authenticateToken, (req: any, res) => {
  const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;
  db.prepare("INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    title, description, status || 'pending', priority || 'medium', due_date, project_id, assigned_to
  );
  res.status(201).json({ message: "Task created" });
});

app.put("/api/tasks/:id", authenticateToken, (req: any, res) => {
  const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;
  
  if (req.user.role === 'employee') {
    // Employee can only update status
    db.prepare("UPDATE tasks SET status = ? WHERE id = ? AND assigned_to = ?").run(status, req.params.id, req.user.id);
  } else {
    db.prepare("UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, project_id = ?, assigned_to = ? WHERE id = ?").run(
      title, description, status, priority, due_date, project_id, assigned_to, req.params.id
    );
  }
  res.json({ message: "Task updated" });
});

app.delete("/api/tasks/:id", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') return res.status(403).json({ message: "Access denied" });
  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  res.json({ message: "Task deleted" });
});

// Attendance
app.get("/api/attendance", authenticateToken, (req: any, res) => {
  let records;
  if (req.user.role === 'employee') {
    records = db.prepare("SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC").all(req.user.id);
  } else {
    records = db.prepare(`
      SELECT a.*, u.name as user_name 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.date DESC
    `).all();
  }
  res.json(records);
});

app.post("/api/attendance/check-in", authenticateToken, (req: any, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  try {
    db.prepare("INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, 'present')").run(req.user.id, today, now);
    res.json({ message: "Checked in successfully" });
  } catch (e) {
    res.status(400).json({ message: "Already checked in today" });
  }
});

app.post("/api/attendance/check-out", authenticateToken, (req: any, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const record: any = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?").get(req.user.id, today);
  
  if (!record) return res.status(400).json({ message: "Must check in first" });
  if (record.check_out) return res.status(400).json({ message: "Already checked out today" });

  db.prepare("UPDATE attendance SET check_out = ? WHERE id = ?").run(now, record.id);
  res.json({ message: "Checked out successfully" });
});

// Leaves
app.get("/api/leaves", authenticateToken, (req: any, res) => {
  let records;
  if (req.user.role === 'employee') {
    records = db.prepare("SELECT * FROM leaves WHERE user_id = ? ORDER BY start_date DESC").all(req.user.id);
  } else if (req.user.role === 'project_manager') {
    // PM sees their own and their project members' leaves
    records = db.prepare(`
      SELECT l.*, u.name as user_name 
      FROM leaves l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.user_id = ? OR l.user_id IN (
        SELECT user_id FROM project_members WHERE project_id IN (
          SELECT project_id FROM project_members WHERE user_id = ?
        )
      )
      ORDER BY l.start_date DESC
    `).all(req.user.id, req.user.id);
  } else {
    records = db.prepare(`
      SELECT l.*, u.name as user_name 
      FROM leaves l 
      JOIN users u ON l.user_id = u.id 
      ORDER BY l.start_date DESC
    `).all();
  }
  res.json(records);
});

app.post("/api/leaves", authenticateToken, (req: any, res) => {
  const { type, start_date, end_date, reason } = req.body;
  
  const overlap = db.prepare(`
    SELECT * FROM leaves 
    WHERE user_id = ? AND status != 'rejected'
    AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
  `).get(req.user.id, end_date, start_date, start_date, end_date);

  if (overlap) return res.status(400).json({ message: "Leave request overlaps with existing one" });

  db.prepare("INSERT INTO leaves (user_id, type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id, type, start_date, end_date, reason
  );
  res.status(201).json({ message: "Leave request submitted" });
});

app.put("/api/leaves/:id", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  const { status } = req.body;
  db.prepare("UPDATE leaves SET status = ?, approved_by = ? WHERE id = ?").run(status, req.user.id, req.params.id);
  
  // If approved, mark attendance as leave
  if (status === 'approved') {
    const leave: any = db.prepare("SELECT * FROM leaves WHERE id = ?").get(req.params.id);
    let current = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      try {
        db.prepare("INSERT INTO attendance (user_id, date, status) VALUES (?, ?, 'leave')").run(leave.user_id, dateStr);
      } catch (e) {
        db.prepare("UPDATE attendance SET status = 'leave' WHERE user_id = ? AND date = ?").run(leave.user_id, dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
  }
  res.json({ message: "Leave request updated" });
});

// Finance
app.get("/api/finance", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee' || req.user.role === 'project_manager') return res.status(403).json({ message: "Access denied" });
  const records = db.prepare(`
    SELECT f.*, p.name as project_name, c.name as client_name 
    FROM finance f 
    LEFT JOIN projects p ON f.project_id = p.id 
    LEFT JOIN clients c ON f.client_id = c.id
    ORDER BY f.date DESC
  `).all();
  res.json(records);
});

app.post("/api/finance", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee' || req.user.role === 'project_manager') return res.status(403).json({ message: "Access denied" });
  const { type, amount, date, description, project_id, client_id, status } = req.body;
  
  let finalClientId = client_id;
  if (project_id && !finalClientId) {
    const project: any = db.prepare("SELECT client_id FROM projects WHERE id = ?").get(project_id);
    finalClientId = project?.client_id;
  }

  db.prepare("INSERT INTO finance (type, amount, date, description, project_id, client_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    type, amount, date, description, project_id, finalClientId, status || 'pending'
  );
  res.status(201).json({ message: "Finance record created" });
});

// Payroll
app.get("/api/payroll", authenticateToken, (req: any, res) => {
  if (req.user.role === 'employee') {
    const records = db.prepare("SELECT * FROM payroll WHERE user_id = ? ORDER BY month DESC").all(req.user.id);
    return res.json(records);
  }
  
  const records = db.prepare(`
    SELECT p.*, u.name as user_name 
    FROM payroll p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.month DESC
  `).all();
  res.json(records);
});

app.post("/api/payroll/generate", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
  const { month } = req.body; // YYYY-MM
  
  const users = db.prepare("SELECT id, base_salary FROM users WHERE status = 'active'").all();
  
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  users.forEach((user: any) => {
    const dailyRate = user.base_salary / 30; // Standard 30 days for calculation or use daysInMonth
    
    // Improved absence calculation:
    // Check all days in the month. If it's a working day (Mon-Fri) and no attendance record exists, count as absent.
    let absenceCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      
      // Assuming Fri and Sat are weekends (common in some regions) or Sat/Sun
      // Let's assume Fri/Sat as weekends for this system as per common request in similar systems
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; 
      
      if (!isWeekend) {
        const dateStr = date.toISOString().split('T')[0];
        const record: any = db.prepare("SELECT status FROM attendance WHERE user_id = ? AND date = ?").get(user.id, dateStr);
        
        if (!record || record.status === 'absent') {
          absenceCount++;
        }
      }
    }
    
    const deductions = absenceCount * dailyRate;
    const net_salary = Math.max(0, user.base_salary - deductions);
    
    try {
      // Check if already exists, if so update, else insert
      const existing = db.prepare("SELECT id FROM payroll WHERE user_id = ? AND month = ?").get(user.id, month);
      if (existing) {
        db.prepare("UPDATE payroll SET base_salary = ?, deductions = ?, net_salary = ? WHERE id = ?").run(
          user.base_salary, deductions, net_salary, (existing as any).id
        );
      } else {
        db.prepare("INSERT INTO payroll (user_id, month, base_salary, deductions, net_salary) VALUES (?, ?, ?, ?, ?)").run(
          user.id, month, user.base_salary, deductions, net_salary
        );
      }
    } catch (e) {
      console.error("Payroll generation error:", e);
    }
  });
  
  res.json({ message: "Payroll generated" });
});

// API 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API route ${req.originalUrl} not found` });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
