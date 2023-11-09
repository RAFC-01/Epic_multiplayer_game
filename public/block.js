class Block{
    constructor(x, y, sx, sy, color){
        this.x = x;
        this.y = y;
        this.size = {
            x: sx,
            y: sy
        }
        this.color = color;
        blocks.push(this);
    }
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(this.x, this.y, this.size.x, this.size.y);
        ctx.fill();
        ctx.closePath();
    }
}