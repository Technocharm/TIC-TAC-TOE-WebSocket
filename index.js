var clients = {};
var games = {};
const WinStates = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const express = require("express");
const path = require("path");
const port = process.env.PORT || 8000;
const app = express();
// const wss = new webSocket.Server({port: port})

const http = require("http").createServer(app).listen(port, console.log(`Listening on ${port}`));
const server = require("websocket").server;
const socket = new server({ httpServer: http });


const modal_path = path.join(__dirname,"/js")
app.use('/js',express.static(modal_path))
app.use(express.static(path.join(__dirname,"/public")))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,"/dist/index.html"));
});


socket.on("request", (req) => {
// wss.on("request", (req) => {
  const conn = req.accept(null, req.origin);
  const clientId =Math.round(Math.random() * 100) +Math.round(Math.random() * 100) +Math.round(Math.random() * 100);
  clients[clientId] = { conn: conn };
  console.log(clientId);
  conn.send(
    JSON.stringify({
      'tag': "connected",
      'clientID': clientId,
    })
  );

  sendAvailgame();

  conn.on("message", onMessage);
});

function sendAvailgame() {
  const gamesList = [];
  for (const game in games) {
    if (games[game].players.length < 2) {
      gamesList.push(game);
    }
  }
  for (const client in clients)
    clients[client].conn.send(
      JSON.stringify({
        'tag': "gameList",
        'list': gamesList,
      })
    );
}

function onMessage(msg) {
  const data = JSON.parse(msg.utf8Data);
  switch (data.tag) {
    case "create":
      const gameId =Math.round(Math.random() * 100) +Math.round(Math.random() * 100) +Math.round(Math.random() * 100);
      const board = ["", "", "", "", "", "", "", "", ""];
      var player = {
        clientId: data.clientId,
        symbol: "x",
        isTurn: true,
      };

      const players = Array(player);
      games[gameId] = {
        board: board,
        players: players,
      };
      clients[data.clientId].conn.send(
        JSON.stringify({
          'tag': "created",
          'gameId': gameId,
        })
      );
      sendAvailgame();
      break;
    case "join":
      player = {
        clientId: data.clientId,
        symbol: "o",
        isTurn: false,
      };
      games[data.gameId].players.push(player);
      sendAvailgame();
      games[data.gameId].players.forEach((player) => {
        clients[player.clientId].conn.send(
          JSON.stringify({
            'tag': "joined",
            'gameId': data.gameId,
            'symbol': player.symbol,
          })
        );
      });
      updateBoard(data.gameId);
      break;
    case "exitgame":
      games[data.gameId].players.forEach((player) => {
        clients[player.clientId].conn.send(
          JSON.stringify({
            'tag': "exited",
            'gameId': data.gameId,
            'symbol': player.symbol,
          })
        );
      });
    case "moveMade":
      games[data.gameId].board = data.board;
      console.log(games[data.gameId].board)
      console.log(data.board)
      const isWinner = winState(data.gameId);
      const isDraw = stateDraw(data.gameId);
      let currPlayer
      let playerSymbol
      games[data.gameId].players.forEach((player) => {
            if (player.isTurn) {
                currPlayer = player.clientId
                playerSymbol = player.symbol
        }
      })
      if (isWinner) {
        games[data.gameId].players.forEach((player) => {
          clients[player.clientId].conn.send(JSON.stringify({
              'tag': "winner",
              'winner': playerSymbol,
            })
          );
        });
      } else if (isDraw) {
        games[data.gameId].players.forEach((player) => {
          clients[player.clientId].conn.send(JSON.stringify({
              'tag': "gameDraw",
            })
          );
        });
      } else {
        games[data.gameId].players.forEach((player) => {
          player.isTurn = !player.isTurn;
        });
        updateBoard(data.gameId);
      }
      updateBoard(data.gameId);
      break;
  }
}



function updateBoard(gameId) {
  games[gameId].players.forEach((player) => {
    clients[player.clientId].conn.send(
      JSON.stringify({
        'tag': "updateBoard",
        'isTurn': player.isTurn,
        'board': games[gameId].board,
      })
    );
  });
}

function winState(gameId) {
  return WinStates.some((row) => {
    return (
      row.every((cell) => {
        return games[gameId].board[cell] == "x";
      }) ||
      row.every((cell) => {
        return games[gameId].board[cell] == "o";
      })
    );
  });
}


function stateDraw(gameId){
    return WinStates.every(row=>{
        return (
            row.some(cell=>{
                return games[gameId].board[cell]=="x" 
            })&&
            row.some(cell=>{
                return games[gameId].board[cell]=="o" 
            })
        )
    })
}