const {Socket} = require("./Controller/Socket");
Socket();

const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 8000;

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGOOSE_USERNAME}:${process.env.MONGOOSE_PASSWORD}@cluster0.cuw4ebp.mongodb.net/?retryWrites=true&w=majority`,
    {}
  )
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

const UserController = require("./Controller/UserController");

app.use(cors(["http://localhost:3000/", process.env.FRONTEND_URL]));

app.use(express.json());

app.post("/SignUp", UserController.signup);
app.post("/Login", UserController.login);
app.post(
  "/LoginVerifyAndCheckIfUserAlreadyLogged",
  UserController.loginVerifyAndCheckIfUserAlreadyLogged
);
app.post("/Logout", UserController.logout);

app.post("/GetAllUsers", UserController.getAllUsers);
app.post("/GetAllUserMessages", UserController.getAllUserMessages);
app.post("/GetAllRooms", UserController.getAllRooms);
app.post("/GetOneUser", UserController.getOneUser);

app.post("/UpdateUnreadMessage", UserController.updateUnreadMessage);

// app.post("/CheckUserAlreadyLogged", UserController.checkUserAlreadyLogged);
// app.post("/AddMessage", UserController.addMessage);
// app.post("/AddRoom", UserController.addRoom);
// app.post("/GetAllUserRoomMessage", UserController.getAllUserRoomMessage);

app.listen(port, () => console.log(`listening on port ${port}!`));

app.use((req, res) => {
  res.send("RaviChat Server");
});
