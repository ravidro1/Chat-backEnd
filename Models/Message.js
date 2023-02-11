const mongoose = require("mongoose")

const Message = new mongoose.Schema({
    content: {type: String, required: true},
    room: {type: mongoose.Types.ObjectId, ref: "Room", required: true},
    // from: {type: mongoose.Types.ObjectId, ref: "User", required: true}
    from: {type: String, required: true},
    creationTime: {type: Date, required: true}
})

module.exports = mongoose.model("Message", Message);
