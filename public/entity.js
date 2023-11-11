class CharacterEntity{
    constructor(){
        this.weaponId = 1;
    }
    drawWeapon() {
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!this.gunImage) return;
        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }

        let upsideDownThreshold = 90;

        const mouseX = mousePos.x - canvas.getBoundingClientRect().left;
        const mouseY = mousePos.y - canvas.getBoundingClientRect().top;
    
        const angle = Math.atan2(mouseY - gunPos.y, mouseX - gunPos.x);
        const degrees = angle * (180 / Math.PI);
    
        ctx.save();
        ctx.translate(gunPos.x, gunPos.y);
        ctx.rotate(angle);
        if (degrees > upsideDownThreshold || degrees < -upsideDownThreshold) {
            ctx.scale(1, -1);
        }
        let scale = this.weapon.scale ? this.weapon.scale : DEFAULT_SIZE_SCALE;
        ctx.drawImage(this.gunImage, -this.gunImage.width / (2 * scale), -this.gunImage.height / (2 * scale), this.gunImage.width / scale, this.gunImage.height / scale);
        ctx.restore();

        // ctx.fillText(Math.floor(degrees), this.x, this.y - 20);
    }
    shoot(){
        if (!this.weaponLoaded) return;
        let bulletSpeed = 30; 
        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }
        let angle = Math.atan2(mousePos.y - gunPos.y, mousePos.x - gunPos.x);
        let x = Math.cos(angle);
        let y = Math.sin(angle);

        let vector = {x, y};

        shootBullet(this.x + this.size.x / 2, this.y - 12 + this.size.y / 2 , vector, bulletSpeed);
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
        let text = 'You';
        let textWidth = ctx.measureText(text).width;
        ctx.fillText(text, this.x + (this.size.x - textWidth) / 2, this.y - 5);        
        ctx.closePath();

        this.drawWeapon();
    }
}