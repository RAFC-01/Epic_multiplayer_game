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
        this.remainder = {x: 0, y: 0};
        this.runAcceleration = 15;
        this.runSpeed = 4;
        this.runReduce = 30; 
        this.flyReduce = 12;    
        this.fallSpeed = 3.6;
        this.jumpSpeed = -5;
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
        if (pressedKeys['w'] || pressedKeys[' ']){ // jump
            if (this.grounded){
                this.vel.y = this.jumpSpeed;
                // this.vel.x += this.solidSpeed.x;
                // this.vel.y += this.solidSpeed.y;
                this.grounded = false;
            }
        }

        if (pressedKeys['a']){ // left
            if(this.vel.x > 0)
            {
                this.vel.x = 0;
            }
            this.vel.x = approach(this.vel.x, -this.runSpeed, this.runAcceleration * dt);
        }

        if (pressedKeys['d']){ // right
            if(this.vel.x < 0)
            {
                this.vel.x = 0;
            }
            this.vel.x = approach(this.vel.x, this.runSpeed, this.runAcceleration * dt);
        }


        // gravity
        this.vel.y = approach(this.vel.y, this.fallSpeed, gravity * dt);

        // execute movement
        
        this.remainder.x += this.vel.x;
        let moveX = Math.round(this.remainder.x);
        if(moveX != 0)
        {
            this.remainder.x -= moveX;
            let moveSign = Math.sign(moveX);
            let collisionHappened = false;
            let playerRect = {
                pos: {
                    x: this.x,
                    y: this.y,
                },
                size: {
                    x: this.size.x,
                    y: this.size.y
                }
            }
    
            // Move the player in X until collision or moveX is exausted
            while(moveX)
            {
                // console.log(moveX)
                playerRect.pos.x += moveSign;

                
                // Test collision against Solids
                for(let solidIdx = 0; solidIdx < blocks.length; solidIdx++)
                {
                    let solid = blocks[solidIdx];
                    let solidRect = {
                        pos: {
                            x: solid.x,
                            y: solid.y,
                        },
                        size: {
                            x: solid.size.x,
                            y: solid.size.y
                        }
                    }
                    if(rectCollision(playerRect, solidRect)){
                        this.vel.x = 0;
                        return;
                    }
                }  
                // Move the Player
                // console.log(moveSign)
                this.x += moveSign;
                moveX -= moveSign;
            }
        }      
        // Move Y
            let playerRect  = {
                pos: {
                    x: this.x,
                    y: this.y,
                },
                size: {
                    x: this.size.x,
                    y: this.size.y
                }
            }
      
            this.remainder.y += this.vel.y;
            let moveY = Math.round(this.remainder.y);
            if(moveY != 0)
            {
                this.remainder.y -= moveY;
                let moveSign = Math.sign(moveY);
                let collisionHappened = false;
      
             // Move the player in Y until collision or moveY is exausted
                while(moveY)
                {
                  playerRect.pos.y += moveSign;
      
                  // Test collision against Solids
                    for(let solidIdx = 0; solidIdx < blocks.length; solidIdx++)
                    {
                        let solid = blocks[solidIdx];
                        let solidRect = {
                            pos: {
                                x: solid.x,
                                y: solid.y,
                            },
                            size: {
                                x: solid.size.x,
                                y: solid.size.y
                            }
                        }      
                        if(rectCollision(playerRect, solidRect)) {
                        // Moving down/falling
                            if(this.vel.y > 0)
                            {
                                this.grounded = true;
                            }
      
                            this.vel.y = 0;
                            return;
                        }
                    }
      
                // Move the Player
                  this.y += moveSign;
                  moveY -= moveSign;
                }
            }
            
    }
    tp(x, y){
        this.x = x - this.size.x / 2;
        this.y = y - this.size.y / 2;
    }
}