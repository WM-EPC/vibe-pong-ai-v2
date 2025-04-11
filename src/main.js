import Phaser from 'phaser';

// Define the Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerPaddle = null; // Initialize paddle variable
        this.cursors = null; // Initialize cursor keys variable
        this.keyW = null; // Initialize W key variable
        this.keyS = null; // Initialize S key variable
        this.paddleSpeed = 400; // Pixels per second
        this.ball = null; // Initialize ball variable
        this.isDraggingPaddle = false; // Track drag state
        this.inputZone = null; // Add input zone variable
        this.activePointer = null; // Track the pointer controlling the paddle
    }

    preload() {
        // Load assets here (images, audio)
        console.log("Preloading assets in GameScene...");
    }

    create() {
        // Set up game objects here (paddles, ball)
        console.log("Creating game objects in GameScene...");
        // Remove the placeholder text
        // this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Vibe Pong!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // Game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Create Player Paddle (left side)
        const paddleWidth = 15;
        const paddleHeight = 100;
        const paddleX = 100; // MOVED INWARD: Increased distance from the left edge
        const paddleY = gameHeight / 2; // Center vertically

        // Using a Graphics object to draw the rectangle first, then adding physics
        // Alternatively, you could load an image sprite
        this.playerPaddle = this.add.rectangle(paddleX, paddleY, paddleWidth, paddleHeight, 0xffffff); // White color
        this.physics.add.existing(this.playerPaddle); // Add physics body

        // Configure paddle physics
        this.playerPaddle.body.setImmovable(true); // Paddle doesn't get pushed by the ball
        this.playerPaddle.body.setCollideWorldBounds(true); // Keep paddle within game boundaries

        // --- Input Handling ---
        // Create cursor keys object
        this.cursors = this.input.keyboard.createCursorKeys();
        // Create W and S keys object
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // Create Input Zone (Area from left screen edge up to and including the paddle's right edge)
        const zoneWidth = paddleX + (paddleWidth / 2); // CORRECTED: Zone ends at the right edge of the paddle
        const zoneX = 0; // Start zone at the left screen edge
        this.inputZone = this.add.zone(zoneX, 0, zoneWidth, gameHeight).setOrigin(0, 0).setInteractive();
        this.input.setDraggable(this.inputZone);

        // Listen for drag START event on the input zone
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject === this.inputZone) { // Check if dragging the zone
                this.isDraggingPaddle = true; // Set flag to override keyboard
                this.activePointer = pointer; // Track this pointer
            }
        });

        // Listen for drag END event anywhere
        this.input.on('dragend', (pointer, gameObject) => {
             // Check if the pointer ending the drag is the one we are tracking
             if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0); // Stop paddle movement
            }
        });

        // Add a global pointer up listener to catch finger lifts that aren't dragend events
        this.input.on('pointerup', (pointer) => {
             // Check if the pointer being lifted is the one we are tracking
            if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0); // Stop paddle movement
            }
        });

        // --- Create Ball ---
        const ballSize = 15;
        this.ball = this.add.circle(gameWidth / 2, gameHeight / 2, ballSize / 2, 0xffffff); // White circle
        this.physics.add.existing(this.ball);

        // Configure ball physics
        this.ball.body.setCollideWorldBounds(true); // Collide with walls
        this.ball.body.setBounce(1, 1); // Full bounce off walls and paddles

        // --- Adjust World Bounds for Physics & Visuals ---
        const boundsInset = 10; // REVERTED to smaller value - safe areas handled by CSS
        this.physics.world.setBounds(boundsInset, boundsInset, gameWidth - boundsInset * 2, gameHeight - boundsInset * 2);

        // Draw visual boundary lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x333333, 1); // 2px thick, dark grey, full alpha
        // Top line
        graphics.lineBetween(boundsInset, boundsInset, gameWidth - boundsInset, boundsInset);
        // Bottom line
        graphics.lineBetween(boundsInset, gameHeight - boundsInset, gameWidth - boundsInset, gameHeight - boundsInset);
        // Left line
        graphics.lineBetween(boundsInset, boundsInset, boundsInset, gameHeight - boundsInset);
        // Right line
        graphics.lineBetween(gameWidth - boundsInset, boundsInset, gameWidth - boundsInset, gameHeight - boundsInset);

        // Give the ball an initial velocity
        const initialSpeedX = 200;
        const initialSpeedY = Phaser.Math.Between(-100, 100); // Random initial Y direction
        this.ball.body.setVelocity(initialSpeedX, initialSpeedY);

        // --- Collisions ---
        // Ball vs Player Paddle
        this.physics.add.collider(this.ball, this.playerPaddle, this.handlePaddleBallCollision, null, this);

        // --- Version Text ---
        const versionText = 'v0.1.0';
        this.add.text(10, gameHeight - 10, versionText, {
            fontSize: '12px',
            fill: '#555' // Dim color
        }).setOrigin(0, 1); // Anchor bottom-left
    }

    update() {
        // --- Player Paddle Movement ---

        // Stop any previous movement
        this.playerPaddle.body.setVelocityY(0);

        // --- Pointer Following Logic ---
        if (this.activePointer && this.activePointer.isDown) {
             // Calculate minY/maxY based on current paddle state
            const minY = this.playerPaddle.displayHeight / 2;
            const maxY = this.sys.game.config.height - this.playerPaddle.displayHeight / 2;
            // Get target Y from the active pointer
            const targetY = Phaser.Math.Clamp(this.activePointer.y, minY, maxY);

            // Move the player paddle physics body towards the target Y
            this.physics.moveTo(this.playerPaddle, this.playerPaddle.x, targetY, null, 75);
            // Ensure isDraggingPaddle is true while actively following
            this.isDraggingPaddle = true;
        }
        else {
             // Reset drag flag if pointer is up but somehow missed the up/end event
             if (this.isDraggingPaddle) {
                 this.isDraggingPaddle = false;
                 this.activePointer = null; // Ensure pointer is cleared
             }
            // --- Keyboard Input Fallback ---
            // Check keyboard input ONLY if not actively following a pointer
            if (this.cursors.up.isDown || this.keyW.isDown) {
                this.playerPaddle.body.setVelocityY(-this.paddleSpeed);
            }
            else if (this.cursors.down.isDown || this.keyS.isDown) {
                this.playerPaddle.body.setVelocityY(this.paddleSpeed);
            }
        }

        // --- Other game loop logic ---
        // (collision, etc. will go here later)
    }

    handlePaddleBallCollision(ball, paddle) {
        console.log("Ball hit player paddle");
        // We'll add more sophisticated bounce logic later (angle based on hit position)
        let diff = 0;
        const currentSpeedX = Math.abs(ball.body.velocity.x); // Store current X speed
        const maxDeflectionSpeedY = currentSpeedX * 1.5; // Limit vertical speed change relative to horizontal

        // Ball is higher than paddle center
        if (ball.y < paddle.y) {
            diff = paddle.y - ball.y;
            // Deflect upwards, scale deflection by difference, clamp max speed
            const newSpeedY = Phaser.Math.Clamp(-10 * diff, -maxDeflectionSpeedY, -50); // Ensure minimum deflection
            ball.body.setVelocity(currentSpeedX, newSpeedY); // Set X and Y
        }
        // Ball is lower than paddle center
        else if (ball.y > paddle.y) {
            diff = ball.y - paddle.y;
             // Deflect downwards, scale deflection by difference, clamp max speed
            const newSpeedY = Phaser.Math.Clamp(10 * diff, 50, maxDeflectionSpeedY); // Ensure minimum deflection
            ball.body.setVelocity(currentSpeedX, newSpeedY); // Set X and Y
        }
        // Ball hit paddle center
        else {
            // Add a slight random angle on center hits
            ball.body.setVelocity(currentSpeedX, Phaser.Math.Between(-50, 50)); // Randomly up or down slightly, preserve X
        }

        // Optional: Increase ball speed slightly on each hit (uncomment to enable)
        // ball.body.velocity.scale(1.05);
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    scale: {
        mode: Phaser.Scale.FIT, // Fit the game within the screen, preserving aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas
        width: 800, // Design width (game world coordinates)
        height: 600 // Design height (game world coordinates)
    },
    parent: 'game-container', // Optional: Specify a div ID if you have one
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity needed for Pong
            debug: false // Set to true for physics debugging visuals
        }
    },
    scene: [GameScene] // Add the scene to the configuration
};

// Initialize the Game
const game = new Phaser.Game(config); 