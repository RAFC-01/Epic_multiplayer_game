const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const blocks = [];
const pressedKeys = {};

const gravity = 14;
const fallSpeed = 1;
const friction = 0.8;

let dt = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;

new Block(0, canvas.height / 2, canvas.width, canvas.height/2, 'green');
new Block(250, canvas.height / 2 - 50, 100, 50, 'red');
new Block(450, canvas.height / 2 - 100, 100, 50, 'red');
new Block(920, canvas.height / 2 - 200, 100, 50, 'red');
new Block(350, canvas.height / 2 - 300, 200, 50, 'red');
new Block(250, canvas.height / 2 - 499, 50, 200, 'red');

const player = new Player(canvas.width / 2, canvas.height / 2 - 450);

let lastUpdate = Date.now();

function animate(){
  let now = Date.now();
  dt = (now - lastUpdate) / 1000;
  lastUpdate = now;
  drawBackGround();
  drawBlocks();
  player.draw();
  player.update();

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

document.addEventListener('mousedown', (e) => {
  let x = e.clientX;
  let y = e.clientY;
  player.tp(x, y);
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
animate();