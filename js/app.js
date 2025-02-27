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
let isFirstLoad = sessionStorage.getItem("gameStarted") ? false : true; // Track if the game has been restarted

function showStartPopup() {
    // Draw a semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

    // Draw move set instructions
    context.fillStyle = "white";
    context.font = "24px Arial";
    context.textAlign = "center";
    context.fillText("🚀 Welcome to Space Cat Shooter! 🚀", canvas.width / 2, canvas.height / 2 - 60);
    context.fillText("Move Up: ↑ Arrow", canvas.width / 2, canvas.height / 2 - 10);
    context.fillText("Move Down: ↓ Arrow", canvas.width / 2, canvas.height / 2 + 20);

    context.fillText("Score 500 points to win", canvas.width / 2, canvas.height / 2 + 70);

    // Change restart button to "Start Game"
    restartButton.innerText = "Start Game";
    restartButton.style.position = "absolute";
    restartButton.style.top = `${canvas.offsetTop + canvas.height / 2 + 120}px`; 
    restartButton.style.left = `${canvas.offsetLeft + canvas.width / 2 - 50}px`; 
}

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
                showPopup("💀 Game Over!");
            }
        }
    })
} 

// Function to spawn enemies at random intervals
function spawnEnemy() {
    if (!gameRunning) return;

    const enemy = new Enemy();
    enemy.startFiring(); 
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

  // Clear enemies and projectiles before init
    enemies.forEach(enemy => enemy.stopFiring()); 
    enemies.length = 0; 
    projectiles.length = 0;    

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

    // Iterate backwards for projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];
        projectile.update();
        projectile.draw();
        checkPlayerCollisions();

        // Check collision with each enemy
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];

            if (projectile.checkCollision(enemy)) {
                enemy.stopFiring(); // Stop firing before removing
                // Remove both the enemy and the projectile
                enemies.splice(j, 1); 
                projectiles.splice(i, 1); 
                
                // Update score 
                score += 100;
                scoreElement.innerText = score;
                if (score >= 500) {
                    showPopup("🎉 You Win!");
                }
                break; // Stop checking other enemies after a hit
            }
        };

        // Remove off-screen bullets
        if (projectile.x > canvas.width || projectile.x < 0) {
            projectiles.splice(i, 1);
            }
    };

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

function showPopup(message) {
    // Draw a semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 3);

    // Draw the message
    context.fillStyle = "white";
    context.font = "30px Arial";
    context.textAlign = "center";
    context.fillText(message, canvas.width / 2, canvas.height / 2 - 60);

    // Stop the game loop
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    clearTimeout(enemySpawnTimeout);

    restartButton.style.position = "absolute";
    restartButton.style.top = `${canvas.offsetTop + canvas.height / 2 - 40}px`; // Move below pop-up
    restartButton.style.left = `${canvas.offsetLeft + canvas.width / 2 - 50}px`; // Centered
    restartButton.style.display = "block"; // Make sure it's visible
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
// Movement Controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') player.move('up');
    if (event.key === 'ArrowDown') player.move('down');
    if (event.key === ' ') player.shoot(); // Fire laser on Spacebar
});
// Function to restart the game when the restart button is clicked
restartButton.addEventListener("click", () => {
    if (restartButton.innerText === "Start Game") return; // Prevent gameInit from running twice

    window.location.reload(); // Reload the page for a full restart
});

// Start game upon opening 
window.onload = () => {
    // Check if the page was fully reloaded (not just restarted in-game)
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
        sessionStorage.removeItem("gameStarted"); // Reset session storage on full reload
    }

    let isFirstLoad = !sessionStorage.getItem("gameStarted"); // True if first time playing

    if (isFirstLoad) {
        showStartPopup(); // Show popup before starting the game
        restartButton.onclick = startGame; // Attach event to start game
    } else {
        gameInit(); // Start game immediately if not first load
    }
};

// Function to start the game after clicking "Start Game"
function startGame() {
    sessionStorage.setItem("gameStarted", "true"); // Mark game as started
    restartButton.style.display = "none"; // Hide button after clicking
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear popup
    gameInit(); // Start the game
};

bgImage.onload = function () {
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
};

updatePlayerSize(); // Initialize player size
resizeCanvas();
