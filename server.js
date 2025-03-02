var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
const fs = require("fs").promises;
const path = require("path");

app.use(express.static(__dirname)); // 정적 파일 제공

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

http.listen(3000, function () {
  console.log("Server가 실행 중입니다. 포트번호: 3000");
});

var players = {}; // 접속한 플레이어들을 저장할 객체

io.on("connection", function (socket) {
  console.log("새로운 플레이어 접속:", socket.id);

  // 새로운 플레이어 등록
  socket.on("newPlayer", async function (playerData) {
    players[socket.id] = playerData;
    io.emit("updatePlayers", players);
  });

  // 플레이어 이동 처리
  socket.on("movePlayer", function (playerData) {
    if (players[socket.id]) {
      players[socket.id] = playerData;
      io.emit("updatePlayers", players);
    }
  });

  // 플레이어가 접속 종료할 경우 제거
  socket.on("disconnect", function () {
    console.log("플레이어 접속 종료:", socket.id);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});
