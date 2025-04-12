import Phaser from 'phaser';

// Define the Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerPaddlePhysics = null;
        this.playerPaddleGraphics = null;
        this.aiPaddlePhysics = null;
        this.aiPaddleGraphics = null;
        this.cursors = null; // Initialize cursor keys variable
        this.keyW = null; // Initialize W key variable
        this.keyS = null; // Initialize S key variable
        this.paddleSpeed = 400; // Pixels per second
        this.ball = null; // Initialize ball variable
        this.isDraggingPaddle = false; // Track drag state
        this.inputZone = null; // Add input zone variable
        this.activePointer = null; // Track the pointer controlling the paddle
        this.aiPaddleSpeed = 150; // AI paddle speed (Reduced significantly for testing)

        // Score tracking
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerScoreText = null;
        this.aiScoreText = null;
        this.boundsInset = 10; // Store inset value for use in update

        // Game State
        this.winningScore = 11;
        this.gameOver = false;
        this.gameOverText = null;
        this.restartText = null; // Add restart text variable

        // Audio State
        this.music = null; // Will be created on demand
        this.audioInitialized = false;
        this.soundButtonContainer = null; // Graphics for container
        this.soundButtonText = null; // Text object "SOUND"
        this.soundIndicator = null; // Graphics for the indicator dot
        this.soundIndicatorOn = false; // State of the indicator

        // Grid properties
        this.gridGraphics = null;
        this.gridColor = 0x00ffff; // Cyan color
        this.gridLines = 20; // Number of horizontal lines
        this.gridScrollY = 0;
        this.gridScrollSpeed = 0.5; // Slower scroll speed
        this.perspectivePointY = 0; // Vanishing point Y (relative to center)

        // Define paddle colors
        this.playerColor = 0x00ffff; // Cyan
        this.aiColor = 0xff00ff; // Pink
        this.ballColor = 0xffff00; // Yellow

        // Paddle properties
        this.paddleWidth = 15;
        this.paddleHeight = 100;
    }

    preload() {
        // Load assets here (images, audio)
        // console.log("Preloading assets in GameScene...");

        // Load background music (Revert to original mp3)
        this.load.audio('music', 'assets/audio/sample-track.mp3');
    }

    create() {
        // Set up game objects here (paddles, ball)
        // console.log("Creating game objects in GameScene...");

        // Game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // --- Create Grid Background (Draw first, so it's behind other elements) ---
        this.gridGraphics = this.add.graphics();
        this.perspectivePointY = gameHeight * 0.4; // Vanishing point slightly above center
        this.drawGrid(); // Draw initial grid

        // Create Player Paddle (left side)
        const paddleX = 100; // MOVED INWARD: Increased distance from the left edge
        const paddleY = gameHeight / 2; // Center vertically

        // --- Create Player Paddle Graphics ---
        this.playerPaddleGraphics = this.add.graphics();
        this.drawPaddleGraphics(this.playerPaddleGraphics, paddleX, paddleY, this.paddleWidth, this.paddleHeight, this.playerColor);
        // Add Glow FX if WebGL is available
        /* // Disable Glow FX - Causing instability
        if (this.sys.game.config.renderType === Phaser.WEBGL) {
            this.playerPaddleGraphics.setFXPadding(4); // Padding for glow
            this.playerPaddleGraphics.postFX.addGlow(this.playerColor, 2, 0, false, 0.1, 32);
        }
        */

        // --- Create Player Paddle Physics Zone (Invisible) ---
        this.playerPaddlePhysics = this.add.zone(paddleX, paddleY, this.paddleWidth, this.paddleHeight);
        this.physics.add.existing(this.playerPaddlePhysics);
        this.playerPaddlePhysics.body.setImmovable(true);
        this.playerPaddlePhysics.body.setCollideWorldBounds(true);

        // --- Input Handling ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        const zoneWidth = paddleX + (this.paddleWidth / 2);
        const zoneX = 0;
        this.inputZone = this.add.zone(zoneX, 0, zoneWidth, gameHeight).setOrigin(0, 0).setInteractive();
        this.input.setDraggable(this.inputZone);

        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject === this.inputZone) {
                this.isDraggingPaddle = true;
                this.activePointer = pointer;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
             if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddlePhysics.body.setVelocityY(0);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddlePhysics.body.setVelocityY(0);
            }
        });

        // --- Create Ball ---
        const ballSize = 15;
        this.ball = this.add.circle(gameWidth / 2, gameHeight / 2, ballSize / 2, this.ballColor);
        this.physics.add.existing(this.ball);

        // Configure ball physics
        this.ball.body.setCollideWorldBounds(true); // Re-enabled - should respect physics.world.setBounds
        this.ball.body.setBounce(1, 1);

        // --- Adjust World Bounds for Physics & Visuals ---
        this.physics.world.setBounds(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset * 2, gameHeight - this.boundsInset * 2);

        // Draw visual boundary lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x333333, 1);
        graphics.lineBetween(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, this.boundsInset);
        graphics.lineBetween(this.boundsInset, gameHeight - this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);
        graphics.lineBetween(this.boundsInset, this.boundsInset, this.boundsInset, gameHeight - this.boundsInset);
        graphics.lineBetween(gameWidth - this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);

        // Give the ball an initial velocity - RE-ADDED for this revert
        const initialSpeedX = 200;
        const initialSpeedY = Phaser.Math.Between(-100, 100);
        this.ball.body.setVelocity(initialSpeedX, initialSpeedY);

        // --- Create AI Paddle (right side) ---
        const aiPaddleX = gameWidth - 100;
        this.aiPaddleGraphics = this.add.graphics();
        this.drawPaddleGraphics(this.aiPaddleGraphics, aiPaddleX, paddleY, this.paddleWidth, this.paddleHeight, this.aiColor);
        // Add Glow FX if WebGL is available
        /* // Disable Glow FX - Causing instability
        if (this.sys.game.config.renderType === Phaser.WEBGL) {
            this.aiPaddleGraphics.setFXPadding(4); // Padding for glow
            this.aiPaddleGraphics.postFX.addGlow(this.aiColor, 2, 0, false, 0.1, 32);
        }
        */

        // --- Create AI Paddle Physics Zone (Invisible) ---
        this.aiPaddlePhysics = this.add.zone(aiPaddleX, paddleY, this.paddleWidth, this.paddleHeight);
        this.physics.add.existing(this.aiPaddlePhysics);
        this.aiPaddlePhysics.body.setImmovable(true);
        // No need for collide world bounds on AI typically, but fine to leave
        this.aiPaddlePhysics.body.setCollideWorldBounds(true);

        // --- Collisions ---
        this.physics.add.collider(this.ball, this.playerPaddlePhysics, this.handlePaddleBallCollision, null, this);
        this.physics.add.collider(this.ball, this.aiPaddlePhysics, this.handlePaddleBallCollision, null, this);

        // --- Listen for World Bounds Collision ---
        this.ball.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', this.handleWorldBoundsCollision, this);

        // --- Version Text ---
        const versionText = 'v0.1.2b'; // Bump version after audio test
        this.add.text(10, gameHeight - 10, versionText, {
            fontSize: '12px',
            fill: '#555'
        }).setOrigin(0, 1);

        // --- Score Text ---
        const scoreTextStyle = {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: '"Courier New", Courier, monospace', // Monospaced font for retro feel
            shadow: { offsetX: 2, offsetY: 2, color: '#0000ff', blur: 5, stroke: true, fill: true } // Blue neon glow
        };
        this.playerScoreText = this.add.text(gameWidth * 0.25, 50, '0', scoreTextStyle).setOrigin(0.5);
        this.aiScoreText = this.add.text(gameWidth * 0.75, 50, '0', scoreTextStyle).setOrigin(0.5);

        // --- Sound Button UI --- (New Structure)
        const soundButtonHeight = 30;
        const soundButtonWidth = 100;
        const soundButtonPadding = 10;
        const soundButtonX = gameWidth - this.boundsInset - soundButtonWidth;
        const soundButtonY = this.boundsInset;

        // Create Container Graphics
        this.soundButtonContainer = this.add.graphics({ x: soundButtonX, y: soundButtonY });

        // Create Text (White, Sans-serif, No Glow)
        const soundTextStyle = {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif' // Cleaner font
        };
        this.soundButtonText = this.add.text(soundButtonX + soundButtonPadding, soundButtonY + soundButtonHeight / 2, 'SOUND', soundTextStyle)
            .setOrigin(0, 0.5)
            .setInteractive(); // Make TEXT interactive again

        // Create Indicator Graphics
        this.soundIndicator = this.add.graphics();
        // Position will be set within drawSoundButtonUI relative to container - MOVED: Position set here directly
        const indicatorRadius = 8;
        const indicatorPadding = 5; // Padding between text and indicator
        this.soundIndicator.x = soundButtonX + soundButtonWidth - soundButtonPadding - indicatorRadius * 2; // Position based on container right edge
        this.soundIndicator.y = soundButtonY + soundButtonHeight / 2 - indicatorRadius; // Align vertically with text center

        // if (this.sys.game.config.renderType === Phaser.WEBGL) {
        //      this.soundIndicator.setFXPadding(4); // Padding for glow - Temporarily disable
        // }

        // Draw initial state (container + indicator OFF)
        this.drawSoundButtonUI(false);

        // Attach listener to TEXT again
        this.soundButtonText.on('pointerdown', this.toggleSound, this);

        // Game Over Text (initially hidden)
        const gameOverStyle = {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: '"Courier New", Courier, monospace',
            align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#800000', blur: 8, stroke: true, fill: true } // Dark red glow
        };
        this.gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, '', gameOverStyle).setOrigin(0.5).setVisible(false);

        // Restart Text (initially hidden)
        const restartTextStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: '"Courier New", Courier, monospace',
            align: 'center'
        };
        this.restartText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 60, 'Click to Restart', restartTextStyle).setOrigin(0.5).setVisible(false);
    }

    update(time, delta) {
        console.log('Update loop running'); // DEBUG
        // --- Stop updates if game over ---
        if (this.gameOver) {
            return;
        }

        // --- Update Grid Scroll ---
        const gameHeight = this.sys.game.config.height; // Define gameHeight if not accessible otherwise
        this.gridScrollY = (this.gridScrollY + this.gridScrollSpeed) % (gameHeight * 2); // Modulo arithmetic for looping scroll
        this.drawGrid();

        // --- Player Paddle Movement ---
        this.playerPaddlePhysics.body.setVelocityY(0); // Move the physics body

        if (this.activePointer && this.activePointer.isDown) {
            const minY = this.paddleHeight / 2; // Use this.paddleHeight
            const maxY = this.sys.game.config.height - this.paddleHeight / 2; // Use this.paddleHeight
            const targetY = Phaser.Math.Clamp(this.activePointer.y, minY, maxY);
            // Move the physics body towards the target Y
            this.physics.moveTo(this.playerPaddlePhysics, this.playerPaddlePhysics.body.x + this.paddleWidth / 2, targetY, null, 75); // Use this.paddleWidth
            this.isDraggingPaddle = true;
        }
        else {
             if (this.isDraggingPaddle) {
                 this.isDraggingPaddle = false;
                 this.activePointer = null;
                 this.playerPaddlePhysics.body.setVelocityY(0); // Stop physics body
             }
            if (this.cursors.up.isDown || this.keyW.isDown) {
                this.playerPaddlePhysics.body.setVelocityY(-this.paddleSpeed); // Move physics body
            }
            else if (this.cursors.down.isDown || this.keyS.isDown) {
                this.playerPaddlePhysics.body.setVelocityY(this.paddleSpeed); // Move physics body
            }
        }
        // Sync Graphics with Physics Zone
        this.playerPaddleGraphics.x = this.playerPaddlePhysics.body.x;
        this.playerPaddleGraphics.y = this.playerPaddlePhysics.body.y;

        // --- AI Paddle Movement ---
        const yDiff = this.ball.y - (this.aiPaddlePhysics.body.y + this.paddleHeight / 2); // Use this.paddleHeight

        if (Math.abs(yDiff) > this.paddleHeight * 0.1) { // Use this.paddleHeight
            if (yDiff < 0) {
                this.aiPaddlePhysics.body.setVelocityY(-this.aiPaddleSpeed); // Move physics body
            }
            else {
                this.aiPaddlePhysics.body.setVelocityY(this.aiPaddleSpeed); // Move physics body
            }
        }
         else {
             this.aiPaddlePhysics.body.setVelocityY(0); // Stop physics body
         }
        // Sync Graphics with Physics Zone
        this.aiPaddleGraphics.x = this.aiPaddlePhysics.body.x;
        this.aiPaddleGraphics.y = this.aiPaddlePhysics.body.y;
    }

    toggleSound() {
        if (!this.audioInitialized) {
            // --- First time: Initialize, PLAY FIRST, then attempt resume ---
            this.audioInitialized = true;
            let soundPlayed = false;
            if (!this.music) {
                this.music = this.sound.add('music', { loop: true });
            }
            if (this.music) {
                try {
                    this.music.play();
                    soundPlayed = true;
                } catch (e) {
                    console.error("Immediate play() call failed:", e);
                    soundPlayed = false;
                }
                if (soundPlayed) {
                    if (this.sound.context.state === 'suspended') {
                        this.sound.context.resume().then(() => {
                            if(this.music) this.music.setMute(false);
                            this.drawSoundButtonUI(true);
                        }).catch(e => {
                            console.error('Audio context resume failed: ', e);
                            this.drawSoundButtonUI(false); // Failed to resume, show OFF
                        });
                    } else {
                        if(this.music) this.music.setMute(false);
                        this.drawSoundButtonUI(true);
                    }
                } else {
                    this.drawSoundButtonUI(false); // Play failed, show OFF
                }
            }
        } else {
            // --- Subsequent times: Toggle mute ---
            if (this.music) {
                this.music.setMute(!this.music.mute);
                this.drawSoundButtonUI(!this.music.mute);
            }
        }
    }

    handlePaddleBallCollision(ball, paddle) {
        let diff = 0;
        const currentSpeedX = Math.abs(ball.body.velocity.x);
        const maxDeflectionSpeedY = currentSpeedX * 1.5;
        let newSpeedY = 0;

        if (ball.y < paddle.y) {
            diff = paddle.y - ball.y;
            newSpeedY = Phaser.Math.Clamp(-10 * diff, -maxDeflectionSpeedY, -50);
        }
        else if (ball.y > paddle.y) {
            diff = ball.y - paddle.y;
            newSpeedY = Phaser.Math.Clamp(10 * diff, 50, maxDeflectionSpeedY);
        }
        else {
            newSpeedY = Phaser.Math.Between(-50, 50);
        }

        if (paddle === this.playerPaddlePhysics) {
            ball.body.setVelocity(currentSpeedX, newSpeedY);
        }
        else if (paddle === this.aiPaddlePhysics) {
            ball.body.setVelocity(-currentSpeedX, newSpeedY);
        }
    }

    handleWorldBoundsCollision(body, up, down, left, right) {
        if (body === this.ball.body && !this.gameOver) {
            let scorer = null;

            if (left) {
                this.aiScore++;
                this.aiScoreText.setText(this.aiScore);
                scorer = 'ai';
            }
            else if (right) {
                this.playerScore++;
                this.playerScoreText.setText(this.playerScore);
                scorer = 'player';
            }

            if (this.playerScore >= this.winningScore || this.aiScore >= this.winningScore) {
                this.endGame(scorer);
            }
            else if (scorer) {
                 this.resetBall(scorer === 'ai');
            }
        }
    }

    resetBall(serveToPlayer) {
         if (this.gameOver) return;

        this.ball.body.stop();
        this.ball.setVisible(false);

        this.time.delayedCall(1000, () => {
            const initialSpeedY = Phaser.Math.Between(-100, 100);
            const initialSpeedX = serveToPlayer ? -200 : 200;
            this.ball.setPosition(this.sys.game.config.width / 2, this.sys.game.config.height / 2);
            this.ball.setVisible(true);
            this.ball.body.setVelocity(initialSpeedX, initialSpeedY);
        });
    }

    endGame(winner) {
        this.gameOver = true;
        this.ball.body.stop();
        this.ball.setVisible(false);
        this.playerPaddlePhysics.body.stop();
        this.aiPaddlePhysics.body.stop();

        let message = '';
        if (winner === 'player') {
            message = 'You Win!';
        }
        else {
            message = 'AI Wins!';
        }

        this.gameOverText.setText(message);
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true); // Show restart text

        // Listen for a click/tap to restart
        this.input.once('pointerdown', this.restartGame, this);
    }

    restartGame() {
        // Prevent further restarts if clicked multiple times quickly
        this.input.removeListener('pointerdown', this.restartGame, this);

        // Reset scores
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerScoreText.setText('0');
        this.aiScoreText.setText('0');

        // Hide game over messages
        this.gameOverText.setVisible(false);
        this.restartText.setVisible(false);

        // Reset game state
        this.gameOver = false;

        // Optional: Reset paddle positions (to center?)
        // this.playerPaddlePhysics.setPosition(100, this.sys.game.config.height / 2);
        // this.aiPaddlePhysics.setPosition(this.sys.game.config.width - 100, this.sys.game.config.height / 2);

        // Serve the ball again
        this.resetBall(Math.random() < 0.5); // Random serve direction
    }

    // --- Paddle Drawing with Gradient ---
    drawPaddleGraphics(graphics, x, y, width, height, color) {
        graphics.clear();

        // Revert to solid color fill
        graphics.fillStyle(color, 1); // Solid color, full alpha
        graphics.fillRect(0, 0, width, height); // Draw fill relative to graphics object origin

        // Add an outline
        const outlineColor = Phaser.Display.Color.ValueToColor(color).darken(50).color; // Darker shade for outline
        graphics.lineStyle(2, outlineColor, 1); // 2px thick outline
        graphics.strokeRect(0, 0, width, height); // Draw outline relative to graphics object origin

        graphics.setPosition(x - width / 2, y - height / 2); // Position graphics object correctly (origin is top-left)
    }

    // --- Grid Drawing Logic ---
    drawGrid() {
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(1, this.gridColor, 0.5); // Thinner lines, slightly transparent

        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const horizonY = this.perspectivePointY; // Use the defined perspective point
        const centerXinVP = gameWidth / 2; // Vanishing point X (center)

        // --- Draw Horizontal Lines ---
        for (let i = 0; i < this.gridLines; i++) {
            // Calculate y position with perspective and incorporating scroll
            // Map the linear scroll offset to the perspective scale
            const scrollOffset = (this.gridScrollY / (gameHeight * 2)) * this.gridLines;
            const lineIndexWithScroll = i + scrollOffset;
            const perspectiveProgress = (lineIndexWithScroll % this.gridLines) / this.gridLines;

            // Use exponential scaling for perspective (closer lines more spaced out)
            const y = horizonY + (gameHeight - horizonY) * Math.pow(perspectiveProgress, 2);

            if (y >= horizonY && y <= gameHeight) { // Draw only below horizon and on screen
                // Calculate line width based on perspective (lines get shorter near horizon)
                const widthFactor = (y - horizonY) / (gameHeight - horizonY);
                const currentLineWidth = gameWidth * widthFactor;
                const startX = centerXinVP - currentLineWidth / 2;
                const endX = centerXinVP + currentLineWidth / 2;

                this.gridGraphics.lineBetween(startX, y, endX, y);
            }
        }

        // --- Draw Vertical Lines (Radiating from center vanishing point) ---
        const numVerticalLines = 30; // More vertical lines
        this.gridGraphics.lineStyle(1, this.gridColor, 0.3); // Make vertical lines fainter
        for (let i = 0; i <= numVerticalLines; i++) {
             // Calculate x position at the bottom edge of the screen
             // Distribute lines more densely near the center for better perspective feel
             const normalizedIndex = i / numVerticalLines; // 0 to 1
             const perspectiveRatio = Math.pow(normalizedIndex - 0.5, 3) * 2 + 0.5; // Cubic function centered at 0.5
             let x = perspectiveRatio * gameWidth;

             // Clamp x to be within screen bounds just in case
             x = Phaser.Math.Clamp(x, 0, gameWidth);

             this.gridGraphics.lineBetween(x, gameHeight, centerXinVP, horizonY);
         }
    }

    // --- Sound Button UI Drawing Logic ---
    drawSoundButtonUI(isOn) {
        const container = this.soundButtonContainer;
        const width = 100;
        const height = 30;
        const cornerRadius = 10;
        const outlineColor = this.playerColor; // Cyan
        const fillColor = 0x000000; // Black

        // Update state variable
        this.soundIndicatorOn = isOn;

        // Draw Container
        container.clear();
        container.fillStyle(fillColor, 0.8); // Slightly transparent black
        container.fillRoundedRect(0, 0, width, height, cornerRadius);
        container.lineStyle(2, outlineColor, 1);
        container.strokeRoundedRect(0, 0, width, height, cornerRadius);

        // Draw Indicator (relative to container top-left at 0,0)
        const indicatorRadius = 8;
        const indicatorPadding = 10;
        const indicatorX = width - indicatorPadding - indicatorRadius; // Position inside right edge
        const indicatorY = height / 2; // Center vertically
        this.updateSoundIndicator(isOn); // Call without position

        // Ensure text and indicator are drawn on top
        this.children.bringToTop(this.soundButtonText);
        this.children.bringToTop(this.soundIndicator);
    }

    // --- Sound Indicator Drawing Logic (Simplified) ---
    updateSoundIndicator(isOn) {
        this.soundIndicator.clear();
        // Set position based on container - REMOVED: Position set once in create
        // this.soundIndicator.x = this.soundButtonContainer.x;
        // this.soundIndicator.y = this.soundButtonContainer.y;

        const radius = 8;
        const indicatorColor = this.playerColor; // Cyan
        const offColor = 0x555555; // Grey

        if (isOn) {
            this.soundIndicator.fillStyle(indicatorColor, 1);
            this.soundIndicator.fillCircle(radius, radius, radius); // Draw relative to origin
            // if (this.sys.game.config.renderType === Phaser.WEBGL) {
            //     // Make glow slightly less intense?
            //     this.soundIndicator.postFX.addGlow(indicatorColor, 0.8, 0, false, 0.1, 16); // Temporarily disable
            // }
        } else {
            this.soundIndicator.lineStyle(2, offColor, 1);
            this.soundIndicator.strokeCircle(radius, radius, radius); // Draw relative to origin
            // if (this.sys.game.config.renderType === Phaser.WEBGL) {
            //     this.soundIndicator.postFX.clear(); // Temporarily disable
            // }
        }
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // DISABLED physics debugging
        }
    },
    scene: [GameScene]
};

// Initialize the Game
const game = new Phaser.Game(config);