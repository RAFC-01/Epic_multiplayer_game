class CharacterEntity{
    constructor(){
        this.weaponId = 1;
        
        this.hp = 10;
        this.maxHp = 10;
        this.lastShoot = 0;
        this.groundedCooldown = 110;
    }
    drawWeapon() {
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.gunImage = WEAPONS[this.weaponId].img;
        if (!this.gunImage) return;
        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }

        let upsideDownThreshold = 90;
    
        ctx.save();
        ctx.translate(gunPos.x, gunPos.y);
        ctx.rotate(this.weaponAngle);
        if (this.weaponDegrees > upsideDownThreshold || this.weaponDegrees < -upsideDownThreshold) {
            ctx.scale(1, -1);
        }
        let scale = this.weapon.scale ? this.weapon.scale : DEFAULT_SIZE_SCALE;
        ctx.drawImage(this.gunImage, -this.gunImage.width / (2 * scale), -this.gunImage.height / (2 * scale), this.gunImage.width / scale, this.gunImage.height / scale);
        ctx.restore();

        // ctx.fillText(Math.floor(degrees), this.x, this.y - 20);
    }
    shoot(){
        if (GAME_STATE != 'game' || this.isDead) return;

        let weaponDrag = WEAPONS[this.weaponId].drag !== undefined ? WEAPONS[this.weaponId].drag : DEFAULT_WEAPON_DRAG; 
        let cooldown = WEAPONS[this.weaponId].cooldown ? WEAPONS[this.weaponId].cooldown : DEFAULT_WEAPON_COOLDOWN;
        let now = Date.now();

        if (now - this.lastShoot < cooldown) return;

        let bulletSpeed = 10; 
        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }
        let angle = Math.atan2(mousePos.y - gunPos.y, mousePos.x - gunPos.x);
        let x = Math.cos(angle);
        let y = Math.sin(angle);

        let vector = {x, y};

        this.pushBack(-x * weaponDrag, -y * weaponDrag);

        new Particle(this.x + this.size.x / 2, this.y - 12 + this.size.y / 2 , vector, bulletSpeed, this.socketId, this.weaponId);
        shootBullet(this.x + this.size.x / 2, this.y - 12 + this.size.y / 2 , vector, bulletSpeed, this.weaponId);
        this.lastShoot = Date.now();
    }
    drawHpBar(){
        // background bar
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.rect(this.x, this.y - 30, this.size.x, 5);
        ctx.fill();
        ctx.closePath();
        // hp bar
        ctx.beginPath();
        ctx.fillStyle = 'red';
        let size = this.size.x * (this.hp / this.maxHp);
        ctx.rect(this.x, this.y - 30, size, 5);
        ctx.fill();
        ctx.closePath();
    }
    dealDmg(amm){
        this.hp -= amm;
        if (this.hp < 0) this.hp = 0;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        
        if (this.hp == 0) this.kill();
    }
    draw(){
        if (this.isDead) return;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(this.x, this.y, this.size.x, this.size.y);
        ctx.fill();
        ctx.closePath();
        
        // text
        ctx.beginPath();
        ctx.font = '20px Arial';
        let text = this.display;
        let textWidth = ctx.measureText(text).width;
        ctx.fillText(text, this.x + (this.size.x - textWidth) / 2, this.y - 5);        
        ctx.closePath();

        this.drawWeapon();
        
        this.drawHpBar();
    }
    kill(){
        this.hp = 0;
        this.isDead = true;
        this.vel.x = 0;
        this.vel.y = 0;
        document.getElementById('deathScreen').style.display = 'flex';        
    }
    respawn(){
        this.hp = this.maxHp;
        this.tp(spawnPoint.x, spawnPoint.y);
        document.getElementById('deathScreen').style.display = 'none';        
        setTimeout(()=> {
            this.isDead = false;
        },100)
    }
    explode(x, y) {
        for (var i = 0; i < 12; i++) {
            var angle = (i * Math.PI) / 6; // Spread particles evenly in a circle
            var speed = Math.random() * 5 + 2;
            var speedX = Math.cos(angle) * speed;
            var speedY = Math.sin(angle) * speed;
            var size = Math.random() * 20 + 10;
            var color = 'rgb(' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ')';
            var life = Math.random() * 30 + 10;

            // particles.push(new Particle(x, y, speedX, speedY, size, color, life));
        }
    }
    changeWeapon(id){
        if (!WEAPONS[id]) return;
        this.weaponId = id;
        this.weapon = WEAPONS[this.weaponId];
        this.weapon.size = {
            x: this.weapon.img.width / this.weapon.scale,
            y: this.weapon.img.height / this.weapon.scale
        }
        this.gunImage = this.weapon.img;
    }
    pushBack(x, y){
        if (this.isDead) return;
        if (Math.abs(this.vel.x) < Math.abs(x) * 3) this.vel.x += x;
        if (Math.abs(this.vel.y) < Math.abs(y) * 3) this.vel.y += y;
    }
}