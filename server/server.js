const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 3001;

let users = {};
const socketToRoom = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomId) => {
    if (users[roomId]) users[roomId].push(socket.id);
    else users[roomId] = [socket.id];

    // this is an array containing the socket id's of users currently in a room
    // except for the person joining the room
    const usersInThisRoom = users[roomId].filter(
      (userId) => userId !== socket.id
    );

    socketToRoom[socket.id] = roomId;
    socket.emit("get all users", usersInThisRoom);
  });

  // after a new user joins, they send a signal to other people in the room
  // this emits "new user joined"
  socket.on("sending signal", ({ userToSignal, callerId, callerSignal }) => {
    io.to(userToSignal).emit("new user joined", {
      callerSignal,
      callerId,
    });
  });

  // after accepting the signal of the user joining the room, send out a signal to that new user
  socket.on("returning signal", ({ userInRoomSignal, callerId }) => {
    io.to(callerId).emit("receiving returned signal", {
      userInRoomSignal,
      userInRoomId: socket.id,
    });
  });

  // handle deleting users from a given room
  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let room = users[roomId];
    console.log(`${socket.id} disconnected from room: ${roomId}`);
    if (room) {
      users[roomId] = room.filter((id) => id !== socket.id);
      const usersInThisRoom = users[roomId].filter(
        (userId) => userId !== socket.id
      );
      console.log(usersInThisRoom);
      socket.emit("get all users", usersInThisRoom);
    }
  });
});

http.listen(port, () => {
  console.log(`Connected at port: ${port}`);
});
