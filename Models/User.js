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

  unreadMessages: [
    {
      numberOfUnreadMessages: {type: Number, required: true, default: 0},
      roomID: {type: mongoose.Types.ObjectId, ref: "Room", required: true},
    },
  ],

  loggedIn: {type: Boolean, required: true, default: false},
});

module.exports = mongoose.model("User", User);
