const WEAPON_IMGS = {};

const DEFAULT_SIZE_SCALE = 3;
const DEFAULT_BULLET_COLOR = {r: 255, g: 0, b: 0};
const DEFAULT_BULLET_SIZE = 3;
const BULLET_ACCELERATION = 5;
const DEFAULT_WEAPON_DMG = 1;
const DEFAULT_WEAPON_HEAL = 0;
const DEFAULT_WEAPON_COOLDOWN = 400; // ms
const DEFAULT_WEAPON_TRAIL_STATE = true;
const DEFAULT_WEAPON_DRAG = 1;
const DEFAULT_BULLET_AMMOUNT = 1;
const DEFAULT_BULLET_SPEED = 10;
const DEFAULT_WEAPON_KNOCKBACK = 3;

const WEAPONS = {
    1: {
        name: 'ak47',
        imageName: 'gun',
        soundName: 'gun_shot',
        cooldown: 300,
        maxDistance: 1500,
        hasTrail: false
    },
    3: {
        name: 'ak47-asimov',
        imageName: 'ak_asimov',
        knockback: 1,
        drag: 1,
        dmg: 2,
        cooldown: 300,
        soundName: 'gun_shot'
    },
    4: {
        name: 'heal-gun',
        imageName: 'heal_gun',
        soundName: 'heal_gun',
        hitSound: 'healed',
        heal: 0.5,
        dmg: -0.5,
        drag: 1,
        cooldown: 333,
        knockback: 0,
        bulletSpeed: 1.5,
        bulletSize: 6,
        color:  {r: 10, g: 255, b: 10},
        maxDistance: 550,
        hasTrail: false
    },
    5: {
        name: 'shot-gun',
        imageName: 'shot_gun',
        dmg: 1,
        leastDmg: 1,
        knockback: 4,
        drag: 3,
        cooldown: 1500,
        soundName: 'shot_gun',
        color:  {r: 255, g: 255, b: 0},
        bulletAmmout: 5,
        maxDistance: 400,
        hasTrail: false,
        bulletSize: 2,
    }
}

function createWeaponImgs(){
    let weaponsIDs = Object.keys(WEAPONS);
    for (let i = 0; i < weaponsIDs.length; i++){
        let id = weaponsIDs[i];
        WEAPONS[id].img = loadedImgs[WEAPONS[id].imageName];
        WEAPONS[id].scale = WEAPONS[id].scale ? WEAPONS[id].scale : DEFAULT_SIZE_SCALE; 
        if (WEAPONS[id].soundName) WEAPONS[id].sound = loadedAudio[WEAPONS[id].soundName];
    }
}

const PARTICLES = [];

class Particle{
    constructor(x, y, dir, speed, shooterId, weaponID, noSound){
        this.weapon = WEAPONS[weaponID];
        this.weaponScale = this.weapon.scale ? this.weapon.scale : DEFAULT_SIZE_SCALE; 
        this.x = x + dir.x * this.weapon.size.x / 2;
        this.y = y + dir.y * this.weapon.size.x / 2;
        this.color = this.weapon.color ? this.weapon.color : DEFAULT_BULLET_COLOR;
        this.size = this.weapon.bulletSize ? this.weapon.bulletSize : DEFAULT_BULLET_SIZE;
        this.dir = dir;
        this.dmg = this.weapon.dmg !== undefined ? this.weapon.dmg : DEFAULT_WEAPON_DMG;
        this.hasTrail = this.weapon.hasTrail !== undefined ? this.weapon.hasTrail : DEFAULT_WEAPON_TRAIL_STATE;
        this.vel = {x: 0, y: 0};
        this.speed = speed;
        this.createdTime = Date.now();
        this.knockback = this.weapon.knockback !== undefined ? this.weapon.knockback : DEFAULT_WEAPON_KNOCKBACK;
        this.shooterId = shooterId;
        this.maxDistance = this.weapon.maxDistance ? this.weapon.maxDistance : 0;
        this.trail = [];
        this.trailLength = 5;
        this.createdAt = {x: x + dir.x * this.weapon.size.x / 2, y: y + dir.y * this.weapon.size.x / 2};
        if (this.weapon.sound && !noSound){
            loadedAudio['gun_shot'].stop();
            this.weapon.sound.play();
        } 
            
        PARTICLES.push(this);
    }
    draw(){
        // trail
        let pos = {
            x: this.x - CAMERA.offset.x,
            y: this.y - CAMERA.offset.y
        }
        if (this.hasTrail){
            let trailSize = this.size-1 > 0 ? this.size-1 : this.size;
            for (let i = this.trail.length-1; i >= 0; i--){
                let t = this.trail[i];
                let orginA = this.color.a ? this.color.a : 1;
                let alpha = orginA - i / this.trail.length;
                ctx.beginPath();
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
                ctx.arc(t.x - CAMERA.offset.x, t.y - CAMERA.offset.y, trailSize, 0, 360, false);
                ctx.fill();
                ctx.closePath();
            }
        }
        // particle
        ctx.beginPath();
        let alpha = this.color.a ? this.color.a : 1;
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.arc(pos.x, pos.y, this.size, 0, 360, false);
        ctx.fill();
        ctx.closePath();
    }
    update(){

        let collision = false;
        let speed = {
            x: this.dir.x * this.speed,
            y: this.dir.y * this.speed
        }

        if (this.maxDistance) {
            let distFromCreted = Math.pow(this.createdAt.x - this.x, 2) + Math.pow(this.createdAt.y - this.y, 2);
            let dist = Math.sqrt(distFromCreted);
            if (this.maxDistance < dist){
                PARTICLES.splice(PARTICLES.indexOf(this), 1);
                return;
            } 
            let alpha = 1 - dist / this.maxDistance;
            alpha = 1;
            this.color.a = alpha;
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
            if (!playerRect) continue;
            if (this.shooterId == players[i].id || players[i].values.isDead) continue;
            if (pointInRect(point, playerRect)){
                collision = {target: players[i].id};
            }
        }
        for (let i = 0; i < COLLISIONBOXES.length; i++){
            let block = COLLISIONBOXES[i];
            let blockData = {
                x: block.x,
                y: block.y,
                size: {
                    x: block.width,
                    y: block.height
                }
            }
            let blockRect = getSolidRect(blockData);
            if (pointInRect(point, blockRect)){
                collision = true;
            }
        }   

        if (!collision){
            this.x += this.vel.x;
            this.y += this.vel.y;

            if (this.x < 0 || this.y < 0) PARTICLES.splice(PARTICLES.indexOf(this), 1);
            if (this.x > MAP_SIZE.x || this.y > MAP_SIZE.y) PARTICLES.splice(PARTICLES.indexOf(this), 1);
        }else{
            // hit target, destroy bullet
            if (collision.target){
                // console.log('hit player', collision.target);
                if (collision.target !== player.socketId && this.shooterId == player.socketId){
                    // deal dmg to attacked player
                    // console.log(this.dmg);
                    let victim = players[getPlayerById(collision.target).i].values;

                    if (this.weapon.hitSound) loadedAudio[this.weapon.hitSound].play();
                    else loadedAudio['gun_hit'].play();
                    victim.hp-= this.dmg;
                    if (dealDmgToPlayer) dealDmgToPlayer(this.dmg, collision.target, {attacker: player.name, weapon: 'gun'});
                    // knockback attacked player
                    let knockbackValue = {
                        x: this.dir.x * this.knockback,
                        y: this.dir.y * this.knockback
                    }
                    knockbackPlayer(knockbackValue.x, knockbackValue.y, collision.target);                   
                }
            }else{
                // console.log('just a block');
            }
            PARTICLES.splice(PARTICLES.indexOf(this), 1);
        }
    }
}
class SpecialParticle{
    constructor(x, y, size, dir, color, speed, shooterId){
        this.x = x;
        this.y = y;
        this.size = size;
        this.dir = dir;
        this.color = color;
        this.speed = speed;
        this.shooterId = shooterId;
        this.knockback = speed;
        this.dmg = 500;
        this.vel = {
            x: 0, y: 0
        }

        let newspeed = {
            x: this.dir.x * this.speed,
            y: this.dir.y * this.speed
        }
        this.vel.x = newspeed.x;
        this.vel.y = newspeed.y;

        this.slowdown = 4;
        this.fallSpeed = 10;

        SPECIAL_PARTICLES.push(this);
    }
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x - CAMERA.offset.x, this.y - CAMERA.offset.y, this.size, 0, 360, false);
        ctx.fill();
        ctx.closePath();
    }
    update(){
        // this.speed = ;

        let collision = false;

        let rect = {
            x: this.x,
            y: this.y,
            size: {
                x: this.size,
                y: this.size
            }
        }

        let particleRect = getSolidRect(rect);

        for (let i = 0; i < players.length; i++){
            let playerRect = players[i].values;
            if (!playerRect) continue;
            if (players[i].values.isDead) continue;
            if (rectCollision(particleRect, playerRect)){
                collision = {target: players[i].id};
            }
        }
        for (let i = 0; i < blocks.length; i++){
            let block = blocks[i];
            let blockRect = getSolidRect(block);
            if (rectCollision(particleRect, blockRect)){
                collision = true;
            }
        }   


        // friction
        this.vel.x = approach(this.vel.x, 1, this.slowdown * dt);
        this.vel.y = approach(this.vel.y, 1, this.slowdown * dt);
        
        // gravity
        this.vel.y = approach(this.vel.y, this.fallSpeed, gravity * dt);

        if (!collision){
            this.x += this.vel.x * dt * DELTA_SPEED_CORRECTION;
            this.y += this.vel.y * dt * DELTA_SPEED_CORRECTION;
        }else{
            // hit target, destroy bullet
            if (collision.target){
                // console.log('hit player', collision.target);
                if (collision.target !== this.shooterId){
                    // deal dmg to attacked player
                    // console.log(this.dmg);
                    let shooterName = getNameById(this.shooterId);
                    if (dealDmgToPlayer) dealDmgToPlayer(this.dmg, collision.target, {attacker: shooterName, weapon: 'cannon'});
                    // knockback attacked player
                    let knockbackValue = {
                        x: this.dir.x * this.knockback,
                        y: this.dir.y * this.knockback
                    }
                    console.log(knockbackValue);
                    knockbackPlayer(knockbackValue.x, knockbackValue.y, collision.target);                   

                    // player.dealDmg(-this.dmg); // heal hp
                }else{
                    if (player.socketId == this.shooterId){
                        let knockbackValue = {
                            x: this.dir.x * this.knockback,
                            y: this.dir.y * this.knockback
                        }
                        player.pushBack(knockbackValue.x, knockbackValue.y);                    
                    }
                }
            }else{
                // console.log('just a block');
            }
            SPECIAL_PARTICLES.splice(SPECIAL_PARTICLES.indexOf(this), 1);
        }
    }
}