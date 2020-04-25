var mongoose = require("mongoose"),
    PassportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    contact: Number,
    username: String,
    password: String
});

userSchema.plugin(PassportLocalMongoose);

module.exports = mongoose.model("User", userSchema);