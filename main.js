const express = require('express');
const http = require('http');
const ngrok = require('ngrok');
const {ngrok_config} = require('./ngrok_config.js');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  reconnection: true
});

let playerList = [];

io.on('connection', client => {
  console.log('user connected '+client.id);
  playerList.push({
    id: client.id,
  })

  client.on('update', (values) => {
    let read = editPlayerWithId(client.id, values);

    // console.log('update')
    if (read) io.emit('updatePlayers', playerList);
  })

  client.on('reload', ()=>{
    io.emit('reloadPage');
  });

  client.on('pingNotify', (type) => {
    io.emit('pingN', type);
  })

  client.on('shootBullet', (data) => {
    client.broadcast.emit('shootB', data);
    // io.emit('shootB', data);
  });

  client.on('dealDmg', (data) => {
    io.to(data.playerID).emit('reciveDmg', data);
  })

  client.on('knockback', (data) => {
    io.to(data.playerID).emit('knockbackRecive', data);
  })

  client.on('shootSpecial', (data) => {
    client.broadcast.emit('shootSpecialRecive', data);
  })

  client.on('notify', (data) => {
    client.broadcast.emit('reciveNotify', data);
  });

  client.on('spectatePlayer', (data) => {
    if (data.all){
      client.broadcast.emit('spectateRecive', data);
    }else{
      if (!data.targetPlayer) return;
      io.to(data.targetPlayer).emit('spectateRecive', data);
    }
  })

  client.on('bigMessage', (data) => {
    client.broadcast.emit('reciveBigMessage', data);
  })

  client.on('disconnect', () => {
    console.log('user disconnected');
    let player = getPlayerById(client.id);
    if (player) playerList.splice(playerList.indexOf(player), 1);
    io.emit('removePlayer', client.id);
  })
})

app.use(express.static('public'))

const createServer = async () => {
  try {
    const PORT = 3000; // Define your desired port
    server.listen(PORT, async () => {
      playerList = [];
      console.log(`Server is running at http://localhost:${PORT}`);
      if (process.env.npm_lifecycle_event == 'startmulti'){
        const url = await ngrok.connect(ngrok_config);
        console.log(`Server is running, and the server address is: ${url}`);
      }
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};
function getPlayerById(id){
  for (let i = 0; i < playerList.length; i++){
    if (playerList[i].id == id) return playerList[i];
  }
  return false;
}

function editPlayerWithId(id, values){
  let player = getPlayerById(id);
  if (!player) return false;

  player.values = values;

  return true;
  // console.log(playerList);

}


createServer();