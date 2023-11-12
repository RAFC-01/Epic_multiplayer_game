const WEAPON_IMGS = {};

WEAPON_IMGS['ak'] = new Image();
WEAPON_IMGS['ak'].src = './imgs/gun.png';

WEAPON_IMGS['portal_gun'] = new Image();
WEAPON_IMGS['portal_gun'].src = './imgs/portal_gun.png';

const DEFAULT_SIZE_SCALE = 3;
const DEFAULT_BULLET_COLOR = 'red';
const DEFAULT_BULLET_SIZE = 2;
const BULLET_ACCELERATION = 5;
const DEFAULT_WEAPON_DMG = 1;
const DEFAULT_WEAPON_COOLDOWN = 400; // ms

const WEAPONS = {
    1: {
        name: 'ak47',
        img: WEAPON_IMGS['ak'],
    },
    2: {
        name: 'portal gun',
        img: WEAPON_IMGS['portal_gun'],
        bulletSize: 10,
        dmg: 0,
    }
}

const PARTICLES = [];

class Particle{
    constructor(x, y, dir, speed, shooterId, weaponID){
        this.weapon = WEAPONS[weaponID];
        this.weaponScale = this.weapon.scale ? this.weapon.scale : DEFAULT_SIZE_SCALE; 
        this.x = x + dir.x * this.weapon.size.x / 2;
        this.y = y + dir.y * this.weapon.size.x / 2;
        this.color = this.weapon.color ? this.weapon.color : DEFAULT_BULLET_COLOR;
        this.size = this.weapon.bulletSize ? this.weapon.bulletSize : DEFAULT_BULLET_SIZE;
        this.dir = dir;
        this.dmg = this.weapon.dmg ? this.weapon.dmg : DEFAULT_WEAPON_DMG;
        this.vel = {x: 0, y: 0};
        this.speed = speed;
        this.createdTime = Date.now();
        this.shooterId = shooterId;
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

        let collision = false;
        let speed = {
            x: this.dir.x * this.speed,
            y: this.dir.y * this.speed
        }

        this.vel.x = speed.x * dt * DELTA_SPEED_CORRECTION;
        this.vel.y = speed.y * dt * DELTA_SPEED_CORRECTION;

        let point = {
            x: this.x,
            y: this.y,
        }
        for (let i = 0; i < players.length; i++){
            let playerRect = players[i].values;
            if (this.shooterId == players[i].id) continue;
            if (pointInRect(point, playerRect)){
                collision = {target: players[i].id};
            }
        }
        for (let i = 0; i < blocks.length; i++){
            let block = blocks[i];
            let blockRect = getSolidRect(block);
            if (pointInRect(point, blockRect)){
                collision = true;
            }
        }   

        if (!collision){
            this.x += this.vel.x;
            this.y += this.vel.y;
        }else{
            // hit target, destroy bullet
            if (collision.target){
                // console.log('hit player', collision.target);
                if (collision.target !== player.socketId){
                    // deal dmg to attacked player
                    if (dealDmgToPlayer) dealDmgToPlayer(this.dmg, collision.target);
                    player.dealDmg(-this.dmg); // heal hp
                }
            }else{
                // console.log('just a block');
            }
            PARTICLES.splice(PARTICLES.indexOf(this), 1);
        }
    }
}