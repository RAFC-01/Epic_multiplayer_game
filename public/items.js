class Structure{
    constructor(x, y, size, name, image){
        this.x = x;
        this.y = y;
        this.size = size;
        this.name = name;
        this.image = image;
    }
    draw(){
        if (!image) return;
        ctx.beginPath();
        ctx.drawImage(this.image, this.x, this.y, this.size.x, this.size.y);
        ctx.closePath();
    }
}

const ITEMIMAGES = {};

function initializeItems(){
    ITEMIMAGES['spike'] =  loadedImgs['spike'];
}

class Spike extends Structure{
    constructor(x, y, size, name, image){
        super(x, y, size, name, image);
    }
}