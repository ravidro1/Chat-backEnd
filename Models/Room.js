const mongoose = require("mongoose");

const Room = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
  },
  participants: [{type: mongoose.Types.ObjectId, ref: "User", required: true}],
  creationTime: {type: Date, required: true},
  creator: {type: String, required: true},

  //  isPrivate: {type: Boolean, required: true},
});

module.exports = mongoose.model("Room", Room);
