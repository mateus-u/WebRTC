import { VideoRoomService } from './video-rooms/video-room.service';
import { Server } from "socket.io";

const videoRoomService = new VideoRoomService();

const io = new Server({});

io.listen(3000);

io.on("connection", (socket) => {
    console.log("connection", socket.id);

    socket.on("join-room", (data) => {
        console.log("joined", data.roomId)

        socket.join(data.roomId)
        socket.emit("join-room", data.roomId)
    });


    socket.on("offer", (offer) => {
        console.log("offer")
        for (let room of socket.rooms) {
            socket.to(room).emit('offer', offer)
        }
    });

    socket.on("answer", (answer) => {
        console.log("answer")
        for (let room of socket.rooms) {
            socket.to(room).emit('answer', answer)
        }
    });

    socket.on("ice-candidate", (candidate) => {
        console.log("candidate", new Date(Date.now()).toString())
        for (let room of socket.rooms) {
            socket.to(room).emit('ice-candidate', candidate)
        }
    });
});

