const Message = require("../Models/Message");
const Room = require("../Models/Room");
const User = require("../models/User");

const roomsList = [];

exports.Socket = () => {
  const io = require("socket.io")(8002, {
    cors: "http://localhost:3000/",
  });

  io.on("connection", (socket) => {
    socket.on("id", (id) => {
      login(id);
      socket.on("disconnect", () => {
        logout(id);
        console.log("disconnect");
      });
    });

    socket.on("newMessage", (newMessage, callBack) => {
      addMessage(newMessage, callBack, socket);
    });

    socket.on("createRoom", (room, callBack) => {
      addRoom(room, callBack, socket);
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
                user.previousMessages.push(message._id);
                user.save().catch((err) => console.log({message: err}));
              });

              console.log({message: "Message Sent", participants: users});
            });
          })
          .catch((err) => {
            console.log(err);
          });

        callBack(message._id, currentName);
        socket.broadcast.emit("recive-message", {
          ...newMessage,
          creationTime: currentName,
          _id: message._id,
        });
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
              user.previousRooms.push(room._id);
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

        console.log(newRoomData);
        console.log(room);

        callBack(room);
        socket.broadcast.emit("recive-newRoom", room);
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
