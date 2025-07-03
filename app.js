import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import env from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GitHubStrategy from "passport-github";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    password:"Tridip@2006",
    port:5432,
    database:"commitdb"
})
db.connect();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/public/html/main.html");
})


app.listen(port,()=>{
    console.log("App running in port:",port);
})