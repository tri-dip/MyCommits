import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import passport from "passport";
import GitHubStrategy from "passport-github2";
import session from "express-session";
import axios from "axios";
import cors from "cors";
import pg from "pg";

env.config();
const app = express();

const { Pool } = pg;

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

app.use(cors({
  origin: URL,
  credentials: true
}));
app.use(express.json());
const isProd = process.env.NODE_ENV === "production";
app.use(session({
  secret: process.env.Secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: isProd ? "None" : "Lax",  // Required for cross-origin in HTTPS
    secure: isProd                     // Cookie only over HTTPS in production
  }
}));



app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
function ensureauthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}

app.get("/api/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

app.get("/auth/github", passport.authenticate("github", { scope: ['repo'] }));
app.get("/github/auth/callback", passport.authenticate("github", {
  successRedirect: URL,
  failureRedirect: "/login"
}));
app.get("/dashboard", ensureauthenticated, (req, res) => {
  return res.redirect(`${URL}`);
});
app.get("/login", (req, res) => {
  return res.redirect(`${URL}/login`);
});
app.get("/github/repo",ensureauthenticated,async(req,res)=>{
  const user = req.user.username;
  const accesstoken = req.user.accesstoken;
  try{
    const result = await axios.get("https://api.github.com/user/repos",{
      headers: {
        Authorization: `token ${accesstoken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    res.json(result.data)
  }
  catch(err){
    console.error("Failed to fetch repos", err);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
})
app.get("/github/repo/commit/:repoName",ensureauthenticated,async(req,res)=>{
  const repo = req.params.repoName;
  const user = req.user.username;
  const accesstoken = req.user.accesstoken;
  try{
    const result = await axios.get(`https://api.github.com/repos/${user}/${repo}/commits`,{
      headers: {
        Authorization: `token ${accesstoken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    console.log(result.data);
    res.json(result.data);
  }
  catch(err){
    console.error("Failed to fetch commits", err);
    res.status(500).json({ error: "Failed to fetch commits"});
  }
})
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});


passport.use(new GitHubStrategy({
  clientID: process.env.Client_id,
  clientSecret: process.env.Client_secret,
  callbackURL: `${BURL}/github/auth/callback`
},
  async function (accessToken, refreshToken, profile, done) {
    const username = profile.username;
    try{
      const result = await db.query("SELECT * FROM users WHERE username = $1",[username]);
    if(result.rows.length===0) {
      const user = await db.query("INSERT INTO users (username,accesstoken) VALUES ($1,$2) RETURNING *",[username,accessToken]);
      return done(null,user.rows[0]);
    }
    await db.query("UPDATE users SET accesstoken = $1 WHERE username = $2",[accessToken,username]);
    return done(null,result.rows[0]);
    }
    catch(err){
      console.log(err);
      done(err);
    }
    
  }
));

passport.serializeUser((user,cb)=>
  cb(null,user.id)
);
passport.deserializeUser(async (id,cb)=>{
  try{
    const user = await db.query("SELECT * FROM users WHERE id = $1",[id]);
    cb(null,user.rows[0]);
  }
  catch(err){
    console.log(err);
  }
  
})
app.listen(PORT, () => {
  console.log(`Backend running on ${PORT}`);
});