const WEAPON_IMGS = {};

WEAPON_IMGS['ak'] = new Image();
WEAPON_IMGS['ak'].src = './imgs/gun.png';

const DEFAULT_SIZE_SCALE = 3;
const DEFAULT_BULLET_COLOR = 'red';
const DEFAULT_BULLET_SIZE = 2;
const BULLET_ACCELERATION = 5;

const WEAPONS = {
    1: {
        name: 'ak47',
        img: WEAPON_IMGS['ak'],
    }
}

const PARTICLES = [];

class Particle{
    constructor(x, y, dir){
        this.weapon = player.weapon;
        this.x = x + dir.x * this.weapon.size.x / 2;
        this.y = y + dir.y * this.weapon.size.x / 2;
        this.color = this.weapon.color ? this.weapon.color : DEFAULT_BULLET_COLOR;
        this.size = this.weapon.bulletSize ? this.weapon.bulletSize : DEFAULT_BULLET_SIZE;
        this.dir = dir;
        this.vel = {x: 0, y: 0};
        PARTICLES.push(this);
    }
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 360, false);
        ctx.fill();
        ctx.closePath();
    }
    update(){



        this.x += this.vel.x;
        this.y += this.vel.y;
    }
}