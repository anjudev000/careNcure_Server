const { instrument } = require("@socket.io/admin-ui")

let roomSockets


const socketManager = (io) => {
  const emailToSocketIdMap = new Map();
  const socketIdToEmailMap = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    //doctor joining the room
    socket.on("room:join", (data) => {
      console.log(`Doctor ${data.email} joined room ${data.room}`);
      const { email, room } = data;
      emailToSocketIdMap.set(email, socket.id);
      socketIdToEmailMap.set(socket.id, email);
      socket.join(room);
      roomSockets = io.sockets.adapter.rooms.get(room)
      // io.to(socket.id).emit("room:join", data);
    });
    //user joining the room
    socket.on("user-room:join", (data) => {
      console.log(`User ${data.email} joined room ${data.room}`);
      const { email, room } = data
      socket.join(room);
      io.to(room).emit('user:joined', socket.id)

    })
    //listening to call emitted by doctor
    socket.on("user:call", ({ to, offer }) => {
      console.log(`Doctor ${socket.id} initiated a call to ${to}`);
      //emitting the incoming call event to user
      io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

  

    //listening to the call:accepted event
    socket.on("call:accepted", (data) => {
      // console.log(data,42222222222)
      // console.log(data.to,43333);
      console.log(Object.values(data)[0].ans,44444);
    console.log(`Call accepted from ${Object.values(data)[0].to} to ${socket.id} and answer is ${Object.values(data)[0].ans }`);
    const {to,ans} = data;
    //emitting call:accepted event
      io.to(Object.values(data)[0].to).emit("call:accepted", { from: socket.id, ans:Object.values(data)[0].ans });
    });

    //listening to negotiation needed
   socket.on('peer:nego:needed',(data)=>{
      const {to,offer} = data;
      io.to(to).emit('peer:nego:needed',{from:socket.id,offer});
   })

   //listening  nego:done
   socket.on('peer:nego:done',(data)=>{
    const {to,ans} = data;
    io.to(to).emit('peer:nego:final',{from:socket.id,ans})
   })

 
    // Handle socket disconnection
    socket.on("disconnect:call", (data) => {
      console.log(data,6666);
      const {to} = data;
      console.log(to,6888);
      console.log(socketIdToEmailMap,6999);
      console.log(emailToSocketIdMap,7000);
    const email = socketIdToEmailMap.get(to);
    console.log(email,7000);
    if (email) {
      emailToSocketIdMap.delete(email);
      socketIdToEmailMap.delete(to);
      console.log(emailToSocketIdMap,766);
      console.log(socketIdToEmailMap,777);
    }
     // Emit disconnect event to notify the other party
     console.log(roomSockets,7666);
     const targetSocket = io.sockets.sockets.get(to);
     if (targetSocket) {
       targetSocket.disconnect();
     }
  });
   
  });


  instrument(io, { auth: false })
};

module.exports = socketManager;