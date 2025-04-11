# Lessons Learned: Cross-Device Compatibility (Phaser 3)

This document summarizes the key challenges and solutions encountered while setting up the initial Vibe Pong project to work correctly across desktop, iPad, and iPhone, particularly addressing iOS display and input quirks.

**Phaser Version:** v3.88.2 (as of initial setup)

## 1. Scaling and Centering

*   **Challenge:** The initial fixed-size canvas (800x600) did not adapt to different screen sizes, causing parts of the game to be cut off, especially on mobile devices like the iPhone in portrait or landscape mode.
*   **Solution:** Implemented Phaser's **Scale Manager** in the game configuration (`src/main.js`):
    *   Used `mode: Phaser.Scale.FIT` to scale the game canvas to fit within the available screen space while maintaining the 800x600 aspect ratio.
    *   Used `autoCenter: Phaser.Scale.CENTER_BOTH` to automatically center the scaled canvas horizontally and vertically.
*   **Refinement:** Removed conflicting CSS centering rules (like `display: flex`, `justify-content`, `align-items: center` on the `body`) to let Phaser's `autoCenter` handle positioning reliably.

## 2. iOS Viewport and Safe Area Handling (iPhone Clipping)

*   **Challenge:** Despite correct scaling and centering, the bottom edge of the game canvas was visually clipped on iPhone (especially in landscape mode), causing the ball to disappear when bouncing off the bottom boundary. This was likely due to mobile Safari's dynamic UI elements (toolbars, home indicator) obscuring the viewport.
*   **Troubleshooting (Ineffective/Insufficient):**
    *   Experimenting with CSS `height: 95%` or `80%` on `html`/`body` did not reliably control the container size or fix the clipping.
    *   Increasing Phaser's physics `boundsInset` moved the gameplay boundary up, but didn't prevent the *visual* clipping of the canvas itself.
*   **Solution:** Implemented standard **iOS Safe Area** handling:
    1.  **HTML (`index.html`):** Added `viewport-fit=cover` to the `<meta name="viewport">` tag.
    2.  **HTML (`index.html`):** Wrapped the game canvas's target location with `<div id="game-container"></div>`.
    3.  **CSS (`style.css`):** Applied styles to `#game-container`:
        *   `position: absolute;`
        *   Used `top/bottom/left/right: env(safe-area-inset-*, 0px);` to respect the safe area margins provided by iOS.
        *   **Crucially:** Removed explicit `width: 100%` and `height: 100%` from the container, letting the `top/bottom/left/right` offsets define its size and position within the safe area.
    4.  **Phaser (`src/main.js`):** Ensured the `parent: 'game-container'` property was set in the Phaser config.
    5.  **Phaser (`src/main.js`):** Reverted `boundsInset` to a smaller value (`10`) once safe areas were handled correctly.

## 3. Touch Input Refinement (Paddle Control)

*   **Challenge:** Initial drag-and-drop on the paddle itself felt unreliable, sometimes stopped working if the finger drifted, and didn't provide comfortable thumb space on mobile.
*   **Evolution:**
    1.  **Direct Drag:** Started with `setInteractive`/`setDraggable` on the paddle, directly setting `y` in the `drag` event. (Issues: Physics conflict, unreliability).
    2.  **Physics Move:** Changed to using `physics.moveTo` in the `drag` event. (Better, but still required starting drag *on* the paddle).
    3.  **Input Zone:** Introduced an invisible `Phaser.GameObjects.Zone` for interaction, decoupling input from the paddle sprite. Calculation of the zone's position/width required iteration to match the desired left-side control area.
    4.  **Pointer Following:** Refined the zone approach. Instead of using `drag` events, used `dragstart` to capture an `activePointer`, then continuously followed `activePointer.y` in the `update` loop (using `physics.moveTo`) as long as `activePointer.isDown`. Used `dragend` and global `pointerup` listeners to clear the `activePointer` and stop movement. (Most robust and forgiving approach).
*   **Paddle Positioning:** Moved the player paddle further inward (`paddleX = 100`) to create sufficient physical space between the left screen edge and the paddle for comfortable thumb placement on narrow devices.

## 4. Visual Boundaries

*   **Challenge:** The initial CSS `border` on the canvas was unreliable, sometimes disappearing or becoming misaligned due to scaling and safe area adjustments.
*   **Solution:** Removed the CSS border and drew the gameplay boundaries directly within Phaser using `this.add.graphics()`, ensuring the visual lines always matched the inset physics bounds (`this.physics.world.setBounds`). 