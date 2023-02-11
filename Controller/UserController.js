const User = require("../models/User");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Message = require("../Models/Message");
const Room = require("../Models/Room");

exports.signup = async (req, res) => {
  const hashPassword = await bcrypt.hash(req.body.password, 10);
  const newUser = new User({...req.body, password: hashPassword});
  newUser
    .save()
    .then((user) => {
      if (!user) {
        res.status(400).json({message: "User creation falild"});
      } else {
        res.status(200).json({message: "User created"});
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err: err});
    });
};

exports.login = (req, res) => {
  User.findOne({username: req.body.username})
    .then((user) => {
      if (!user) {
        res.status(400).json({message: "User not found"});
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((password) => {
            if (!password) {
              res.status(400).json({message: "Password incorrect"});
            } else {
              if (user.loggedIn) {
                res.status(200).json({message: "User Already Logged!!!", userAlreadyLogged: true});
                return;
              }

              user.loggedIn = true;
              user
                .save()
                .then((user) => {
                })
                .catch((err) => {
                  res.status(500).json({message: "Error", err: err});
                });

              const token = jsonwebtoken.sign(
                {id: user._id},
                process.env.JWT_TOKEN
              );
              console.log({message: "User Login | Controller"});

              res
                .status(200)
                .json({message: "Login", userID: user._id, token: token, userAlreadyLogged: false});
            }
          })
          .catch((err) => {
            res.status(500).json({message: "Error", err: err});
          });
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err: err});
    });
};

exports.loginVerifyAndCheckIfUserAlreadyLogged = (req, res) => {
  User.findOne({_id: req.body.id})
    .then((user) => {
      if (!user) {
        res.status(400).json({message: "User Not Exist"});
      } else {
        const isLegalToken = jsonwebtoken.verify(
          req.body.token,
          process.env.JWT_TOKEN
        );
        if (isLegalToken) {
          res.status(200).json({
            message: "Token Legal",
            isLegalToken: true,
            isAlreadyLogged: user.loggedIn,
          });
        } else {
          res
            .status(400)
            .json({message: "Token Not Legal", isLegalToken: false});
        }
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err, isLegalToken: false});
    });
};

exports.logout = (req, res) => {
  User.findOneAndUpdate({_id: req.body.id}, {loggedIn: false})
    .then((user) => {
      if (!user) res.status(400).json({message: "User Not Found!!!"});
      else {
        // console.log(user);
        res.status(200).json({message: "User Logout"});
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err});
    });
};

// exports.checkUserAlreadyLogged = (req, res) => {
//   User.findById(req.body.id)
//     .then((user) => {
//       if (!user) {
//         res.status(400).json({message: "User Not Found"});
//       } else {
//         res
//           .status(200)
//           .json({message: "User Found", isAlreadyLogged: user.loggedIn});
//       }
//     })
//     .catch((err) => {
//       res.status(200).json({message: "Error", err});
//     });
// };

exports.getOneUser = (req, res) => {
  User.findOne({_id: req.body.id})
    .then((user) => {
      if (!user) res.status(400).json({message: "User Not Exist!!!"});
      else res.status(200).json({message: "User Found", user});
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err});
    });
};

exports.getAllUsers = (req, res) => {
  User.find({})
    .then((users) => {
      if (!users) {
        res.status(400).json({message: "Users Not Found"});
      } else {
        res.status(200).json({message: "Users Found", users});
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err});
    });
};

exports.getAllRooms = (req, res) => {
  User.findOne({_id: req.body.id}).then((user) => {
    if (!user) {
      res.status(400).json({message: "User Not Found"});
    } else {
      user.populate("previousRooms").then((rooms) => {
        if (!rooms) {
          res.status(400).json({message: "Rooms List Empty"});
        } else {
          res
            .status(200)
            .json({message: "Room List", rooms: rooms.previousRooms});
        }
      });
    }
  });
};

exports.getAllRoomUsers = (req, res) => {
  Room.findOne({_id: req.body.id}).then((room) => {
    if (!room) {
      res.status(400).json({message: "Room Not Found"});
    } else {
      room.populate("participants").then((users) => {
        if (!users) {
          res.status(400).json({message: "users List Empty"});
        } else {
          res
            .status(200)
            .json({message: "Room List", users: users.participants});
        }
      });
    }
  });
};

exports.getAllUserMessages = (req, res) => {
  // User.findOne({username: req.body.username})
  User.findOne({_id: req.body.id})
    .then((user) => {
      if (!user) {
        res.status(400).json({message: "User Not Found"});
      } else {
        user
          .populate("previousMessages")
          .then((messages) => {
            console.log(
              messages.previousMessages[0].creationTime.getTime(),
              "1"
            );
            if (!messages) {
              res.status(400).json({message: "Message list Empty"});
            } else {
              res.status(200).json({
                message: "Message list",
                data: messages.previousMessages,
              });
            }
          })
          .catch((err) => {
            res.status(500).json({message: err});
          });
      }
    })
    .catch((err) => {
      res.status(500).json({message: "Error", err});
    });
};

// exports.getAllUserRoomMessage = (req, res) => {
//   // User.findOne({username: req.body.username})
//   User.findOne({_id: req.body.id})
//     .then((user) => {
//       if (!user) {
//         res.status(400).json({message: "User Not Found"});
//       } else {
//         user
//           .populate("previousMessages")
//           .then((messages) => {
//             if (!messages) {
//               res.status(400).json({message: "Message list Empty"});
//             } else {
//               const messageList = messages.previousMessages.filter(
//                 (message) => message.room == req.body.room
//               );
//               res.status(200).json({
//                 message: "Message list",
//                 data: messageList,
//               });
//             }
//           })
//           .catch((err) => {
//             res.status(500).json({message: err});
//           });
//       }
//     })
//     .catch((err) => {
//       res.status(500).json({message: "Error", err});
//     });
// };

// exports.addRoom = (req, res) => {
//   const newRoom = new Room(req.body);
//   newRoom
//     .save()
//     .then((room) => {
//       if (!room) {
//         res.status(400).json({message: "Room Not Created"});
//       } else {
//         room
//           .populate("participants")
//           .then((participants) => {
//             participants?.participants?.map((user) => {
//               user.previousRooms.push(room._id);
//               user
//                 .save()
//                 .then((user) => {
//                   if (!user) res.status(400).json({message: "User Not Found"});
//                   else console.log("add to " + user.username);
//                 })
//                 .catch((err) => {
//                   res.status(500).json({message: "Error", err});
//                 });
//             });
//           })
//           .catch((err) => {
//             res.status(500).json({message: err});
//           });
//         res.status(200).json({message: "Room Created"});
//       }
//     })
//     .catch((err) => {
//       res.status(500).json({message: "Error", err});
//     });
// };

// exports.addMessage = (req, res) => {
//   const newMessage = new Message(req.body);
//   newMessage
//     .save()
//     .then((message) => {
//       if (!message) {
//         res.status(400).json({message: "Message Not Created"});
//       } else {
//         Room.findOne({_id: message.room})
//           .then((room) => {
//             room.populate("participants").then((users) => {
//               users.participants.map((user) => {
//                 user.previousMessages.push(message._id);
//                 user
//                   .save()
//                   .catch((err) => res.status(500).json({message: err}));
//               });

//               res
//                 .status(200)
//                 .json({message: "Message Sent", participants: users});
//             });
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//       }
//     })
//     .catch((err) => {
//       res.status(500).json({message: err});
//     });
// };
