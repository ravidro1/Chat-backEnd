const Message = require("../Models/Message");
const Room = require("../Models/Room");
const User = require("../Models/User");

const bcrypt = require("bcrypt");

// const {io} = require("../index")

require("dotenv").config();

exports.Socket = (io) => {
  setInterval(() => {
    console.log("Render Interval");
  }, 1000 * 60 * 30);

  io.on("connection", (socket) => {
    socket.on("id", (id) => {
      login(id);
      socket.on("disconnect", () => {
        logout(id);
        console.log("disconnect");
      });
    });

    socket.on("signup", (username, password, callBack) => {
      signup(username, password, callBack, socket);
    });

    socket.on("newMessage", (newMessage, callBack) => {
      addMessage(newMessage, callBack, socket);
    });

    socket.on("createRoom", (room, callBack) => {
      addRoom(room, callBack, socket);
      // console.log(socket.rooms);
    });

    socket.on("transmit-IsTyping", (from, isTyping, room) => {
      socket.to(room).emit("receive-IsTyping", from, isTyping, room);
    });

    socket.on("joinRoom", (room, callBack) => {
      // const roomsArray = Array.from(socket.rooms);
      // roomsArray.forEach((room, index) => {
      //   if (index != 0) socket.leave(room);
      // });

      socket.join(room);
      callBack(room);
    });
  });
};

const signup = async (username, password, callBack, socket) => {
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({username: username, password: hashPassword});
  newUser
    .save()
    .then((user) => {
      if (!user) {
        console.log({message: "User creation falild"});
      } else {
        callBack();
        socket.broadcast.emit("receive-signup", user);

        console.log({message: "User created"});
      }
    })
    .catch((err) => {
      console.log({message: "Error", err: err});
    });
};

const addMessage = (newMessage, callBack, socket) => {
  const currentName = new Date();

  const createMessage = new Message({...newMessage, creationTime: currentName});
  createMessage
    .save()
    .then((message) => {
      if (!message) {
        console.log({message: "Message Not Created"});
      } else {
        Room.findOne({_id: message.room})
          .then((room) => {
            room.populate("participants").then((users) => {
              users.participants.map((user) => {
                socket.to(user._id.toString()).emit("recive-message", {
                  ...newMessage,
                  creationTime: currentName,
                  _id: message._id,
                });

                if (user.username != message.from) {
                  const unreadItemIndex = user.unreadMessages.findIndex(
                    (item) =>
                      item.roomID?.toString() == message.room?.toString()
                  );

                  if (unreadItemIndex >= 0) {
                    // console.log(unreadItemIndex);

                    user.unreadMessages[unreadItemIndex] = {
                      roomID: user.unreadMessages[unreadItemIndex].roomID,
                      numberOfUnreadMessages:
                        user.unreadMessages[unreadItemIndex]
                          .numberOfUnreadMessages + 1,
                    };
                  } else {
                    user.unreadMessages.push({
                      numberOfUnreadMessages: 1,
                      roomID: message.room,
                    });
                  }
                }

                user.previousMessages.push(message._id);
                user
                  .save()
                  .then()
                  .catch((err) => console.log({message: "Error", err}));
              });

              // console.log({message: "Message Sent", participants: users});
              console.log({message: "Message Sent"});
            });
          })
          .catch((err) => {
            console.log({message: "Error", err});
          });

        callBack(message._id, currentName);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const addRoom = (newRoomData, callBack, socket) => {
  const newRoom = new Room(newRoomData);
  newRoom
    .save()
    .then((room) => {
      if (!room) {
        console.log({message: "Room Not Created"});
      } else {
        room
          .populate("participants")
          .then((participants) => {
            participants?.participants?.map((user) => {
              socket.to(user._id.toString()).emit("recive-newRoom", room);
              user.previousRooms.push(room._id);

              user.unreadMessages.push({roomID: room._id});
              // console.log(user);
              user
                .save()
                .then((user) => {
                  if (!user) console.log({message: "User Not Found"});
                  else {
                    console.log("add to " + user.username);
                  }
                })
                .catch((err) => {
                  console.log({message: "Error", err});
                });
            });
          })
          .catch((err) => {
            console.log({message: err});
          });
        console.log({message: "Room Created"});

        // console.log(newRoomData);
        // console.log(room);

        callBack(room);
      }
    })
    .catch((err) => {
      console.log({message: "Error", err});
    });
};

const login = (id) => {
  User.findOneAndUpdate({_id: id}, {loggedIn: true})
    .then((user) => {
      if (!user) console.log({message: "User Not Found!!!"});
      else {
        // console.log(user);
        console.log({message: "User Login | Socket"});
      }
    })
    .catch((err) => {
      console.log({message: "Error", err});
    });
};

const logout = (id) => {
  User.findOneAndUpdate({_id: id}, {loggedIn: false})
    .then((user) => {
      if (!user) console.log({message: "User Not Found!!!"});
      else {
        // console.log(user);
        console.log({message: "User Logout | Socket"});
      }
    })
    .catch((err) => {
      console.log({message: "Error", err});
    });
};
