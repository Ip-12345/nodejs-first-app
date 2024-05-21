import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import { secureHeapUsed } from 'crypto';
import { runInNewContext } from 'vm';
import bcrypt from "bcrypt";

mongoose.connect("mongodb://localhost:27017", {
    dbName: "backend",
})
.then(() => console.log("database connected!"))
.catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const user = mongoose.model("User", userSchema); 

const server = express();
const users = [];

server.use(express.static(path.join(path.resolve(), "public")));
server.use(express.urlencoded({extended: true}));
server.use(cookieParser());

server.set("view engine", "ejs");

/*server.get("/", (req, res) => {
    res.render("index"); 
});
*/

const isAuthenticated = async (req, res, next) => {
    const {token} = req.cookies;
    if(token){
        
        const decoded = jwt.verify(token, "dhfghdgvfvsjkreg");
        req.User = await user.findById(decoded._id);

        next();
    }
    else{
    res.redirect("/login");
    }
};

server.get("/", isAuthenticated, (req, res) => {
   res.render("logout", {name: req.User.name});
});

server.get("/login", (req, res) => {
    res.render("login");
});

server.get("/register", (req, res) => {
    res.render("register");
});

server.post("/login", async (req, res) => {

    const {email, password} = req.body;

    let User = await user.findOne({email});
    if(!User){
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password, User.password);
    if(!isMatch)
        return res.render("login", {email, message: "Incorrect password"});

    const token = jwt.sign({ _id : User._id}, "dhfghdgvfvsjkreg");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000),
    });

    res.redirect("/"); 
})

server.post("/register", async (req, res) => {

    const {name, email, password} = req.body;

    let User = await user.findOne({email});
    if(User){
        return res.redirect("/login");
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    User = await user.create({ 
        name,
        email, 
        password: hashedpassword,
    });

    const token = jwt.sign({ _id : User._id}, "dhfghdgvfvsjkreg");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000),
    });
});

server.get("/logout", (req, res) => {
    res.cookie("token", "null", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

/*
server.get("/success", (req, res) => {
    res.render("success");
}); 

server.post("/contact", async (req,res) => {
    const {name, email} = req.body;
    await Msg.create({ name, email });
    res.redirect("success"); 
});

server.get("/users", (req,res) => {
    res.json({
        users,
    });
});
*/

server.listen(5000, () => {
    console.log("hello server");
});

