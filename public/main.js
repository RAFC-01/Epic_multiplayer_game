const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let players = [];

const mousePos = {x: 0, y: 0};
const pings = [];

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

new Block(0, floor_level, 1980, canvas.height/2, 'green');
new Block(250, floor_level - 50, 100, 50, 'red');
new Block(450, floor_level - 100, 100, 50, 'red');
new Block(905, floor_level - 200, 50, 50, 'red');
new Block(350, floor_level - 300, 200, 50, 'red');
new Block(250, floor_level - 499, 50, 200, 'red');
new Block(0, floor_level - 1000, 10, 1000, 'red');

const player = new Player(100, floor_level - 250);

let lastUpdate = Date.now();
let reload;
let shootBullet;
let pingNofity;
let pingLifeSpan = 1;

const pingsAudio = {
  0: new Howl({
    src: './audio/missing.mp3',
    volume: 0.2
  })
};

const pingImgs = {};
pingImgs[0] = new Image();
pingImgs[0].src = './imgs/missing.png';

function startGame(name){
  if (name) player.name = name;
  let socket = io();
  socket.username = name ? name : socket.id;
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
    updatePartiles();
    player.draw();
    drawPings();
    
    socket.emit('update', getPlayerInfo(player));
    
    stats.end();
    requestAnimationFrame(animate);
  }
  
  animate();
  
  socket.on('reloadPage', () => {

    console.log('update in 3 sec!');

    document.getElementById('updateScreen').style.display = 'flex';
    let textDiv = document.getElementById('updateCountDown');
    i = 3;
    let updateText = 'Updating in '
    setInterval(() => {
      i--;
      textDiv.innerText = updateText + i + '..';
    },100)

    setTimeout(()=> {

      location.reload();
    }, 300);
  });
  socket.on('updatePlayers', (data) =>{
    players = data;
  });
  socket.on('removePlayer', (data) => {
    let index = players.indexOf(data);
    players.splice(index, 1);
  });
  reload = () => {
    socket.emit('reload');
  }

  socket.on('pingN', pingData => {
    pings.push(pingData);
    pingsAudio[pingData.type].play();
  })
  pingNofity = (x, y, type = 0) => {
    let time = Date.now();
    let data = {x, y, type, time};
    socket.emit('pingNotify', data);
  }
  shootBullet = (x, y, dir, speed) => {
    let data = {
      x: x,
      y: y,
      dir: dir,
      speed: speed,
      id: socket.id,
    }
    socket.emit('addBullet', data);
  }

}

window.onload = () => {

  const search = window.location.search;
  const params = new URLSearchParams(search);
  let name = params.get('name');
  if (!name){
    document.getElementById('enteringScreen').style.display = 'flex';
  }else{
    if (player) startGame(name);
  }

}

function disableEnteringScreen(values){
  document.getElementById('enteringScreen').style.display = 'none';
  startGame(values.name);
}
function drawPings(){
  let scaleDown = 2;
  let timeNow = Date.now();
  for (let i = pings.length-1; i >= 0; i--){
    let ping = pings[i];
    let img = pingImgs[ping.type];
    ctx.beginPath();
    ctx.drawImage(img, ping.x - img.width / scaleDown / 2, ping.y - img.height / scaleDown / 2, img.width / scaleDown, img.height / scaleDown);
    ctx.closePath();

    ping.y -= 15 * dt;

    let timePassed = timeNow - ping.time; 
    if (timePassed / 1000 > pingLifeSpan){
      pings.splice(i, 1);
    }
  }
}
function updatePartiles(){
  for (let i = 0; i < PARTICLES.length; i++){
    let p = PARTICLES[i];
    p.draw();
    p.update();
  }
}
function updatePlayers(socket){
  for (let i = players.length-1; i >= 0; i--){
    let user = players[i];
    if (user.id != socket.id){
      let m = user.values;
      if (!m) return;
      // player
      ctx.beginPath();
      ctx.fillStyle = m.color;
      ctx.rect(m.pos.x, m.pos.y, m.size.x, m.size.y);
      ctx.fill();
      ctx.closePath();

      //text
      ctx.beginPath();
      ctx.font = '15px Arial';
      let text = m.name ? m.name : 'Unknown user';
      let textWidth = ctx.measureText(text).width;
      ctx.fillText(text, m.pos.x + m.size.x / 2 - textWidth / 2, m.pos.y - 5);
      ctx.closePath();

      // weapon
      if (m.weaponId){
        let weapon = WEAPONS[m.weaponId];
        let scale = WEAPONS[m.weaponId].sizeScale ? WEAPONS[m.weaponId].sizeScale : DEFAULT_SIZE_SCALE; 
        ctx.beginPath();
        ctx.drawImage(weapon.img, m.pos.x, m.pos.y, weapon.img.width / scale, weapon.img.height / scale);
        ctx.closePath();
      }
    }

  }
}
function getPlayerInfo(pl){
  return {
    name: pl.name,
    weaponId: pl.weaponId,
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

document.addEventListener('keydown', (e) => {
  const key = e.key ? e.key.toLowerCase() : 0;
    if (key != 'f5') e.preventDefault();
    
    pressedKeys[key] = 1;

});

document.addEventListener('keyup', (e) =>{
    const key = e.key ? e.key.toLowerCase() : 0;
    
    delete pressedKeys[key];

});

document.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y =  e.clientY;
});

document.addEventListener('mousedown', (e) => {
  let x = e.clientX;
  let y = e.clientY;

  if (pressedKeys['control']) player.tp(x, y);
  else if (pressedKeys['shift']) pingNofity(x,y);
  else player.shoot();

  if (e.target.id == 'playBtn'){
    let elems = document.getElementById('inputs').children;
    let values = {};

    const searchParams = new URLSearchParams(window.location.search);
    Array.from(elems).forEach(elem => {
      if (elem.tagName === 'INPUT'){
        values[elem.name] = elem.value;
        searchParams.set(elem.name, elem.value);
        const updatedSearchString = searchParams.toString();

        // Create a new URL with the updated search string
        const newUrl = `${window.location.origin}${window.location.pathname}?${updatedSearchString}`;

        // Update the browser history without reloading the page
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    })
    disableEnteringScreen(values);
  }
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

