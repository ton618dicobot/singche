var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var squareSize = 60;
var boardX = 6; // 6 x 6 으로 보드 생성
canvas.width = squareSize * 11;
canvas.height = squareSize * 11;
var cameraSize = squareSize * 11;
var boardSize = squareSize * 8;
var materialSize = squareSize * (2 / 3);

var socket = io(); // 소켓 연결
var players = {}; // 플레이어 저장 객체

// 보드 이미지 로딩
var boardImg = new Image();
boardImg.src = "img/board.png";

// 기물 이미지 로딩
var kingBlueImg = new Image();
kingBlueImg.src = "img/material/blue/king_blue.png";
var queenBlueImg = new Image();
queenBlueImg.src = "img/material/blue/queen_blue.png";
var rookBlueImg = new Image();
rookBlueImg.src = "img/material/blue/rook_blue.png";
var bishopBlueImg = new Image();
bishopBlueImg.src = "img/material/blue/bishop_blue.png";
var knightBlueImg = new Image();
knightBlueImg.src = "img/material/blue/knight_blue.png";

var materialsBlueImg = [
  kingBlueImg,
  queenBlueImg,
  rookBlueImg,
  bishopBlueImg,
  knightBlueImg,
];

var kingRedImg = new Image();
kingRedImg.src = "img/material/red/king_red.png";
var queenRedImg = new Image();
queenRedImg.src = "img/material/red/queen_red.png";
var rookRedImg = new Image();
rookRedImg.src = "img/material/red/rook_red.png";
var bishopRedImg = new Image();
bishopRedImg.src = "img/material/red/bishop_red.png";
var knightRedImg = new Image();
knightRedImg.src = "img/material/red/knight_red.png";

var materialsRedImg = [
  kingRedImg,
  queenRedImg,
  rookRedImg,
  bishopRedImg,
  knightRedImg,
];

// 스퀘어 이미지 로딩
var moveableImg = new Image();
moveableImg.src = "img/moveable_square.png";
var mySquareImg = new Image();
mySquareImg.src = "img/my_square.png";

// 기물 행마
moveSquares = [
  [
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1],
  ],
  [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [1, -1],
    [2, -2],
    [3, -3],
    [4, -4],
    [-1, -1],
    [-2, -2],
    [-3, -3],
    [-4, -4],
    [-1, 1],
    [-2, 2],
    [-3, 3],
    [-4, 4],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [0, -1],
    [0, -2],
    [0, -3],
    [0, -4],
    [-1, 0],
    [-2, 0],
    [-3, 0],
    [-4, 0],
  ],
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [0, -1],
    [0, -2],
    [0, -3],
    [0, -4],
    [-1, 0],
    [-2, 0],
    [-3, 0],
    [-4, 0],
  ],
  [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [1, -1],
    [2, -2],
    [3, -3],
    [4, -4],
    [-1, -1],
    [-2, -2],
    [-3, -3],
    [-4, -4],
    [-1, 1],
    [-2, 2],
    [-3, 3],
    [-4, 4],
  ],
  [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ],
];
// 기물 쿨타임
cooltimes = [0.9, 1.9, 1.2, 1.1, 1.1];

// 내 캐릭터 정보
var myPlayer = {
  x: Math.floor(Math.random() * 8),
  y: Math.floor(Math.random() * 8),
  speed: 0.1,
  material: 2,
  score: 0,
};

// 카메라 위치
var cameraPos = {
  x: myPlayer.x * squareSize + squareSize / 2 - cameraSize / 2,
  y: myPlayer.y * squareSize + squareSize / 2 - cameraSize / 2,
};

// 서버에 내 캐릭터 정보 전송
socket.emit("newPlayer", myPlayer);

// 키 입력 상태 저장
var keys = {};

window.addEventListener("keydown", function (event) {
  keys[event.key] = true;
});

window.addEventListener("keyup", function (event) {
  keys[event.key] = false;
});

// FPS 설정
const FPS = 60;
setInterval(updateGame, 1000 / FPS);

function updateGame() {
  movePlayer();
  socket.emit("movePlayer", {
    x: myPlayer.x,
    y: myPlayer.y,
    material: myPlayer.material,
    score: myPlayer.score,
  });
  drawPlayers();
}

// 플레이어 이동 처리
function movePlayer() {
  if (keys["ArrowRight"]) myPlayer.x += myPlayer.speed;
  if (keys["ArrowLeft"]) myPlayer.x -= myPlayer.speed;
  if (keys["ArrowUp"]) myPlayer.y -= myPlayer.speed;
  if (keys["ArrowDown"]) myPlayer.y += myPlayer.speed;

  if (keys["d"]) cameraPos.x += 5;
  if (keys["a"]) cameraPos.x -= 5;
  if (keys["w"]) cameraPos.y -= 5;
  if (keys["s"]) cameraPos.y += 5;
}

// 서버에서 모든 플레이어 정보 수신
socket.on("updatePlayers", function (serverPlayers) {
  players = serverPlayers;
  drawPlayers();
});

function moveableSquares() {
  // 자신을 제외한 모든 플레이어의 위치 불러오기
  var material = myPlayer.material;
  var playersPos = [];
  for (let id in players) {
    if (id === socket.id) continue;
    let player = players[id];
    playersPos.push([player.x, player.y]);
  }
  var array = [];
  var kingSquares = [
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1],
  ];
  var knightSquares = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ];
  var rookPairs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  var bishopPairs = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ];
  if (material === 2 || material === 1) {
    for (const pair of rookPairs) {
      for (let j = 1; j <= 4; j++) {
        var squareX = myPlayer.x + j * pair[0];
        var squareY = myPlayer.y + j * pair[1];
        array.push([squareX, squareY]);
        if (playersPos.some((pos) => pos[0] === squareX && pos[1] === squareY))
          break;
      }
    }
  }
  if (material === 3 || material === 1) {
    for (const pair of bishopPairs) {
      for (let j = 1; j <= 4; j++) {
        var squareX = myPlayer.x + j * pair[0];
        var squareY = myPlayer.y + j * pair[1];
        array.push([squareX, squareY]);
        if (playersPos.some((pos) => pos[0] === squareX && pos[1] === squareY))
          break;
      }
    }
  }
  if (material === 0) {
    for (const pos of kingSquares) {
      array.push([myPlayer.x + pos[0], myPlayer.y + pos[1]]);
    }
  }
  if (material === 4) {
    for (const pos of knightSquares) {
      array.push([myPlayer.x + pos[0], myPlayer.y + pos[1]]);
    }
  }
  // 보드 바깥으로 나가는 것은 삭제
  array = array.filter(
    (pos) =>
      !(pos[0] < 0 || pos[0] > boardX * 8 || pos[1] < 0 || pos[1] > boardX * 8)
  );
  canvas.onclick = function (event) {
    const mouseX = event.clientX - ctx.canvas.offsetLeft;
    const mouseY = event.clientY - ctx.canvas.offsetTop;
    for (const pos of array) {
      const posX = pos[0] * squareSize - cameraPos.x;
      const posY = pos[1] * squareSize - cameraPos.y;
      if (
        mouseX > posX &&
        mouseX < posX + squareSize &&
        mouseY > posY &&
        mouseY < posY + squareSize
      ) {
        myPlayer.x = pos[0];
        myPlayer.y = pos[1];
        break;
      }
    }
  };
  return array;
}

// 이미지 그리기
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 보드 그리기
  for (i = 0; i < boardX; i++) {
    for (j = 0; j < boardX; j++) {
      ctx.drawImage(
        boardImg,
        i * boardSize - cameraPos.x,
        j * boardSize - cameraPos.y,
        boardSize,
        boardSize
      );
    }
  }

  // 스퀘어 그리기
  ctx.drawImage(
    mySquareImg,
    myPlayer.x * squareSize - cameraPos.x,
    myPlayer.y * squareSize - cameraPos.y,
    squareSize,
    squareSize
  );

  var moveSquaresPos = moveableSquares();
  for (const pos of moveSquaresPos) {
    ctx.drawImage(
      moveableImg,
      pos[0] * squareSize - cameraPos.x,
      pos[1] * squareSize - cameraPos.y,
      squareSize,
      squareSize
    );
  }

  // 기물 그리기
  for (let id in players) {
    if (id === socket.id) continue;
    let player = players[id];
    ctx.drawImage(
      materialsRedImg[player.material],
      player.x * squareSize + squareSize / 2 - materialSize / 2 - cameraPos.x,
      player.y * squareSize + squareSize / 2 - materialSize / 2 - cameraPos.y,
      materialSize,
      materialSize
    );
  }

  ctx.drawImage(
    materialsBlueImg[myPlayer.material],
    myPlayer.x * squareSize + squareSize / 2 - materialSize / 2 - cameraPos.x,
    myPlayer.y * squareSize + squareSize / 2 - materialSize / 2 - cameraPos.y,
    materialSize,
    materialSize
  );
}
