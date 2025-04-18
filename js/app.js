const canvas = document.querySelector('canvas');
const main = document.querySelector('main'); 
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score-content');
const lifeElement = document.getElementById('life-content');
const startButton = document.getElementById('start');
const backgroundMusic = new Audio('./audio/gamebg.mp3');

// Audio - Adjust volume (0.0 - 1.0)
const laserSound = new Audio('./audio/laser.mp3');
laserSound.volume = 0.7;

const winSound = new Audio('./audio/win.mp3');
winSound.volume = 0.7;

const loseSound = new Audio('./audio/lose.mp3');
loseSound.volume = 0.7;

const startSound = new Audio('./audio/start.mp3');
startSound.volume = 0.9;

const enemyLaserSound = new Audio('./audio/enemylaser.mp3');
enemyLaserSound.volume = 0.6;

const enemyHitSound = new Audio('./audio/enemyhit.mp3');
enemyHitSound.volume = 0.9;

const playerHitSound = new Audio('./audio/playerhit.mp3');
playerHitSound.volume = 1;

// background audio plays on loop
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

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
const TOTAL_FRAMES = 4; 

// Dynamic sizing relative to canvas
const PLAYER_WIDTH_RATIO = 0.1; // 10% of canvas width
let playerWidth, playerHeight = 0;

function updatePlayerSize() {
    playerWidth = canvas.width * PLAYER_WIDTH_RATIO;
    playerHeight = (FRAME_HEIGHT / FRAME_WIDTH) * playerWidth; // Maintain aspect ratio
}

// Global variables
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
    context.fillStyle = "rgba(0, 0, 0, 0.65)";
    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

    // Draw move set instructions
    context.fillStyle = "white";
    context.font = "30px Copperplate";
    context.textAlign = "center";
    context.fillText("🚀 Welcome to Space Cat Shooter! 🚀", canvas.width / 2, canvas.height / 2 - 90);
    context.fillText("Move Up: ↑ Arrow", canvas.width / 2, canvas.height / 2 - 40);
    context.fillText("Move Down: ↓ Arrow", canvas.width / 2, canvas.height / 2 - 10);
    context.fillText("Shoot Lasers: Spacebar", canvas.width / 2, canvas.height / 2 + 20);
    context.fillText("Score 500 points to win", canvas.width / 2, canvas.height / 2 + 70);

    startButton.style.position = "absolute";
    startButton.style.top = `${canvas.offsetTop + canvas.height / 2 + 90}px`; 
    startButton.style.left = `${canvas.offsetLeft + canvas.width / 2 - 90}px`; 
}

// Function to redraw everything after resizing
function drawAll() {
    player.draw();
    enemies.forEach(enemy => enemy.draw());
    projectiles.forEach(projectile => projectile.draw());
}

function resizeCanvas() {
    // Store the current game state
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;

    // Update canvas size
    canvas.width = main.clientWidth;
    canvas.height = main.clientHeight;

    updatePlayerSize(); // Initialize player size
    if (player) {
        player.resize();
        player.y = canvas.height / 2; // Adjust position
    }
    // Scale enemy positions to new canvas size
    enemies.forEach(enemy => {
        enemy.y = (enemy.y / prevHeight) * canvas.height;
    });

    // Scale projectiles to new canvas size
    projectiles.forEach(projectile => {
        projectile.y = (projectile.y / prevHeight) * canvas.height;
    });

    // Redraw background
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Redraw everything after resizing
    drawAll();

    if (isFirstLoad) {
        showStartPopup();
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
        laserSound.currentTime = 0; // Restart sound to allow rapid firing
        laserSound.play().catch(err => console.warn("Laser sound failed:", err));
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
        this.width = 60; 
        this.height = 60; 
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
        enemyLaserSound.play();
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
            playerHitSound.play();
            //reduce lives
            lives -= 1;
            updateLives();

            // check for game over
            if (lives === 0) {
                loseSound.play()
                showPopup("💀 Game Over! 💀");
            }
        }
    });
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

    // Play background music
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(err => console.warn("Audio play failed:", err));
    }

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
        
            if (projectile.direction === "right" && projectile.checkCollision(enemy)) {  
                enemy.stopFiring();
                enemyHitSound.play();
                enemies.splice(j, 1);
                projectiles.splice(i, 1);
        
                // Update score 
                score += 100;
                scoreElement.innerText = score;
                if (score >= 500) {
                    winSound.play();
                    showPopup("🎉 You Win! 🎉 ");
                }
                break; // Stops checking after one hit
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
    context.font = "40px Copperplate";
    context.textAlign = "center";
    context.fillText(message, canvas.width / 2, canvas.height / 2 - 90);

    // Stop the game loop
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    clearTimeout(enemySpawnTimeout);

    // Stop background music when the game ends
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    // Trigger confetti if the player wins
    if (message.includes("Win")) {
        confetti({
            particleCount: 500,
            spread: 250,
            startVelocity: 40,
            gravity: 0.9,
            origin: { x: 0.5, y: 0.6 }, // Center of the canvas
            shapes: ["star"],
            zIndex: 999,
        });
    }


    startButton.style.position = "absolute";
    startButton.style.top = `${canvas.offsetTop + canvas.height / 2 - 50}px`; // Move below pop-up
    startButton.style.left = `${canvas.offsetLeft + canvas.width / 2 - 90}px`; // Centered
    startButton.style.display = "block"; // Make sure it's visible
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
// Movement Controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') player.move('up');
    if (event.key === 'ArrowDown') player.move('down');
    if (event.key === ' ') player.shoot(); // Fire laser on Spacebar
});
// Function to restart the game when the start button is clicked
startButton.addEventListener("click", () => {
    startSound.play();
    if (startButton.innerText === "Start Game") return; // Prevent gameInit from running twice
    window.location.reload();
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
        startButton.onclick = startGame; // Attach event to start game
    } else {
        gameInit(); // Start game immediately if not first load
    }
};

// Function to start the game after clicking "Start Game"
function startGame() {
    sessionStorage.setItem("gameStarted", "true"); // Mark game as started
    startButton.style.display = "none"; // Hide button after clicking
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear popup
    gameInit();
};

bgImage.onload = function () {
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
};

updatePlayerSize(); // Initialize player size
resizeCanvas();
