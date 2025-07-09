import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import passport from "passport";
import GitHubStrategy from "passport-github2";
import session from "express-session";
import axios from "axios";
import cors from "cors";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";

env.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const PgSession = connectPgSimple(session);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;
const URL = process.env.FRONTENDURL || "http://localhost:3000";
const BURL = process.env.BACKENDURL || "http://localhost:5000";
const isProd = process.env.NODE_ENV === "production";

// Middlewares
app.use(cors({
  origin: URL,
  credentials: true,
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  store: new PgSession({
    pool: db,
    tableName: "session",
  }),
  secret: process.env.Secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  },
}));

app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}

// Auth Routes
app.get("/auth/github", passport.authenticate("github", { scope: ["repo"] }));

app.get("/github/auth/callback", passport.authenticate("github", {
  successRedirect: URL,
  failureRedirect: "/login"
}));

app.get("/dashboard", ensureAuthenticated, (req, res) => {
  return res.redirect(`${URL}`);
});

app.get("/login", (req, res) => {
  return res.redirect(`${URL}/login`);
});

// API Routes
app.get("/api/check-auth", (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
});

app.get("/github/repo", ensureAuthenticated, async (req, res) => {
  const user = req.user.username;
  const token = req.user.accesstoken;

  try {
    const result = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    res.json(result.data);
  } catch (err) {
    console.error("Failed to fetch repos", err);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

app.get("/github/repo/commit/:repoName", ensureAuthenticated, async (req, res) => {
  const repo = req.params.repoName;
  const user = req.user.username;
  const token = req.user.accesstoken;

  try {
    const result = await axios.get(`https://api.github.com/repos/${user}/${repo}/commits`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    res.json(result.data);
  } catch (err) {
    console.error("Failed to fetch commits", err);
    res.status(500).json({ error: "Failed to fetch commits" });
  }
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

// Passport setup
passport.use(new GitHubStrategy({
  clientID: process.env.Client_id,
  clientSecret: process.env.Client_secret,
  callbackURL: `${BURL}/github/auth/callback`,
}, async (accessToken, _, profile, done) => {
  const username = profile.username;
  try {
    const userCheck = await db.query("SELECT * FROM users WHERE username = $1", [username]);

    if (userCheck.rows.length === 0) {
      const newUser = await db.query(
        "INSERT INTO users (username, accesstoken) VALUES ($1, $2) RETURNING *",
        [username, accessToken]
      );
      return done(null, newUser.rows[0]);
    }

    await db.query("UPDATE users SET accesstoken = $1 WHERE username = $2", [accessToken, username]);
    return done(null, userCheck.rows[0]);
  } catch (err) {
    console.error(err);
    done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "../my-app/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../my-app/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
