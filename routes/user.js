const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../contollers/users.js");
router.route("/signup")
.get( userController.signUpForm)
.post( wrapAsync(userController.signUp));

router.route("/login")
.get( userController.loginPage)
.post( saveRedirectUrl, passport.authenticate("local" , {failureRedirect: "/login" , failureFlash:true,}), 
userController.loginPageFlash
);

router.get("/logout" , userController.logout);
module.exports = router;