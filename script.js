
/* ==================================================
   SPACE DEFENDER
   Retro-Futuristic Arcade Game
   With Background Music
   Progressive Difficulty + Damage Effects
================================================== */


// ==================================================
// 1. CONNECT HTML ELEMENTS
// ==================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over");

const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const finalScoreDisplay = document.getElementById("final-score");

// Background Music
const backgroundMusic =
    document.getElementById("background-music");

if (backgroundMusic) {
    backgroundMusic.volume = 0.25;
}


// ==================================================
// 2. GAME VARIABLES
// ==================================================

let score = 0;
let lives = 3;
let gameRunning = false;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 45,
    speed: 5
};

const keys = {};

let bullets = [];
let asteroids = [];
let stars = [];

let canShoot = true;
const shootCooldown = 250;

let asteroidTimer = 0;
const baseAsteroidInterval = 900;

let animationId = null;
let lastTime = 0;

// Collision damage effect
let playerHitTimer = 0;
const playerInvulnerabilityDuration = 800;


// ==================================================
// 3. DIFFICULTY SYSTEM
// ==================================================

function getDifficultyLevel() {

    return Math.floor(score / 100);

}


function getAsteroidSpeedMultiplier() {

    const level = getDifficultyLevel();

    return Math.min(2.5, 1 + level * 0.15);

}


function getAsteroidInterval() {

    const level = getDifficultyLevel();

    return Math.max(
        400,
        baseAsteroidInterval - level * 75
    );

}


// ==================================================
// 4. CREATE STARS
// ==================================================

function createStars() {

    stars = [];

    for (let i = 0; i < 140; i++) {

        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.5 + 0.3
        });

    }

}


// ==================================================
// 5. DRAW RETRO SPACE BACKGROUND
// ==================================================

function drawBackground(deltaTime) {

    const time = performance.now() * 0.001;

    const gradient = ctx.createLinearGradient(
        0, 0, 0, canvas.height
    );

    gradient.addColorStop(0, "#08051f");
    gradient.addColorStop(0.45, "#17103c");
    gradient.addColorStop(1, "#030611");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0, 0, canvas.width, canvas.height
    );


    // Animated nebula clouds

    const nebula = [

        {
            x: 180 + Math.sin(time * 0.4) * 35,
            y: 150,
            radius: 190,
            color: "rgba(130, 40, 255, 0.18)"
        },

        {
            x: 600 + Math.cos(time * 0.3) * 40,
            y: 260,
            radius: 220,
            color: "rgba(0, 190, 255, 0.15)"
        },

        {
            x: 400,
            y: 80 + Math.sin(time * 0.5) * 20,
            radius: 150,
            color: "rgba(255, 40, 150, 0.12)"
        }

    ];


    nebula.forEach(cloud => {

        const glow = ctx.createRadialGradient(
            cloud.x,
            cloud.y,
            0,
            cloud.x,
            cloud.y,
            cloud.radius
        );

        glow.addColorStop(0, cloud.color);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = glow;

        ctx.fillRect(
            cloud.x - cloud.radius,
            cloud.y - cloud.radius,
            cloud.radius * 2,
            cloud.radius * 2
        );

    });


    // Moving and twinkling stars

    stars.forEach(star => {

        star.y += star.speed * deltaTime / 16.67;

        if (star.y > canvas.height) {

            star.y = 0;
            star.x = Math.random() * canvas.width;

        }

        const twinkle =
            0.5 + Math.sin(time * 3 + star.x) * 0.5;

        ctx.globalAlpha = twinkle;

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            star.x,
            star.y,
            star.size,
            star.size
        );

    });

    ctx.globalAlpha = 1;


    // Neon perspective grid

    ctx.save();

    ctx.strokeStyle = "rgba(0, 210, 255, 0.16)";
    ctx.lineWidth = 1;

    const horizon = canvas.height * 0.65;

    for (let i = -10; i <= 10; i++) {

        ctx.beginPath();

        ctx.moveTo(canvas.width / 2, horizon);

        ctx.lineTo(
            canvas.width / 2 + i * 100,
            canvas.height
        );

        ctx.stroke();

    }


    // Moving horizontal grid lines

    for (let i = 0; i < 9; i++) {

        const progress =
            ((time * 0.35 + i / 9) % 1);

        const y =
            horizon + progress * progress *
            (canvas.height - horizon);

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();

    }

    ctx.restore();


    // Subtle CRT scanlines

    ctx.fillStyle = "rgba(255, 255, 255, 0.025)";

    for (let y = 0; y < canvas.height; y += 4) {

        ctx.fillRect(0, y, canvas.width, 1);

    }

}


// ==================================================
// 6. DRAW PLAYER SPACESHIP
// ==================================================

function drawPlayer() {

    ctx.save();

    // Change spaceship color after collision

    const isDamaged = playerHitTimer > 0;

    const playerColor = isDamaged
        ? "#ff3864"
        : "#00e5ff";

    // Flash effect while temporarily invulnerable

    if (isDamaged && Math.floor(performance.now() / 90) % 2 === 0) {

        ctx.globalAlpha = 0.35;

    }

    ctx.shadowBlur = 20;
    ctx.shadowColor = playerColor;

    ctx.fillStyle = playerColor;

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y - player.height / 2
    );

    ctx.lineTo(
        player.x - player.width / 2,
        player.y + player.height / 2
    );

    ctx.lineTo(
        player.x + player.width / 2,
        player.y + player.height / 2
    );

    ctx.closePath();

    ctx.fill();


    // Spaceship cockpit

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y + 3,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}


// ==================================================
// 7. PLAYER MOVEMENT
// ==================================================

function updatePlayer() {

    if (
        keys["ArrowLeft"] ||
        keys["a"] ||
        keys["A"]
    ) {

        player.x -= player.speed;

    }

    if (
        keys["ArrowRight"] ||
        keys["d"] ||
        keys["D"]
    ) {

        player.x += player.speed;

    }


    // Keep player inside canvas

    player.x = Math.max(
        player.width / 2,
        Math.min(
            canvas.width - player.width / 2,
            player.x
        )
    );

}


// ==================================================
// 8. SHOOTING SYSTEM
// ==================================================

function shootBullet() {

    if (!canShoot || !gameRunning) {
        return;
    }

    bullets.push({

        x: player.x,
        y: player.y - 25,

        width: 5,
        height: 15,

        speed: 8

    });

    canShoot = false;

    setTimeout(() => {

        canShoot = true;

    }, shootCooldown);

}


// ==================================================
// 9. DRAW BULLETS
// ==================================================

function drawBullets() {

    bullets.forEach(bullet => {

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00e5ff";

        ctx.fillStyle = "#00e5ff";

        ctx.fillRect(
            bullet.x - bullet.width / 2,
            bullet.y,
            bullet.width,
            bullet.height
        );

        ctx.restore();

    });

}


// ==================================================
// 10. UPDATE BULLETS
// ==================================================

function updateBullets(deltaTime) {

    bullets.forEach(bullet => {

        bullet.y -=
            bullet.speed * deltaTime / 16.67;

    });

    bullets = bullets.filter(
        bullet => bullet.y > -20
    );

}


// ==================================================
// 11. CREATE ASTEROIDS
// ==================================================

function createAsteroid() {

    const size = Math.random() * 25 + 25;

    // Asteroid speed increases with difficulty

    const speedMultiplier =
        getAsteroidSpeedMultiplier();

    const asteroidSpeed =
        (Math.random() * 2 + 1.5) *
        speedMultiplier;

    asteroids.push({

        x: Math.random() *
            (canvas.width - size) + size / 2,

        y: -size,

        size: size,

        speed: asteroidSpeed

    });

}


// ==================================================
// 12. DRAW ASTEROIDS
// ==================================================

function drawAsteroids() {

    asteroids.forEach(asteroid => {

        ctx.save();

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff3864";

        ctx.fillStyle = "#ff3864";

        ctx.beginPath();

        ctx.arc(
            asteroid.x,
            asteroid.y,
            asteroid.size / 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

    });

}


// ==================================================
// 13. UPDATE ASTEROIDS
// ==================================================

function updateAsteroids(deltaTime) {

    asteroids.forEach(asteroid => {

        asteroid.y +=
            asteroid.speed * deltaTime / 16.67;

    });

    asteroids = asteroids.filter(
        asteroid =>
            asteroid.y < canvas.height + asteroid.size
    );

}


// ==================================================
// 14. COLLISION DETECTION
// ==================================================

function checkCollision(a, b) {

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y

    );

}


// ==================================================
// 15. BULLET AND ASTEROID COLLISIONS
// ==================================================

function checkBulletCollisions() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        const bulletBox = {

            x: bullet.x - bullet.width / 2,
            y: bullet.y,

            width: bullet.width,
            height: bullet.height

        };


        for (
            let j = asteroids.length - 1;
            j >= 0;
            j--
        ) {

            const asteroid = asteroids[j];

            const asteroidBox = {

                x: asteroid.x - asteroid.size / 2,
                y: asteroid.y - asteroid.size / 2,

                width: asteroid.size,
                height: asteroid.size

            };


            if (
                checkCollision(
                    bulletBox,
                    asteroidBox
                )
            ) {

                bullets.splice(i, 1);
                asteroids.splice(j, 1);

                score += 10;

                scoreDisplay.textContent = score;

                break;

            }

        }

    }

}


// ==================================================
// 16. PLAYER AND ASTEROID COLLISIONS
// ==================================================

function checkPlayerCollisions() {

    // Prevent repeated damage during the flash effect

    if (playerHitTimer > 0) {
        return;
    }

    const playerBox = {

        x: player.x - player.width / 2,
        y: player.y - player.height / 2,

        width: player.width,
        height: player.height

    };


    for (
        let i = asteroids.length - 1;
        i >= 0;
        i--
    ) {

        const asteroid = asteroids[i];

        const asteroidBox = {

            x: asteroid.x - asteroid.size / 2,
            y: asteroid.y - asteroid.size / 2,

            width: asteroid.size,
            height: asteroid.size

        };


        if (
            checkCollision(
                playerBox,
                asteroidBox
            )
        ) {

            asteroids.splice(i, 1);

            // Activate collision damage effect

            playerHitTimer =
                playerInvulnerabilityDuration;

            // Decrease one life

            lives--;

            livesDisplay.textContent = lives;

            if (lives <= 0) {

                endGame();
                return;

            }

            // Only one life lost per collision

            return;

        }

    }

}


// ==================================================
// 17. KEYBOARD CONTROLS
// ==================================================

document.addEventListener("keydown", function(event) {

    if (
        [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Space"
        ].includes(event.code)
    ) {

        event.preventDefault();

    }

    keys[event.key] = true;

    if (event.code === "Space") {

        shootBullet();

    }

});


document.addEventListener("keyup", function(event) {

    keys[event.key] = false;

});


// ==================================================
// 18. MAIN GAME LOOP
// ==================================================

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }


    // Calculate frame time

    const deltaTime = Math.min(
        timestamp - lastTime,
        50
    );

    lastTime = timestamp;


    // Update player

    updatePlayer();


    // Update collision flash timer

    if (playerHitTimer > 0) {

        playerHitTimer = Math.max(
            0,
            playerHitTimer - deltaTime
        );

    }


    // Generate asteroids using current difficulty

    asteroidTimer += deltaTime;

    if (asteroidTimer >= getAsteroidInterval()) {

        createAsteroid();

        asteroidTimer = 0;

    }


    // Update objects

    updateBullets(deltaTime);
    updateAsteroids(deltaTime);


    // Check collisions

    checkBulletCollisions();
    checkPlayerCollisions();


    if (!gameRunning) {
        return;
    }


    // Draw everything

    drawBackground(deltaTime);

    drawPlayer();

    drawBullets();

    drawAsteroids();


    // Repeat animation

    animationId = requestAnimationFrame(gameLoop);

}


// ==================================================
// 19. START GAME
// ==================================================

function startGame() {

    if (animationId !== null) {

        cancelAnimationFrame(animationId);

    }


    // Reset game values

    score = 0;
    lives = 3;

    bullets = [];
    asteroids = [];

    asteroidTimer = 0;

    canShoot = true;

    playerHitTimer = 0;


    // Reset player

    player.x = canvas.width / 2;
    player.y = canvas.height - 60;


    // Reset keyboard

    Object.keys(keys).forEach(key => {

        keys[key] = false;

    });


    // Create fresh stars

    createStars();


    // Update scoreboard

    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;


    // Change screens

    mainMenu.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");


    // Start gameplay

    gameRunning = true;

    lastTime = performance.now();


    // Start background music

    if (backgroundMusic) {

        backgroundMusic.currentTime = 0;

        backgroundMusic.play().catch(error => {

            console.log(
                "Background music could not start:",
                error
            );

        });

    }


    // Draw first frame

    drawBackground(0);
    drawPlayer();
    drawBullets();
    drawAsteroids();


    // Begin animation

    animationId = requestAnimationFrame(gameLoop);

}


// ==================================================
// 20. GAME OVER
// ==================================================

function endGame() {

    gameRunning = false;

    if (animationId !== null) {

        cancelAnimationFrame(animationId);

        animationId = null;

    }


    // Stop background music

    if (backgroundMusic) {

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

    }


    finalScoreDisplay.textContent = score;

    gameScreen.classList.add("hidden");

    gameOverScreen.classList.remove("hidden");

}


// ==================================================
// 21. BUTTON EVENT LISTENERS
// ==================================================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


// ==================================================
// 22. INITIALIZE GAME
// ==================================================

createStars();

console.log("SPACE DEFENDER loaded successfully!");

