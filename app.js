//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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

const secret = "My deepest secret";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});


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
                if(foundAccounts.password === password){
                    res.render("secrets");
                }
                else{
                    res.send("INCORRECT PASSWORD");
                }
            
            }
        }
    });
});

app.route("/register")
.get((req,res) => {   
    res.render("register");
})
.post((req,res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
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


app.listen(3000, () => {
    console.log("Listening on port 3000...");
});

