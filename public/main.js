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
const TILES = [];

let timeMultiplier = 1;

const DELTA_SPEED_CORRECTION = 140;

let dt = 0;

let stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom, -1 disable
document.body.appendChild( stats.dom );

canvas.width = innerWidth;
canvas.height = innerHeight;

let spawnPoint = {x: 100, y: floor_level - 250};
let MAP_SIZE = {x: 0, y: 0};

let player;

let lastUpdate = Date.now();
let reload;
let shootBullet;
let dealDmgToPlayer;
let pingNofity;
let knockbackPlayer;
let shootSpecial;
let makeSpectate;
let sendNotification;
let pingLifeSpan = 1;

let pingTypes = {
  0: 'missing'
}

let pausedGame = false;

let GAME_STATE = 'lobby';

const pingsAudio = {};

const loadedAudio = {};

// for testing
let newDelta = false;

let loadedImgs = {};

let CAMERA;

function initializePingAudio(){
  pingsAudio[0] = loadedAudio['missing'];
}

function loadAssets(next){
  document.getElementById('loadingScreen').style.display = 'flex';
  const assetsToLoad = ['box', 'interactionKey', 'blue_portal_flat','arrow', 'missing', 'cannon', 'portal_gun', 'spike', 'gun', 'ak_asimov'];
  const soundsToLoad = ['5_kills','4_kills','3_kills','2_kills','1_kills','missing', 'gun_shot', 'gun_hit'];

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
  CAMERA = new Camera();

  // createNotification(1, {playerName: name});
  // createNotification(2, {attacker: 'name', victim: name, weapon: 'gun'});
  // createNotification(2, {attacker: 'name', victim: 'name2', weapon: 'cannon'});
  // createNotification(3, {playerName: name});

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
      CAMERA.update();
      
      drawBackGround();
      drawBlocks();
      drawTiles();
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
      player.dealDmg(data.dmg, data.attackerName);
    })
    dealDmgToPlayer = (dmg, playerID, attackerName) => {
      // console.log('deal dmg')
      let data = {
        dmg, playerID, attackerName
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

    socket.on('spectateRecive', (data) => {
      if (data.reset){
        CAMERA.canChangeTarget = true;
        CAMERA.reset();
      }else{
        CAMERA.changeTarget(data.playerID);
        if (data.all) CAMERA.canChangeTarget = false;
      }
    })

    makeSpectate = (playerID, targetPlayer, all, reset) => {
      let data = {reset, playerID, targetPlayer, all};
      socket.emit('spectatePlayer', data);
    }

    socket.on('reciveNotify', (data) => {
      createNotification(data.type, data.data, false);
    })

    sendNotification = (type, data) => {
      socket.emit('notify', {type, data})
    }
    GAME_STATE = 'game';

    createNotification(0, {playerName: name});
  
  }catch (err){
    console.log(err);
  }
}

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
function drawTiles(){
  for (let i = 0; i < TILES.length; i++){
    let t = TILES[i];
    t.draw();
  }
}
function drawMap(){
  // walls
  // new Block(0, floor_level, 1980, canvas.height/2, 'green');
  // new Block(0, floor_level - 1000, 10, 1000, invisibleColor);
  // new Block(1980, floor_level - 1000, 10, 1000, invisibleColor);
  // new Block(0, 0, 1980, 10, invisibleColor);
  
  // // other
  // new Block(250, floor_level-50, 50, 50, 'red');
  // // new Block(550, floor_level-150, 50, 150, 'red');
  // new Block(950, floor_level-50, 50, 50, 'red');
  // new Block(60, floor_level-450, 320, 50, 'red');
  
  // new Spike(300, floor_level-50, {x: 50, y:50});
  // new Spike(350, floor_level-50, {x: 50, y:50});
  // new Spike(400, floor_level-50, {x: 50, y:50});
  // new Spike(450, floor_level-50, {x: 50, y:50});
  // new Spike(500, floor_level-50, {x: 50, y:50});
  // new Spike(550, floor_level-50, {x: 50, y:50});
  // new Spike(600, floor_level-50, {x: 50, y:50});
  // new Spike(650, floor_level-50, {x: 50, y:50});
  // new Spike(700, floor_level-50, {x: 50, y:50});
  // new Spike(750, floor_level-50, {x: 50, y:50});
  // new Spike(800, floor_level-50, {x: 50, y:50});
  // new Spike(850, floor_level-50, {x: 50, y:50});
  // new Spike(900, floor_level-50, {x: 50, y:50});

  // new Cannon(0, floor_level-212, {x: 300, y:212});
  let defaultSize = {x: 50, y: 50};
  let defaultColor = 'red';
  for (let i = 0; i < MAP.length; i++){
    let data = MAP[i];
    if (!data.width) data.width = defaultSize.x;
    if (!data.height) data.height = defaultSize.y;
    if (!data.color) data.color = defaultColor;

    let size = {
      x: data.width,
      y: data.height
    }
    
    MAP_SIZE.x = MAP_SIZE.x < data.x+size.x ? data.x+size.x : MAP_SIZE.x;
    MAP_SIZE.y = MAP_SIZE.y < data.y+size.y ? data.y+size.y : MAP_SIZE.y;

    if (data.type == 'block'){
      new Tile(data.x, data.y, size, data.color, 1);
    }
    if (data.type == 'tile'){
      if (!data.name) data.name = 'box';
      new Tile(data.x, data.y, size, data.name);
    }
    if (data.type == 'spike'){
      new Spike(data.x, data.y, size);
    }
    if (data.type == 'cannon'){
      new Cannon(data.x, data.y, size, data.o);
    }
  }

}

function startEditor(){
  player.godMode = true;
}

function createParticle(data){
  // console.log(data);
  if (!data) return;
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
    ctx.drawImage(img, ping.x - CAMERA.offset.x - img.width / scaleDown / 2, ping.y - CAMERA.offset.y - img.height / scaleDown / 2, img.width / scaleDown, img.height / scaleDown);
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
    kills: pl.kills,
    deaths: pl.deaths,
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

document.addEventListener('visibilitychange', (e) => {
  pausedGame = !pausedGame;
  console.log(pausedGame);
})

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
      let pos = {
        x: x + CAMERA.offset.x,
        y: y + CAMERA.offset.y
      }
      if (pressedKeys['control']) player.tp(pos.x, pos.y);
      else if (pressedKeys['shift']) pingNofity(pos.x,pos.y);
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
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}
class Camera{
  constructor(){
    this.offset = {
      x: 0, y: 0
    }
    this.target = player;
    this.minLerpFactor = 0.01;
    this.maxLerpFactor = 0.05;
    this.targetId = player.socketId;
    this.canChangeTarget = true;
  }
  update(){

    if (this.targetId) this.target = getPlayerPos(this.targetId);

    let size = this.target.size ? this.target.size : {x: 0, y: 0};
    let x = this.target.x + size.x / 2;
    let y = this.target.y + size.y / 2;
    // moving x
    // this.offset.x = x - innerWidth / 2;

    // Calculate the distance between the camera and the target
    let distanceX = Math.abs(x - this.offset.x - innerWidth / 2);

    // Calculate the lerpFactor based on distance
    let clampedDistanceX = Math.max(1, Math.min(innerWidth / 2, distanceX));
    let normalizedDistanceX = clampedDistanceX / (innerWidth / 2);
    let lerpFactor = this.minLerpFactor + normalizedDistanceX * (this.maxLerpFactor - this.minLerpFactor)

    this.offset.x = lerp(this.offset.x, x - innerWidth / 2, lerpFactor);
    // if (this.offset.x < innerWidth / 2) this.offset.x = 0;
    // if (this.offset.x+10 > MAP_SIZE.x - innerWidth / 2) this.offset.x = MAP_SIZE.x - innerWidth - 10;
    if (this.offset.x < 0)  this.offset.x = 0;
    else if (this.offset.x + innerWidth > MAP_SIZE.x - 10) this.offset.x = MAP_SIZE.x - innerWidth - 10;
  }
  changeTarget(id){
    if (!this.canChangeTarget) return;
    this.targetId = id;
  }
  changeTargetPos(x, y){
    if (!this.canChangeTarget) return;
    this.targetId = null;
    this.target = {x: x, y: y}
  }
  reset(){
    if (!this.canChangeTarget) return;
    this.targetId = null;
    this.target = player;
  }
}
function getPlayerPos(playerID){
  if (playerID == player.socketId) return player;
  for (let i = 0; i < players.length; i++){
    if (playerID == players[i].id) return {
      x: players[i].values.pos.x,
      y: players[i].values.pos.y,
      size: players[i].values.size
    }
  }
  return player;
}

function createNotification(type, data, broadcast = true){
  const notiDiv = document.getElementById('notifications');
  let message = '';
  let isSpecial = false;
  let youText = data.playerName && data.playerName == player.name ? '(You)' : '';
  if (type == 0){ // player joined
    message = `<span class='colorYellow'>${data.playerName} ${youText} joined</span>`;
  }
  if (type == 1){ // player left
    message = `<span class='colorRed'>${data.playerName} ${youText} left</span>`;
  }
  if (type == 2){ // killed player
    // data.attacker
    // data.victim
    // data.weapon
    if (data.weapon == 'cannon') isSpecial = true;
    let youAttacker = data.attacker && data.attacker == player.name ? '(You)' : '';
    let youVictim = data.victim && data.victim == player.name ? '(You)' : '';

    let weapon = data.weapon == 'gun' ? 'gun.png' : 'cannon.png';
    let weaponSize = data.weapon == 'gun' ? {x: 384/5, y: 216/5} : {x: 300/9, y: 212/9};
    let iconClass = data.weapon == 'gun' ? 'gunIcon' : 'cannonIcon';
    let weaponIcon = `<img class='${iconClass}' src='imgs/${weapon}' width='${weaponSize.x}' height='${weaponSize.y}' />`;

    message = `
    <span class='colorGreen'>${data.attacker} ${youAttacker}</span>
    ${weaponIcon}
    <span class='colorRed'>${data.victim} ${youVictim} </span>
    `
    if (data.attacker === player.name) {
      player.confirmKill();
    }
  } 
  if (type == 3){ // died to spikes
    // data.playerName
    let youText = data.playerName && data.playerName == player.name ? '(You)' : '';

    let spikeImage = `<img src='imgs/spike.png' width='25' height='25' />`
    message = `<span class='colorRed'>${data.playerName} ${youText} just died! </span> ${spikeImage}`;
  }

  let notificationDiv = document.createElement('div');
  notificationDiv.innerHTML = message;
  notificationDiv.className ='notification';
  notificationDiv.dataset.special = isSpecial;
  notificationDiv.style.transition = '2s'; 

  notiDiv.appendChild(notificationDiv);

  setTimeout(()=>{
    notificationDiv.style.opacity = '0';
  }, 3000);

  notificationDiv.addEventListener('transitionend', function () {
    // This callback is called when the transition is complete
    notificationDiv.remove();
  });


  if (notiDiv.children.length > 5) {
    notiDiv.removeChild(notiDiv.firstElementChild);
  }

  // check for missed notifications
  for (let i = 0; i < notiDiv.children.length; i++){
    let noti = notiDiv.children[i];
    if (noti.style.opacity === '0') noti.remove();
  }


  if (broadcast) sendNotification(type, data);

}
function getNameById(id){
  for (let i = 0; i< players.length; i++){
    if (players[i].id == id) return players[i].values.name;
  }
}
function getPlayerById(id){
  for (let i = 0; i< players.length; i++){
    if (players[i].id == id) return {v: players[i].values, i: i};
  }  
}
function bigMessage(player){
  let messageDiv = document.getElementById('bigMessage');
}