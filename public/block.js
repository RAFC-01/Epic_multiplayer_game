class Tile{
    constructor(x, y, size, imageName, type = 0){
        // type 0 = image
        // type 1 = color
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        if (type == 0) this.image = loadedImgs[imageName];
        else this.color = imageName;
        if (this.color == 'rgba(0, 0, 0, 0)'){
            let data = {
                type: 'triggerBox',
                x: x,
                y: y,
                width: this.size.x,
                height: this.size.y,
                name: 'collisionBox'
            }
            COLLISIONBOXES.push(data);
        }else{
            blocks.push(this);
        }
    }
    draw(){
        let pos = {
            x: this.x - CAMERA.offset.x,
            y: this.y - CAMERA.offset.y
        }
        if (this.type == 0){
            ctx.beginPath();
            ctx.drawImage(this.image, pos.x, pos.y, 50, 50);
            ctx.closePath();
        }else{
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.rect(pos.x, pos.y, this.size.x, this.size.y);
            ctx.fill();
            ctx.closePath();    
        }
    }
}
class Block extends Tile{
    constructor(x, y, size, color){
        super(x, y, size, color, 1);
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        console.log(this.color);
        if (this.color == 'rgba(0, 0, 0, 0)'){
            console.log('here')
        }
        blocks.push(this);
    }
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(this.x+CAMERA.offset.x, this.y+CAMERA.offset.y, this.size.x, this.size.y);
        ctx.fill();
        ctx.closePath();
    }
}
class killerBox{
    constructor(data){
        this.x = data.x;
        this.y = data.y;
        this.size = {
            x: data.width,
            y: data.height
        }
        KILLERBOXES.push(this);
    }
    update(){
        let playerRect = getSolidRect(player);
        let stRect = getSolidRect(this);

        let collision = rectCollision(playerRect, stRect);

        if (collision){
            player.dealDmg(100, {object: 'spike'});
        }
    }
    draw(){
        if (!editorMode) return;
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.strokeRect(this.x - CAMERA.offset.x, this.y - CAMERA.offset.y, this.size.x, this.size.y);
        ctx.closePath();   
    }
}
class actionBox{
    constructor(data){
        this.x = data.x;
        this.y = data.y;
        this.size = {
            x: data.width,
            y: data.height
        }
        ACTIONBOXES.push(this);
        this.lastTimeAdded = Date.now();
        this.stopedColliding = false;
    }
    update(){
        let playerRect = getSolidRect(player);
        let stRect = getSolidRect(this);

        let collision = rectCollision(playerRect, stRect);

        if (collision){
            if (this.stopedColliding) this.lastTimeAdded = Date.now();
            this.stopedColliding = false;
            // player.dealDmg(100, {object: 'spike'});
            // add player to list of players on the point
            // check if point is cotensted if not add points every second to take the point
            if (Date.now() - this.lastTimeAdded > 500){
                player.addPoint();
                this.lastTimeAdded = Date.now();
            }            

        }else{
            this.stopedColliding = true;
        }      
    }
    draw(){
        if (!editorMode) return;
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.strokeRect(this.x - CAMERA.offset.x, this.y - CAMERA.offset.y, this.size.x, this.size.y);
        ctx.closePath();   
    }
}