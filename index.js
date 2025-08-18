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

app.use(express.json());
app.use(morgan("tiny"));
app.use(cors({
  origin: "https://shreynik00.github.io", // only domain, no path
  credentials: true
}));



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

// ✅ Signup (email + password)
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users(name, email, password_hash, provider)
       VALUES($1, $2, $3, 'local')
       RETURNING id, name, email, provider`,
      [name, email, hashedPassword]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ✅ Login (email + password)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1 AND provider='local'", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ✅ Google Auth login/signup
app.post("/google-auth", async (req, res) => {
  try {
    const { name, email, googleId } = req.body;

    let { rows } = await pool.query("SELECT * FROM users WHERE provider='google' AND provider_id=$1", [googleId]);

    if (rows.length === 0) {
      // new Google user -> insert
      const insertResult = await pool.query(
        `INSERT INTO users(name, email, provider, provider_id)
         VALUES($1, $2, 'google', $3)
         RETURNING id, name, email, provider`,
        [name, email, googleId]
      );
      rows = insertResult.rows;
    }

    res.json({ message: "Google login successful", user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Google auth failed" });
  }
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API on :${PORT}`);
});









