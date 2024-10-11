require('dotenv').config()
require('./helpers/db')
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const users = require('./models/github-integration.model');
const cors = require('cors');
const app = express();

app.use(session({ secret: 'a980098c017fe065a9eef539f19643c37cf0e501', resave: false, saveUninitialized: false }));
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200,
    credentials: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


passport.use(new GitHubStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, { profile, accessToken});
  }
));

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  async function(req, res) {
    try{
        let { user } = req
        if(user){
            console.log("REQ>> ", req.session)
            let { profile,accessToken } = user
            let { id, displayName, username, lastLogin } = profile
            let userData = await new users({id, displayName, username, lastLogin, accessToken}).save()
            res.redirect(`http://localhost:4200/?token=${accessToken}`);
        }
        
    }catch(_err){
        console.log("_ERR >> ", _err)
    }
  }
);


app.delete('/auth/user', async(req, res) => {
    let {authorization} = req.headers
    if(!authorization){
        return res.status(401).json({message: "Unauthorized"})
    }
    let token = authorization.substring(6, authorization.length)
    
    return await users.findOneAndDelete({accessToken: token})
        .then(_res => {
            return res.status(200).json({message: "User Removed Successfully!"})
        }).catch(_err => {
            console.log("ERR >> ", _err)
            return res.status(400).json({message: "Something went wrong"})
        })
  });

app.get('/auth/user', async (req, res) => {
    let {authorization} = req.headers
    if(!authorization){
        return res.status(401).json({message: "Unauthorized"})
    }
    let token = authorization.substring(6, authorization.length)
    console.log("Toekn >> ", token)
    let user = await users.findOne({accessToken: token})
    if(!user){
        return res.status(400).json({message: "You are not connected!"})
    }

    return res.status(200).json(user)
});

let port = process.env.PORT
app.listen(port, () =>{
    console.log(`API START AT PORT ${port} `)
})



