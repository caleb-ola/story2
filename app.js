//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
//const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
    }));

//Telling the app to use the express-session package with some initial configurations.
app.use(session({
    secret: "My deepest little secret.",
    resave: false,
    saveUninitialized: true
}));


//Initializing passport and using passport to handle sessions
app.use(passport.initialize());
app.use(passport.session());
// require("./app/config/passport.js")(pass);


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

//Configuring the strategy and ensure the serialization and deserialization.
passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req,res) => {  
     res.render("home");
});

app.get("/secrets", (req,res) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});
app.route("/login")
.get((req,res) => { 
    res.render("login");
})
.post((req,res) => {
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res, () => {
                //console.log(req.user);
                res.redirect("/secrets");
            });
        }
    });
});


app.get("/logout",(req,res) => {
    req.logout();
    res.redirect("/");
});

app.route("/register")
.get((req,res) => {   
    res.render("register");
})
.post((req,res) => {

    User.register({username: req.body.username}, req.body.password, (err,user) => {
        if(err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res, () => {
                res.redirect("/secrets");
            });
        }
    });
    
});


app.listen(3000, () => {
    console.log("Listening on port 3000...");
});

