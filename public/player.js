class Player{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.vel = {x: 0, y: 0};
        this.grounded = false;
        this.size = {
            x: 50,
            y: 100
        }
        this.color = getRandomColor();
        this.maxSpeed = 4;
        this.runAcceleration = 16;
        this.runSpeed = 6;
        this.runReduce = 15; 
        this.flyReduce = 12;    
        this.fallSpeed = 3.6;
        this.jumpSpeed = 3;
    }
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(this.x, this.y, this.size.x, this.size.y);
        ctx.fill();
        ctx.closePath();
    }
    update(){
        // physics 
        
        
        // Friction
        if(!pressedKeys['a'] &&
        !pressedKeys['d']) {
            if(this.grounded){
                player.vel.x = approach(this.vel.x, 0, this.runReduce * dt);
            }
            else{
                player.vel.x = approach(player.vel.x, 0, this.flyReduce * dt);
            }
        }   

        // movement
        if (pressedKeys['a']){ // left
            let mult = 1;
            if(this.vel.x > 0)
            {
                mult = 3;
            }
            this.vel.x = approach(this.vel.x, -this.runSpeed, this.runAcceleration * mult * dt);
        }

        if (pressedKeys['d']){ // right
            let mult = 1;
            if(this.vel.x < 0)
            {
                mult = 3;
            }
            this.vel.x = approach(this.vel.x, this.runSpeed, this.runAcceleration * mult * dt);
        }


        if (pressedKeys['w'] || pressedKeys[' ']){ // jump
            if (this.grounded){
                this.grounded = false;
                this.vel.y -= 30;
            }
        }

        // gravity
        this.vel.y = approach(this.vel.y, gravity, fallSpeed);

        // check for collisions
        this.checkForCollison();

        // execute movement
        this.y += this.vel.y;
        this.x += this.vel.x;
    }
    checkForCollison(){
        // blocks
        for (let i = 0; i < blocks.length; i++){
            let b = blocks[i];
            
            // sides of player
            let top = this.y < b.y + b.size.y;
            let bottom = this.y + this.size.y > b.y;
            let right = this.x + this.size.x > b.x;
            let left = this.x < b.x + b.size.x;
            
            if (bottom && left && right && top){
                if (this.vel.y > 0){
                    this.vel.y = 0;
                    this.grounded = true;
                }
            }

            // if (this.y+this.size.y > b.y) this.y = b.y - this.size.y;

            
        }
    }
}