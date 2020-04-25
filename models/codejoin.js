var mongoose = require("mongoose");

var codeSchema = new mongoose.Schema({
    joincode: String,
    username: String,
    joins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "join"
    }]

})


module.exports = mongoose.model("codejoin", codeSchema);