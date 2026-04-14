const User = require("../models/user");


module.exports.renderSignupForm = (req, res) =>{
    res.render("users/signup.ejs");
}

module.exports.signup = async(req, res) =>{
    try{
    let {username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
   req.login(registeredUser, (err)=>{
    if(err){
        return next(err);
    }
    req.flash("success", "welcome to HotelEase!");
    res.redirect("/hotels");
   });
   
    }
    catch(err){
     
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res)=>{
    res.render("users/login.ejs");
  };

  module.exports.login = async (req, res)=>{
    req.flash("Success","Welcome to wonderlust, you are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/hotels"
    res.redirect( redirectUrl);
    };

    module.exports.logout = (req, res) =>{
        req.logout((err)=>{
            if(err){
              return  next(err);
            }
            req.flash("success", "You are logged out now!");
            res.redirect("/hotels");
        });
    };
