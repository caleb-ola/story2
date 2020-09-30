//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
    }));


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


const User = mongoose.model("User", userSchema);

app.get("/", (req,res) => {  
     res.render("home");
});

app.route("/login")
.get((req,res) => { 
    res.render("login");
})
.post((req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username},(err,foundAccounts) => {
        if(err){
            console.log(err);
        }
        else{
            if(foundAccounts){
                bcrypt.compare(password, foundAccounts.password, function(err, result) {
                    // result == true
                    if(result === true){
                    res.render("secrets");
                }
                else{
                    res.send("INCORRECT PASSWORD");
                }
            
                });
                
            }
        }
    });
});

app.route("/register")
.get((req,res) => {   
    res.render("register");
})
.post((req,res) => {
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
        email: req.body.username,
        password: hash
    });
    newUser.save( err => {
        if(!err){
            console.log("NEW USER SUCCESSFULLY ADDED");
        }
        else{
            console.log(err);
        }
    })
    res.redirect("/login");
    });
    
});


app.listen(3000, () => {
    console.log("Listening on port 3000...");
});

