class Structure{
    constructor(x, y, size, name, image){
        this.x = x;
        this.y = y;
        this.size = size;
        this.name = name;
        this.image = image;
        STRUCTURES.push(this);
    }
    draw(){
        if (!this.image) return;
        ctx.beginPath();
        if (this.orientation === 0){
            ctx.save();
            ctx.translate(this.x + this.size.x / 2, this.y + this.size.y / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, -this.size.x / 2 + CAMERA.offset.x, -this.size.y / 2 + CAMERA.offset.y, this.size.x, this.size.y);

            ctx.restore();
        }else{
            ctx.drawImage(this.image, this.x - CAMERA.offset.x, this.y - CAMERA.offset.y, this.size.x, this.size.y);
        }
        ctx.closePath();
    }
    update(){
        if (this.canCollide){
            
            let playerRect = getSolidRect(player);
            let stRect = getSolidRect(this);

            let collision = rectCollision(playerRect, stRect);

            if (!this.colisionDmg) this.colisionDmg = 0;
            if (collision){
                this.collision();
            }else{
                if (this.noCollision) this.noCollision();
            }

        }
    }
}

const ITEMIMAGES = {};

function initializeItems(){
    ITEMIMAGES['spike'] =  loadedImgs['spike'];
}

class Spike extends Structure{
    constructor(x, y, size){
        let image = loadedImgs['spike'];
        let name = 'Spike';
        super(x, y, size, name, image);
        this.canCollide = true;
        this.colisionDmg = 1000;
    }
    collision(){
        player.dealDmg(this.colisionDmg, {object: 'spike'});
    }
}

class Cannon extends Structure{
    constructor(x, y, size, o = 1){
        let image = loadedImgs['cannon'];
        let name = 'Cannon';
        super(x, y, size, name, image);
        this.canCollide = true;
        this.cooldown = 5000;
        this.orientation = o;
        this.lastTimeShoot = 0;
    }
    collision(){
        player.interacionWith = this;
    }
    noCollision(){
        if (player.interacionWith == this) player.interacionWith = null;
    }
    interact(){
        let now = Date.now();
        if (now - this.lastTimeShoot < this.cooldown) return;
        let dir;
        let bulletPos;
        if (this.orientation){
            dir = {
                x: 0.9313908626506681,
                y: -0.36402068755888645
            };
            bulletPos = {
                x: this.x+this.image.width, 
                y: this.y+20,
            }
        }else{
            dir = {
                x: -0.9313908626506681,
                y: -0.36402068755888645
            };
            bulletPos = {
                x: this.x, 
                y: this.y+20,
            }
        }
        new SpecialParticle(bulletPos.x, bulletPos.y, 20, dir, 'red', 28, player.socketId);
        shootSpecial(bulletPos.x, bulletPos.y, 20, dir, 'red', 28, player.socketId);
        
        this.lastTimeShoot = Date.now();
    }

}

class Portal extends Structure{
    // blue then yellow
    constructor(x, y, size, color){
        let imgName = color + '_portal_flat';
        let image = loadedImgs[imgName];
        let name = color+' portal';
        super(x, y, size, name, image);
        this.canCollide = true;
        this.colisionDmg = 0;
    }
}