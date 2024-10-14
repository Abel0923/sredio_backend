const express = require('express')
const authController = require('../controllers/auth.controller');
const passport = require('passport');

const router = express.Router();
router.get('/auth/github', authController.githubAuth);
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), authController.githubCallback);
router.get('/auth/user', authController.userAuth);
router.delete('/auth/user', authController.deleteAuthUser);

module.exports =  router 