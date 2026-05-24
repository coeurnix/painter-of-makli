# Painter of Makli Agent Notes

## Project Goal

Painter of Makli is a PlayCanvas web game for Token Game Jam 1. The current app is an early scaffold with the intended mode structure in place:

- Black click-to-start splash screen that unlocks audio and preloads core assets.
- Main menu with animated 3D PlayCanvas background and New Game / Load Game buttons.
- Cutscene shell with letterboxed video area, independent subtitle line, and room to add narration audio.
- Top-down 3D exploration mode using `resources/hero-playcanvas.glb` plus rootless animation GLBs when compatible. The current view is an angled PlayCanvas camera over a placeholder Makli-inspired ruins layout.
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
- The procedural floor, ruins, menu scene, music loop, cutscene content, and painting images are placeholders meant to be replaced with final game assets.
- The current movement supports WASD/arrow keys, click-to-run-to, click-hold pointer movement through PlayCanvas pointer events, custom pointer/wheel camera controls, right-stick camera rotation, touch pointer movement on coarse-pointer devices, and controller left-stick movement.
- The explore mode normalizes `resources/hero-playcanvas.glb` to roughly human scale at import time. Keep that normalization unless the source asset is re-exported at game scale.

## Important Implementation Detail

The supplied walk/run animations may include root motion. The exploration mode moves `playerRoot` in code and keeps `visualRoot.position` reset each frame so the character origin stays stable. If animation retargeting changes later, preserve the separation between logical movement and visual animation.
