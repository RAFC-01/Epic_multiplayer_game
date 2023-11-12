const WEAPON_IMGS = {};

const DEFAULT_SIZE_SCALE = 3;
const DEFAULT_BULLET_COLOR = {r: 255, g: 0, b: 0};
const DEFAULT_BULLET_SIZE = 3;
const BULLET_ACCELERATION = 5;
const DEFAULT_WEAPON_DMG = 1;
const DEFAULT_WEAPON_COOLDOWN = 400; // ms
const DEFAULT_WEAPON_TRAIL_STATE = true;
const DEFAULT_WEAPON_DRAG = 2;
const DEFAULT_WEAPON_KNOCKBACK = 3;

const WEAPONS = {
    1: {
        name: 'ak47',
    },
    2: {
        name: 'portal gun',
        bulletSize: 10,
        dmg: 0,
    }
}

function createWeaponImgs(){
    WEAPONS[1].img = loadedImgs['gun'];
    WEAPONS[2].img = loadedImgs['portal_gun'];
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
        this.dmg = this.weapon.dmg !== undefined ? this.weapon.dmg : DEFAULT_WEAPON_DMG;
        this.hasTrail = this.weapon.hasTrail ? this.weapon.hasTrail : DEFAULT_WEAPON_TRAIL_STATE;
        this.vel = {x: 0, y: 0};
        this.speed = speed;
        this.createdTime = Date.now();
        this.knockback = this.weapon.knockback ? this.weapon.knockback : DEFAULT_WEAPON_KNOCKBACK;
        this.shooterId = shooterId;
        this.trail = [];
        this.trailLength = 5;
        PARTICLES.push(this);
    }
    draw(){
        // trail
        if (this.hasTrail){
            let trailSize = this.size-1 > 0 ? this.size-1 : this.size;
            for (let i = 0; i < this.trail.length; i++){
                let t = this.trail[i];
                let alpha = i / this.trail.length;
                ctx.beginPath();
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
                ctx.arc(t.x, t.y, trailSize, 0, 360, false);
                ctx.fill();
                ctx.closePath();
            }
        }
        // particle
        ctx.beginPath();
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
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

        // add trail
        if (this.hasTrail){
            if (this.trail.length >= this.trailLength) {
                this.trail.shift(); // Remove the oldest trail element
            }
            this.trail.push({ x: this.x, y: this.y });
        }

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
                    // console.log(this.dmg);
                    if (dealDmgToPlayer) dealDmgToPlayer(this.dmg, collision.target);
                    // knockback attacked player
                    

                    player.dealDmg(-this.dmg); // heal hp
                }
            }else{
                // console.log('just a block');
            }
            PARTICLES.splice(PARTICLES.indexOf(this), 1);
        }
    }
}