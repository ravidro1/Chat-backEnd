const mongoose = require("mongoose");

const User = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  previousRooms: [{type: mongoose.Types.ObjectId, ref: "Room"}],
  previousMessages: [{type: mongoose.Types.ObjectId, ref: "Message"}],
  loggedIn: {type: Boolean, required: true, default: false},
});

module.exports = mongoose.model("User", User);
