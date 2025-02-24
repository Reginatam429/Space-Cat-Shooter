const canvas = document.querySelector('canvas');
const main = document.querySelector('main'); 
const context = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = './images/player.png';

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

const player = new Player(50, canvas.height / 2);
resizeCanvas();

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
}

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

    //draw player
    player.draw();

    // Move & draw projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();

        // Remove off-screen bullets
        if (projectile.x > canvas.width || projectile.x < 0) {
            projectiles.splice(index, 1);
        }
    });
    requestAnimationFrame(gameLoop);
}

playerImage.onload = function () {
    //console.log("Player image loaded successfully.");
    gameLoop(); // Start the game loop only after image loads
};
