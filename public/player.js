class Player extends CharacterEntity{
    constructor(x, y){
        super();
        this.display = 'You';
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
        this.runAcceleration = 10;
        this.runSpeed = 4;
        this.runReduce = 22; 
        this.flyReduce = 12;    
        this.fallSpeed = 3.6;
        this.fallSideAcceleration = 10;
        this.directionChangeMult = 1.6;
        this.jumpSpeed = -5;

        this.weaponLoaded = false;
        this.weapon = WEAPONS[this.weaponId];
        this.weapon.img.onload = () => {
            this.weapon.scale = WEAPONS[this.weaponId].scale ? WEAPONS[this.weaponId].scale : DEFAULT_SIZE_SCALE;
            this.weapon.size = {
                x: this.weapon.img.width / this.weapon.scale,
                y: this.weapon.img.height / this.weapon.scale
            }
            this.gunImage = this.weapon.img;
            this.weaponLoaded = true;

        }
    }
    update(){
        // weapon

        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }

        const mouseX = mousePos.x - canvas.getBoundingClientRect().left;
        const mouseY = mousePos.y - canvas.getBoundingClientRect().top;
    
        this.weaponAngle = Math.atan2(mouseY - gunPos.y, mouseX - gunPos.x);
        this.weaponDegrees =  this.weaponAngle * (180 / Math.PI);

        if (this.shooting) this.shoot();

        // physics 
                

        // movement
        if (pressedKeys['w'] || pressedKeys[' ']){ // jump
            let timeSinceGrouned = Date.now() - this.groundedTime;
            if (this.grounded || timeSinceGrouned < 20){
                this.vel.y = this.jumpSpeed;
                // this.vel.x += this.solidSpeed.x;
                // this.vel.y += this.solidSpeed.y;
            }
        }

        if (pressedKeys['a'] && !pressedKeys['d']){ // left
            let mult = 1;
            if(this.vel.x > 0)
            {
                mult = this.directionChangeMult;
            }
            if (this.grounded){
                this.vel.x = approach(this.vel.x, -this.runSpeed, this.runAcceleration * mult * dt);
            }else{
                this.vel.x = approach(this.vel.x, -this.runSpeed, this.fallSideAcceleration * mult * dt);
            }
        }

        if (pressedKeys['d'] && !pressedKeys['a']){ // right
            let mult = 1;
            if(this.vel.x < 0)
            {
                mult = this.directionChangeMult;
            }
            if (this.grounded){
                this.vel.x = approach(this.vel.x, this.runSpeed, this.runAcceleration  * mult * dt);
            }else{
                this.vel.x = approach(this.vel.x, this.runSpeed, this.fallSideAcceleration  * mult * dt);
            }
        }


        // gravity
        this.vel.y = approach(this.vel.y, this.fallSpeed, gravity * dt);


         // Friction
         if(!pressedKeys['a'] && !pressedKeys['d']) {
            if(this.grounded){
                player.vel.x = approach(this.vel.x, 0, this.runReduce * dt);
            }
            else{
                player.vel.x = approach(player.vel.x, 0, this.flyReduce * dt);
            }
        }   

        // execute movement
        
        this.remainder.x += this.vel.x * dt * DELTA_SPEED_CORRECTION;
        let moveX = Math.round(this.remainder.x);
        if(moveX != 0)
        {
            this.remainder.x -= moveX;
            let moveSign = Math.sign(moveX);
            let collisionHappenedX = false;
            let playerRect = getSolidRect(this);
    
            // Move the player in X until collision or moveX is exausted
            while(moveX != 0)
            {
                // console.log(moveX)
                playerRect.pos.x += moveSign;

                
                // Test collision against Solids
                for(let solidIdx = 0; solidIdx < blocks.length; solidIdx++)
                {
                    let solid = blocks[solidIdx];
                    let solidRect = getSolidRect(solid);
                    if(rectCollision(solidRect, playerRect)){
                        collisionHappenedX = true;
                        break;
                    }

                }  
                if (!collisionHappenedX){
                    this.x += moveSign;
                    moveX -= moveSign;
                }else{
                    this.vel.x = 0;
                    this.remainder.x = 0;
                    break;
                }
                // Move the Player
                // console.log(moveSign)
            }
        }
        if (this.grounded){
            this.grounded = false;
            this.groundedTime = Date.now();      
        }
        // Move Y
            let playerRect = getSolidRect(this);
      
            this.remainder.y += this.vel.y * dt * DELTA_SPEED_CORRECTION;
            let moveY = Math.round(this.remainder.y);
            if(moveY != 0)
            {
                this.remainder.y -= moveY;
                let moveSign = Math.sign(moveY);
                let collisionHappenedY = false;
      
             // Move the player in Y until collision or moveY is exausted
                while(moveY)
                {
                    playerRect.pos.y += moveSign;
      
                    // Test collision against Solids
                    for(let solidIdx = 0; solidIdx < blocks.length; solidIdx++)
                    {
                        let solid = blocks[solidIdx];
                        let solidRect = getSolidRect(solid);  
                        if(rectCollision(playerRect, solidRect)) {
                        // Moving down/falling
                            if(this.vel.y > 0)
                            {
                                this.grounded = true;
                            }
      
                            collisionHappenedY = true;
                            break;
                        }
                    }
      
                    // Move the Player
                    if (!collisionHappenedY){
                        this.y += moveSign;
                        moveY -= moveSign;
                    }else{
                        if (moveSign < 0){
                            this.vel.y = 0;
                        }
                        break;
                    }
                }
            }     
    }
    tp(x, y){
        this.x = x - this.size.x / 2;
        this.y = y - this.size.y / 2;
    }
}
function getSolidRect(solid){
    return {
        pos: {
            x: solid.x,
            y: solid.y,
        },
        size: {
            x: solid.size.x,
            y: solid.size.y
        }
    }
}