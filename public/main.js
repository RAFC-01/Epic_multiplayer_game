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

let timeMultiplier = 1;

const DELTA_SPEED_CORRECTION = 140;

let dt = 0;

let stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom, -1 disable
document.body.appendChild( stats.dom );

canvas.width = innerWidth;
canvas.height = innerHeight;

let floor_level = 700;

// walls
new Block(0, floor_level, 1980, canvas.height/2, 'green');
new Block(0, floor_level - 1000, 10, 1000, 'red');
new Block(1980, floor_level - 1000, 10, 1000, 'red');
new Block(0, 0, 1980, 10, 'red');

// other
new Block(250, floor_level-100, 50, 100, 'red');
new Block(550, floor_level-150, 50, 150, 'red');
new Block(650, floor_level-50, 50, 50, 'red');

const player = new Player(100, floor_level - 250);

let lastUpdate = Date.now();
let reload;
let shootBullet;
let dealDmgToPlayer;
let pingNofity;
let pingLifeSpan = 1;

let GAME_STATE = 'lobby';

const pingsAudio = {
  0: new Howl({
    src: './audio/missing.mp3',
    volume: 0.2
  })
};

// for testing
let newDelta = false;

const pingImgs = {};
pingImgs[0] = new Image();
pingImgs[0].src = './imgs/missing.png';
pingImgs[0].onload = () => {
  console.log('loaded png')
}

function startGame(name){
  if (name) player.name = name;
  try{

    let socket = io({
      reconnection: true
    });
    socket.username = name ? name : socket.id;

    function animate(){
      if (!socket) return;
      stats.begin();
      player.socketId = socket.id;
      let now = Date.now();
      dt = (now - lastUpdate) / 1000;
      dt = newDelta ? newDelta * timeMultiplier : dt * timeMultiplier;
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
  
      console.log('update in few sec!');
  
      document.getElementById('updateScreen').style.display = 'flex';
      let textDiv = document.getElementById('updateCountDown');
      i = 3;
      let updateText = 'Updating in '
      setInterval(() => {
        i--;
        if (i < 0) i = 0;
        textDiv.innerText = updateText + i + '..';
      },100)
  
      setTimeout(()=> {
  
        location.reload();
      }, 300);
    });
  
    socket.on('connect_error', ()=>{
      document.getElementById('LostConnectionScreen').style.display = 'flex';
    })

    socket.on('updatePlayers', (data) => {
      players = data;
      document.getElementById('LostConnectionScreen').style.display = 'none';
    });
    socket.on('removePlayer', (data) => {
      let index = players.indexOf(data);
      players.splice(index, 1);
    });
    reload = () => {
      socket.emit('reload');
    }
  
    socket.on('pingN', pingData => {
      createPing(pingData);
    })
    pingNofity = (x, y, type = 0) => {
      let data = {x, y, type};
      socket.emit('pingNotify', data);
    }
    socket.on('shootB', (data) => {
      createParticle(data);
    });
    shootBullet = (x, y, dir, speed, weaponId) => {
      let data = {
        x: x,
        y: y,
        dir: dir,
        speed: speed,
        weaponId: weaponId,
        id: socket.id,
      }
      socket.emit('shootBullet', data);
    }

    socket.on('reciveDmg', (data) => {
      player.dealDmg(data);
    })
    dealDmgToPlayer = (dmg, playerID) => {
      // console.log('deal dmg')
      let data = {
        dmg, playerID
      }
      socket.emit('dealDmg', data);
    }

    GAME_STATE = 'game';

  }catch (err){
    console.log(err);
  }
}

function createParticle(data){
  // console.log(data);
  new Particle(data.x, data.y, data.dir, data.speed, data.id, data.weaponId);
}

function createPing(data){
    data.time = Date.now();
    pings.push(data);
    pingsAudio[data.type].play();
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
      let otherPlayer = new OtherPlayer(m);
      // console.log(otherPlayer);
      otherPlayer.draw();
    }

  }
}
function getPlayerInfo(pl){
  return {
    name: pl.name,
    weaponId: pl.weaponId,
    color: pl.color,
    weaponAngle: pl.weaponAngle,
    weaponDegrees: pl.weaponDegrees,
    hp: pl.hp,
    maxHp: pl.maxHp,
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

  const playerNames =[
    "Haruka Mizuki",
    "Kazuki Hoshino",
    "Yuki Nakamura",
    "Aya Sakura",
    "Ryota Kurogane",
    "Emi Takahashi",
    "Sora Kobayashi",
    "Ren Ichinose",
    "Kaori Yamamoto",
    "Tatsuya Nakagawa",
    "Mai Tanaka",
    "Yuto Suzuki",
    "Ayame Fujimoto",
    "Hikari Mori",
    "Kaito Hayashi",
    "Yui Aizawa",
    "Shota Ishikawa",
    "Mio Kimura",
    "Daichi Nishimura",
    "Yukihiro Sato",
    "Aoi Fujita",
    "Riku Inoue",
    "Haruna Yoshida",
    "Kenta Takahashi",
    "Sakura Ito",
    "Yusuke Kobayashi",
    "Arisa Watanabe",
    "Shinji Matsumoto",
    "Nao Suzuki",
    "Kazumi Honda",
    "Miku Yamashita",
    "Ryo Tanaka",
    "Yui Suzuki",
    "Riku Matsuda",
    "Akane Kobayashi",
    "Kenta Yamamoto",
    "Misaki Nakajima",
    "Takumi Sato",
    "Yukihiro Nakamura",
    "Asuka Yamaguchi",
    "Hiroki Nishida",
    "Yumi Takahashi",
    "Tatsuya Suzuki",
    "Ayaka Fujimoto",
    "Kazuya Kimura",
    "Mai Kuroki",
    "Hiroshi Nakagawa",
    "Saki Honda",
    "Yusuke Takahashi"
  ];

document.addEventListener('keydown', (e) => {
  const key = e.key ? e.key.toLowerCase() : 0;
    if (pressedKeys['control'] && GAME_STATE == 'game') {
      if (key == 'd' || key == 's' || key == 'p'){
        e.preventDefault();
      }
    } 
    
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

  if (e.button == 0){
    if (pressedKeys['control']) player.tp(x, y);
    else if (pressedKeys['shift']) pingNofity(x,y);
    else player.shooting = true;
  }

  if (e.target.id == 'playBtn'){
    let elems = document.getElementById('inputs').children;
    let values = {};

    const searchParams = new URLSearchParams(window.location.search);
    Array.from(elems).forEach(elem => {
      if (elem.tagName === 'INPUT'){
        if (!elem.value && elem.name == 'name'){
          let randomName = playerNames[Math.floor(Math.random() * playerNames.length)];
          if (randomName) elem.value = randomName;
          else elem.value = 'Unknown';
        }
        searchParams.set(elem.name, elem.value);
        const updatedSearchString = searchParams.toString();
        
        // Create a new URL with the updated search string
        const newUrl = `${window.location.origin}${window.location.pathname}?${updatedSearchString}`;
        
        // Update the browser history without reloading the page
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        values[elem.name] = elem.value;
      }
    })
    disableEnteringScreen(values);
  }
});
document.addEventListener('mouseup', (e) => {
  if (e.button == 0 && player.shooting == true) player.shooting = false;
})

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
  if (!point || !rect) return;
  return (point.x >= rect.pos.x &&
          point.x <= rect.pos.x + rect.size.x &&
          point.y >= rect.pos.y &&
          point.y <= rect.pos.y + rect.size.y);
}

