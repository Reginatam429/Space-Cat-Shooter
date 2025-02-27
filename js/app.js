const canvas = document.querySelector('canvas');
const main = document.querySelector('main'); 
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score-content');
const lifeElement = document.getElementById('life-content');
const restartButton = document.getElementById('restart');

const bgImage = new Image();
bgImage.src = "./images/background.png";
bgImage.alt = "Purple colorful galaxy"

const playerImage = new Image();
playerImage.src = './images/player.png';
playerImage.alt = "Nyancat with rainbow trail"

const enemyImage = new Image();
enemyImage.src = './images/enemyship1.png';
enemyImage.alt = "purple enemy spaceship"

const heartImage = new Image();
heartImage.src = './images/heart.gif';
heartImage.alt = "spinning red pixel heart with sparkles"

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



// let player;
let currentFrame = 0;
let score = 0;
let lives = 3;
let gameLoopId = null; // Stores the requestAnimationFrame ID
let enemySpawnTimeout = null;
let gameRunning = false; // Track game loop status
const projectiles = []; // Store all bullets (player & enemies)
const enemies = []; // Store all enemies

function resizeCanvas() {
    canvas.width = main.clientWidth;
    canvas.height = main.clientHeight;

    updatePlayerSize(); // Initialize player size
    if (player) {
        player.resize();
        player.y = canvas.height / 2; // Adjust position
    }
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
        this.speed = 18;
    }

    move(direction) {
        if (direction === 'up' && this.y > 0) this.y -= this.speed;
        if (direction === 'down' && this.y + this.height < canvas.height) this.y += this.speed;
    }

    draw() {
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
let player = new Player(50, canvas.height / 2);

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

    startFiring() {
        this.fireInterval = setInterval(() => {
            if (this.x > 0) { // Only fire if still on screen
                projectiles.push(new Projectile(this.x, this.y + this.height / 2, "left"));
            }
        }, Math.random() * 3000 + 1000); // Fire every 1-4 seconds
    }

    stopFiring() {
        if (this.fireInterval) {
            clearInterval(this.fireInterval);
            this.fireInterval = null;
        } // Stops enemy from firing when removed
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
        this.color = direction === "right" ? "pink" : "red"; // Player bullets are pink, enemy bullets are red
    }
    update() {
        this.x += this.direction === "right" ? this.speed : -this.speed;
    }

    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(target) {
        return (
            this.x < target.x + target.width &&
            this.x + this.width > target.x &&
            this.y < target.y + target.height &&
            this.y + this.height > target.y
        );
    }
}

function checkPlayerCollisions() {
    projectiles.forEach((projectile, index) => {
        if (projectile.direction ===  "left" && projectile.checkCollision(player)) {
            //remove projectile
            projectiles.splice(index, 1);
            //reduce lives
            lives -= 1;
            updateLives();

            // check for game over
            if (lives === 0) {
                //replace with gameover screen logic later
                alert(`Game Over. Score: ${score}`);
                window.location.reload();
            }
        }
    })
} 

// Function to spawn enemies at random intervals
function spawnEnemy() {
    if (!gameRunning) return;

    const enemy = new Enemy(); // Create a new enemy
    enemy.startFiring(); // Enemy starts shooting
    enemies.push(enemy); // Add enemy to the enemies array
    enemySpawnTimeout = setTimeout(spawnEnemy, Math.random() * 2000 + 1000); // Spawn every 1-3 seconds
}

// Function to update heart images
function updateLives() {
    lifeElement.innerHTML = ""; // Clear previous hearts

    for (let i = 0; i < lives; i++) {
        const heart = document.createElement("img");
        heart.src = heartImage.src; 
        heart.alt = "heart representing game lives";
        heart.style.width = "30px";
        heart.style.height = "30px";
        lifeElement.appendChild(heart);
    }
}

updateLives(lives);

// Starts new instance of a game, calls gameloop
function gameInit() {

    // Set game state
    score = 0;
    lives = 3;

    // Set player position
    player.x = 50;
    player.y = canvas.height / 2;

    // Update UI
    scoreElement.innerText = score;
    updateLives(); 

    // Start everything
    gameRunning = true;
    gameLoop();
    spawnEnemy();
}

// MAIN FUNCTION - Game Loop
function gameLoop() {
    if (!gameRunning) return; // Prevents multiple game loops

    gameLoopId = requestAnimationFrame(gameLoop); // Store the frame ID

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    player.draw();

    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();
        checkPlayerCollisions();

        // Check collision with each enemy
        enemies.forEach((enemy, index) => {
            if (projectiles.some(projectile => projectile.checkCollision(enemy))) {
                // Remove both the enemy and the projectile
                enemies.splice(index, 1);
                projectiles.splice(index, 1);
                enemy.stopFiring(); // Stop firing before removing
                
                // Update score 
                score += 100;
                scoreElement.innerText = score;
                if (score >= 1000) {
                    alert(`You Win! Score: ${score}`);
                    window.location.reload();
                }
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
            enemy.stopFiring();
            enemies.splice(index, 1);
        }
    });
}

// RESTARTS the game
function gameRestart() {
    // Clear all game objects
    projectiles.length = 0;
    enemies.forEach(enemy => enemy.stopFiring()); // Stop enemy firing before clearing
    enemies.length = 0;

     // Stop existing game loop (clear scheduled frames)
     if (gameLoopId) {
        cancelAnimationFrame(gameLoopId); // Stops the previous game loop
    }

    gameRunning = false; // Prevent multiple loops

    // Stop existing enemy spawn timers
    clearTimeout(enemySpawnTimeout);

    // start game again
    gameInit();
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
// Movement Controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') player.move('up');
    if (event.key === 'ArrowDown') player.move('down');
    if (event.key === ' ') player.shoot(); // Fire laser on Spacebar
});
// Restart Button
restartButton.addEventListener("click", () => {
    window.location.reload();
});
// Start game upon opening 
window.onload = () => {
    gameInit();
};

bgImage.onload = function () {
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
};

updatePlayerSize(); // Initialize player size
resizeCanvas();
