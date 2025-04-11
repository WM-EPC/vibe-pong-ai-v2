# Project Plan: Vibe Pong

## Phase 1: Core Pong Mechanics (Phaser)

-   [x] Set up project structure (HTML, JS, CSS, Vite, Phaser)
-   [x] Create basic game scene
-   [x] Add player paddle (left side)
    -   [x] Control with keyboard (W/S or Up/Down)
    -   [x] Control with touch/mouse drag (vertical only)
-   [x] Add AI paddle (right side)
    -   [x] Basic AI (follows ball's Y position)
-   [x] Add ball
    -   [x] Initial movement
    -   [x] Collision with top/bottom walls
    -   [x] Collision with paddles (basic bounce)
-   [x] Scoring system
    -   [x] Detect when ball goes past a paddle (via world bounds event)
    -   [x] Display score
    -   [x] Reset ball after score
-   [x] Basic win condition (e.g., first to 11 points)

## Phase 2: Rhythm & Vibe Integration

-   [ ] Add background music
    -   [ ] Load and play a sample track
    -   [ ] Analyze track for beats/timing information (or use pre-defined data)
-   [ ] Sync gameplay elements to music
    -   [ ] Ball speed changes with beat intensity
    -   [ ] Visual effects pulse with the beat (background, particles)
-   [ ] Rhythm-based power-ups/mechanics
    -   [ ] Trigger effect on perfect beat hit
    -   [ ] Potential effects: Wider paddle, faster ball, multi-ball, opponent stun?
-   [ ] Visual feedback for rhythm
    -   [ ] Indicator for upcoming beats
    -   [ ] Clear feedback for on-beat/off-beat hits

## Phase 3: Polish & Enhancements

-   [ ] Improved AI for opponent paddle
-   [ ] Sound effects (paddle hit, score, wall bounce)
-   [ ] Menu system (Start screen, options, track selection?)
-   [ ] Multiple music tracks/levels
-   [ ] Refine visual aesthetics (color palettes, particle effects, UI)
-   [ ] Mobile responsiveness and touch controls refinement
-   [ ] Performance optimization

## Phase 4: Deployment

-   [ ] Build production version
-   [ ] Deploy to a web host (e.g., Vercel, Netlify, GitHub Pages)
-   [ ] Configure domain (`vibepong.ai`) 