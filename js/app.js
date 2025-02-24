const canvas = document.querySelector('canvas');
const main = document.querySelector('main'); 
const context = canvas.getContext('2d');

const bgImage = new Image();
bgImage.src = "./images/background.png";

const playerImage = new Image();
playerImage.src = './images/player.png';

const enemyImage = new Image();
enemyImage.src = './images/enemyship1.png';

// Spritesheet settings
const FRAME_WIDTH = 950; 
const FRAME_HEIGHT = 630;
const TOTAL_FRAMES = 4; // Number of frames in spritesheet

// Dynamic sizing relative to canvas
const PLAYER_WIDTH_RATIO = 0.1; // 10% of canvas width
let playerWidth, playerHeight = 0;

function updatePlayerSize() {
    playerWidth = canvas.width * PLAYER_WIDTH_RATIO;
    playerHeight = (FRAME_HEIGHT / FRAME_WIDTH) * playerWidth; // Maintain aspect ratio
}

updatePlayerSize(); // Initialize player size

let currentFrame = 0;
const projectiles = []; // Store all bullets (player & enemies)
const enemies = []; // Store all enemies

function resizeCanvas() {
    canvas.width = main.clientWidth;
    canvas.height = main.clientHeight;

    updatePlayerSize(); // Initialize player size
    player.resize();
    player.y = canvas.height / 2; // Adjust position
}

function animateFrames() {
    currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
}
setInterval(animateFrames, 100); 

//Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y ?? 100;
        this.width = playerWidth;
        this.height = playerHeight;
        this.speed = 15;
    }

    move(direction) {
        if (direction === 'up' && this.y > 0) this.y -= this.speed;
        if (direction === 'down' && this.y + this.height < canvas.height) this.y += this.speed;
    }

    draw() {
        console.log("Drawing player at:", this.x, this.y, "Size:", this.width, this.height);
        context.drawImage(
            playerImage,
            currentFrame * FRAME_WIDTH, // Crop x position
            0, // Crop y position
            FRAME_WIDTH,
            FRAME_HEIGHT,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    shoot() {
        projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2, "right")); // Fire right
        //console.log("Pew! Pew! Laser fired!");
    }
    resize() {
        // Dynamically update player's size
        this.width = playerWidth;
        this.height = playerHeight;
    }
}

// Enemy Class
class Enemy {
    constructor() {
        this.width = 60; // Set enemy width
        this.height = 60; // Set enemy height
        this.x = canvas.width; // Spawn at the right edge
        this.y = Math.random() * (canvas.height - this.height); // Random y position
        this.speed = Math.random() * 3 + 2; // Random speed between 2 and 5
    }

    update() {
        this.x -= this.speed; // Move left
    }

    draw() {
        context.drawImage(enemyImage, this.x, this.y, this.width, this.height);
    }

    shoot() {
        projectiles.push(new Projectile(this.x, this.y + this.height / 2, "left", 7)); // Fire left, slower speed
    }
}

class Projectile {
    constructor(x, y,direction) {
        this.x = x;
        this.y = y;
        this.direction = direction; // right for player, left for enemies
        this.width = 10;
        this.height = 5;
        this.speed = 10;
        this.color = direction === "right" ? "pink" : "blue"; // Player bullets are pink, enemy bullets are blue
    }
    update() {
        this.x += this.direction === "right" ? this.speed : -this.speed;
    }

    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(enemy) {
        return (
            this.x < enemy.x + enemy.width &&
            this.x + this.width > enemy.x &&
            this.y < enemy.y + enemy.height &&
            this.y + this.height > enemy.y
        );
    }
}

// Function to spawn enemies at random intervals
function spawnEnemy() {
    enemies.push(new Enemy());
    setTimeout(spawnEnemy, Math.random() * 2000 + 1000); // Spawn every 1-3 seconds

}

const player = new Player(50, canvas.height / 2);
resizeCanvas();

// Event Listeners
window.addEventListener('resize', resizeCanvas);
// Movement Controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') player.move('up');
    if (event.key === 'ArrowDown') player.move('down');
    if (event.key === ' ') player.shoot(); // Fire laser on Spacebar
});


// Game Loop
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    //draw player
    player.draw();

    // Move & draw projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();

        projectiles.forEach((projectile, pIndex) => {
            projectile.update();
            projectile.draw();
        
            // Check collision with each enemy
            enemies.forEach((enemy, eIndex) => {
                if (projectile.checkCollision(enemy)) {
                    // Remove both the enemy and the projectile
                    enemies.splice(eIndex, 1);
                    projectiles.splice(pIndex, 1);
                }
            });
        
            // Remove off-screen bullets
            if (projectile.x > canvas.width || projectile.x < 0) {
                projectiles.splice(pIndex, 1);
            }
        });
        

        // Remove off-screen bullets
        if (projectile.x > canvas.width || projectile.x < 0) {
            projectiles.splice(index, 1);
        }
    });

     // Move & draw enemies
     enemies.forEach((enemy, index) => {
        enemy.update();
        enemy.draw();

        // Remove off-screen enemies
        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1);
        }
    });

    requestAnimationFrame(gameLoop);
}

bgImage.onload = function () {
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
};

playerImage.onload = function () {
    //console.log("Player image loaded successfully.");
    gameLoop(); // Start the game loop only after image loads
};

enemyImage.onload = function () {
    spawnEnemy(); // Start spawning enemies after enemy image loads
};
