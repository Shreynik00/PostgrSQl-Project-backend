import 'dotenv/config';

import express from "express";

import cors from "cors";
import morgan from "morgan";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));



// DB-specific routes will be added below in each path

app.get("/", async (req, res) => {
  res.send("🚀 API is live and running!");
});

app.get("/health", async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT NOW()");
    res.json({ status: "ok badiya", dbTime: dbRes.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Route: Get all users
app.get("/users", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(rows);
  });
  
  // Route: Add a user
  app.post("/users", async (req, res) => {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO users(name,email) VALUES($1,$2) RETURNING *",
      [name, email]
    );
    res.status(201).json(rows[0]);
  });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API on :${PORT}`);
});





