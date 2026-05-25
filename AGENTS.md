# Painter of Makli Agent Notes

## Project Goal

Painter of Makli is a Babylon.js web game for Token Game Jam 1. The current app is an early scaffold with the intended mode structure in place:

- Black click-to-start splash screen that unlocks audio and preloads core assets.
- Main menu with animated 3D Babylon.js background and New Game / Load Game buttons.
- Cutscene shell with letterboxed video area, independent subtitle line, and room to add narration audio.
- Top-down 3D protection/exploration mode using the Draco-compressed `resources/yusuf.glb` and its built-in `NlaTrack.004` walking animation. Yusuf currently walks in a large scripted circle while the player rotates/zooms the camera and draws ground enclosures to remove incoming threats.
- Painting mode where dragging reveals a completed image through a feathered circular brush and scores center-point penalties.

## Commands

- `npm install` installs dependencies.
- `npm run dev` starts Vite at `127.0.0.1` and serves `resources/` from `/resources/`.
- `npm run build` writes the distributable game to `dist/` and copies `resources/` into `dist/resources/`.
- `npm run preview` serves the built `dist/` output locally.

## Development Notes

- Client-side console errors and unhandled promise rejections are posted to `/__client-log` during `npm run dev` and appended to `logs/client-errors.log`.
- `dist/`, `logs/`, and `node_modules/` are ignored by git.
- Keep large binary game resources under `resources/`; the custom Vite plugin handles dev serving and build copying.
- The plain explore terrain mesh, menu scene, music loop, cutscene content, painting images, and dark vortex threats are placeholders meant to be replaced with final game assets.
- Current explore input uses left click/touch drag to draw a clearly visible glowing ground line, middle/right mouse drag or Q/E/gamepad shoulder/right-stick for camera rotation, and wheel/two-finger pinch for zoom. Drawn lines auto-close and trigger when they reach 20 meters, are released, or are held for 3 seconds.
- Babylon.js loads glTF assets through `@babylonjs/loaders`; keep the Draco-compressed `resources/yusuf.glb` as the active Yusuf model unless there is a deliberate asset pipeline change. Draco decoder files are served from `/draco/` in dev and copied to `dist/draco/` during builds.

## Important Implementation Detail

The exploration mode moves Yusuf along the scripted path in code while the glTF animation group supplies the walk cycle. Keep gameplay movement, camera rotation/zoom, and draw-to-enclose behavior aligned with the current controls when changing the renderer or assets.
