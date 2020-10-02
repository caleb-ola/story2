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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const FacebookStrategy = require("passport-facebook").Strategy;

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
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

//Configuring the strategy and ensure the serialization and deserialization.
passport.use(User.createStrategy());


//Local serialization and deserialization 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req,res) => {  
     res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/submit", (req,res) => {
    if(req.isAuthenticated()){
       res.render("submit"); 
    }
    else{
        res.redirect("/login");
    } 
  });

app.get("/secrets", (req,res) => {
    User.find({secret: {$ne: null}}, (err,foundUsers) => {
        if(err) {
            console.log(err)
        }
        else{
            if(foundUsers){
                res.render("secrets", {listOfSecrets: foundUsers});
            }
        }
    });
});

app.post("/submit", (req,res) => {
    const newSecret = req.body.secret;
    console.log(req.user);

    User.findById(req.user._id,(err, foundUser) => {
        if(err) {
            console.log(err);
        }
        else{
            foundUser.secret = newSecret;
            foundUser.save(()=> {
                res.redirect("/secrets");
            });
        }
    });
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

