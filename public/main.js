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

const STRUCTURES = [];
const SPECIAL_PARTICLES = [];

let timeMultiplier = 1;

const DELTA_SPEED_CORRECTION = 140;

let dt = 0;

let stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom, -1 disable
document.body.appendChild( stats.dom );

canvas.width = innerWidth;
canvas.height = innerHeight;

let floor_level = 700;

let spawnPoint = {x: 100, y: floor_level - 250};

let player;

let lastUpdate = Date.now();
let reload;
let shootBullet;
let dealDmgToPlayer;
let pingNofity;
let knockbackPlayer;
let shootSpecial;
let pingLifeSpan = 1;

let pingTypes = {
  0: 'missing'
}

let GAME_STATE = 'lobby';

const pingsAudio = {};

const loadedAudio = {};

// for testing
let newDelta = false;

let loadedImgs = {};


function initializePingAudio(){
  pingsAudio[0] = loadedAudio['missing'];
}

function loadAssets(next){
  document.getElementById('loadingScreen').style.display = 'flex';
  const assetsToLoad = ['interactionKey', 'blue_portal_flat','arrow', 'missing', 'cannon', 'portal_gun', 'spike', 'gun', 'ak_asimov'];
  const soundsToLoad = ['missing'];

  let loadedStatus = {
    img: false,
    sound: false,
  }

  const loading = (i = 0) => {
    let img = new Image();
    img.src = 'imgs/'+assetsToLoad[i] + '.png';
    img.onload = () => {
        loadedImgs[assetsToLoad[i]] = img;
        i++;
        if (i < assetsToLoad.length) loading(i);
        else {
          loadedStatus.img = true;
          if (loadedStatus.img && loadedStatus.sound) next();
        }
    }
  }
  loading();

  const loadSounds = (i = 0) => {
    
    let sound = new Howl({
      src: `./audio/${soundsToLoad[i]}.mp3`,
      volume: 0.2
    });
    sound.on('load', ()=>{
      loadedAudio[soundsToLoad[i]] = sound;
      i++;
      if (i < soundsToLoad.length) loadSounds(i);
      else {
        loadedStatus.sound = true;    
        if (loadedStatus.img && loadedStatus.sound) next();
      }
    })
    
  }
  loadSounds();

} 

let FPS_LIMIT = 0;

function startGame(name){
  drawMap();
  initializeItems();
  initializePingAudio();
  createWeaponImgs();
  player = new Player(spawnPoint.x, spawnPoint.y, name);
  try{
    document.getElementById('loadingScreen').style.display = 'none';
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
      drawStructures();
      updatePlayers(socket);
      updatePartiles();
      updateSpecialPartiles();
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
    pingNofity = (x, y, id = 0) => {
      let data = {x, y, id};
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
    socket.on('knockbackRecive', (data) => {
      player.pushBack(data.x, data.y);
    })
    knockbackPlayer = (x, y, playerID) => {
      let data = {
        x,y,playerID
      }
      socket.emit('knockback', data);
    }

    socket.on('shootSpecialRecive', (data) => {
      createSpecialParticle(data.x, data.y, data.size, data.dir, data.color, data.speed, data.shooterId);
    });

    shootSpecial = (x, y, size, dir, color, speed, shooterId) => {
        let data = {
          x, y, size, dir, color, speed, shooterId
        }
        // console.log(data);
        socket.emit('shootSpecial', data);
    }
    GAME_STATE = 'game';

  }catch (err){
    console.log(err);
  }
}

let invisibleColor = 'rgba(0, 0, 0, 0)';

function createSpecialParticle(x, y, size, dir, color, speed, shooterId){
  new SpecialParticle(x, y, size, dir, color, speed, shooterId);
}

function updateSpecialPartiles(){
  for (let i = 0; i < SPECIAL_PARTICLES.length; i++){
    let p = SPECIAL_PARTICLES[i];
    p.draw();
    p.update();
  }
}

function drawMap(){
  // walls
  new Block(0, floor_level, 1980, canvas.height/2, 'green');
  new Block(0, floor_level - 1000, 10, 1000, invisibleColor);
  new Block(1980, floor_level - 1000, 10, 1000, invisibleColor);
  new Block(0, 0, 1980, 10, invisibleColor);
  
  // other
  new Block(250, floor_level-50, 50, 50, 'red');
  // new Block(550, floor_level-150, 50, 150, 'red');
  new Block(950, floor_level-50, 50, 50, 'red');
  new Block(60, floor_level-450, 320, 50, 'red');
  
  new Spike(300, floor_level-50, {x: 50, y:50});
  new Spike(350, floor_level-50, {x: 50, y:50});
  new Spike(400, floor_level-50, {x: 50, y:50});
  new Spike(450, floor_level-50, {x: 50, y:50});
  new Spike(500, floor_level-50, {x: 50, y:50});
  new Spike(550, floor_level-50, {x: 50, y:50});
  new Spike(600, floor_level-50, {x: 50, y:50});
  new Spike(650, floor_level-50, {x: 50, y:50});
  new Spike(700, floor_level-50, {x: 50, y:50});
  new Spike(750, floor_level-50, {x: 50, y:50});
  new Spike(800, floor_level-50, {x: 50, y:50});
  new Spike(850, floor_level-50, {x: 50, y:50});
  new Spike(900, floor_level-50, {x: 50, y:50});

  new Cannon(0, floor_level-212, {x: 300, y:212})
}


function createParticle(data){
  // console.log(data);
  new Particle(data.x, data.y, data.dir, data.speed, data.id, data.weaponId);
}

function createPing(data){
    data.time = Date.now();
    pings.push(data);
    pingsAudio[data.id].play();
}

window.onload = () => {

  const search = window.location.search;
  const params = new URLSearchParams(search);
  let name = params.get('name');
  if (!name){
    document.getElementById('enteringScreen').style.display = 'flex';
  }else{
      loadAssets(() => {
        startGame(name);
      });
  }

}

function disableEnteringScreen(values){
  document.getElementById('enteringScreen').style.display = 'none';
  loadAssets(() => {
    startGame(values.name);
  });
}
function drawPings(){
  let scaleDown = 2;
  let timeNow = Date.now();
  for (let i = pings.length-1; i >= 0; i--){
    let ping = pings[i];
    let pingType = pingTypes[ping.id];
    let img = loadedImgs[pingType];
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
function drawStructures(){
  for (let i = 0; i < STRUCTURES.length; i++){
    STRUCTURES[i].draw();
    STRUCTURES[i].update();
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
    isDead: pl.isDead,
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
    ctx.fillStyle = '#03021a';
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
      if (key == 'd' || key == 's' || key == 'p' || key == 'e'){
        e.preventDefault();
      }
    } 
    if (key == 'e'){
      // console.log('co nie')
      if (player.interacionWith) player.interact();
    }
    if (key == 'tab'){
      e.preventDefault();
    }
    
    pressedKeys[key] = 1;

});

document.addEventListener('keyup', (e) =>{
    const key = e.key ? e.key.toLowerCase() : 0;
    
    delete pressedKeys[key];

});

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
})

document.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y =  e.clientY;
});

document.addEventListener('mousedown', (e) => {
  let x = e.clientX;
  let y = e.clientY;

  if (e.button == 0){
    if (player){
      if (pressedKeys['control']) player.tp(x, y);
      else if (pressedKeys['shift']) pingNofity(x,y);
      else player.shooting = true;
    }
  }

  if (e.target.id == 'respawnBtn'){
    player.respawn();
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
  if (player && e.button == 0 && player.shooting == true) player.shooting = false;
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

