class CharacterEntity{
    constructor(){
        this.weaponId = 2;
        
        this.hp = 10;
        this.maxHp = 10;
        this.lastShoot = 0;
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
        if (!this.weaponLoaded || GAME_STATE != 'game') return;

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
    }
    draw(){
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
}