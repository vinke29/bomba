// Bomba Game v1.1 - Force cache refresh
// Game constants
const GRAVITY = 0.5;
const CANNON_LENGTH = 50;
const BASE_HOTEL_WIDTH = 300;
const BASE_HOTEL_HEIGHT = 400;
const BASE_HOTEL_ROOMS = 20; // 4 rows, 5 columns
const HILL_HEIGHT = 100;

// Level-specific obstacles
const OBSTACLES = {
    static: {
        x: 400,
        y: 200,
        width: 40,
        height: 150
    },
    moving: {
        x: 350,
        y: 200,
        width: 50,
        height: 50,
        direction: 1,
        speed: 2
    }
};

// Game state
let gameState = {
    level: 1,
    score: 0,
    canFire: true,
    inProgress: false,
    projectile: null,
    particles: [],
    enemyProjectiles: [],
    targetRoom: Math.floor(Math.random() * BASE_HOTEL_ROOMS),
    hotelDamage: new Array(BASE_HOTEL_ROOMS).fill(false),
    wind: 0,
    attempts: 5
};

// DOM Elements
let canvas, ctx, angleSlider, powerSlider, angleValue, powerValue, fireButton, levelDisplay, targetDisplay, messageBox, scoreDisplay, attemptsDisplay;

// Initialize the game
function init() {
    console.log("Game initializing...");
    
    // Initialize DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    angleSlider = document.getElementById('angle');
    powerSlider = document.getElementById('power');
    angleValue = document.getElementById('angle-value');
    powerValue = document.getElementById('power-value');
    fireButton = document.getElementById('fire-button');
    levelDisplay = document.getElementById('level');
    targetDisplay = document.getElementById('target-description');
    messageBox = document.getElementById('message-box');
    scoreDisplay = document.getElementById('score');
    attemptsDisplay = document.getElementById('attempts');
    
    if (!canvas || !ctx) {
        console.error("Canvas or context not initialized!");
        return;
    }
    
    // Reset game state
    resetGameState();
    
    // Set up event listeners
    angleSlider.addEventListener('input', updateAngle);
    powerSlider.addEventListener('input', updatePower);
    
    // Ensure the fire button event listener is properly attached
    if (fireButton) {
        console.log("Fire button found in DOM");
        fireButton.addEventListener('click', function() {
            console.log("Fire button click direct handler");
            fireProjectile();
        });
    } else {
        console.error("Fire button not found in DOM!");
    }
    
    // Add keyboard support (spacebar to fire)
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' || event.key === ' ') {
            console.log("Space key pressed for firing");
            fireProjectile();
            event.preventDefault();
        }
    });
    
    // Initialize wind
    updateWind();
    
    // Draw initial scene
    drawScene();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    console.log("Game initialized, canFire =", gameState.canFire);
}

// Reset game state
function resetGameState() {
    console.log("Resetting game state");
    gameState.canFire = true;
    gameState.inProgress = false;
    gameState.projectile = null;
    gameState.particles = [];
    gameState.enemyProjectiles = [];
    gameState.attempts = 5; // Reset attempts
    updateAttemptsDisplay();
}

// Update the angle display
function updateAngle() {
    const angle = angleSlider.value;
    angleValue.textContent = angle;
    drawScene();
}

// Update the power display
function updatePower() {
    const power = powerSlider.value;
    powerValue.textContent = power;
    drawScene();
}

// Fire the projectile
function fireProjectile() {
    console.log("Fire button clicked!", gameState.canFire, gameState.inProgress);
    
    if (!gameState.canFire || gameState.inProgress) {
        console.log("Cannot fire right now - canFire is", gameState.canFire, "inProgress is", gameState.inProgress);
        return;
    }
    
    const angle = angleSlider.value * (Math.PI / 180);
    const power = powerSlider.value / 5;
    
    // Set initial projectile position
    gameState.projectile = {
        x: 50,
        y: canvas.height - 50 - HILL_HEIGHT,
        velocityX: Math.cos(angle) * power * 5,
        velocityY: -Math.sin(angle) * power * 5
    };
    
    gameState.canFire = false;
    gameState.inProgress = true;
    
    console.log("Projectile fired!", gameState.projectile);
}

// Draw enemy projectiles
function drawEnemyProjectiles() {
    for (const proj of gameState.enemyProjectiles) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Update enemy projectiles
function updateEnemyProjectiles() {
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = gameState.enemyProjectiles[i];
        
        // Update position
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;
        proj.velocityY += GRAVITY;
        
        // Remove if out of bounds
        if (proj.x < 0 || proj.x > canvas.width || proj.y > canvas.height) {
            gameState.enemyProjectiles.splice(i, 1);
        }
    }
}

// Draw the cannon
function drawCannon() {
    const angle = angleSlider.value * (Math.PI / 180);
    const cannonX = 50;
    const cannonY = canvas.height - 50 - HILL_HEIGHT;
    
    // Draw cannon base
    ctx.fillStyle = 'darkgray';
    ctx.beginPath();
    ctx.arc(cannonX, cannonY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cannon barrel
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cannonX, cannonY);
    ctx.lineTo(
        cannonX + Math.cos(angle) * CANNON_LENGTH,
        cannonY - Math.sin(angle) * CANNON_LENGTH
    );
    ctx.stroke();
}

// Draw the projectile
function drawProjectile() {
    if (!gameState.projectile) return;
    
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(gameState.projectile.x, gameState.projectile.y, 8, 0, Math.PI * 2);
    ctx.fill();
}

// Draw the hill based on level
function drawHill() {
    if (gameState.level >= 3) {
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, canvas.height - HILL_HEIGHT);
        ctx.quadraticCurveTo(100, canvas.height - HILL_HEIGHT - 50, 200, canvas.height - HILL_HEIGHT / 2);
        ctx.quadraticCurveTo(300, canvas.height - HILL_HEIGHT + 30, 400, canvas.height - HILL_HEIGHT * 0.7);
        ctx.lineTo(400, canvas.height);
        ctx.fill();
    }
}

// Draw obstacles based on level
function drawObstacles() {
    if (gameState.level >= 5) {
        // Static obstacle
        ctx.fillStyle = '#555';
        ctx.fillRect(
            OBSTACLES.static.x,
            OBSTACLES.static.y,
            OBSTACLES.static.width,
            OBSTACLES.static.height
        );
    }
    
    if (gameState.level >= 6) {
        // Moving obstacle
        ctx.fillStyle = '#777';
        OBSTACLES.moving.y += OBSTACLES.moving.direction * OBSTACLES.moving.speed;
        
        // Bounce the obstacle when it hits boundaries
        if (OBSTACLES.moving.y > canvas.height - 100 || OBSTACLES.moving.y < 100) {
            OBSTACLES.moving.direction *= -1;
        }
        
        ctx.fillRect(
            OBSTACLES.moving.x,
            OBSTACLES.moving.y,
            OBSTACLES.moving.width,
            OBSTACLES.moving.height
        );
    }
}

// Draw the hotel
function drawHotel() {
    const { width: hotelWidth, height: hotelHeight } = getHotelDimensions();
    const hotelX = canvas.width - hotelWidth - 50;
    const hotelY = canvas.height - hotelHeight - 20;
    
    // Draw main building
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(hotelX, hotelY, hotelWidth, hotelHeight);
    
    // Draw rooms
    const roomWidth = hotelWidth / 5;
    const roomHeight = hotelHeight / 4;
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            const roomIndex = row * 5 + col;
            const roomX = hotelX + col * roomWidth;
            const roomY = hotelY + row * roomHeight;
            
            // Skip drawing damaged rooms
            if (gameState.hotelDamage[roomIndex]) continue;
            
            // Draw room background
            ctx.fillStyle = roomIndex === gameState.targetRoom ? '#FF6B6B' : '#FFFFFF';
            ctx.fillRect(roomX + 5, roomY + 5, roomWidth - 10, roomHeight - 10);
            
            // Draw window frame
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(roomX + 5, roomY + 5, roomWidth - 10, roomHeight - 10);
            
            // Draw evil businessman in target room
            if (roomIndex === gameState.targetRoom) {
                drawEvilBusinessman(roomX + 10, roomY + 10, roomWidth - 20, roomHeight - 20);
            }
        }
    }
}

// Draw the ground
function drawGround() {
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

// Draw the trajectory guide
function drawTrajectoryGuide() {
    if (gameState.inProgress) return;
    
    const angle = angleSlider.value * (Math.PI / 180);
    const power = powerSlider.value / 5;
    const cannonX = 50;
    const cannonY = canvas.height - 50 - HILL_HEIGHT;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cannonX, cannonY);
    
    let x = cannonX;
    let y = cannonY;
    let vx = Math.cos(angle) * power * 5;
    let vy = -Math.sin(angle) * power * 5;
    
    for (let t = 0; t < 50; t++) {
        x += vx;
        y += vy;
        vy += GRAVITY;
        vx += gameState.wind; // Add wind effect to trajectory guide
        
        if (x > canvas.width || y > canvas.height) break;
        
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // Draw wind indicator
    drawWind();
}

// Draw particles
function drawParticles() {
    for (const particle of gameState.particles) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Update particles
function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += GRAVITY * 0.1;
        particle.life--;
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Create a particle
function createParticle(x, y, color, radius, vx, vy, life) {
    return {
        x: x,
        y: y,
        color: color,
        radius: radius,
        velocityX: vx,
        velocityY: vy,
        life: life
    };
}

// Add after the createParticle function
function createFirework(x, y) {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = 3 + Math.random() * 2;
        gameState.particles.push(createParticle(
            x,
            y,
            color,
            2 + Math.random() * 2,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            40 + Math.random() * 20
        ));
    }
}

// Check collisions with obstacles and hotel
function checkCollisions() {
    if (!gameState.projectile) return false;
    
    // Check hotel collision first
    if (checkHotelCollision()) {
        return true;
    }
    
    // Level 5: Check static obstacle collision
    if (gameState.level >= 5) {
        if (checkObstacleCollision(OBSTACLES.static)) {
            handleMiss();
            return true;
        }
    }
    
    // Level 6: Check moving obstacle collision
    if (gameState.level >= 6) {
        if (checkObstacleCollision(OBSTACLES.moving)) {
            handleMiss();
            return true;
        }
    }
    
    return false;
}

// Update projectile physics
function updateProjectile() {
    if (!gameState.projectile || !gameState.inProgress) return;
    
    // Apply wind effect based on level
    if (gameState.level >= 2) {
        gameState.projectile.velocityX += gameState.wind;
    }
    
    gameState.projectile.x += gameState.projectile.velocityX;
    gameState.projectile.y += gameState.projectile.velocityY;
    gameState.projectile.velocityY += GRAVITY;
    
    // Check for collisions
    if (checkCollisions()) {
        return;
    }
    
    // Check if projectile is out of bounds
    if (gameState.projectile.y > canvas.height || 
        gameState.projectile.x < 0 || 
        gameState.projectile.x > canvas.width) {
        handleMiss();
    }
}

// Handle a miss
function handleMiss() {
    console.log("Handling miss");
    
    if (gameState.projectile) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            gameState.particles.push(createParticle(
                gameState.projectile.x,
                gameState.projectile.y,
                'rgba(255, 100, 100, 0.7)',
                3 + Math.random() * 3,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                30 + Math.random() * 20
            ));
        }
    }
    
    // Decrease attempts
    gameState.attempts--;
    console.log("Attempts remaining:", gameState.attempts);
    updateAttemptsDisplay();
    
    // Check if game over (no more attempts in this level)
    if (gameState.attempts <= 0) {
        console.log("No more attempts, game over!");
        gameOver();
        return;
    }
    
    // Reset for next shot
    gameState.inProgress = false;
    gameState.projectile = null;
    gameState.canFire = true;
}

// Draw the entire scene
function drawScene() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background elements first
    drawGround();
    drawHill();
    drawObstacles();
    
    // Draw game elements
    drawHotel();
    drawCannon();
    drawProjectile();
    drawParticles();
    drawEnemyProjectiles();
    
    // Draw UI elements
    if (!gameState.inProgress) {
        drawTrajectoryGuide();
    }
    drawWind();
}

// Main game loop
function gameLoop() {
    drawScene();
    
    // Update game state
    if (gameState.inProgress) {
        updateProjectile();
    }
    
    updateParticles();
    updateEnemyProjectiles();
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the window loads
window.addEventListener('load', init);

// Add after the init function
function updateWind() {
    if (gameState.level >= 2) {
        // Add random wind effect
        gameState.wind = Math.sin(Date.now() / 1000) * 0.2;
    } else {
        gameState.wind = 0;
    }
}

// Add new function to update attempts display
function updateAttemptsDisplay() {
    if (attemptsDisplay) {
        attemptsDisplay.textContent = gameState.attempts;
        // Change color based on remaining attempts
        if (gameState.attempts <= 2) {
            attemptsDisplay.style.color = '#FF0000';
        } else if (gameState.attempts <= 3) {
            attemptsDisplay.style.color = '#FFA500';
        } else {
            attemptsDisplay.style.color = '#000000';
        }
    }
}

// Add game over function
function gameOver() {
    messageBox.textContent = "Game Over! Try again?";
    messageBox.style.display = "block";
    messageBox.style.fontSize = "24px";
    messageBox.style.color = "#FF0000";
    messageBox.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
    
    // Reset game after 2 seconds
    setTimeout(() => {
        // Reset all game state
        gameState = {
            level: 1,
            score: 0,
            canFire: true,
            inProgress: false,
            projectile: null,
            particles: [],
            enemyProjectiles: [],
            targetRoom: Math.floor(Math.random() * getHotelDimensions().rooms),
            hotelDamage: new Array(getHotelDimensions().rooms).fill(false),
            wind: 0,
            attempts: 5 // Reset attempts for level 1
        };
        
        // Update displays
        levelDisplay.textContent = gameState.level;
        scoreDisplay.textContent = gameState.score;
        updateAttemptsDisplay();
        
        // Reset wind
        updateWind();
        
        // Hide message box
        messageBox.style.display = "none";
        messageBox.style.fontSize = "";
        messageBox.style.color = "";
        messageBox.style.textShadow = "";
    }, 2000);
}

// Get level-specific hotel dimensions
function getHotelDimensions() {
    let width = BASE_HOTEL_WIDTH;
    let height = BASE_HOTEL_HEIGHT;
    let rooms = BASE_HOTEL_ROOMS;
    
    if (gameState.level >= 4) {
        // Make hotel smaller from level 4 onwards
        width *= 0.7;
        height *= 0.7;
    }
    
    return { width, height, rooms };
}

// Draw the evil businessman
function drawEvilBusinessman(x, y, width, height) {
    // Draw suit
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + width * 0.2, y + height * 0.3, width * 0.6, height * 0.6);
    
    // Draw tie
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.4, y + height * 0.3);
    ctx.lineTo(x + width * 0.5, y + height * 0.5);
    ctx.lineTo(x + width * 0.6, y + height * 0.3);
    ctx.fill();
    
    // Draw head
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.2, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw evil smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.2, width * 0.1, 0, Math.PI);
    ctx.stroke();
    
    // Draw evil eyes
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x + width * 0.4, y + height * 0.15, width * 0.03, 0, Math.PI * 2);
    ctx.arc(x + width * 0.6, y + height * 0.15, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
}

// Check collision with hotel
function checkHotelCollision() {
    if (!gameState.projectile) return false;
    
    const { width: hotelWidth, height: hotelHeight } = getHotelDimensions();
    const hotelX = canvas.width - hotelWidth - 50;
    const hotelY = canvas.height - hotelHeight - 20;
    
    // Check if projectile is within hotel bounds
    if (gameState.projectile.x >= hotelX && 
        gameState.projectile.x <= hotelX + hotelWidth &&
        gameState.projectile.y >= hotelY && 
        gameState.projectile.y <= hotelY + hotelHeight) {
        
        // Calculate which room was hit
        const col = Math.floor((gameState.projectile.x - hotelX) / (hotelWidth / 5));
        const row = Math.floor((gameState.projectile.y - hotelY) / (hotelHeight / 4));
        const roomIndex = row * 5 + col;
        
        if (roomIndex >= 0 && roomIndex < getHotelDimensions().rooms && !gameState.hotelDamage[roomIndex]) {
            // Mark room as damaged
            gameState.hotelDamage[roomIndex] = true;
            
            // Create explosion particles
            for (let i = 0; i < 30; i++) {
                gameState.particles.push(createParticle(
                    gameState.projectile.x,
                    gameState.projectile.y,
                    'rgba(255, 100, 100, 0.7)',
                    3 + Math.random() * 3,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    30 + Math.random() * 20
                ));
            }
            
            // Check if target room was hit
            if (roomIndex === gameState.targetRoom) {
                handleHit();
            } else {
                handleMiss();
            }
            return true;
        }
    }
    return false;
}

// Check collisions with obstacles and hotel
function checkObstacleCollision(obstacle) {
    return gameState.projectile.x > obstacle.x &&
           gameState.projectile.x < obstacle.x + obstacle.width &&
           gameState.projectile.y > obstacle.y &&
           gameState.projectile.y < obstacle.y + obstacle.height;
}

// Handle a hit
function handleHit() {
    console.log("Target room hit!");
    gameState.score += 100;
    scoreDisplay.textContent = gameState.score;
    
    // Show victory message with animation
    messageBox.textContent = "🎉 Hooray! Target Hit! 🎉";
    messageBox.style.display = "block";
    messageBox.style.fontSize = "24px";
    messageBox.style.color = "#FFD700";
    messageBox.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
    
    // Create fireworks
    const hotelX = canvas.width - getHotelDimensions().width - 50;
    const hotelY = canvas.height - getHotelDimensions().height - 20;
    const roomWidth = getHotelDimensions().width / 5;
    const roomHeight = getHotelDimensions().height / 4;
    const targetCol = gameState.targetRoom % 5;
    const targetRow = Math.floor(gameState.targetRoom / 5);
    const targetX = hotelX + targetCol * roomWidth + roomWidth/2;
    const targetY = hotelY + targetRow * roomHeight + roomHeight/2;
    
    // Create multiple fireworks
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFirework(targetX, targetY);
        }, i * 200);
    }
    
    // Increment level and update display immediately
    gameState.level++;
    levelDisplay.textContent = gameState.level;
    console.log("Level increased to:", gameState.level);
    
    // Update wind for next level
    updateWind();
    
    // Reset attempts for new level
    gameState.attempts = 5;
    console.log("Attempts reset to 5 for new level");
    updateAttemptsDisplay();
    
    // Wait 2 seconds before transitioning to next level
    setTimeout(() => {
        // Reset hotel damage for next level
        gameState.hotelDamage = new Array(getHotelDimensions().rooms).fill(false);
        gameState.targetRoom = Math.floor(Math.random() * getHotelDimensions().rooms);
        
        // Ensure attempts are still 5
        gameState.attempts = 5;
        updateAttemptsDisplay();
        
        // Hide victory message
        messageBox.style.display = "none";
        messageBox.style.fontSize = "";
        messageBox.style.color = "";
        messageBox.style.textShadow = "";
        
        // Reset game state
        gameState.inProgress = false;
        gameState.projectile = null;
        gameState.canFire = true;
        
        // Force a redraw of the scene
        drawScene();
    }, 2000);
}

// Draw wind indicator
function drawWind() {
    if (gameState.level >= 2 && gameState.wind !== 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        const windStrength = Math.abs(gameState.wind);
        const windDirection = gameState.wind > 0 ? '→' : '←';
        const arrows = ''.padStart(Math.ceil(windStrength * 10), windDirection);
        ctx.fillText(`Wind: ${arrows}`, 10, 30);
    }
} 