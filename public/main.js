const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const blocks = [];
const pressedKeys = {};

const gravity = 5;
const fallSpeed = 1;
const friction = 0.8;

let dt = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;

new Block(0, canvas.height / 2, canvas.width, canvas.height/2, 'green');
new Block(50, canvas.height / 2 - 100, 100, 100, 'red');

const player = new Player(canvas.width / 2, canvas.height / 2 - 250);

let lastUpdate = Date.now();

function animate(){
  let now = Date.now();
  dt = (now - lastUpdate) / 1000;
  lastUpdate = now;
  drawBackGround();
  player.draw();
  player.update();
  drawBlocks();

  requestAnimationFrame(animate);
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

function approach(current, target, increase)
{

  if(current < target)
  {
    return Math.min(current + increase, target);
  }
  return Math.max(current - increase, target);
}

animate();