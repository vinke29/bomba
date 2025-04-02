// Bomba Game v1.1 - Force cache refresh
// Game constants
const GRAVITY = 0.5;
const CANNON_LENGTH = 50;
const HOTEL_WIDTH = 300;
const HOTEL_HEIGHT = 400;
const HOTEL_ROOMS = 20; // 4 rows, 5 columns
const HILL_HEIGHT = 100;

// Game state
let gameState = {
    level: 1,
    score: 0,
    canFire: true,
    inProgress: false,
    projectile: null,
    particles: [],
    enemyProjectiles: [],
    targetRoom: Math.floor(Math.random() * HOTEL_ROOMS),
    hotelDamage: new Array(HOTEL_ROOMS).fill(false)
};

// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const angleSlider = document.getElementById('angle');
const powerSlider = document.getElementById('power');
const angleValue = document.getElementById('angle-value');
const powerValue = document.getElementById('power-value');
const fireButton = document.getElementById('fire-button');
const levelDisplay = document.getElementById('level');
const targetDisplay = document.getElementById('target-description');
const messageBox = document.getElementById('message-box');
const scoreDisplay = document.getElementById('score');

// Initialize the game
function init() {
    console.log("Game initializing...");
    
    // Set initial displays
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    const row = Math.floor(gameState.targetRoom / 5) + 1;
    const col = (gameState.targetRoom % 5) + 1;
    targetDisplay.textContent = `Target: Room ${row}-${col}`;
    
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
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    console.log("Game initialized, canFire =", gameState.canFire);
}

// Reset game state
function resetGameState() {
    console.log("Resetting game state");
    const currentLevel = gameState.level;
    const currentScore = gameState.score;
    const currentTargetRoom = gameState.targetRoom;
    
    // Reset the game state while preserving progress
    gameState = {
        level: currentLevel,
        score: currentScore,
        canFire: true,
        inProgress: false,
        projectile: null,
        particles: [],
        enemyProjectiles: [],
        targetRoom: currentTargetRoom,
        hotelDamage: new Array(HOTEL_ROOMS).fill(false)
    };
    
    // Update displays
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    
    // Update target room display
    const row = Math.floor(gameState.targetRoom / 5) + 1;
    const col = (gameState.targetRoom % 5) + 1;
    targetDisplay.textContent = `Target: Room ${row}-${col}`;
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

// Draw the hill
function drawHill() {
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height - HILL_HEIGHT);
    ctx.quadraticCurveTo(100, canvas.height - HILL_HEIGHT - 20, 200, canvas.height - HILL_HEIGHT / 2);
    ctx.lineTo(200, canvas.height);
    ctx.fill();
}

// Draw the hotel
function drawHotel() {
    const hotelX = canvas.width - HOTEL_WIDTH - 50;
    const hotelY = canvas.height - HOTEL_HEIGHT - 20;
    
    // Draw main building
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(hotelX, hotelY, HOTEL_WIDTH, HOTEL_HEIGHT);
    
    // Draw rooms
    const roomWidth = HOTEL_WIDTH / 5;
    const roomHeight = HOTEL_HEIGHT / 4;
    
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
        }
    }
}

// Draw the ground
function drawGround() {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
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
        
        if (x > canvas.width || y > canvas.height) break;
        
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
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
    
    // Only reset projectile state, keep hotel damage
    gameState.inProgress = false;
    gameState.projectile = null;
    gameState.canFire = true;
}

// Handle a hit
function handleHit() {
    console.log("Target room hit! Moving to next level!");
    
    // Increment level and score
    gameState.level += 1;
    gameState.score += 100;
    
    // Create victory explosion particles
    for (let i = 0; i < 50; i++) {
        gameState.particles.push(createParticle(
            gameState.projectile.x,
            gameState.projectile.y,
            'rgba(255, 255, 0, 0.7)', // Yellow explosion for target hit
            3 + Math.random() * 5,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            50 + Math.random() * 30
        ));
    }
    
    // Update displays
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    
    // Show level up message with z-index and styling
    messageBox.style.zIndex = '1000';
    messageBox.style.position = 'absolute';
    messageBox.style.top = '50%';
    messageBox.style.left = '50%';
    messageBox.style.transform = 'translate(-50%, -50%)';
    messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    messageBox.style.color = '#fff';
    messageBox.style.padding = '20px';
    messageBox.style.borderRadius = '10px';
    messageBox.style.fontSize = '24px';
    messageBox.textContent = `Level ${gameState.level}! Target eliminated! Find the next target!`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 2000);
    
    // Reset hotel damage and select new target
    gameState.hotelDamage = new Array(HOTEL_ROOMS).fill(false);
    gameState.targetRoom = Math.floor(Math.random() * HOTEL_ROOMS);
    
    // Update target room display
    const row = Math.floor(gameState.targetRoom / 5) + 1;
    const col = (gameState.targetRoom % 5) + 1;
    targetDisplay.textContent = `Target: Room ${row}-${col}`;
    
    // Reset projectile state
    gameState.inProgress = false;
    gameState.projectile = null;
    gameState.canFire = true;
}

// Check collision with hotel
function checkHotelCollision() {
    if (!gameState.projectile) return false;
    
    const hotelX = canvas.width - HOTEL_WIDTH - 50;
    const hotelY = canvas.height - HOTEL_HEIGHT - 20;
    const roomWidth = HOTEL_WIDTH / 5;
    const roomHeight = HOTEL_HEIGHT / 4;
    
    // Check if projectile is within hotel bounds
    if (gameState.projectile.x >= hotelX && 
        gameState.projectile.x <= hotelX + HOTEL_WIDTH &&
        gameState.projectile.y >= hotelY && 
        gameState.projectile.y <= hotelY + HOTEL_HEIGHT) {
        
        // Calculate which room was hit
        const col = Math.floor((gameState.projectile.x - hotelX) / roomWidth);
        const row = Math.floor((gameState.projectile.y - hotelY) / roomHeight);
        const roomIndex = row * 5 + col;
        
        if (roomIndex >= 0 && roomIndex < HOTEL_ROOMS && !gameState.hotelDamage[roomIndex]) {
            // Check if target room was hit BEFORE marking as damaged
            if (roomIndex === gameState.targetRoom) {
                handleHit();
            } else {
                // Only mark as damaged if it wasn't the target room
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
                
                handleMiss();
            }
            return true; // Collision occurred
        }
    }
    return false; // No collision
}

// Update the projectile position
function updateProjectile() {
    if (!gameState.projectile) return;
    
    // Update position
    gameState.projectile.x += gameState.projectile.velocityX;
    gameState.projectile.y += gameState.projectile.velocityY;
    
    // Apply gravity
    gameState.projectile.velocityY += GRAVITY;
    
    // Create trail effect
    if (Math.random() > 0.7) {
        gameState.particles.push(createParticle(
            gameState.projectile.x,
            gameState.projectile.y,
            'rgba(255, 100, 100, 0.5)',
            4 + Math.random() * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            20 + Math.random() * 10
        ));
    }
    
    // Check for collisions with hotel
    const hotelX = canvas.width - HOTEL_WIDTH - 50;
    const hotelY = canvas.height - HOTEL_HEIGHT - 20;
    const roomWidth = HOTEL_WIDTH / 5;
    const roomHeight = HOTEL_HEIGHT / 4;
    
    // Check if projectile is within hotel bounds
    if (gameState.projectile.x >= hotelX && 
        gameState.projectile.x <= hotelX + HOTEL_WIDTH &&
        gameState.projectile.y >= hotelY && 
        gameState.projectile.y <= hotelY + HOTEL_HEIGHT) {
        
        // Calculate which room was hit
        const col = Math.floor((gameState.projectile.x - hotelX) / roomWidth);
        const row = Math.floor((gameState.projectile.y - hotelY) / roomHeight);
        const roomIndex = row * 5 + col;
        
        console.log("Hit room:", roomIndex, "Target room:", gameState.targetRoom);
        
        if (roomIndex >= 0 && roomIndex < HOTEL_ROOMS) {
            if (roomIndex === gameState.targetRoom) {
                // Target room hit!
                console.log("TARGET ROOM HIT! Level up!");
                
                // Increment level and score
                gameState.level += 1;
                gameState.score += 100;
                
                // Update displays
                levelDisplay.textContent = gameState.level;
                scoreDisplay.textContent = gameState.score;
                
                // Create victory explosion
                for (let i = 0; i < 50; i++) {
                    gameState.particles.push(createParticle(
                        gameState.projectile.x,
                        gameState.projectile.y,
                        'rgba(255, 255, 0, 0.7)',
                        3 + Math.random() * 5,
                        (Math.random() - 0.5) * 8,
                        (Math.random() - 0.5) * 8,
                        50 + Math.random() * 30
                    ));
                }
                
                // Show success message
                messageBox.style.zIndex = '1000';
                messageBox.style.position = 'absolute';
                messageBox.style.top = '50%';
                messageBox.style.left = '50%';
                messageBox.style.transform = 'translate(-50%, -50%)';
                messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                messageBox.style.color = '#fff';
                messageBox.style.padding = '20px';
                messageBox.style.borderRadius = '10px';
                messageBox.style.fontSize = '24px';
                messageBox.textContent = `Level ${gameState.level}! Target eliminated! Find the next target!`;
                messageBox.style.display = 'block';
                
                setTimeout(() => {
                    messageBox.style.display = 'none';
                }, 2000);
                
                // Reset hotel and select new target
                gameState.hotelDamage = new Array(HOTEL_ROOMS).fill(false);
                gameState.targetRoom = Math.floor(Math.random() * HOTEL_ROOMS);
                
                // Update target display
                const newRow = Math.floor(gameState.targetRoom / 5) + 1;
                const newCol = (gameState.targetRoom % 5) + 1;
                targetDisplay.textContent = `Target: Room ${newRow}-${newCol}`;
            } else {
                // Hit a non-target room
                gameState.hotelDamage[roomIndex] = true;
                
                // Create explosion
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
            }
            
            // Reset projectile state
            gameState.projectile = null;
            gameState.inProgress = false;
            gameState.canFire = true;
            return;
        }
    }
    
    // Check if projectile is out of bounds
    if (gameState.projectile.x > canvas.width || 
        gameState.projectile.x < 0 || 
        gameState.projectile.y > canvas.height) {
        gameState.projectile = null;
        gameState.inProgress = false;
        gameState.canFire = true;
    }
}

// Draw the entire scene
function drawScene() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw elements
    drawGround();
    drawHill();
    drawHotel();
    drawTrajectoryGuide();
    drawCannon();
    drawEnemyProjectiles();
    drawParticles();
    
    if (gameState.projectile) {
        drawProjectile();
    }
}

// Game loop
function gameLoop() {
    // Update projectiles
    if (gameState.inProgress && gameState.projectile) {
        updateProjectile();
    }
    updateEnemyProjectiles();
    
    // Update particles
    updateParticles();
    
    // Draw everything
    drawScene();
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Start the game when loaded
window.addEventListener('load', init); 