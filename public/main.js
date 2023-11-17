const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let players = [];

const mousePos = {x: 0, y: 0};
const pings = [];

const blocks = [];
const pressedKeys = {};
const choosenValues = {};

const gravity = 14;
const fallSpeed = 1;
const friction = 0.8;

const STRUCTURES = [];
const SPECIAL_PARTICLES = [];
const TILES = [];

const COLLISIONBOXES = [];
const KILLERBOXES = [];
const ACTIONBOXES = [];

const teamPoints = {
  red: 0,
  blue: 0,
  fullRed: 0,
  fullBlue: 0
}

const classesInfo = {
  'tank':{
    hp: 25,
    weaponId: 5,
    knockbackRes: 5,
    desc: 'Unit has a close range weapon, (shield) and (knockback resistance)'
  },
  'dmg':{
    hp: 10,
    weaponId: 1,
    knockbackRes: 0,
    desc: 'Unit has a long/close range weapon and (low hp), but (heals to full hp on kill)'
  },
  'heal': {
    hp: 8,
    weaponId: 4,
    knockbackRes: -2,
    desc: 'Unit has a heal gun that allows you to heal (allies) as well as (enemies)'
  }
}

let timeMultiplier = 1;
let isTpEnabled = true;
let editorMode = false;
let selectedTile = 'box';
let triggerBoxSelected = null;
let triggerBoxData = {};

const DELTA_SPEED_CORRECTION = 140;

let dt = 0;

let stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom, -1 disable
document.body.appendChild( stats.dom );

canvas.width = innerWidth;
canvas.height = innerHeight;

let spawnPointBlue = {x: 100, y: floor_level - 250};
let spawnPointRed = {x: 4700, y: floor_level - 250};

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
let sendBigMessage;
let sendUpdatePoints;
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
  const assetsToLoad = ['greenBox','redBox','blueBox','pillar-middle','bricks','shot_gun','heal_gun', 'dmg_class','tank_class','dmg_class','box', 'interactionKey', 'blue_portal_flat','arrow', 'missing', 'cannon', 'portal_gun', 'spike', 'gun', 'ak_asimov'];
  const soundsToLoad = ['healed','heal_gun','shot_gun','death_sound','click','5_kills','4_kills','3_kills','2_kills','1_kills','missing', 'gun_shot', 'gun_hit'];

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

function startGame(){
  drawMap();
  initializeItems();
  initializePingAudio();  
  createWeaponImgs();
  document.getElementById('tab_playerName').innerHTML = choosenValues.name;
  player = new Player(spawnPointBlue.x, spawnPointBlue.y, choosenValues);
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
      updateKillerBoxes();
      updateActionBoxes();
      updatePlayers(socket);
      updatePartiles();
      updateSpecialPartiles();
      player.draw();
      drawPings();
      
      if (editorMode){
        drawCollisionBoxes();
      }

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
    shootBullet = (x, y, dir, speed, weaponId, noSound = false) => {
      let data = {
        x: x,
        y: y,
        dir: dir,
        speed: speed,
        weaponId: weaponId,
        id: socket.id,
        noSound: noSound
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

    socket.on('reciveBigMessage', (data) => {
      bigMessage(data.type, data.player, false);      
    });

    sendBigMessage = (type, player) => {
      socket.emit('bigMessage', {type, player});
    }

    socket.on('reciveUpdatePoints', (data) => {
      teamPoints.blue = data.blue;
      teamPoints.red = data.red;
      teamPoints.fullBlue = data.fullBlue;
      teamPoints.fullRed = data.fullRed;

      updatePointsUI(false);
    });

    sendUpdatePoints = () => {
      socket.emit('updatePoints' , teamPoints);
    }
    GAME_STATE = 'game';

    createNotification(0, {playerName: choosenValues.name});
  
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
    if (data.type == 'triggerBox'){
      if (data.name == 'collisionBox'){
        COLLISIONBOXES.push(data);
      }
      if (data.name == 'killerBox'){
        new killerBox(data);
      }
      if (data.name == 'actionBox'){
        new actionBox(data);
      }
    }
  }

}

function startEditor(){
  player.godMode = true;
}

function createParticle(data){
  // console.log(data);
  if (!data) return;
  new Particle(data.x, data.y, data.dir, data.speed, data.id, data.weaponId, data.noSound);
}

function createPing(data){
    data.time = Date.now();
    pings.push(data);
    pingsAudio[data.id].play();
}

function loadEditor(){
  let btns = document.getElementById('tileImages');
  let blockImages = ['box', 'spike', 'bricks', 'pillar-middle', 'blueBox', 'redBox', 'greenBox'];

  let content = '';
  for (let i = 0; i < blockImages.length; i++ ){
    content += `<div class='tileBtn' data-name='${blockImages[i]}'>
    <img src='imgs/${blockImages[i]}.png' width='100%' height='100%' draggable='false'/>
    </div>`
  }

  btns.innerHTML = content;
}

window.onload = () => {

  const search = window.location.search;
  const params = new URLSearchParams(search);
  let name = params.get('name');
  
  if (editorMode) document.getElementById('editotModeText').style.display = 'flex';
  if (editorMode) loadEditor();

  const decodedCookies = decodeURIComponent(document.cookie).split('choosenValues=')[1];
  console.log(decodedCookies);
  let cookieValues = JSON.parse(decodedCookies); 

  choosenValues.name = cookieValues.name;
  choosenValues.class = cookieValues.class ? cookieValues.class : 'dmg';
  choosenValues.color = cookieValues.color ? cookieValues.color : getRandomColor();

  if (!choosenValues.name){
    loadAssets(()=> {
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('enteringScreen').style.display = 'flex';
      showNameSelectionScreen();
    })
  }else{
      loadAssets(() => {
        loadMap()
      });
  }

}
async function loadMap(){
  fetch('./maps/map.json')
        .then(response => response.json())
        .then(data => {
          MAP = data;
          startGame();
        })
        .catch(error => console.error('Error loading JSON:', error));
}

function showColorSelectionScreen(){
  document.getElementById('enteringScreen_name').style.display = 'none';
  document.getElementById('enteringScreen_class').style.display = 'none';
  document.getElementById('enteringScreen_color').style.display = 'flex';

  // display available colors
  let colorsDiv = document.getElementById('enteringScreen_colors');
  let colors;

  switch (choosenValues.class){
    case 'tank':
      colors = ['#2542a3', '#2196F3', '#009688', '#9E9E9E', '#6f6f6f', '#393939'];
      break;
    case 'dmg':
      colors = ['#ffeb3b', '#ff9800', '#f44336', '#b50404', '#cb2626', '#673ab7']
      break;
    default:
      colors = ['#ff00ff', '#eb5ceb', '#ff96ff', '#52e32b', '#7bed5d', '#9ef388'];
      break;

  }

  let content = '';

  for (let i = 0; i < colors.length; i++){
    content+=`<div class='coloredTile' style='background-color: ${colors[i]}' data-color='${colors[i]}'></div>`
  }

  colorsDiv.innerHTML = content;


}

function showClassSelectionScreen(){
  document.getElementById('enteringScreen_name').style.display = 'none';
  document.getElementById('enteringScreen_class').style.display = 'flex';
}
function showNameSelectionScreen(){
  document.getElementById('enteringScreen_name').style.display = 'flex';
}

function disableEnteringScreen(){
  document.getElementById('enteringScreen').style.display = 'none';
    loadMap();
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
function updatePointsUI(broadcast = true){
  let redTeam = document.querySelector('#teamRedProgress > div');
  let blueTeam = document.querySelector('#teamBlueProgress > div');
  let redTeamNumber = document.getElementById('teamRedPoints')
  let blueTeamNumber = document.getElementById('teamBluePoints')

  let redProcentage = -1 * (100 - teamPoints.red) == -100 ? -100.5 : -1 * (100 - teamPoints.red);
  let blueProcentage = 100 - teamPoints.blue == 100 ? 100.5 : 100 - teamPoints.blue;
  

  redTeam.style.transform = `translateX(${redProcentage}%)`;
  blueTeam.style.transform = `translateX(${blueProcentage}%)`;

  redTeamNumber.innerText = teamPoints.fullRed;
  blueTeamNumber.innerText = teamPoints.fullBlue;

  if (broadcast) sendUpdatePoints();
}
function updateKillerBoxes(){
  for (let i = 0; i < KILLERBOXES.length; i++){
    let box = KILLERBOXES[i];
    box.update();
    box.draw();
  }
}
function updateActionBoxes(){
  for (let i = 0; i < ACTIONBOXES.length; i++){
    let box = ACTIONBOXES[i];
    box.update();
    box.draw();
  }  
}
function drawStructures(){
  for (let i = 0; i < STRUCTURES.length; i++){
    STRUCTURES[i].draw();
    STRUCTURES[i].update();
  }
}
function updatePartiles(){
  for (let i = PARTICLES.length-1; i >= 0; i--){
    let p = PARTICLES[i];
    if (!p) continue;
    p.update();
    p.draw();
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
    updateTabContent();

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
    dominating: pl.dominating,
    maxHp: pl.maxHp,
    isDead: pl.isDead,
    kills: pl.kills,
    deaths: pl.deaths,
    class: pl.class,
    team: pl.team,
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
function drawCollisionBoxes(){
  for (let i = 0; i < COLLISIONBOXES.length; i++){
    let box = COLLISIONBOXES[i];
    ctx.beginPath();
    ctx.strokeStyle = 'yellow';
    ctx.strokeRect(box.x - CAMERA.offset.x, box.y - CAMERA.offset.y, box.width, box.height);
    ctx.closePath();
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
})

window.addEventListener('unload', ()=>{
  if (GAME_STATE == 'game') createNotification(1, {playerName: player.name});
});

window.addEventListener('beforeunload' ,()=>{
  const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000));

    // Convert the object to a JSON string
    const jsonValue = JSON.stringify(choosenValues);

    // Encode the name, value, and set the cookie
    const cookieValue = encodeURIComponent('choosenValues') + "=" + encodeURIComponent(jsonValue) + "; expires=" + expirationDate.toUTCString() + "; path=/";

    document.cookie = cookieValue;
})

document.addEventListener('keydown', (e) => {
  const key = e.key ? e.key.toLowerCase() : 0;
    if (pressedKeys['control'] && GAME_STATE == 'game') {
      if (key == 'd' || key == 's' || key == 'p' || key == 'e'){
        e.preventDefault();
      }
    } 
    if (key == 'e'){
      if (player.interacionWith) player.interact();
    }
    if (key == 'tab'){
      e.preventDefault();
      toggleTab('on');
    }
    if (key == 'escape'){
      toggleEsc();
    }
    
    pressedKeys[key] = 1;

});


document.addEventListener('keyup', (e) =>{
    const key = e.key ? e.key.toLowerCase() : 0;
    
      if (key == 'tab'){
        toggleTab('off');
      }

    delete pressedKeys[key];

});

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
})

document.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y =  e.clientY;
});

canvas.addEventListener('mousedown', (e) => {
  let x = e.clientX;
  let y = e.clientY;
  if (e.button == 0){
    if (player){
      let pos = {
        x: x + CAMERA.offset.x,
        y: y + CAMERA.offset.y
      }
      if (pressedKeys['control'] && isTpEnabled || pressedKeys['control'] && editorMode) player.tp(pos.x, pos.y);
      if (pressedKeys['shift'] && !editorMode) pingNofity(pos.x,pos.y);
      else player.shooting = true;
    }
  }
  if (editorMode && !pressedKeys['control']){
    let obj = getObjectByPos(x ,y);
    let newPos = {
      x: Math.floor((x + CAMERA.offset.x) / 50) * 50,
      y: Math.floor((y + CAMERA.offset.y) / 50) * 50 
    }
    if (obj.i !== undefined && pressedKeys['shift']){
      // remove tile
      if (obj.mapObj.type !== 'tile' && obj.mapObj.type !== 'triggerBox') return
      MAP.splice(obj.i, 1);
      
      console.log(obj.mapObj)
      if (obj.mapObj.name == 'collisionBox'){
        COLLISIONBOXES.splice(obj.triggerI, 1);
      }
      if (obj.mapObj.name == 'killerBox'){
        KILLERBOXES.splice(obj.triggerI, 1);
      }
      if (obj.mapObj.name == 'actionBox'){
        ACTIONBOXES.splice(obj.triggerI, 1);
      }

      if (obj.tileI && obj.mapObj.type == 'tile') blocks.splice(obj.tileI, 1);
    }else{
      if (pressedKeys['shift']) return;
      // place block
      if (!selectedTile){
        if (!triggerBoxSelected) return;

        if (!triggerBoxData.start){
          triggerBoxData.start = {x: newPos.x, y: newPos.y}
        }else{
          // just finish the selection
          triggerBoxData.finish = {x: newPos.x, y: newPos.y}

          if (triggerBoxData.start.x > triggerBoxData.finish.x){
            let start = triggerBoxData.start.x;
            triggerBoxData.start.x = triggerBoxData.finish.x;
            triggerBoxData.finish.x = start;
          }
          if (triggerBoxData.start.y > triggerBoxData.finish.y){
            let start = triggerBoxData.start.y;
            triggerBoxData.start.y = triggerBoxData.finish.y;
            triggerBoxData.finish.y = start;
          }

          // get the bottom of the tile
          let width = triggerBoxData.finish.x - triggerBoxData.start.x + 50;
          let height = triggerBoxData.finish.y - triggerBoxData.start.y + 50; 

          let triggerBoxArea = {
            type: 'triggerBox',
            x: triggerBoxData.start.x,
            y: triggerBoxData.start.y,
            width: width,
            height: height,
            name: triggerBoxSelected 
          }

          MAP.push(triggerBoxArea);
          if (triggerBoxSelected == 'collisionBox') COLLISIONBOXES.push(triggerBoxArea);
          if (triggerBoxSelected == 'killerBox') new killerBox(triggerBoxArea);
          if (triggerBoxSelected == 'actionBox') new actionBox(triggerBoxArea); 

          //reset the data
          triggerBoxData = {};

        }

      }else{
        let tileName = selectedTile;
  
  
        let tile = {type: 'tile', x: newPos.x, y: newPos.y, name: tileName};
        if (obj.i === undefined || obj.mapObj.name != tileName){
          console.log('placed')
          if (obj.i !== undefined){
            MAP.splice(obj.i, 1);
            if (obj.tileI && obj.mapObj.type == 'tile') blocks.splice(obj.tileI, 1);
          }
          MAP.push(tile);
          new Tile(tile.x, tile.y, {x: 50, y: 50}, tileName);
        }
      }

    }
  }
})

function getObjectByPos(x, y){

  let newPos = {
    x: Math.floor((x + CAMERA.offset.x) / 50) * 50,
    y: Math.floor((y + CAMERA.offset.y) / 50) * 50 
  }
  let blockData = {};
  for (let i = 0; i < MAP.length; i++){
    let m = MAP[i];
    if (m.x == newPos.x && m.y == newPos.y){
      if (MAP[i].type == 'triggerBox' && !triggerBoxSelected) continue;
      blockData.i = i;
      blockData.mapObj = MAP[i];
    }
  }
  for (let i = 0; i < blocks.length; i++){
    let m = blocks[i];
    if (m.x == newPos.x && m.y == newPos.y){
      blockData.tileI = i;
      blockData.tile = MAP[i];
    }
  }
  if (blockData.mapObj){
    // check trigger boxes
    if (blockData.mapObj.type == 'triggerBox'){
      for (let i = 0; i < COLLISIONBOXES.length; i++){
        let box = COLLISIONBOXES[i];
        if (box.x == newPos.x && box.y == newPos.y){
          blockData.triggerI = i;
        }    
      }
    }    
  }

  return blockData;
}

document.addEventListener('mousedown', (e) => {

  if (e.target.id == 'goBackBtn'){
    choosenValues.name = null;
    choosenValues.class = null;
    choosenValues.color = null;
    location.reload();
  }

  if (e.target.id == 'saveMap_btn'){
    saveAsJSON(MAP)
  }

  if (e.target.id == 'respawnBtn'){
    loadedAudio['click'].play();
    player.respawn();
  }

  if (e.target.className == 'btn'){
    loadedAudio['click'].play();
  }

  if(e.target.className == 'tileBtn'){
    loadedAudio['click'].play();
    let tile = e.target.dataset.name;
    selectedTile = tile;
    triggerBoxSelected = null;
  }
  if (e.target.className == 'clickableBox'){
    loadedAudio['click'].play();
    selectedTile = null;
    triggerBoxSelected = e.target.id;
  }
  if (e.target.className == 'coloredTile'){
    loadedAudio['click'].play();

    let all_elems = document.querySelectorAll('.coloredTile');

    let color = e.target.dataset.color;

    if (e.target.dataset.selected === undefined){
      //remove selected state
      for (let i = 0; i < all_elems.length; i++){
        let elem = all_elems[i];
        elem.removeAttribute('data-selected');
      }

      e.target.dataset.selected = 'true';

      choosenValues.color = color ? color : getRandomColor();

    }else{
      e.target.removeAttribute('data-selected');
      delete choosenValues.color;
    }

  }

  if (e.target.className == 'classSelectionBtn'){
    loadedAudio['click'].play();

    let btns = document.querySelectorAll('.classSelectionBtn');


    if (e.target.dataset.selected === undefined){
      // remove selected state from all
      for (i = 0; i < btns.length; i++){
        btns[i].removeAttribute('data-selected')
      }

      // add selected state to clicked one
      e.target.dataset.selected = 'true';
      choosenValues['class'] = e.target.dataset.name;
      
      document.getElementById('classSpaceMaker').style.display = 'none';
      document.getElementById('classInfoBox').style.display = 'flex';

      let infoDiv = document.getElementById('classBoxChamp');

      let loadOutDiv = document.getElementById('classBoxWeapon');

      let classData = classesInfo[e.target.dataset.name];

      let content = `
      <div class='colorYellow' style='text-transform: uppercase; font-size: 30px;'>${e.target.dataset.name}</div>
      <div>HP: ${classData.hp}</div>
      <div>${classData.desc}</div>
      `;

      let weapon = WEAPONS[classData.weaponId];
      let bullets = weapon.bulletAmmout ? weapon.bulletAmmout : DEFAULT_BULLET_AMMOUNT; 

      let stats = {
        dmg: weapon.dmg !== undefined ? weapon.dmg*bullets : DEFAULT_WEAPON_DMG,
        heal: weapon.heal !== undefined ? weapon.heal : DEFAULT_WEAPON_HEAL,
        cooldown: weapon.cooldown ? weapon.cooldown : DEFAULT_WEAPON_COOLDOWN,
        drag: weapon.drag !== undefined ? weapon.drag : DEFAULT_WEAPON_DRAG,
        knockback: weapon.knockback !== undefined ? weapon.knockback : DEFAULT_WEAPON_KNOCKBACK,
      }

      let minDmgText = '';

      if (bullets > 1) {
        if (stats.dmg > 0){
          minDmgText = stats.dmg / bullets + ' - '
        }else{
          minDmgText = stats.heal / bullets + ' - '
        }
      }
      
      let dmgType = stats.dmg > 0 && stats.heal == 0 ? `<div class='colorRed'>DMG: ${minDmgText} ${stats.dmg} </div>` : `<div class='colorGreen'>HEAL: ${minDmgText} ${stats.heal}</div>`; 
      
      let loadOutContent = `
      <div style='width: 80px;'><img src='imgs/${weapon.imageName}.png' width='100%' height='100%' draggable='false' /></div>
      <div id='gunStats'>      
        ${dmgType}
        <div>SPEED: ${Math.floor(1000 / stats.cooldown * 10) / 10} / sec</div>
        <div>DRAG: ${stats.drag}</div>
        <div>KNOCKBACK: ${stats.knockback}</div>
      </div>
      `;

      loadOutDiv.innerHTML = loadOutContent;
      infoDiv.innerHTML = content;

    }else{
      e.target.removeAttribute('data-selected');
      document.getElementById('classSpaceMaker').style.display = 'block';
      document.getElementById('classInfoBox').style.display = 'none';
      delete choosenValues['class'];
    }

  }

  if (e.target.id == 'nextBtn'){
    let step = e.target.dataset.id;
    console.log(step);
    if (step === '0'){ // name selection
      let name = document.getElementById('playerNameInput').value;
      if (!name) name = playerNames[Math.floor(Math.random() * playerNames.length)];

      choosenValues['name'] = name;     


      showClassSelectionScreen();
    }
    if (step === '1'){
      showColorSelectionScreen();
    }
  }


  if (e.target.id == 'playBtn'){
    if (!choosenValues.name) choosenValues.name = playerNames[Math.floor(Math.random() * playerNames.length)];
    if (!choosenValues.class) choosenValues.class = 'dmg';
    if (!choosenValues.color) choosenValues.color = getRandomColor()
    disableEnteringScreen();
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

    this.offset.x = lerp(this.offset.x, x - innerWidth / 2, lerpFactor * dt * DELTA_SPEED_CORRECTION);
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
function bigMessage(type, playerName, broadcast = true){
  let messageDiv = document.getElementById('bigMessage');
  messageDiv.style.transition = '0s';
  messageDiv.style.opacity = 1;
  if (type === 0){ // player is dominating
    messageDiv.innerHTML = `<span class='colorYellow'>${playerName} is dominating!</span>`
    if (player.name !== playerName){
      loadedAudio['5_kills'].volume(0.05);
      loadedAudio['5_kills'].play();
    }
  }
  if (type === 1){
    messageDiv.innerHTML = `<span class='colorYellow'>Team <b style='color: ${playerName};'>${playerName}</b> gets a point!</span>`
  }

  setTimeout(()=>{
    messageDiv.style.transition = '2s';
    messageDiv.style.opacity = 0;
  }, 3000);

  if (broadcast) sendBigMessage(type, playerName);

}
let tabUpdateCooldown = 500;
let tabLastUpdateTime = 0;
let noTabUpdate = false;

function updateTabContent(){
  if (noTabUpdate) return;
  let tabMainDiv = document.getElementById('tabScreen');
  if (tabMainDiv.style.display !== 'flex') return;
  if (Date.now() - tabLastUpdateTime < tabUpdateCooldown) return; 
  tabLastUpdateTime = Date.now();
  
  players.sort((p1, p2) => p1.values.kills - p2.values.kills);

  let blueTeamDiv = document.getElementById('blueTeam');
  let redTeamDiv = document.getElementById('redTeam');

  let redContent = '';
  let blueContent = '';

  for (let i = players.length-1; i >= 0; i--){
    let p = players[i].values;
    if (!p) continue;
    let team = p.team ? p.team : 'blue';
    let playerClass = p.class ? p.class : 'dmg';

    // classes: dmg, tank, heal

    let classImage = `<img src='imgs/${playerClass}_class.png' height='100%'/>`;

    let youTag = p.name == player.name ? 'colorYellow' : '';

    let element = `<div class='tab_player'>
      <div class='tab_player_color'><div class='coloredBox' style='background-color: ${p.color};'></div></div>
      <div class='tab_player_name tabCell ${youTag}'>${p.name}</div>                                    
      <div class='tab_player_kills tabCell'>Kills: ${p.kills}</div>
      <div class='tab_player_deaths tabCell'>Deaths: ${p.deaths}</div>
      <div class='tab_player_dominating tabCell'>Domination: ${p.dominating}</div>
      <div class='tab_player_class tabCell'>Class: ${classImage}</div>
      </div>`

    if (team == 'blue') blueContent += element;
    else redContent += element;
  }

  blueTeamDiv.innerHTML = blueContent;
  redTeamDiv.innerHTML = redContent;

}
function toggleEsc(){
  let escDiv = document.getElementById('escapeScreen');
  let display = escDiv.style.display == 'none' || !escDiv.style.display ? 'flex' : 'none';
  escDiv.style.display = display;
}
function toggleTab(state){
  let tabDiv = document.getElementById('tabScreen');
  let display = state == 'on' ? 'flex' : 'none';
  tabDiv.style.display = display;
}
function saveAsJSON(data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'map.json';

  // Append the link to the body, click it, and remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}