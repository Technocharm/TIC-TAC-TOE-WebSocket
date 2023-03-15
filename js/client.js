var clientId;
var gameId;
var socket;
var symbol;
const create = document.querySelector(".crtbtn");
create.disabled = true;
const join = document.querySelector(".jnbtn");
join.disabled = true;
join.addEventListener("click", () => {
  socket.send(
    JSON.stringify({
      'tag': "join",
      'clientId': clientId,
      'gameId': gameId,
    })
  );
});

const gamejoined = document.querySelector(".gamejoinedid")
const cells = document.querySelectorAll(".cell");
const board = document.querySelector(".board");
const list = document.querySelector("ul");
const connect = document.querySelector(".cntbtn");
const sidebar = document.querySelector(".sidebar");
const newbtn = document.querySelector(".newbtn");
newbtn.disabled = true
const exitbtn = document.querySelector(".exitgame");

connect.addEventListener("click", (src) => {
  socket = new WebSocket("ws://localhost:8000");
//   socket = new WebSocket("wss://sok.onrender.com");
  socket.onmessage = onMessage;
  src.target.disabled = true;
});

function onMessage(msg) {
  const data = JSON.parse(msg.data);
  console.log(msg.data);
  switch (data.tag) {
    case "connected":
      // console.log(data.clientID)
      clientId = data.clientID;
      const label = document.createElement("label");
      label.innerText = `Your ID: ${data.clientID}`;
      label.style.textAlign = "center";
      sidebar.insertBefore(label, connect);
      create.disabled = false;
      join.disabled = false;
      break;
    case "gameList":
      // console.log(data.list)
      const games = data.list;
      while (list.firstChild) {
        list.removeChild(list.lastChild);
      }
      games.forEach((game) => {
        const li = document.createElement("li");
        li.innerText = game;
        li.style.textAlign = "center";
        list.appendChild(li);
        li.addEventListener("click", () => {
          gameId = game;
          li.style.backgroundColor="rgb(208, 81, 35)";
        });
      });
      break;
    case "created":
      gameId = data.gameId;
      join.disabled = true;
      create.disabled = true;
      console.log(gameId);
      break;
    case "joined":
      gamejoined.innerText = `Room Joined: ${data.gameId}`;
      document.querySelector(".board").style.display = "grid";
      symbol = data.symbol;
      if (symbol == "x") {
        board.classList.add("cross");
      } else {
        board.classList.add("circle");
      }
      break;
    case "updateBoard":
      cells.forEach((cell) => {
        if (cell.classList.contains("cross")) {
          cell.classList.remove("cross");
        } else if (cell.classList.contains("circle")) {
          cell.classList.remove("circle");
        }
      });
      for (i = 0; i < 9; i++) {
        if (data.board[i] == "x") {
          cells[i].classList.add("cross");
        } else if (data.board[i] == "o") {
          cells[i].classList.add("circle");
        }
      }
      if (data.isTurn) {
        makeMove();
        // alert(`Your (${symbol}) Turn`)
      }
      break
    case 'winner':
        alert(`The winner is ${data.winner}`)
        // close()
        newbtn.disabled= false;
        cells.disabled=true;
        break
    case 'gameDraw':
        alert('The game is Draw')
        newbtn.disabled= false;
        break
    case 'exited':
        alert("Player left , Join a new game using New Game Button OR You can also quit and start again" );
        newbtn.disabled= false;
  }
}

function makeMove() {
  cells.forEach((cell) => {
    if (
      !cell.classList.contains("cross") &&
      !cell.classList.contains("circle")
    ) {
      cell.addEventListener("click", cellClicked);
    }
  });
}

function cellClicked(src) {
  let icon;
  if (symbol == "x") {
    icon = "cross";
  } else {
    icon = "circle";
  }
  src.target.classList.add(icon);
  const board = [];
  for (i = 0; i < 9; i++) {
    if (cells[i].classList.contains("circle")) {
      board[i] = "o";
    } else if (cells[i].classList.contains("cross")) {
      board[i] = "x";
    } else {
      board[i] = "";
    }
  }
  cells.forEach((cell) => {
    cell.removeEventListener("click", cellClicked);
  });
  socket.send(
    JSON.stringify({
      'tag': "moveMade",
      'board': board,
      'clientId': clientId,
      'gameId': gameId,
    })
  );
}

create.addEventListener("click", () => {
  socket.send(
    JSON.stringify({
      'tag': "create",
      'clientId': clientId,
    })
  );
});

exitbtn.addEventListener("click",()=>{
    socket.send(
        JSON.stringify({
            'tag':"exitgame",
            'clientId': clientId,
            'gameId': gameId,
        })
    )
})