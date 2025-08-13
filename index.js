import 'dotenv/config';

import express from "express";

import cors from "cors";
import morgan from "morgan";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon requires SSL
});


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/health", (req, res) => res.json({ ok: true }));

// DB-specific routes will be added below in each path

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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API on :${port}`));
