const Message = require("../Models/Message");
const Room = require("../Models/Room");
const User = require("../Models/User");
const bcrypt = require("bcrypt");
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
    });

    socket.on("transmit-IsTyping", (from, isTyping, room) => {
      socket.to(room).emit("receive-IsTyping", from, isTyping, room);
    });

    socket.on("transmit-sendFriendshipRequest", (from, to, callBack) => {
      addFriendshipRequest(callBack, socket, to, from);
    });

    socket.on(
      "transmit-acceptFriendshipRequest",
      (isConfirmOrDeny, from, to, callBack) => {
        if (isConfirmOrDeny)
          confirmRequest(callBack, socket, to, from, isConfirmOrDeny);
        else denyRequest(callBack, socket, to, from, isConfirmOrDeny);
      }
    );

    socket.on("joinRoom", (room, callBack) => {
      socket.join(room);
      callBack(room);
    });
  });
};

const addFriendshipRequest = (callBack, socket, to, from) => {
  User.findById(to)
    .then((user) => {
      if (!user) {
        console.log("Find User Faild");
      } else {
        if (
          !user.FriendRequestsSentToUserInPending.includes(from) ||
          !user.FriendRequestsSentFromUserInPending.includes(from)
        ) {
          const newFriendRequestsSentToUserInPending = [
            ...user.FriendRequestsSentToUserInPending,
          ];

          newFriendRequestsSentToUserInPending.push(from);

          user
            .update({
              FriendRequestsSentToUserInPending:
                newFriendRequestsSentToUserInPending,
              FriendRequestsUserSentThatDeny:
                user.FriendRequestsUserSentThatDeny.filter(
                  (item) => item != from
                ),
            })
            .then((user) => {
              socket.to(to).emit("receive-sendFriendshipRequest", from);
            })
            .catch((err) => {
              console.log({message: "Error", err: err});
            });
        }
      }
    })
    .catch((err) => {
      console.log({message: "Error", err: err});
    });

  User.findById(from)
    .then((user) => {
      if (!user) {
        console.log("Find User Faild");
      } else {
        if (
          !user.FriendRequestsSentFromUserInPending.includes(to) ||
          !user.FriendRequestsSentToUserInPending.includes(to)
        ) {
          const newFriendRequestsSentFromUserInPending = [
            ...user.FriendRequestsSentFromUserInPending,
          ];

          newFriendRequestsSentFromUserInPending.push(to);
          user
            .update({
              FriendRequestsSentFromUserInPending:
                newFriendRequestsSentFromUserInPending,
              FriendRequestsUserSentThatDeny:
                user.FriendRequestsUserSentThatDeny.filter(
                  (item) => item != to
                ),
            })
            .then((user) => {
              callBack(to);
            })
            .catch((err) => {
              console.log({message: "Error", err: err});
            });
        }
      }
    })
    .catch((err) => {
      console.log({message: "Error", err: err});
    });
};

const confirmRequest = (callBack, socket, to, from, isConfirmOrDeny) => {
  User.findById(to)
    .then((user) => {
      if (!user) {
        console.log("User Not Found");
      } else {
        user
          .update({
            friendsList: [...user.friendsList, from],
            FriendRequestsSentFromUserInPending:
              user.FriendRequestsSentFromUserInPending.filter(
                (item) => item.toString() != from
              ),
          })
          .catch((err) => {
            console.log(err);
          });

        socket
          .to(to)
          .emit("receive-acceptFriendshipRequest", from, isConfirmOrDeny);
      }
    })
    .catch((err) => {
      console.log(err);
    });

  User.findById(from)
    .then((user) => {
      if (!user) {
        console.log("User Not Found");
      } else {
        user
          .update({
            friendsList: [...user.friendsList, to],
            FriendRequestsSentToUserInPending:
              user.FriendRequestsSentToUserInPending.filter(
                (item) => item.toString() != to
              ),
          })
          .catch((err) => {
            console.log(err);
          });

        callBack();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const denyRequest = (callBack, socket, to, from, isConfirmOrDeny) => {
  User.findById(to)
    .then((user) => {
      if (!user) {
        console.log("User Not Found");
      } else {
        user
          .update({
            FriendRequestsUserSentThatDeny: [
              ...user.FriendRequestsUserSentThatDeny,
              from,
            ],
            FriendRequestsSentFromUserInPending:
              user.FriendRequestsSentFromUserInPending.filter(
                (item) => item.toString() != from
              ),
          })
          .catch((err) => {
            console.log(err);
          });

        socket
          .to(to)
          .emit("receive-acceptFriendshipRequest", from, isConfirmOrDeny);
      }
    })
    .catch((err) => {
      console.log(err);
    });

  User.findById(from)
    .then((user) => {
      if (!user) {
        console.log("User Not Found");
      } else {
        user
          .update({
            FriendRequestsSentToUserInPending:
              user.FriendRequestsSentToUserInPending.filter(
                (item) => item.toString() != to
              ),
          })
          .catch((err) => {
            console.log(err);
          });

        callBack();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const signup = async (username, password, callBack, socket) => {

  if(password.length < 1) return;

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({username: username, password: hashPassword});
  newUser
    .save()
    .then((user) => {
      if (!user) {
        console.log({message: "User creation falild"});
      } else {
        callBack(false);
        socket.broadcast.emit("receive-signup", user);

        console.log({message: "User created"});
      }
    })
    .catch((err) => {
      console.log({message: "Error", err: err});
      callBack(true);
    });
};

const addMessage = (newMessage, callBack, socket) => {
  const currentTime = new Date();

  const createMessage = new Message({...newMessage, creationTime: currentTime});
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
                  creationTime: currentTime,
                  _id: message._id,
                });

                if (user.username != message.from) {
                  const unreadItemIndex = user.unreadMessages.findIndex(
                    (item) =>
                      item.roomID?.toString() == message.room?.toString()
                  );

                  if (unreadItemIndex >= 0) {
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

              console.log({message: "Message Sent"});
            });

            room.update({lastTimeActive: currentTime}).catch((err) => {
              console.log({
                message: "Error - Update lastTimeActive Faild",
                err,
              });
            });
          })
          .catch((err) => {
            console.log({message: "Error", err});
          });

        callBack(message._id, currentTime);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const addRoom = (newRoomData, callBack, socket) => {
  const currentTime = new Date().getTime();
  const newRoom = new Room({...newRoomData, lastTimeActive: currentTime});
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
        console.log({message: "User Logout | Socket"});
      }
    })
    .catch((err) => {
      console.log({message: "Error", err});
    });
};
