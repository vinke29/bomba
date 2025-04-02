// Game constants
const GRAVITY = 0.1;
const ROOM_WIDTH = 40;
const ROOM_HEIGHT = 30;
const CANNON_LENGTH = 50;
const SHOW_TRAJECTORY = false; // Set to false to hide trajectory line

// Game state
let gameState = {
    level: 1,
    lives: 3,
    score: 0,
    canFire: true,
    inProgress: false,
    windSpeed: 0, // Wind affects projectile
    gameTime: 0, // Time counter for animations
    powerups: [], // Available powerups
    activePowerup: null, // Currently active powerup
    targets: [
        { name: "Evil Businessman", level: 1, points: 100, image: '💼', behavior: "static" },
        { name: "Corrupt Politician", level: 2, points: 200, image: '🎩', behavior: "moving" },
        { name: "Drug Lord", level: 3, points: 300, image: '💊', behavior: "hiding" },
        { name: "Mafia Boss", level: 4, points: 400, image: '🔫', behavior: "shooting" },
        { name: "Terrorist Leader", level: 5, points: 500, image: '💣', behavior: "explosive" }
    ],
    hotels: [
        { floors: 5, roomsPerFloor: 6, color: "#f1c40f", name: "Golden Sands Hotel" },
        { floors: 6, roomsPerFloor: 7, color: "#e67e22", name: "Copper Mountain Resort" },
        { floors: 7, roomsPerFloor: 8, color: "#3498db", name: "Azure Towers" },
        { floors: 8, roomsPerFloor: 8, color: "#9b59b6", name: "Royal Heights" },
        { floors: 10, roomsPerFloor: 10, color: "#2ecc71", name: "Emerald Skyscraper" }
    ],
    targetRoom: { floor: 0, room: 0 },
    projectile: { x: 0, y: 0, velocityX: 0, velocityY: 0 },
    hotelPosition: { x: 0, y: 0 },
    particles: [], // For explosion effects
    combo: 0, // Consecutive hits
    comboTimer: 0,
    enemyProjectiles: [] // Projectiles from enemies that shoot back
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
const livesDisplay = document.getElementById('lives');
const messageBox = document.getElementById('message-box');
const scoreDisplay = document.getElementById('score');

// Initialize the game
function init() {
    console.log("Game initializing..."); // Debug log
    
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
            event.preventDefault(); // Prevent page scrolling
        }
    });
    
    // Initialize the first level
    setupLevel(gameState.level);
    
    // Explicitly set the canFire flag
    gameState.canFire = true;
    
    // Spawn a powerup periodically
    setInterval(spawnRandomPowerup, 10000);
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    console.log("Game initialized, canFire =", gameState.canFire); // Debug log
}

// Update the angle display
function updateAngle() {
    const angle = angleSlider.value;
    angleValue.textContent = angle;
    drawScene(); // Redraw to update trajectory guide
}

// Update the power display
function updatePower() {
    const power = powerSlider.value;
    powerValue.textContent = power;
    drawScene(); // Redraw to update trajectory guide
}

// Setup a new level
function setupLevel(level) {
    if (level > gameState.targets.length) {
        showMessage(`CONGRATULATIONS! You completed all levels with a score of ${gameState.score}!`, true);
        return;
    }
    
    gameState.level = level;
    levelDisplay.textContent = level;
    targetDisplay.textContent = gameState.targets[level - 1].name;
    
    const hotel = gameState.hotels[level - 1];
    
    // Set wind for this level (gets stronger in higher levels)
    gameState.windSpeed = (Math.random() * 0.2 - 0.1) * level;
    
    // Clear enemy projectiles
    gameState.enemyProjectiles = [];
    
    // Always set the target room to be the first room (leftmost) on a random floor
    const randomFloor = Math.floor(Math.random() * hotel.floors);
    gameState.targetRoom = { floor: randomFloor, room: 0, 
                            offset: 0, // For moving targets
                            visible: true, // For hiding targets
                            lastShotTime: 0 // For shooting targets
                           }; 
    
    // Reset game state
    gameState.canFire = true;
    gameState.inProgress = false;
    gameState.particles = [];
    
    // Show level intro
    showLevelIntro(level);
    
    // Draw the scene
    drawScene();
}

// Show level intro
function showLevelIntro(level) {
    const target = gameState.targets[level - 1];
    const hotel = gameState.hotels[level - 1];
    
    // Show an intro message
    showMessage(`LEVEL ${level}: Target ${target.name} at ${hotel.name}!`, false);
    
    setTimeout(() => {
        hideMessage();
    }, 2000);
}

// Spawn a random powerup somewhere in the game
function spawnRandomPowerup() {
    if (gameState.powerups.length >= 2) return; // Maximum 2 powerups at once
    
    const powerupTypes = [
        { type: "slowmo", icon: "⏱️", color: "#3498db", effect: "Slows down time" },
        { type: "triple", icon: "🎯", color: "#e74c3c", effect: "Triple shot" },
        { type: "shield", icon: "🛡️", color: "#f1c40f", effect: "Protects from one miss" }
    ];
    
    const powerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    // Position somewhere in the playfield
    const x = 100 + Math.random() * (canvas.width - 400);
    const y = 100 + Math.random() * (canvas.height - 300);
    
    gameState.powerups.push({
        ...powerup,
        x: x,
        y: y,
        radius: 15,
        bounceOffset: 0,
        collected: false
    });
    
    // Create a notice effect
    createFloatingText(`New Powerup!`, x, y - 30, '#ffffff');
    console.log("Spawned powerup:", powerup.type);
}

// Activate a powerup
function activatePowerup(powerup) {
    console.log("Activating powerup:", powerup.type);
    
    gameState.activePowerup = {
        ...powerup,
        duration: 10000, // 10 seconds
        startTime: Date.now()
    };
    
    // Create a notice
    createFloatingText(`${powerup.effect} activated!`, canvas.width/2, 100, '#ffcc00');
    
    // Visual effect
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        
        gameState.particles.push(
            createParticle(
                powerup.x, 
                powerup.y, 
                powerup.color, 
                3 + Math.random() * 3, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                50 + Math.random() * 30
            )
        );
    }
}

// Fire the projectile
function fireProjectile() {
    console.log("Fire button clicked!", gameState.canFire); // Debug log
    
    if (!gameState.canFire) {
        console.log("Cannot fire right now - canFire is false"); // Debug log
        return;
    }
    
    const angle = angleSlider.value * (Math.PI / 180); // Convert to radians
    const power = powerSlider.value / 5; // Scaled to be more powerful
    
    // Check if triple shot powerup is active
    if (gameState.activePowerup && gameState.activePowerup.type === "triple") {
        console.log("Triple shot active!");
        
        // Fire three projectiles at slightly different angles
        for (let i = -1; i <= 1; i++) {
            const spreadAngle = angle + (i * 0.1); // Small angle spread
            
            if (i === 0) {
                // Center projectile (main one)
                gameState.projectile = {
                    x: 50,
                    y: canvas.height - 30,
                    velocityX: Math.cos(spreadAngle) * power,
                    velocityY: -Math.sin(spreadAngle) * power
                };
            } else {
                // Side projectiles
                gameState.particles.push({
                    type: 'projectile',
                    x: 50,
                    y: canvas.height - 30,
                    velocityX: Math.cos(spreadAngle) * power,
                    velocityY: -Math.sin(spreadAngle) * power,
                    radius: 6,
                    color: '#e74c3c',
                    life: 300,
                    gravity: GRAVITY,
                    checkCollision: true
                });
            }
        }
    } else {
        // Regular single shot
        gameState.projectile = {
            x: 50, // Starting position X
            y: canvas.height - 30, // Starting position Y (bottom of canvas)
            velocityX: Math.cos(angle) * power,
            velocityY: -Math.sin(angle) * power
        };
    }
    
    gameState.canFire = false;
    gameState.inProgress = true;
    
    // Add cannon firing effect
    createCannonSmoke(50, canvas.height - 30);
    
    console.log("Projectile fired!", gameState.projectile); // Debug log to confirm firing
}

// Update the projectile position
function updateProjectile() {
    if (!gameState.inProgress) return;
    
    // Apply wind effect
    gameState.projectile.velocityX += gameState.windSpeed;
    
    // Slow motion effect if active
    const slowFactor = gameState.activePowerup && gameState.activePowerup.type === "slowmo" ? 0.5 : 1;
    
    // Update position
    gameState.projectile.x += gameState.projectile.velocityX * slowFactor;
    gameState.projectile.y += gameState.projectile.velocityY * slowFactor;
    
    // Apply gravity
    gameState.projectile.velocityY += GRAVITY * slowFactor;
    
    // Create trail effect
    if (Math.random() > 0.7) {
        createTrailParticle(gameState.projectile.x, gameState.projectile.y);
    }
    
    // Check if projectile is out of bounds
    if (gameState.projectile.x > canvas.width || 
        gameState.projectile.x < 0 || 
        gameState.projectile.y > canvas.height) {
        handleMiss();
    }
    
    // Check collision with hotel rooms
    checkRoomCollision();
    
    // Check collision with powerups
    checkPowerupCollision();
}

// Check if the projectile hits a room - fixed to use the same coordinates as drawing
function checkRoomCollision() {
    const hotel = gameState.hotels[gameState.level - 1];
    const roomsPerFloor = hotel.roomsPerFloor;
    const floors = hotel.floors;
    
    // Use the same hotel position as in drawHotel
    const hotelX = gameState.hotelPosition.x;
    const hotelY = gameState.hotelPosition.y;
    
    for (let floor = 0; floor < floors; floor++) {
        for (let room = 0; room < roomsPerFloor; room++) {
            const roomX = hotelX + (room * ROOM_WIDTH);
            const roomY = hotelY + (floor * ROOM_HEIGHT);
            
            // Check if projectile is inside this room
            if (gameState.projectile.x > roomX && 
                gameState.projectile.x < roomX + ROOM_WIDTH &&
                gameState.projectile.y > roomY && 
                gameState.projectile.y < roomY + ROOM_HEIGHT) {
                
                // For debugging - draw a marker where the hit was detected
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(gameState.projectile.x, gameState.projectile.y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Projectile hit a room
                if (floor === gameState.targetRoom.floor && room === gameState.targetRoom.room) {
                    handleHit();
                } else {
                    handleMiss();
                }
            }
        }
    }
}

// Check collision with powerups
function checkPowerupCollision() {
    for (let i = 0; i < gameState.powerups.length; i++) {
        const powerup = gameState.powerups[i];
        
        if (powerup.collected) continue;
        
        const dx = gameState.projectile.x - powerup.x;
        const dy = gameState.projectile.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < powerup.radius + 8) { // 8 is projectile radius
            powerup.collected = true;
            activatePowerup(powerup);
            
            // Remove from array
            gameState.powerups.splice(i, 1);
            break;
        }
    }
}

// Handle a successful hit
function handleHit() {
    gameState.inProgress = false;
    
    // Create explosion effect
    createExplosion(gameState.projectile.x, gameState.projectile.y);
    
    // Special effect for explosive targets
    if (gameState.targets[gameState.level - 1].behavior === "explosive") {
        createMassiveExplosion(gameState.projectile.x, gameState.projectile.y);
    }
    
    // Increment combo
    gameState.combo++;
    gameState.comboTimer = 100; // Reset combo timer
    
    // Calculate points with combo multiplier
    let points = gameState.targets[gameState.level - 1].points;
    let comboMultiplier = gameState.combo >= 2 ? gameState.combo : 1;
    let totalPoints = points * comboMultiplier;
    
    gameState.score += totalPoints;
    
    // Update score display
    if (scoreDisplay) {
        scoreDisplay.textContent = gameState.score;
    }
    
    // Create floating score text
    createFloatingText(`+${totalPoints}`, gameState.projectile.x, gameState.projectile.y - 20, '#ffcc00');
    
    // Show combo message
    if (comboMultiplier > 1) {
        showMessage(`HIT! ${comboMultiplier}x COMBO! +${totalPoints} points!`, false);
    } else {
        showMessage(`HIT! Target eliminated. +${totalPoints} points!`, false);
    }
    
    setTimeout(() => {
        setupLevel(gameState.level + 1);
        hideMessage();
    }, 2000);
}

// Handle a miss
function handleMiss() {
    gameState.inProgress = false;
    
    // Check if shield powerup is active
    if (gameState.activePowerup && gameState.activePowerup.type === "shield") {
        // Use up the shield powerup
        gameState.activePowerup = null;
        
        // Show shield protection message
        showMessage(`Shield protected you! Try again.`, false);
        
        setTimeout(() => {
            gameState.canFire = true;
            hideMessage();
        }, 2000);
        
        return;
    }
    
    gameState.lives--;
    livesDisplay.textContent = gameState.lives;
    
    // Reset combo
    gameState.combo = 0;
    
    // Create miss effect
    if (gameState.projectile.y < canvas.height) {
        createMissEffect(gameState.projectile.x, gameState.projectile.y);
    }
    
    if (gameState.lives <= 0) {
        showMessage('GAME OVER! You ran out of lives.', true);
    } else {
        showMessage(`MISS! ${gameState.lives} lives remaining. Try again.`, false);
        setTimeout(() => {
            gameState.canFire = true;
            hideMessage();
        }, 2000);
    }
}

// Show a message
function showMessage(text, isGameOver) {
    messageBox.textContent = text;
    messageBox.classList.remove('hidden');
    
    if (isGameOver) {
        messageBox.innerHTML = text + '<br><button onclick="resetGame()">Play Again</button>';
    }
}

// Hide the message box
function hideMessage() {
    messageBox.classList.add('hidden');
}

// Reset the game
function resetGame() {
    gameState.level = 1;
    gameState.lives = 3;
    gameState.score = 0;
    livesDisplay.textContent = gameState.lives;
    
    // Update score display if it exists
    if (scoreDisplay) {
        scoreDisplay.textContent = gameState.score;
    }
    
    setupLevel(1);
    hideMessage();
}

// Draw the cannon
function drawCannon() {
    const angle = angleSlider.value * (Math.PI / 180); // Convert to radians
    const cannonX = 50;
    const cannonY = canvas.height - 30;
    
    // Draw a platform for the cannon
    ctx.fillStyle = '#8B4513'; // Brown wooden platform
    ctx.beginPath();
    ctx.ellipse(cannonX, cannonY + 10, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add wooden texture to platform
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cannonX - 30, cannonY + 10);
    ctx.lineTo(cannonX + 30, cannonY + 10);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(cannonX, cannonY);
    
    // Draw cannon shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(5, 5, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the cannon base - larger and with a gradient
    const baseGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    baseGradient.addColorStop(0, '#777');
    baseGradient.addColorStop(0.7, '#333');
    baseGradient.addColorStop(1, '#111');
    
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2); // Larger radius (was 20)
    ctx.fill();
    
    // Add a metallic rim to the base
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw the cannon barrel - thicker and more visible
    const barrelGradient = ctx.createLinearGradient(
        0, 0,
        Math.cos(angle) * CANNON_LENGTH * 1.2, 
        -Math.sin(angle) * CANNON_LENGTH * 1.2
    );
    barrelGradient.addColorStop(0, '#777');
    barrelGradient.addColorStop(1, '#333');
    
    ctx.strokeStyle = barrelGradient;
    ctx.lineWidth = 15; // Thicker barrel (was 10)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * CANNON_LENGTH * 1.2, -Math.sin(angle) * CANNON_LENGTH * 1.2); // Longer barrel
    ctx.stroke();
    
    // Add barrel end (muzzle)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(
        Math.cos(angle) * CANNON_LENGTH * 1.2, 
        -Math.sin(angle) * CANNON_LENGTH * 1.2, 
        8, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Add details to the cannon
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
}

// Draw the hotel with animated target behavior
function drawHotel() {
    const hotel = gameState.hotels[gameState.level - 1];
    const roomsPerFloor = hotel.roomsPerFloor;
    const floors = hotel.floors;
    const targetBehavior = gameState.targets[gameState.level - 1].behavior;
    
    // Position the hotel at the right side with some margin
    const hotelX = canvas.width - 350; 
    const hotelY = canvas.height / 2 - (floors * ROOM_HEIGHT) / 2; // Center hotel vertically
    
    // Draw hill/ground for the hotel to sit on
    drawHotelGround(hotelX, hotelY, roomsPerFloor, floors);
    
    // Draw hotel name
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hotel.name, hotelX + (roomsPerFloor * ROOM_WIDTH) / 2, hotelY - 20);
    ctx.textAlign = 'left';
    
    // Draw hotel structure
    ctx.fillStyle = hotel.color;
    ctx.fillRect(hotelX - 10, hotelY - 10, 
                 (roomsPerFloor * ROOM_WIDTH) + 20, 
                 (floors * ROOM_HEIGHT) + 20);
    
    // Update target behavior
    updateTargetBehavior(targetBehavior);
    
    // Draw rooms
    for (let floor = 0; floor < floors; floor++) {
        for (let room = 0; room < roomsPerFloor; room++) {
            const isTargetRoom = floor === gameState.targetRoom.floor && room === gameState.targetRoom.room;
            
            // Apply room offset for moving targets
            let roomOffset = 0;
            if (isTargetRoom && targetBehavior === "moving") {
                roomOffset = gameState.targetRoom.offset;
            }
            
            const roomX = hotelX + (room * ROOM_WIDTH) + roomOffset;
            const roomY = hotelY + (floor * ROOM_HEIGHT);
            
            // Skip drawing target room if it's hiding and in hidden state
            if (isTargetRoom && targetBehavior === "hiding" && !gameState.targetRoom.visible) {
                continue;
            }
            
            // Highlight target room
            if (isTargetRoom) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Make target more visible
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            }
            
            ctx.fillRect(roomX, roomY, ROOM_WIDTH - 5, ROOM_HEIGHT - 5);
            
            // Draw room light
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(roomX + 5, roomY + 5, ROOM_WIDTH - 15, ROOM_HEIGHT - 15);
            
            // Draw target in the target room
            if (isTargetRoom) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#000';
                ctx.fillText(
                    gameState.targets[gameState.level - 1].image, 
                    roomX + ROOM_WIDTH/2 - 8, 
                    roomY + ROOM_HEIGHT/2 + 5
                );
                
                // For shooting enemies, fire back at the player
                if (targetBehavior === "shooting" && !gameState.inProgress && Math.random() < 0.01) {
                    fireEnemyProjectile(roomX + ROOM_WIDTH/2, roomY + ROOM_HEIGHT/2);
                }
            }
        }
    }
    
    // Store hotel position for collision detection
    gameState.hotelPosition = { x: hotelX, y: hotelY };
}

// Update target behavior based on type
function updateTargetBehavior(behavior) {
    switch(behavior) {
        case "moving":
            // Target moves side to side
            const maxOffset = 20;
            gameState.targetRoom.offset = Math.sin(gameState.gameTime * 0.05) * maxOffset;
            break;
            
        case "hiding":
            // Target periodically becomes invisible
            if (gameState.gameTime % 180 === 0) { // Toggle every 3 seconds
                gameState.targetRoom.visible = !gameState.targetRoom.visible;
            }
            break;
            
        case "shooting":
            // Target shoots back at player periodically
            const timeSinceLastShot = gameState.gameTime - gameState.targetRoom.lastShotTime;
            if (timeSinceLastShot > 120 && Math.random() < 0.01) { // Random chance to shoot every 2 seconds
                const hotel = gameState.hotels[gameState.level - 1];
                const hotelX = gameState.hotelPosition.x;
                const hotelY = gameState.hotelPosition.y;
                
                const roomX = hotelX + (gameState.targetRoom.room * ROOM_WIDTH);
                const roomY = hotelY + (gameState.targetRoom.floor * ROOM_HEIGHT);
                
                fireEnemyProjectile(roomX + ROOM_WIDTH/2, roomY + ROOM_HEIGHT/2);
                gameState.targetRoom.lastShotTime = gameState.gameTime;
            }
            break;
    }
}

// Fire an enemy projectile back at the player
function fireEnemyProjectile(x, y) {
    // Calculate angle toward player cannon
    const cannonX = 50;
    const cannonY = canvas.height - 30;
    
    const angle = Math.atan2(cannonY - y, cannonX - x);
    const power = 2 + Math.random() * 3;
    
    gameState.enemyProjectiles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * power,
        velocityY: Math.sin(angle) * power,
        radius: 6
    });
    
    // Create firing effect
    for (let i = 0; i < 8; i++) {
        const particleAngle = angle + (Math.random() * 0.5 - 0.25);
        const particleSpeed = 0.5 + Math.random() * 1;
        
        gameState.particles.push(
            createParticle(
                x, 
                y, 
                'rgba(255, 255, 0, 0.7)', 
                2 + Math.random() * 2, 
                Math.cos(particleAngle) * particleSpeed, 
                Math.sin(particleAngle) * particleSpeed, 
                20 + Math.random() * 10
            )
        );
    }
}

// Update enemy projectiles
function updateEnemyProjectiles() {
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = gameState.enemyProjectiles[i];
        
        // Update position
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;
        
        // Create trail effect
        if (Math.random() > 0.7) {
            gameState.particles.push(
                createParticle(
                    proj.x, 
                    proj.y, 
                    'rgba(255, 255, 0, 0.5)', 
                    1 + Math.random() * 2, 
                    0, 
                    0, 
                    10 + Math.random() * 5
                )
            );
        }
        
        // Check if out of bounds
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            gameState.enemyProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with player
        const cannonX = 50;
        const cannonY = canvas.height - 30;
        const dx = proj.x - cannonX;
        const dy = proj.y - cannonY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < proj.radius + 25) { // 25 is approximate cannon radius
            // Hit the player!
            gameState.enemyProjectiles.splice(i, 1);
            
            if (!gameState.inProgress) {
                handleEnemyHit();
            }
        }
    }
}

// Handle when the player gets hit by enemy fire
function handleEnemyHit() {
    // Check if shield powerup is active
    if (gameState.activePowerup && gameState.activePowerup.type === "shield") {
        // Use up the shield powerup
        gameState.activePowerup = null;
        
        // Show shield protection message
        showMessage(`Shield protected you from enemy fire!`, false);
        
        setTimeout(() => {
            hideMessage();
        }, 2000);
        
        return;
    }
    
    gameState.lives--;
    livesDisplay.textContent = gameState.lives;
    
    // Reset combo
    gameState.combo = 0;
    
    // Create hit effect at cannon
    createExplosion(50, canvas.height - 30);
    
    if (gameState.lives <= 0) {
        showMessage('GAME OVER! You ran out of lives.', true);
    } else {
        showMessage(`HIT! Enemy fire got you! ${gameState.lives} lives remaining.`, false);
        setTimeout(() => {
            hideMessage();
        }, 2000);
    }
}

// Draw a hill/ground for the hotel
function drawHotelGround(hotelX, hotelY, roomsPerFloor, floors) {
    const hotelWidth = roomsPerFloor * ROOM_WIDTH + 20;
    const hotelHeight = floors * ROOM_HEIGHT + 20;
    const hotelBottom = hotelY + hotelHeight;
    
    // Create a gradient for green hills
    const groundGradient = ctx.createLinearGradient(0, canvas.height, 0, hotelBottom);
    groundGradient.addColorStop(0, '#2d6d1f'); // Dark green at bottom
    groundGradient.addColorStop(0.5, '#3c8c2c'); // Medium green in middle
    groundGradient.addColorStop(1, '#52ad37'); // Lighter green at top
    
    // Draw main hill with gradient
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    
    // Start from bottom-left corner of canvas
    ctx.moveTo(0, canvas.height);
    
    // Draw path to right side of screen
    ctx.lineTo(canvas.width, canvas.height);
    
    // Draw path up to the hotel bottom
    ctx.lineTo(canvas.width, hotelBottom);
    
    // Draw path to hotel left edge
    ctx.lineTo(hotelX - 10, hotelBottom);
    
    // Draw a hill-like curve 
    ctx.bezierCurveTo(
        hotelX - 200, hotelBottom, // Control point 1
        hotelX - 300, canvas.height - 150, // Control point 2
        0, canvas.height // End point (bottom-left corner)
    );
    
    ctx.fill();
    
    // Add a subtle shadow under the hotel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(hotelX - 10, hotelBottom);
    ctx.lineTo(hotelX + hotelWidth + 10, hotelBottom);
    ctx.lineTo(hotelX + hotelWidth + 30, hotelBottom + 20);
    ctx.lineTo(hotelX - 30, hotelBottom + 20);
    ctx.fill();
    
    // Add some terrain details
    drawTerrainDetails(hotelX, hotelBottom);
}

// Draw terrain details for visual interest - simplified to fix shiny stuff
function drawTerrainDetails(hotelX, hotelBottom) {
    // Just draw simple bushes, no more random grass blades
    drawBush(100, canvas.height - 25, '#3aad2e', '#4cc244', '#5bba45');
    drawBush(200, canvas.height - 40, '#3aad2e', '#4cc244', '#5bba45');
    drawBush(350, canvas.height - 70, '#4cc244', '#5bba45', '#3aad2e');
    drawBush(550, canvas.height - 50, '#3aad2e', '#4cc244', '#5bba45');
}

// Function to draw a bush
function drawBush(x, y, color1, color2, color3) {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(x - 15, y + 5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color3;
    ctx.beginPath();
    ctx.arc(x + 10, y + 7, 10, 0, Math.PI * 2);
    ctx.fill();
}

// Create a massive explosion effect for the explosive target
function createMassiveExplosion(x, y) {
    // Larger explosion with more particles
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const size = 3 + Math.random() * 5;
        const life = 40 + Math.random() * 50;
        
        // Mix of colors
        const colors = ['rgba(255, 0, 0, 0.8)', 'rgba(255, 165, 0, 0.8)', 'rgba(255, 255, 0, 0.8)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        gameState.particles.push(
            createParticle(
                x, 
                y, 
                color, 
                size, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                life
            )
        );
    }
    
    // Add a white flash
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Screen shake effect (done in gameLoop)
    gameState.screenShake = 20;
}

// Draw the projectile
function drawProjectile() {
    if (!gameState.inProgress) return;
    
    // Draw a larger, more visible cannonball with gradient
    const radius = 8; // Larger radius (was 5)
    
    // Add a shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(gameState.projectile.x + 3, gameState.projectile.y + 3, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the cannonball with a gradient
    const ballGradient = ctx.createRadialGradient(
        gameState.projectile.x - 2, gameState.projectile.y - 2, 0,
        gameState.projectile.x, gameState.projectile.y, radius
    );
    ballGradient.addColorStop(0, '#ff6b6b');
    ballGradient.addColorStop(0.7, '#e74c3c');
    ballGradient.addColorStop(1, '#c0392b');
    
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(gameState.projectile.x, gameState.projectile.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(gameState.projectile.x - 3, gameState.projectile.y - 3, radius/3, 0, Math.PI * 2);
    ctx.fill();
}

// Draw the ground
function drawGround() {
    // This is now handled by the hill drawing
    // The flat ground at the bottom is already part of the hill
}

// Draw the trajectory guide (now conditional)
function drawTrajectoryGuide() {
    if (gameState.inProgress || !SHOW_TRAJECTORY) return; // Don't show during active shot or if disabled
    
    const angle = angleSlider.value * (Math.PI / 180); // Convert to radians
    const power = powerSlider.value / 5; // Match the fireProjectile scaling
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Make more subtle
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    let x = 50; // Cannon position X
    let y = canvas.height - 30; // Cannon position Y
    let velocityX = Math.cos(angle) * power;
    let velocityY = -Math.sin(angle) * power;
    
    ctx.moveTo(x, y);
    
    // Calculate and draw trajectory points (simplified physics)
    for (let i = 0; i < 100; i++) {
        x += velocityX;
        y += velocityY;
        velocityY += GRAVITY;
        
        // Stop at canvas boundaries
        if (x > canvas.width || x < 0 || y > canvas.height) break;
        
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    ctx.restore();
}

// Particle system for visual effects
function createParticle(x, y, color, size, speedX, speedY, life) {
    return {
        x: x,
        y: y,
        color: color,
        size: size,
        speedX: speedX,
        speedY: speedY,
        life: life,
        gravity: 0.05
    };
}

// Create explosion effect
function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const size = 2 + Math.random() * 3;
        const life = 30 + Math.random() * 30;
        
        gameState.particles.push(
            createParticle(
                x, 
                y, 
                'rgba(255, 0, 0, 0.8)', 
                size, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                life
            )
        );
    }
}

// Create miss effect
function createMissEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI/2 + (Math.random() * Math.PI/4 - Math.PI/8);
        const speed = 1 + Math.random() * 2;
        const size = 1 + Math.random() * 2;
        const life = 20 + Math.random() * 10;
        
        gameState.particles.push(
            createParticle(
                x, 
                y, 
                'rgba(100, 100, 100, 0.5)', 
                size, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                life
            )
        );
    }
}

// Create cannon smoke
function createCannonSmoke(x, y) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.PI/4 + (Math.random() * Math.PI/2);
        const speed = 0.5 + Math.random() * 1;
        const size = 3 + Math.random() * 5;
        const life = 40 + Math.random() * 20;
        
        gameState.particles.push(
            createParticle(
                x, 
                y, 
                'rgba(100, 100, 100, 0.7)', 
                size, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                life
            )
        );
    }
}

// Create trail particle
function createTrailParticle(x, y) {
    const size = 1 + Math.random() * 2;
    const life = 10 + Math.random() * 10;
    
    gameState.particles.push(
        createParticle(
            x, 
            y, 
            'rgba(255, 100, 0, 0.6)', 
            size, 
            0, 
            0, 
            life
        )
    );
}

// Text that floats up for scores
function createFloatingText(text, x, y, color) {
    gameState.particles.push({
        type: 'text',
        text: text,
        x: x,
        y: y,
        color: color,
        size: '20px Arial',
        speedY: -1,
        life: 50
    });
}

// Update particles
function updateParticles() {
    // Update existing particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        if (p.type === 'text') {
            // Handle text particles
            p.y += p.speedY;
            p.life--;
            
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        } else if (p.type === 'projectile') {
            // Handle projectile particles (for triple shot)
            p.velocityY += p.gravity;
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.life--;
            
            // Create trail
            if (Math.random() > 0.7) {
                createTrailParticle(p.x, p.y);
            }
            
            // Check for collision with hotel if needed
            if (p.checkCollision) {
                checkProjectileParticleCollision(p, i);
            }
            
            // Check if out of bounds or expired
            if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y > canvas.height) {
                gameState.particles.splice(i, 1);
            }
        } else {
            // Handle regular particles
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += p.gravity;
            p.life--;
            
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
    
    // Update combo timer
    if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer <= 0) {
            gameState.combo = 0;
        }
    }
}

// Check collision for projectile particles (for triple shot)
function checkProjectileParticleCollision(projectile, particleIndex) {
    const hotel = gameState.hotels[gameState.level - 1];
    const roomsPerFloor = hotel.roomsPerFloor;
    const floors = hotel.floors;
    
    // Use the same hotel position as in drawHotel
    const hotelX = gameState.hotelPosition.x;
    const hotelY = gameState.hotelPosition.y;
    
    for (let floor = 0; floor < floors; floor++) {
        for (let room = 0; room < roomsPerFloor; room++) {
            const roomX = hotelX + (room * ROOM_WIDTH);
            const roomY = hotelY + (floor * ROOM_HEIGHT);
            
            // Check if projectile is inside this room
            if (projectile.x > roomX && 
                projectile.x < roomX + ROOM_WIDTH &&
                projectile.y > roomY && 
                projectile.y < roomY + ROOM_HEIGHT) {
                
                // For debugging - mark where hit was detected
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Remove the particle
                gameState.particles.splice(particleIndex, 1);
                
                // Create explosion effect at impact
                createExplosion(projectile.x, projectile.y);
                
                // Check if it hit the target room
                if (floor === gameState.targetRoom.floor && room === gameState.targetRoom.room) {
                    // Handle the hit, but don't advance the level since this is a secondary projectile
                    createFloatingText("+50 Bonus!", projectile.x, projectile.y - 20, '#ffcc00');
                    gameState.score += 50;
                    scoreDisplay.textContent = gameState.score;
                }
                
                return; // Exit after handling collision
            }
        }
    }
}

// Draw all particles
function drawParticles() {
    for (const p of gameState.particles) {
        if (p.type === 'text') {
            // Draw text particle
            ctx.fillStyle = p.color;
            ctx.font = p.size;
            ctx.fillText(p.text, p.x, p.y);
        } else if (p.type === 'projectile') {
            // Draw projectile particle
            // Add a shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x + 2, p.y + 2, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the projectile
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x - 2, p.y - 2, p.radius/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw regular particle
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw wind indicator
function drawWindIndicator() {
    const windX = 150;
    const windY = 50;
    const windStrength = Math.abs(gameState.windSpeed) * 50;
    const windDirection = gameState.windSpeed > 0 ? '→' : '←';
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('Wind:', windX - 40, windY + 5);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(windX, windY - 10, 100, 20);
    
    ctx.fillStyle = gameState.windSpeed > 0 ? '#3498db' : '#e74c3c';
    ctx.fillRect(windX + 50 - windStrength/2, windY - 8, windStrength, 16);
    
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(windDirection, windX + 50, windY + 5);
}

// Draw combo indicator
function drawComboIndicator() {
    if (gameState.combo >= 2) {
        const x = 150;
        const y = 80;
        
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${gameState.combo}x COMBO!`, x, y);
    }
}

// Draw powerups
function drawPowerups() {
    for (const powerup of gameState.powerups) {
        if (powerup.collected) continue;
        
        // Make powerups bounce slightly for visibility
        powerup.bounceOffset = Math.sin(gameState.gameTime * 0.1) * 5;
        
        // Draw powerup
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y + powerup.bounceOffset, powerup.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(powerup.icon, powerup.x, powerup.y + powerup.bounceOffset + 5);
        ctx.textAlign = 'left';
        
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y + powerup.bounceOffset, powerup.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = powerup.color;
        ctx.fill();
        ctx.restore();
    }
}

// Draw active powerup indicator
function drawActivePowerupIndicator() {
    if (!gameState.activePowerup) return;
    
    const powerup = gameState.activePowerup;
    const remainingTime = Math.max(0, (powerup.duration - (Date.now() - powerup.startTime)) / 1000);
    
    // If time is up, remove the powerup
    if (remainingTime <= 0) {
        gameState.activePowerup = null;
        return;
    }
    
    // Draw indicator at top of screen
    const x = canvas.width - 100;
    const y = 50;
    
    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(powerup.icon, x, y + 5);
    
    // Draw time remaining
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillText(`${remainingTime.toFixed(1)}s`, x - 25, y + 5);
    ctx.textAlign = 'left';
}

// Draw the entire scene
function drawScene() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake if active
    if (gameState.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.screenShake;
        const shakeY = (Math.random() - 0.5) * gameState.screenShake;
        ctx.translate(shakeX, shakeY);
        gameState.screenShake -= 1;
    }
    
    // Draw sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw wind indicator
    drawWindIndicator();
    
    // Draw combo indicator
    drawComboIndicator();
    
    // Draw active powerup indicator
    drawActivePowerupIndicator();
    
    // Draw elements
    drawGround();
    drawHotel();
    drawPowerups();
    drawTrajectoryGuide();
    drawCannon();
    drawProjectile();
    drawEnemyProjectiles();
    drawParticles();
    
    // Reset any translations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Game loop
function gameLoop() {
    // Increment game time
    gameState.gameTime++;
    
    // Update projectiles
    updateProjectile();
    updateEnemyProjectiles();
    
    // Update particles
    updateParticles();
    
    // Draw everything
    drawScene();
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
window.onload = init;

// Expose resetGame to the global scope for the button
window.resetGame = resetGame; 