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
        ctx.drawImage(this.image, this.x, this.y, this.size.x, this.size.y);
        ctx.closePath();
    }
    update(){
        if (this.canCollide){
            
            let playerRect = getSolidRect(player);
            let stRect = getSolidRect(this);

            let collision = rectCollision(playerRect, stRect);

            if (!this.colisionDmg) this.colisionDmg = 0;
            if (collision){
                player.dealDmg(this.colisionDmg);
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
}