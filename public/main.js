const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let players = [];

const blocks = [];
const pressedKeys = {};

const gravity = 14;
const fallSpeed = 1;
const friction = 0.8;

let dt = 0;

let stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom, -1 disable
document.body.appendChild( stats.dom );

canvas.width = innerWidth;
canvas.height = innerHeight;

let floor_level = 700;

new Block(0, floor_level, canvas.width, canvas.height/2, 'green');
new Block(250, floor_level - 50, 100, 50, 'red');
new Block(450, floor_level - 100, 100, 50, 'red');
new Block(820, floor_level - 200, 100, 50, 'red');
new Block(350, floor_level - 300, 200, 50, 'red');
new Block(250, floor_level - 499, 50, 200, 'red');
new Block(0, floor_level - 1000, 10, 1000, 'red');

const player = new Player(canvas.width / 2, floor_level - 450);

window.onload = () => {
  let socket = io();
  function animate(){
    if (!socket) return;
    stats.begin();
    let now = Date.now();
    dt = (now - lastUpdate) / 1000;
    lastUpdate = now;
    
    player.update();
    
    drawBackGround();
    drawBlocks();
    updatePlayers(socket);
    player.draw();
    
    socket.emit('update', getPlayerInfo(player));
    
    stats.end();
    requestAnimationFrame(animate);
  }
  
  animate();
  socket.on('conntection', ()=>{
    console.log(socket)
  })
  
  socket.on('updatePlayers', (data) =>{
    players = data;
  });
  socket.on('removePlayer', (data) => {
    let index = players.indexOf(data);
    players.splice(index, 1);
});

}
let lastUpdate = Date.now();


function updatePlayers(socket){
  for (let i = players.length-1; i >= 0; i--){
    let user = players[i];
    if (user.id != socket.id){
      let m = user.values;
      if (!m) return;
      ctx.beginPath();
      ctx.fillStyle = m.color;
      ctx.rect(m.pos.x, m.pos.y, m.size.x, m.size.y);
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.font = '15px Arial';
      let text = 'Other Player';
      let textWidth = ctx.measureText(text).width;
      ctx.fillText(text, m.pos.x + m.size.x / 2 - textWidth / 2, m.pos.y - 5);
      ctx.closePath();
    }

  }
}
function getPlayerInfo(pl){
  return {
    color: pl.color,
    pos: {
      x: pl.x,
      y: pl.y,
    },
    size: {
      x: pl.size.x,
      y: pl.size.y
    }
  }
}
function drawBlocks(){
    for (let i = 0; i < blocks.length; i++){
        blocks[i].draw();
    }
}
function drawBackGround(){
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    ctx.closePath();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

document.addEventListener('keydown', (e) =>{
    const key = e.key.toLowerCase();
    
    pressedKeys[key] = 1;

});

document.addEventListener('keyup', (e) =>{
    const key = e.key.toLowerCase();
    
    delete pressedKeys[key];

});

document.addEventListener('mousedown', (e) => {
  let x = e.clientX;
  let y = e.clientY;
  if (pressedKeys['control']) player.tp(x, y);
});

function approach(current, target, increase)
{

  if(current < target)
  {
    return Math.min(current + increase, target);
  }
  return Math.max(current - increase, target);
}

function rectCollision(a, b){
  return a.pos.x < b.pos.x  + b.size.x && // Collision on Left of a and right of b
         a.pos.x + a.size.x > b.pos.x  && // Collision on Right of a and left of b
         a.pos.y < b.pos.y  + b.size.y && // Collision on Bottom of a and Top of b
         a.pos.y + a.size.y > b.pos.y;    // Collision on Top of a and Bottom of b
}

function pointInRect(point, rect)
{
  return (point.x >= rect.pos.x &&
          point.x <= rect.pos.x + rect.size.x &&
          point.y >= rect.pos.y &&
          point.y <= rect.pos.y + rect.size.y);
}

