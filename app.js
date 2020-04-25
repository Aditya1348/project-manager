var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    Passport = require("passport"),
    LocalStrategy = require("passport-local"),
    PassportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user"),
    codecreate = require("./models/codecreate"),
    methodOverride = require("method-override"),
    work = require("./models/work"),
    join = require("./models/join"),
    flash = require("connect-flash"),
    idno = require("./idno");





mongoose.connect("mongodb+srv://Aditya4813:Aditya@9523@cluster0-41czy.mongodb.net/myFirst?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true }

).then(() => {
    console.log("connected to DB !");
}).catch(err => {
    console.log('ERROR:', err.message);
});

app.use(require("express-session")({
    secret: "i know my world",
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"))
app.use(flash());



app.use(Passport.initialize());
app.use(Passport.session());
//*****************************************************************
//serializeUser and deserializeUser are responsible for reading the session , taking the data from the session that encoded and unencoding it that the deSerealizeUser and then encoding it and putting back into session is what serealizeUser does
Passport.use(new LocalStrategy(User.authenticate()));
Passport.serializeUser(User.serializeUser());
Passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.user = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.get("/", function(req, res) {
    res.render("home");
});
app.get("/secret", isLoggedIn, function(req, res) {

    codecreate.find({ username: req.user.username }, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            res.render("secret", { created: found })
        }
    })
});
app.get("/register", function(req, res) {
    res.render("register");
});
app.post("/register", function(req, res) {
    User.register(new User({ firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email, contact: req.body.contact, username: req.body.username }), req.body.password, function(err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        Passport.authenticate("local")(req, res, function() {
            req.flash("success", "You have successfully registered now you can logIn");
            res.redirect("/login")
        })

    })
});

app.get("/login", function(req, res) {
    res.render("login")
});

//Middleware
app.post("/login", Passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login"
}), function(req, res) {

});

app.get("/logout", function(req, res) {
    req.logOut();
    res.redirect("/");
});

app.get("/create/new", isLoggedIn, function(req, res) {
    res.render("create")
});


app.post("/create/:user", isLoggedIn, function(req, res) {
    console.log(idno());

    var newcode = { createcode: idno(), username: req.params.user, title: req.body.title, describe: req.body.describe };
    codecreate.create(newcode, function(err, created) {
        if (err) {
            console.log(err);
        } else {
            req.flash("success", "succefully Created Work");
            res.redirect("/secret");
        }
    })
});

//EDIT
app.get("/createdwork/:id/edit", isLoggedIn, function(req, res) {


    codecreate.findById({ _id: req.params.id }, function(err, found) {
        if (err) {
            req.flash("error", "Somethings Went Wrong")
            res.redirect("/secret");
        } else {
            res.render("edit", { editwork: found });
        }
    })

});
//UPDATE
app.put("/createdwork/:id/:user", isLoggedIn, function(req, res) {

    var newcode = { createcode: idno(), username: req.params.user, title: req.body.title, describe: req.body.describe };
    codecreate.findByIdAndUpdate({ _id: req.params.id }, newcode, function(err, updatedBlog) {
        if (err) {
            req.flash("error", "Somethings Went Wrong")
            res.redirect("/secret");
        } else {
            req.flash("success", "Successfully Edited Your Work")
            res.redirect("/secret");
        }
    })

});

//DELETE
app.delete("/createdwork/:id", isLoggedIn, function(req, res) {
    codecreate.findByIdAndRemove(req.params.id, function(err, deleted) {
        if (err) {
            res.redirect("/secret");
        } else {
            work.deleteMany({ _id: { $in: deleted.works } }, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    join.findOneAndDelete({ id: req.params.id }, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect("/secret");
                        }
                    })
                }
            })
        }
    })
});

//SHOW
app.get("/show/:id", isLoggedIn, function(req, res) {
    codecreate.findById(req.params.id).populate("works").exec(function(err, found) {
        if (err) {
            console.log(err);
        } else {
            res.render("show", { found: found });
        }
    })
});


app.get("/show/:id/comment/new", isLoggedIn, function(req, res) {

    codecreate.findById(req.params.id, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            res.render("newcomment", { found: found });
        }
    })
});

app.post("/show/:id/comment/:user", isLoggedIn, function(req, res) {
    codecreate.findById(req.params.id, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            var comment = ({ id: req.user._id, username: req.params.user, comment: req.body.comment });
            work.create(comment, function(err, comment) {
                if (err) {
                    console.log(err);
                    res.redirect("/show/" + req.params.id);
                } else {
                    found.works.push(comment);
                    found.save();
                    res.redirect("/show/" + req.params.id);
                }
            })
        }
    })
});

app.get("/joinshow/:user", isLoggedIn, function(req, res) {
    join.find({ user: req.params.user }, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            res.render("joinshow", { found: found });
        }
    })
});

app.delete("/deletejoin/:id/:user", isLoggedIn, function(req, res) {
    join.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            console.log("back");
        } else {
            req.flash("success", "You just successfully leaved the group")
            res.redirect("/joinshow/" + req.params.user);
        }
    })
});

app.get("/join", isLoggedIn, function(req, res) {
    res.render("join");
});
app.post("/join/:user", isLoggedIn, function(req, res) {
    codecreate.find({ createcode: req.body.code }, function(err, found) {
        console.log(found[0].username);
        if (found[0].username == req.user.username) {
            req.flash("error", "Why are you joining your Creation")
            res.redirect("/join");
        } else {
            join.create({ user: req.params.user, id: found[0]._id, code: found[0].createcode, creator: found[0].username, title: found[0].title, describe: found[0].describe }, function(err, created) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash("success", "Successfully Joined The Work")
                    res.redirect("/joinshow/" + req.params.user);
                }
            })
        }

    })
});

app.get("/commentedit/:user/:showid", commentOwnerShip, function(req, res) {
    work.find({ username: req.params.user }, function(err, found) {
        if (err) {
            res.redirect("back");
        } else {
            res.render("commentedit", { found1: req.params.user, found2: req.params.showid, found3: found });
        }
    })
});

app.put("/commentedit/:user/:showid", commentOwnerShip, function(req, res) {
    work.findOneAndUpdate({ username: req.params.user }, { comment: req.body.comment }, function(err, updated) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/show/" + req.params.showid)
        }
    })
});

app.delete("/delete/:user/:commentid/:showid", commentOwnerShip, function(req, res) {
    console.log(req.params.commentid)
    work.findByIdAndDelete(req.params.commentid, function(err, deleted) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/show/" + req.params.showid)
        }
    })
});

//creation of  Middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "you should first logIn")

    res.redirect("/login");
};

function commentOwnerShip(req, res, next) {
    if (req.isAuthenticated()) {
        work.find({ username: req.params.user }, function(err, found) {
            if (err) {
                res.redirect("back");
            } else {

                if (req.user._id == found[0].id) {
                    next();
                } else {

                    res.redirect("back");
                }
            }
        })
    } else {
        req.flash("error", "You don't have Permission to do that")
        res.redirect("back");
    }

};



app.listen(process.env.PORT || 8080, process.env.IP, function() {
    console.log("server has started just now");
});