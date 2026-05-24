import {
  Application,
  Asset,
  BLEND_NORMAL,
  CULLFACE_NONE,
  calculateNormals,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  FOG_LINEAR,
  GAMMA_SRGB,
  Mat4,
  Mesh,
  MeshInstance,
  Keyboard,
  Mouse,
  Quat,
  RESOLUTION_AUTO,
  SHADOW_PCSS_32F,
  StandardMaterial,
  TONEMAP_ACES2,
  TouchDevice,
  VertexBuffer,
  VertexFormat,
  Vec2,
  Vec3
} from "playcanvas";
import "./styles.css";

type LocomotionAnimation = "idle" | "walkStart" | "walkLoop" | "walkStop";

const RESOURCE_ROOT = "/resources/";
const HERO_MODEL = "hero-playcanvas.glb";
const HERO_ANIMATIONS = {
  idle: "animations/rootless/m_idle_breathe_01.glb",
  walkStart: "animations/rootless/m_walk_stop.glb",
  walkLoop: "animations/rootless/m_walk_neutral.glb",
  walkStop: "animations/rootless/m_walk_stop.glb"
} as const satisfies Record<LocomotionAnimation, string>;
const WALK_SPEED = 2.2;
const RUN_SPEED = 4.2;
const SPRINT_SPEED = 5.3;
const MOVE_ACCELERATION = 5.8;
const MOVE_DECELERATION = 8.5;
const PLAYER_RADIUS = 0.42;
const INTERACTION_RANGE = 1.55;
const INTERACTION_FOCUS_RANGE = 4.6;
const MODEL_FORWARD_OFFSET = 0;
const KEYBOARD_ROTATION_SPEED = 1.9;
const POINTER_ROTATION_SPEED = 0.0065;
const GAMEPAD_ROTATION_SPEED = 2.4;
const TOUCH_ROTATION_SPEED = 0.008;

const selectors = {
  canvas: "#renderCanvas",
  splash: "#splash",
  beginButton: "#beginButton",
  mainMenu: "#mainMenu",
  newGameButton: "#newGameButton",
  loadGameButton: "#loadGameButton",
  hud: "#hud",
  modeLabel: "#modeLabel",
  paintingModeButton: "#paintingModeButton",
  exploreModeButton: "#exploreModeButton",
  menuModeButton: "#menuModeButton",
  paintingScreen: "#paintingScreen",
  paintingCanvas: "#paintingCanvas",
  paintScore: "#paintScore",
  paintCoverage: "#paintCoverage",
  paintingDoneButton: "#paintingDoneButton",
  cutsceneScreen: "#cutsceneScreen",
  cutsceneVideo: "#cutsceneVideo",
  cutsceneFallback: "#cutsceneFallback",
  subtitleLine: "#subtitleLine"
} as const;

type Obstacle = {
  center: Vec2;
  radius: number;
};

type Interactable = {
  entity: Entity;
  label: string;
  position: Vec3;
  range: number;
  radius: number;
};

function bySelector<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element ${selector}`);
  return element;
}

function setHidden(element: Element, hidden: boolean): void {
  element.classList.toggle("hidden", hidden);
}

function postClientLog(level: "error" | "unhandledrejection", args: unknown[]): void {
  const payload = JSON.stringify({
    level,
    href: location.href,
    userAgent: navigator.userAgent,
    args: args.map((arg) => {
      if (arg instanceof Error) {
        return { name: arg.name, message: arg.message, stack: arg.stack };
      }
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
  });

  navigator.sendBeacon?.("/__client-log", new Blob([payload], { type: "application/json" })) ||
    fetch("/__client-log", { method: "POST", body: payload, keepalive: true }).catch(() => undefined);
}

const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  originalConsoleError(...args);
  postClientLog("error", args);
};
window.addEventListener("unhandledrejection", (event) => postClientLog("unhandledrejection", [event.reason]));
window.addEventListener("error", (event) => postClientLog("error", [event.error ?? event.message]));

function makeMaterial(name: string, color: Color, emissive?: Color): StandardMaterial {
  const material = new StandardMaterial();
  material.name = name;
  material.diffuse = color;
  material.emissive = emissive ?? new Color(0, 0, 0);
  material.update();
  return material;
}

function vec3(x = 0, y = 0, z = 0): Vec3 {
  return new Vec3(x, y, z);
}

function copyVec3(value: Vec3): Vec3 {
  return new Vec3(value.x, value.y, value.z);
}

function addVec3(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scaleVec3(value: Vec3, scalar: number): Vec3 {
  return new Vec3(value.x * scalar, value.y * scalar, value.z * scalar);
}

function lengthVec3(value: Vec3): number {
  return Math.hypot(value.x, value.y, value.z);
}

function lengthSqVec3(value: Vec3): number {
  return value.x * value.x + value.y * value.y + value.z * value.z;
}

function normalizeVec3(value: Vec3): Vec3 {
  const length = lengthVec3(value);
  return length > 0.00001 ? scaleVec3(value, 1 / length) : vec3();
}

function distanceVec3(a: Vec3, b: Vec3): number {
  return lengthVec3(subVec3(a, b));
}

function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function addVec2(a: Vec2, b: Vec2): Vec2 {
  return new Vec2(a.x + b.x, a.y + b.y);
}

function subVec2(a: Vec2, b: Vec2): Vec2 {
  return new Vec2(a.x - b.x, a.y - b.y);
}

function scaleVec2(value: Vec2, scalar: number): Vec2 {
  return new Vec2(value.x * scalar, value.y * scalar);
}

function lengthVec2(value: Vec2): number {
  return Math.hypot(value.x, value.y);
}

function lengthSqVec2(value: Vec2): number {
  return value.x * value.x + value.y * value.y;
}

function normalizeVec2(value: Vec2): Vec2 {
  const length = lengthVec2(value);
  return length > 0.00001 ? scaleVec2(value, 1 / length) : new Vec2();
}

function distanceVec2(a: Vec2, b: Vec2): number {
  return lengthVec2(subVec2(a, b));
}

function dotVec2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function lerpAngleDegrees(from: number, to: number, amount: number): number {
  const delta = Math.atan2(Math.sin((to - from) * Math.PI / 180), Math.cos((to - from) * Math.PI / 180));
  return from + (delta * 180 / Math.PI) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hash2(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(0, 1, x - ix);
  const fz = smoothstep(0, 1, z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
}

function terrainHeightAt(x: number, z: number): number {
  const broad = valueNoise(x * 0.055, z * 0.055) - 0.5;
  const dune = Math.sin(x * 0.23 + z * 0.17) * 0.055 + Math.sin(z * 0.31 - x * 0.08) * 0.035;
  const broken = (valueNoise(x * 0.34 + 11.3, z * 0.34 - 7.8) - 0.5) * 0.105;
  const grit = (valueNoise(x * 1.45 - 2.2, z * 1.45 + 5.4) - 0.5) * 0.018;
  const plaza = Math.exp(-((z + 2.1 + Math.sin(x * 0.18) * 1.2) ** 2) / 20) * 0.075;
  return broad * 0.3 + dune + broken + grit - plaza - 0.08;
}

function terrainBlendAt(x: number, z: number): { sand: number; dirt: number; grass: number; stone: number } {
  const pathWear = Math.exp(-((z + 2.1 + Math.sin(x * 0.18) * 1.2) ** 2) / 20);
  const grassNoise = valueNoise(x * 0.115 - 4.2, z * 0.115 + 8.1);
  const scrubNoise = valueNoise(x * 0.34 + 2.7, z * 0.34 - 5.8);
  const stoneNoise = valueNoise(x * 0.55, z * 0.55);
  const courtyard = Math.exp(-((x * 0.055) ** 2 + ((z + 0.8) * 0.08) ** 2));
  const grass = clamp((grassNoise - 0.5) * 2.2 + scrubNoise * 0.32 - pathWear * 0.95 - courtyard * 0.65, 0, 0.72);
  const stone = clamp((stoneNoise - 0.58) * 1.65 + pathWear * 0.3 + courtyard * 0.38, 0, 0.78);
  const dirt = clamp(0.34 + pathWear * 0.48 + (valueNoise(x * 0.19, z * 0.19) - 0.5) * 0.32, 0, 0.95);
  const sand = clamp(1 - dirt * 0.62 - grass * 0.82 - stone * 0.72, 0, 1);
  return { sand, dirt, grass, stone };
}

class MusicLoop {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.context = this.context ?? new AudioContext();
    await this.context.resume();
    this.master = this.context.createGain();
    this.master.gain.value = 0.045;
    this.master.connect(this.context.destination);
    this.isRunning = true;
    this.schedulePhrase();
    this.timer = window.setInterval(() => this.schedulePhrase(), 8000);
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
    this.isRunning = false;
    this.master?.disconnect();
    this.master = null;
  }

  private schedulePhrase(): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const notes = [220, 261.63, 329.63, 392, 329.63, 293.66, 246.94, 220];
    notes.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index);
      gain.gain.linearRampToValueAtTime(0.18, now + index + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index + 0.9);
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start(now + index);
      oscillator.stop(now + index + 1);
    });
  }
}

class MenuBackground {
  private root = new Entity("menuRoot");
  private camera = new Entity("menuCamera");
  private pillars: Entity[] = [];

  constructor(app: Application) {
    app.root.addChild(this.root);
    this.root.enabled = false;

    this.camera.addComponent("camera", {
      clearColor: new Color(0.015, 0.012, 0.018),
      fov: 52
    });
    this.camera.setPosition(0, 7, 14);
    this.camera.lookAt(0, 0.5, 0);
    this.root.addChild(this.camera);

    const ambient = new Entity("menuAmbient");
    ambient.addComponent("light", { type: "omni", intensity: 0.35, range: 34, color: new Color(0.55, 0.5, 0.42) });
    ambient.setPosition(0, 8, 0);
    this.root.addChild(ambient);

    const key = new Entity("menuKey");
    key.addComponent("light", { type: "directional", intensity: 2.2, color: new Color(1, 0.86, 0.62) });
    key.setEulerAngles(52, -35, 0);
    this.root.addChild(key);

    const ground = this.primitive("menuGround", "box", makeMaterial("menuGroundMaterial", new Color(0.08, 0.075, 0.065)));
    ground.setLocalScale(36, 0.08, 36);
    ground.setPosition(0, -0.04, 0);

    const stone = makeMaterial("menuStoneMaterial", new Color(0.46, 0.42, 0.35), new Color(0.025, 0.02, 0.012));
    for (let i = 0; i < 18; i += 1) {
      const pillar = this.primitive(`menuPillar${i}`, "cylinder", stone);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 5.5 + (i % 4) * 1.7;
      const height = 1.5 + Math.random() * 3;
      pillar.setLocalScale(0.7, height, 0.7);
      pillar.setPosition(Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius);
      pillar.setLocalEulerAngles(0, angle * 180 / Math.PI, 0);
      this.pillars.push(pillar);
    }
  }

  setActive(active: boolean): void {
    this.root.enabled = active;
  }

  update(): void {
    if (!this.root.enabled) return;
    const time = performance.now() * 0.00008;
    const x = Math.cos(Math.PI * 1.15 + Math.sin(time) * 0.08) * 14;
    const z = Math.sin(Math.PI * 1.15 + Math.sin(time) * 0.08) * 14;
    this.camera.setPosition(x, 6.2, z);
    this.camera.lookAt(0, 0.7, 0);
    this.pillars.forEach((pillar, index) => {
      const pos = pillar.getPosition();
      pillar.setPosition(pos.x, pillar.getLocalScale().y * 0.5 + Math.sin(time * 8 + index) * 0.03, pos.z);
    });
  }

  private primitive(name: string, type: "box" | "cylinder", material: StandardMaterial): Entity {
    const entity = new Entity(name);
    entity.addComponent("render", { type, material });
    this.root.addChild(entity);
    return entity;
  }
}

class ExplorationMode {
  private root = new Entity("exploreRoot");
  private camera = new Entity("exploreCamera");
  private playerRoot = new Entity("playerRoot");
  private visualRoot = new Entity("visualRoot");
  private modelRoot = new Entity("modelRoot");
  private destinationMarker: Entity;
  private focusMarker: Entity;
  private target: Vec3 | null = null;
  private path: Vec3[] = [];
  private pendingInteract: Interactable | null = null;
  private focusedInteractable: Interactable | null = null;
  private hoveredInteractable: Interactable | null = null;
  private interactables: Interactable[] = [];
  private obstacles: Obstacle[] = [];
  private occluders: Entity[] = [];
  private grassMesh: Mesh | null = null;
  private grassBasePositions: Float32Array | null = null;
  private grassPositions: Float32Array | null = null;
  private grassPhases: Float32Array | null = null;
  private velocity = vec3();
  private lastGamepadButtons = new Set<number>();
  private keys = new Set<string>();
  private activePointers = new Map<number, PointerEvent>();
  private steerPointerId: number | null = null;
  private steerPoint: Vec3 | null = null;
  private rotatePointerId: number | null = null;
  private rotateDragLastX = 0;
  private lastPinchDistance = 0;
  private lastRotateX = 0;
  private cameraYaw = -45;
  private cameraPitch = 38;
  private cameraRadius = 20;
  private visualYaw = 0;
  private animationState: LocomotionAnimation = "idle";
  private loaded = false;

  constructor(private app: Application, private canvas: HTMLCanvasElement) {
    app.root.addChild(this.root);
    this.root.enabled = false;
    this.configureScene();

    this.playerRoot.addChild(this.visualRoot);
    this.visualRoot.addChild(this.modelRoot);
    this.root.addChild(this.playerRoot);

    this.camera.addComponent("camera", {
      clearColor: new Color(0.5, 0.47, 0.4),
      fov: 31,
      gammaCorrection: GAMMA_SRGB,
      toneMapping: TONEMAP_ACES2
    });
    this.root.addChild(this.camera);

    const ambient = new Entity("ambient");
    ambient.addComponent("light", { type: "omni", intensity: 0.5, range: 38, color: new Color(0.56, 0.52, 0.46) });
    ambient.setPosition(-7, 6, 8);
    this.root.addChild(ambient);

    const sun = new Entity("sun");
    sun.addComponent("light", {
      type: "directional",
      intensity: 2.35,
      color: new Color(1, 0.78, 0.52),
      castShadows: true,
      shadowDistance: 54,
      shadowResolution: 4096,
      shadowIntensity: 0.56,
      shadowBias: 0.028,
      normalOffsetBias: 0.18,
      numCascades: 4,
      cascadeBlend: 0.12,
      cascadeDistribution: 0.72,
      shadowType: SHADOW_PCSS_32F,
      shadowSamples: 24,
      shadowBlockerSamples: 12,
      penumbraSize: 1.55,
      penumbraFalloff: 1.45
    });
    sun.setEulerAngles(50, -126, 0);
    this.root.addChild(sun);

    this.createRuinsLevel();
    this.destinationMarker = this.marker("destinationMarker", new Color(0.1, 0.75, 0.55));
    this.destinationMarker.enabled = false;
    this.focusMarker = this.marker("interactionFocusMarker", new Color(1, 0.78, 0.24));
    this.focusMarker.setLocalScale(1.45, 0.045, 1.45);
    this.focusMarker.enabled = false;

    this.bindInput();
    void this.loadHero();
    this.updateCamera();
  }

  private configureScene(): void {
    this.app.scene.ambientLight = new Color(0.28, 0.24, 0.18);
    this.app.scene.exposure = 0.88;
    this.app.scene.fog.type = FOG_LINEAR;
    this.app.scene.fog.color = new Color(0.5, 0.45, 0.37);
    this.app.scene.fog.start = 36;
    this.app.scene.fog.end = 92;
    this.app.scene.skyboxIntensity = 0.22;
  }

  setActive(active: boolean): void {
    this.root.enabled = active;
  }

  update(dt: number): void {
    if (!this.root.enabled) return;
    this.handleKeyboardRotation(dt);
    this.handleGamepadActions(dt);
    this.updateFocusMarker();
    this.updateOccluders();
    this.updateGrass(dt);

    const input = this.combinedMovementVector();
    let desired = vec3();
    let speed = this.keys.has("shift") ? SPRINT_SPEED : WALK_SPEED;

    if (lengthSqVec2(input) > 0) {
      const forward = this.screenUpOnGround();
      const right = vec3(-forward.z, 0, forward.x);
      desired = addVec3(scaleVec3(forward, input.y), scaleVec3(right, input.x));
      const strength = Math.min(1, lengthVec2(input));
      desired = normalizeVec3(desired);
      speed = strength > 0.72 || this.keys.has("shift") ? (this.keys.has("shift") ? SPRINT_SPEED : RUN_SPEED) : WALK_SPEED;
      this.cancelClickIntent();
    } else if (this.steerPoint) {
      const delta = subVec3(this.steerPoint, this.playerRoot.getPosition());
      delta.y = 0;
      if (lengthVec3(delta) > 0.35) {
        desired = normalizeVec3(delta);
        speed = RUN_SPEED;
      }
    } else if (this.path.length > 0) {
      const waypoint = this.path[0];
      const delta = subVec3(waypoint, this.playerRoot.getPosition());
      delta.y = 0;
      const distance = lengthVec3(delta);
      if (distance > 0.16) {
        desired = normalizeVec3(delta);
        speed = distance > 2.3 ? RUN_SPEED : WALK_SPEED;
      } else {
        this.path.shift();
        if (this.path.length === 0) {
          this.target = null;
          this.destinationMarker.enabled = false;
          if (this.pendingInteract) this.performInteraction(this.pendingInteract);
        }
      }
    }

    const desiredVelocity = lengthSqVec3(desired) > 0 ? scaleVec3(desired, speed) : vec3();
    this.velocity = this.approachVelocity(this.velocity, desiredVelocity, dt);
    const actualSpeed = lengthVec3(this.velocity);

    if (lengthSqVec3(this.velocity) > 0.002) {
      this.moveWithCollision(scaleVec3(this.velocity, dt));
      const yaw = Math.atan2(this.velocity.x, this.velocity.z) * 180 / Math.PI;
      this.visualYaw = lerpAngleDegrees(this.visualYaw, yaw, Math.min(1, dt * 14));
      this.visualRoot.setLocalEulerAngles(0, this.visualYaw + MODEL_FORWARD_OFFSET, 0);
      this.visualRoot.setLocalPosition(0, 0, 0);
    } else {
      this.velocity.set(0, 0, 0);
      this.visualRoot.setLocalPosition(0, 0, 0);
      const position = this.playerRoot.getPosition();
      this.playerRoot.setPosition(position.x, terrainHeightAt(position.x, position.z), position.z);
    }

    if (this.loaded) this.updateLocomotionBlend(actualSpeed);
    this.updateCamera();
  }

  private bindInput(): void {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      this.keys.add(key);
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        this.cancelClickIntent();
      } else if (key === "f") {
        this.tryInteract();
      } else if (key === " ") {
        event.preventDefault();
        this.dodgeForward();
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.zoomBy(Math.sign(event.deltaY) * 1.3);
    }, { passive: false });
    this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.canvas.addEventListener("pointercancel", (event) => this.onPointerUp(event));
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.root.enabled) return;
    this.activePointers.set(event.pointerId, event);
    if (this.rotatePointerId === event.pointerId) {
      event.preventDefault();
      this.rotateCamera((event.clientX - this.rotateDragLastX) * POINTER_ROTATION_SPEED);
      this.rotateDragLastX = event.clientX;
      return;
    }
    this.updateTouchGestures(event);
    if (this.steerPointerId === event.pointerId) {
      this.steerPoint = this.pickGroundPoint(event.clientX, event.clientY);
    } else {
      this.hoveredInteractable = this.pickInteractable(event.clientX, event.clientY);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.root.enabled) return;
    this.activePointers.set(event.pointerId, event);
    if (event.pointerType === "mouse" && (event.button === 1 || event.button === 2)) {
      event.preventDefault();
      this.rotatePointerId = event.pointerId;
      this.rotateDragLastX = event.clientX;
      this.canvas.setPointerCapture?.(event.pointerId);
      return;
    }

    const interactable = this.pickInteractable(event.clientX, event.clientY);
    if (interactable) {
      this.moveToInteract(interactable);
      return;
    }

    const groundPoint = this.pickGroundPoint(event.clientX, event.clientY);
    if (groundPoint) {
      this.setDestination(groundPoint);
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        this.steerPointerId = event.pointerId;
        this.steerPoint = groundPoint;
      }
    }
  }

  private onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    if (this.rotatePointerId === event.pointerId) {
      this.rotatePointerId = null;
      this.canvas.releasePointerCapture?.(event.pointerId);
    }
    if (this.steerPointerId === event.pointerId) {
      this.steerPointerId = null;
      this.steerPoint = null;
    }
    this.lastPinchDistance = 0;
    this.lastRotateX = 0;
  }

  private createRuinsLevel(): void {
    const stone = makeMaterial("ruinStoneMaterial", new Color(0.49, 0.39, 0.28));
    stone.specular = new Color(0.09, 0.075, 0.055);
    stone.gloss = 0.22;
    stone.update();
    const paleStone = makeMaterial("paleCarvedStoneMaterial", new Color(0.57, 0.5, 0.4));
    paleStone.specular = new Color(0.08, 0.075, 0.06);
    paleStone.gloss = 0.18;
    paleStone.update();
    const darkStone = makeMaterial("darkRuinStoneMaterial", new Color(0.29, 0.22, 0.15));
    darkStone.specular = new Color(0.05, 0.04, 0.03);
    darkStone.gloss = 0.12;
    darkStone.update();
    const shadowStone = makeMaterial("deepDoorwayMaterial", new Color(0.045, 0.036, 0.028));

    this.createTerrain();
    this.createBrokenPaving(stone, paleStone, darkStone);

    this.createMausoleum(-16.5, -10.5, 7.6, paleStone, stone, darkStone, shadowStone);
    this.createMausoleum(14.8, 8.4, 8.7, paleStone, stone, darkStone, shadowStone);
    this.createMausoleum(23.8, -7.8, 9.4, stone, paleStone, darkStone, shadowStone);
    this.createOpenRuin(9.2, -7.0, stone, darkStone);
    this.createOpenRuin(-9.5, 7.6, paleStone, darkStone);
    this.createGatehouse(-0.5, 13.2, paleStone, darkStone, shadowStone);
    this.createCollapsedArcade(-13.4, 3.0, stone, darkStone);
    this.createInteractables(stone, darkStone);

    this.createInstancedRockField();
    this.createScrubField();
    this.createGrassField();
  }

  private createTerrain(): void {
    const size = 72;
    const segments = 180;
    const vertexCount = (segments + 1) * (segments + 1);
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const colors = new Uint8Array(vertexCount * 4);
    const indices = new Uint32Array(segments * segments * 6);
    const sand = new Color(0.48, 0.36, 0.23);
    const dirt = new Color(0.25, 0.2, 0.14);
    const grass = new Color(0.15, 0.19, 0.08);
    const stone = new Color(0.39, 0.35, 0.29);

    let vertex = 0;
    for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
      const z = (zIndex / segments - 0.5) * size;
      for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
        const x = (xIndex / segments - 0.5) * size;
        const y = terrainHeightAt(x, z);
        const blend = terrainBlendAt(x, z);
        const micro = valueNoise(x * 3.8 + 14.1, z * 3.8 - 9.4);
        const fleck = valueNoise(x * 9.2, z * 9.2);
        const crack = smoothstep(0.84, 0.96, valueNoise(x * 1.15 - 3.8, z * 1.15 + 8.6));
        const shade = 0.6 + valueNoise(x * 1.35, z * 1.35) * 0.22 + micro * 0.08 - crack * 0.16 + (fleck > 0.86 ? 0.08 : 0);
        const warmth = 0.94 + valueNoise(x * 0.72 - 5.4, z * 0.72 + 1.2) * 0.14;
        const r = (sand.r * blend.sand + dirt.r * blend.dirt + grass.r * blend.grass + stone.r * blend.stone) * shade * warmth;
        const g = (sand.g * blend.sand + dirt.g * blend.dirt + grass.g * blend.grass + stone.g * blend.stone) * shade * (0.98 + micro * 0.04);
        const b = (sand.b * blend.sand + dirt.b * blend.dirt + grass.b * blend.grass + stone.b * blend.stone) * shade * (0.9 + micro * 0.05);
        positions[vertex * 3] = x;
        positions[vertex * 3 + 1] = y;
        positions[vertex * 3 + 2] = z;
        uvs[vertex * 2] = x / 5;
        uvs[vertex * 2 + 1] = z / 5;
        colors[vertex * 4] = Math.round(clamp(r, 0, 1) * 255);
        colors[vertex * 4 + 1] = Math.round(clamp(g, 0, 1) * 255);
        colors[vertex * 4 + 2] = Math.round(clamp(b, 0, 1) * 255);
        colors[vertex * 4 + 3] = 255;
        vertex += 1;
      }
    }

    let index = 0;
    for (let zIndex = 0; zIndex < segments; zIndex += 1) {
      for (let xIndex = 0; xIndex < segments; xIndex += 1) {
        const a = zIndex * (segments + 1) + xIndex;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices[index++] = a;
        indices[index++] = c;
        indices[index++] = b;
        indices[index++] = b;
        indices[index++] = c;
        indices[index++] = d;
      }
    }

    const mesh = new Mesh(this.app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(calculateNormals(Array.from(positions), Array.from(indices)));
    mesh.setUvs(0, uvs);
    mesh.setColors32(colors);
    mesh.setIndices(indices);
    mesh.update();

    const material = new StandardMaterial();
    material.name = "terrainSandDirtGrass";
    material.diffuse = new Color(0.86, 0.82, 0.76);
    material.diffuseVertexColor = true;
    material.gloss = 0.18;
    material.specular = new Color(0.11, 0.09, 0.06);
    material.update();

    const terrain = new Entity("proceduralTerrain");
    terrain.addComponent("render", { meshInstances: [new MeshInstance(mesh, material)], receiveShadows: true, castShadows: false });
    this.root.addChild(terrain);
  }

  private createBrokenPaving(stone: StandardMaterial, paleStone: StandardMaterial, darkStone: StandardMaterial): void {
    let index = 0;
    for (let row = -5; row <= 5; row += 1) {
      for (let column = -7; column <= 7; column += 1) {
        const skip = hash2(column + 30, row + 50) > 0.68 || (Math.abs(column) < 1 && Math.abs(row) < 1);
        if (skip) continue;
        const x = column * 2.28 + Math.sin(row * 1.7 + column) * 0.28;
        const z = row * 1.68 - 1.5 + Math.cos(column * 1.3) * 0.22;
        const slab = this.primitive(`stoneSlab${index}`, "box", hash2(column, row) > 0.72 ? darkStone : (index % 3 === 0 ? paleStone : stone));
        const width = 1.28 + hash2(column, row + 3) * 0.42;
        const depth = 0.86 + hash2(column + 6, row) * 0.32;
        const height = 0.075 + hash2(column + 2, row + 7) * 0.075;
        slab.setLocalScale(width, height, depth);
        slab.setPosition(x, terrainHeightAt(x, z) + height * 0.5 + 0.018, z);
        slab.setLocalEulerAngles(hash2(row, column) * 2.4 - 1.2, -5 + hash2(column, row) * 10, hash2(row + 1, column) * 2.2 - 1.1);
        index += 1;
      }
    }

    for (let i = 0; i < 70; i += 1) {
      const x = (hash2(i, 16) - 0.5) * 33;
      const z = (hash2(i + 8, 18) - 0.5) * 24 - 1.5;
      const shard = this.primitive(`pavingChip${i}`, "box", i % 4 === 0 ? darkStone : stone);
      const scale = 0.18 + hash2(i, 4) * 0.42;
      shard.setLocalScale(scale * (1.2 + hash2(i, 6)), 0.04 + scale * 0.12, scale * (0.55 + hash2(i, 8)));
      shard.setPosition(x, terrainHeightAt(x, z) + 0.035, z);
      shard.setLocalEulerAngles(-4 + hash2(i, 2) * 8, hash2(i, 9) * 360, -5 + hash2(i, 11) * 10);
    }
  }

  private createInstancedRockField(): void {
    const rockMaterial = makeMaterial("instancedRockMaterial", new Color(0.42, 0.32, 0.2));
    rockMaterial.gloss = 0.18;
    rockMaterial.update();
    const rockMesh = this.createRockMesh();
    const rockInstance = new MeshInstance(rockMesh, rockMaterial);
    rockInstance.castShadow = true;
    rockInstance.receiveShadow = true;
    const count = 520;
    const matrices = new Float32Array(count * 16);
    const matrix = new Mat4();
    const rotation = new Quat();
    let written = 0;

    for (let i = 0; i < count * 2 && written < count; i += 1) {
      const x = (hash2(i, 7.7) - 0.5) * 66;
      const z = (hash2(i + 19.4, 2.1) - 0.5) * 66;
      if (Math.abs(x) < 2.8 && Math.abs(z) < 4.5) continue;
      const scale = 0.1 + hash2(i, 3.3) * 0.48;
      rotation.setFromEulerAngles(-6 + hash2(i, 1.2) * 12, hash2(i, 9.8) * 360, -8 + hash2(i, 5.1) * 16);
      matrix.setTRS(
        vec3(x, terrainHeightAt(x, z) + scale * 0.28, z),
        rotation,
        vec3(scale * (1.2 + hash2(i, 11.2) * 1.3), scale * (0.55 + hash2(i, 4.2) * 0.7), scale * (0.8 + hash2(i, 6.4)))
      );
      matrices.set(matrix.data, written * 16);
      written += 1;
    }

    const instanceBuffer = new VertexBuffer(
      this.app.graphicsDevice,
      VertexFormat.getDefaultInstancingFormat(this.app.graphicsDevice),
      written,
      { data: matrices.slice(0, written * 16).buffer }
    );
    rockInstance.setInstancing(instanceBuffer);
    rockInstance.instancingCount = written;

    const rocks = new Entity("instancedRockField");
    rocks.addComponent("render", { meshInstances: [rockInstance], castShadows: true, receiveShadows: true });
    this.root.addChild(rocks);
  }

  private createScrubField(): void {
    const twigMaterial = makeMaterial("dryScrubTwigMaterial", new Color(0.24, 0.19, 0.11), new Color(0.025, 0.018, 0.01));
    const leafMaterial = makeMaterial("dryScrubLeafMaterial", new Color(0.32, 0.34, 0.15), new Color(0.02, 0.022, 0.01));
    const strawMaterial = makeMaterial("strawScrubMaterial", new Color(0.66, 0.52, 0.27), new Color(0.035, 0.025, 0.012));
    for (let i = 0; i < 115; i += 1) {
      const x = (hash2(i, 41.3) - 0.5) * 62;
      const z = (hash2(i + 9.2, 35.7) - 0.5) * 62;
      if (Math.abs(x) < 3.2 && Math.abs(z) < 4.8) continue;
      const blend = terrainBlendAt(x, z);
      if (blend.stone > 0.55 && hash2(i, 12) > 0.35) continue;
      const clump = new Entity(`scrubClump${i}`);
      clump.setPosition(x, terrainHeightAt(x, z) + 0.03, z);
      clump.setLocalEulerAngles(0, hash2(i, 14) * 360, 0);
      this.root.addChild(clump);
      const stems = 3 + Math.floor(hash2(i, 16) * 5);
      for (let j = 0; j < stems; j += 1) {
        const height = 0.42 + hash2(i + j, 18) * 0.72;
        const stem = this.primitive(`scrubStem${i}-${j}`, "cylinder", j % 3 === 0 ? strawMaterial : twigMaterial);
        stem.setLocalScale(0.018 + hash2(j, i) * 0.018, height, 0.018 + hash2(j + 2, i) * 0.018);
        stem.setPosition(x + (hash2(i, j) - 0.5) * 0.55, terrainHeightAt(x, z) + height * 0.5, z + (hash2(j, i) - 0.5) * 0.55);
        stem.setLocalEulerAngles(-14 + hash2(i, j + 3) * 28, hash2(i + j, 22) * 360, -10 + hash2(i + 4, j) * 20);
      }
      if (hash2(i, 24) > 0.58) {
        const crown = this.primitive(`scrubCrown${i}`, "sphere", leafMaterial);
        const scale = 0.42 + hash2(i, 27) * 0.4;
        crown.setLocalScale(scale * 1.35, scale * 0.42, scale);
        crown.setPosition(x, terrainHeightAt(x, z) + 0.38 + scale * 0.18, z);
        crown.setLocalEulerAngles(0, hash2(i, 29) * 360, 0);
      }
    }
  }

  private createRockMesh(): Mesh {
    const positions = [
      -0.55, -0.35, -0.45, 0.52, -0.32, -0.36, 0.42, -0.28, 0.48, -0.48, -0.3, 0.42,
      -0.42, 0.28, -0.34, 0.46, 0.22, -0.3, 0.36, 0.31, 0.38, -0.38, 0.24, 0.34
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0
    ];
    const mesh = new Mesh(this.app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(calculateNormals(positions, indices));
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  private createGrassField(): void {
    const bladeCount = 2600;
    const verticesPerBlade = 8;
    const positions = new Float32Array(bladeCount * verticesPerBlade * 3);
    const colors = new Uint8Array(bladeCount * verticesPerBlade * 4);
    const phases = new Float32Array(bladeCount * verticesPerBlade);
    const indices = new Uint32Array(bladeCount * 12);
    const grassColors = [
      new Color(0.2, 0.28, 0.1),
      new Color(0.39, 0.39, 0.16),
      new Color(0.62, 0.48, 0.22),
      new Color(0.14, 0.16, 0.07)
    ];
    let blade = 0;
    for (let attempt = 0; attempt < bladeCount * 4 && blade < bladeCount; attempt += 1) {
      const x = (hash2(attempt, 22.1) - 0.5) * 64;
      const z = (hash2(attempt + 3.9, 12.4) - 0.5) * 64;
      const blend = terrainBlendAt(x, z);
      if (blend.grass < 0.11 && hash2(attempt, 99) > 0.42) continue;
      const height = 0.32 + hash2(attempt, 5.8) * 0.82;
      const width = 0.028 + hash2(attempt, 4.4) * 0.036;
      const angle = hash2(attempt, 7.1) * Math.PI;
      const bend = 0.04 + hash2(attempt, 8.8) * 0.08;
      this.writeGrassBlade(positions, colors, phases, blade, x, z, width, height, angle, bend, grassColors[attempt % grassColors.length]);
      const base = blade * verticesPerBlade;
      const index = blade * 12;
      indices.set([base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 4, base + 5, base + 6, base + 5, base + 7, base + 6], index);
      blade += 1;
    }

    this.grassBasePositions = positions.slice(0, blade * verticesPerBlade * 3);
    this.grassPositions = new Float32Array(this.grassBasePositions);
    this.grassPhases = phases.slice(0, blade * verticesPerBlade);
    const usedIndices = indices.slice(0, blade * 12);
    this.grassMesh = new Mesh(this.app.graphicsDevice);
    this.grassMesh.setPositions(this.grassPositions);
    this.grassMesh.setNormals(calculateNormals(Array.from(this.grassPositions), Array.from(usedIndices)));
    this.grassMesh.setColors32(colors.slice(0, blade * verticesPerBlade * 4));
    this.grassMesh.setIndices(usedIndices);
    this.grassMesh.update();

    const material = new StandardMaterial();
    material.name = "windGrassMaterial";
    material.diffuse = new Color(1, 1, 1);
    material.emissive = new Color(0.025, 0.022, 0.012);
    material.diffuseVertexColor = true;
    material.cull = CULLFACE_NONE;
    material.twoSidedLighting = true;
    material.opacity = 0.92;
    material.blendType = BLEND_NORMAL;
    material.depthWrite = true;
    material.gloss = 0.08;
    material.update();

    const grass = new Entity("windGrassField");
    grass.addComponent("render", { meshInstances: [new MeshInstance(this.grassMesh, material)], castShadows: false, receiveShadows: true });
    this.root.addChild(grass);
  }

  private writeGrassBlade(
    positions: Float32Array,
    colors: Uint8Array,
    phases: Float32Array,
    blade: number,
    x: number,
    z: number,
    width: number,
    height: number,
    angle: number,
    bend: number,
    color: Color
  ): void {
    const base = blade * 8;
    const y = terrainHeightAt(x, z) + 0.01;
    const dx = Math.cos(angle) * width;
    const dz = Math.sin(angle) * width;
    const tx = Math.sin(angle) * bend;
    const tz = -Math.cos(angle) * bend;
    const vertices = [
      [x - dx, y, z - dz], [x + dx, y, z + dz], [x - dx * 0.25 + tx, y + height, z - dz * 0.25 + tz], [x + dx * 0.25 + tx, y + height, z + dz * 0.25 + tz],
      [x - dz, y, z + dx], [x + dz, y, z - dx], [x - dz * 0.25 + tx, y + height * 0.92, z + dx * 0.25 + tz], [x + dz * 0.25 + tx, y + height * 0.92, z - dx * 0.25 + tz]
    ];
    for (let i = 0; i < vertices.length; i += 1) {
      positions.set(vertices[i], (base + i) * 3);
      const shade = 0.8 + hash2(blade, i) * 0.24;
      colors[(base + i) * 4] = Math.round(clamp(color.r * shade, 0, 1) * 255);
      colors[(base + i) * 4 + 1] = Math.round(clamp(color.g * shade, 0, 1) * 255);
      colors[(base + i) * 4 + 2] = Math.round(clamp(color.b * shade, 0, 1) * 255);
      colors[(base + i) * 4 + 3] = 255;
      phases[base + i] = hash2(blade, 31.7) * Math.PI * 2;
    }
  }

  private createMausoleum(
    x: number,
    z: number,
    size: number,
    stone: StandardMaterial,
    trim: StandardMaterial,
    darkStone: StandardMaterial,
    shadowStone: StandardMaterial
  ): void {
    this.obstacles.push({ center: new Vec2(x, z), radius: size * 0.68 });
    const y = terrainHeightAt(x, z);
    const plinth = this.primitive(`mausoleumPlinth${x}`, "box", darkStone);
    plinth.setLocalScale(size * 1.18, 0.42, size * 1.08);
    plinth.setPosition(x, y + 0.21, z);
    this.occluders.push(plinth);

    const body = this.primitive(`mausoleumBody${x}`, "box", stone);
    body.setLocalScale(size, 2.6, size * 0.92);
    body.setPosition(x, y + 1.55, z);
    this.occluders.push(body);

    const drum = this.primitive(`mausoleumDrum${x}`, "cylinder", trim);
    drum.setLocalScale(size * 0.58, 0.75, size * 0.58);
    drum.setPosition(x, y + 3.22, z);
    this.occluders.push(drum);

    const dome = this.primitive(`mausoleumDome${x}`, "sphere", trim);
    dome.setLocalScale(size * 0.86, size * 0.48, size * 0.86);
    dome.setPosition(x, y + 3.64, z);
    this.occluders.push(dome);

    const cap = this.primitive(`mausoleumFinial${x}`, "cylinder", darkStone);
    cap.setLocalScale(0.18, 0.9, 0.18);
    cap.setPosition(x, y + 4.28, z);

    const frontZ = z - size * 0.47;
    const doorway = this.primitive(`mausoleumDoor${x}`, "box", shadowStone);
    doorway.setLocalScale(size * 0.2, 1.35, 0.05);
    doorway.setPosition(x, y + 0.98, frontZ - 0.025);
    const arch = this.primitive(`mausoleumDoorArch${x}`, "torus", darkStone);
    arch.setLocalScale(size * 0.42, 0.08, size * 0.42);
    arch.setPosition(x, y + 1.69, frontZ - 0.06);
    arch.setLocalEulerAngles(90, 0, 0);

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i += 1) {
        const localX = x + side * size * (0.28 + i * 0.095);
        const panel = this.primitive(`mausoleumPanel${x}-${side}-${i}`, "box", i % 2 ? darkStone : trim);
        panel.setLocalScale(0.045, 1.55, 0.055);
        panel.setPosition(localX, y + 1.48, frontZ - 0.075);
      }
    }

    for (let i = 0; i < 4; i += 1) {
      const sx = i < 2 ? -1 : 1;
      const sz = i % 2 === 0 ? -1 : 1;
      const pillar = this.primitive(`mausoleumPillar${x}-${i}`, "cylinder", darkStone);
      pillar.setLocalScale(0.28, 2.25, 0.28);
      pillar.setPosition(x + sx * size * 0.48, y + 1.28, z + sz * size * 0.43);
    }

    this.createStairs(`mausoleumSteps${x}`, x, frontZ - 0.9, size * 0.62, 4, stone);
  }

  private createOpenRuin(x: number, z: number, stone: StandardMaterial, darkStone: StandardMaterial): void {
    this.obstacles.push({ center: new Vec2(x, z), radius: 3.25 });
    const y = terrainHeightAt(x, z);
    const pieces = [
      [0, -2.4, 5.8, 0.58],
      [-2.4, 0, 0.58, 5.2],
      [2.4, 0.8, 0.58, 3.6],
      [-0.8, 2.4, 3.4, 0.58]
    ];
    pieces.forEach(([px, pz, width, depth], index) => {
      const wall = this.primitive(`openRuinWall${x}-${index}`, "box", index % 2 === 0 ? stone : darkStone);
      const height = 1.35 + index * 0.24;
      wall.setLocalScale(width, height, depth);
      wall.setPosition(x + px, y + height * 0.5, z + pz);
      wall.setLocalEulerAngles(0, -4 + index * 2.5, index % 2 ? 0.8 : -0.6);
      this.occluders.push(wall);
      for (let groove = 0; groove < 5; groove += 1) {
        const trim = this.primitive(`openRuinGroove${x}-${index}-${groove}`, "box", darkStone);
        trim.setLocalScale(Math.max(0.05, width - 0.24), 0.035, 0.035);
        trim.setPosition(x + px, y + 0.42 + groove * (height / 6), z + pz - depth * 0.52);
      }
    });

    for (let i = 0; i < 4; i += 1) {
      const column = this.primitive(`openRuinColumn${x}-${i}`, "cylinder", darkStone);
      column.setLocalScale(0.34, 2.1 + hash2(i, x) * 0.6, 0.34);
      column.setPosition(x - 1.6 + i * 1.05, y + column.getLocalScale().y * 0.5, z - 0.25 + Math.sin(i) * 0.22);
    }
  }

  private createGatehouse(x: number, z: number, stone: StandardMaterial, darkStone: StandardMaterial, shadowStone: StandardMaterial): void {
    this.obstacles.push({ center: new Vec2(x, z), radius: 4.1 });
    const y = terrainHeightAt(x, z);
    const left = this.primitive("gatehouseLeftTower", "box", stone);
    left.setLocalScale(1.7, 3.9, 2.2);
    left.setPosition(x - 2.05, y + 1.95, z);
    const right = this.primitive("gatehouseRightTower", "box", stone);
    right.setLocalScale(1.7, 3.55, 2.2);
    right.setPosition(x + 2.05, y + 1.78, z);
    const lintel = this.primitive("gatehouseLintel", "box", stone);
    lintel.setLocalScale(5.25, 0.76, 1.95);
    lintel.setPosition(x, y + 3.15, z);
    const voidPanel = this.primitive("gatehouseArchVoid", "box", shadowStone);
    voidPanel.setLocalScale(1.55, 2.35, 0.08);
    voidPanel.setPosition(x, y + 1.35, z - 1.02);
    const arch = this.primitive("gatehouseArchTrim", "torus", darkStone);
    arch.setLocalScale(1.75, 0.09, 1.3);
    arch.setPosition(x, y + 2.4, z - 1.08);
    arch.setLocalEulerAngles(90, 0, 0);
    [left, right, lintel].forEach((entity) => this.occluders.push(entity));
    this.createStairs("gatehouseSteps", x, z - 2.15, 3.1, 5, darkStone);
  }

  private createCollapsedArcade(x: number, z: number, stone: StandardMaterial, darkStone: StandardMaterial): void {
    this.obstacles.push({ center: new Vec2(x, z), radius: 4.0 });
    const y = terrainHeightAt(x, z);
    for (let i = 0; i < 5; i += 1) {
      const px = x + i * 1.35;
      const column = this.primitive(`arcadeColumn${i}`, "cylinder", i === 3 ? darkStone : stone);
      const height = i === 1 ? 2.1 : 2.9 - hash2(i, 5) * 0.5;
      column.setLocalScale(0.28, height, 0.28);
      column.setPosition(px, y + height * 0.5, z + Math.sin(i) * 0.16);
      const cap = this.primitive(`arcadeCap${i}`, "box", darkStone);
      cap.setLocalScale(0.72, 0.18, 0.72);
      cap.setPosition(px, y + height + 0.08, z + Math.sin(i) * 0.16);
      if (i < 4) {
        const beam = this.primitive(`arcadeBeam${i}`, "box", stone);
        beam.setLocalScale(1.7, 0.32, 0.42);
        beam.setPosition(px + 0.68, y + 2.72 - hash2(i, 2) * 0.35, z);
        beam.setLocalEulerAngles(0, 0, i === 2 ? -8 : 0);
        this.occluders.push(beam);
      }
    }
  }

  private createStairs(name: string, x: number, z: number, width: number, steps: number, material: StandardMaterial): void {
    for (let i = 0; i < steps; i += 1) {
      const depth = 0.42;
      const step = this.primitive(`${name}${i}`, "box", material);
      step.setLocalScale(width + i * 0.18, 0.12, depth);
      const pz = z - i * depth * 0.78;
      step.setPosition(x, terrainHeightAt(x, pz) + 0.06 + i * 0.07, pz);
    }
  }

  private createInteractables(stone: StandardMaterial, darkStone: StandardMaterial): void {
    const markerPositions: Array<[string, number, number]> = [
      ["Painted shard", -2.7, 2.9],
      ["Weathered inscription", 4.1, -1.8],
      ["Sealed arch", -7.4, 3.6]
    ];

    markerPositions.forEach(([label, x, z], index) => {
      const entity = this.primitive(`interactable${index}`, "cylinder", index % 2 === 0 ? darkStone : stone);
      entity.setLocalScale(0.48, 0.72, 0.48);
      entity.setPosition(x, 0.36, z);
      entity.setLocalEulerAngles(0, index * 35, 0);
      this.interactables.push({
        entity,
        label,
        position: vec3(x, 0.36, z),
        range: INTERACTION_RANGE,
        radius: 0.85
      });
    });
  }

  private async loadHero(): Promise<void> {
    try {
      const asset = await this.loadAsset(`${RESOURCE_ROOT}${HERO_MODEL}`, "container");
      const container = asset.resource as any;
      const entity = container.instantiateRenderEntity({ castShadows: true }) as Entity;
      this.modelRoot.addChild(entity);
      this.normalizeHeroModel(entity);

      this.modelRoot.addComponent("anim", { activate: true });
      const anim = this.modelRoot.anim!;
      anim.rootBone = entity;
      const tracks = await Promise.all(
        (Object.entries(HERO_ANIMATIONS) as Array<[LocomotionAnimation, string]>).map(async ([state, path]) => {
          const animationAsset = await this.loadAsset(`${RESOURCE_ROOT}${path}`, "container");
          const animationContainer = animationAsset.resource as any;
          const track = this.findAnimationTrack(animationContainer, state);
          return [state, track, animationContainer] as const;
        })
      );
      const missing = tracks.filter(([, track]) => !track);
      if (missing.length > 0) {
        console.error("Missing hero animation tracks", missing.map(([state, , animationContainer]) => ({
          state,
          available: this.animationTrackNames(animationContainer)
        })));
      } else {
        for (const [state, track] of tracks) {
          anim.assignAnimation(state, track, undefined, this.animationSpeedForState(state), this.animationLoops(state));
        }
        anim.baseLayer?.play("idle");
      }
      this.loaded = true;
    } catch (error) {
      console.error("Unable to load hero model", error);
      const fallback = this.primitive("fallbackHero", "capsule", makeMaterial("fallbackHeroMaterial", new Color(0.18, 0.23, 0.28)));
      fallback.setLocalScale(0.68, 1.8, 0.68);
      fallback.setPosition(0, 0.9, 0);
      this.modelRoot.addChild(fallback);
      this.loaded = true;
    }
  }

  private loadAsset(url: string, type: string): Promise<Asset> {
    return new Promise((resolve, reject) => {
      this.app.assets.loadFromUrl(url, type, (err, asset) => {
        if (err || !asset) reject(new Error(err ?? `Unable to load ${url}`));
        else resolve(asset);
      });
    });
  }

  private findAnimationTrack(container: any, name: string): any {
    const animations = container.animations ?? [];
    const animationAsset = animations.find((asset: Asset) => {
      const resourceName = (asset.resource as any)?.name;
      return asset.name === name || resourceName === name || asset.name.includes(name) || resourceName?.includes(name);
    }) ?? animations[0] ?? null;
    if (animationAsset && animationAsset.name !== name && (animationAsset.resource as any)?.name !== name) {
      console.info(`Using animation track "${animationAsset.name || (animationAsset.resource as any)?.name}" for "${name}"`);
    }
    return animationAsset?.resource ?? null;
  }

  private animationTrackNames(container: any): string[] {
    return container.animations?.map((asset: Asset) => asset.name || (asset.resource as any)?.name).filter(Boolean) ?? [];
  }

  private normalizeHeroModel(entity: Entity): void {
    this.modelRoot.setLocalScale(1, 1, 1);
    this.modelRoot.setLocalPosition(0, 0, 0);
    this.app.update(0);
    const renders = entity.findComponents("render");
    const renderComponents = renders as any[];
    const bounds = renderComponents.find((render) => render.meshInstances?.length)?.meshInstances?.[0]?.aabb?.clone();
    for (const render of renderComponents) {
      for (const meshInstance of render.meshInstances ?? []) {
        if (bounds) bounds.add(meshInstance.aabb);
      }
    }
    if (!bounds) return;
    const height = bounds.halfExtents.y * 2;
    if (height < 0.25) return;
    const scale = height > 0.001 ? 1.75 / height : 1;
    this.modelRoot.setLocalScale(scale, scale, scale);
    this.app.update(0);

    const scaledBounds = renderComponents.find((render) => render.meshInstances?.length)?.meshInstances?.[0]?.aabb?.clone();
    for (const render of renderComponents) {
      for (const meshInstance of render.meshInstances ?? []) {
        if (scaledBounds) scaledBounds.add(meshInstance.aabb);
      }
    }
    if (!scaledBounds) return;
    this.modelRoot.setLocalPosition(-scaledBounds.center.x, scaledBounds.halfExtents.y - scaledBounds.center.y, -scaledBounds.center.z);
  }

  private updateLocomotionBlend(speed: number): void {
    const anim = this.modelRoot.anim;
    if (!anim?.baseLayer) return;
    const isMoving = speed > 0.18;
    const layer = anim.baseLayer;

    if (isMoving) {
      if (this.animationState === "idle" || this.animationState === "walkStop") {
        this.transitionLocomotion("walkStart", 0.08);
      } else if (this.animationState === "walkStart" && !layer.transitioning && layer.activeStateProgress >= 0.92) {
        this.transitionLocomotion("walkLoop", 0.08);
      }
    } else if (this.animationState === "walkStart" || this.animationState === "walkLoop") {
      this.transitionLocomotion("walkStop", 0.1);
    } else if (this.animationState === "walkStop" && !layer.transitioning && layer.activeStateProgress >= 0.99) {
      this.transitionLocomotion("idle", 0.12);
    }

    anim.speed = this.animationSpeedForState(this.animationState, speed);
    anim.playing = true;
  }

  private transitionLocomotion(state: LocomotionAnimation, blendTime: number): void {
    if (state === this.animationState) return;
    this.modelRoot.anim?.baseLayer?.transition(state, blendTime);
    this.animationState = state;
  }

  private animationSpeedForState(state: LocomotionAnimation, speed = WALK_SPEED): number {
    return state === "walkLoop" ? Math.min(1.35, Math.max(0.72, speed / WALK_SPEED)) : 1;
  }

  private animationLoops(state: LocomotionAnimation): boolean {
    return state === "idle" || state === "walkLoop";
  }

  private updateGrass(dt: number): void {
    if (!this.grassMesh || !this.grassBasePositions || !this.grassPositions || !this.grassPhases) return;
    if (dt <= 0) return;
    const time = performance.now() * 0.001;
    for (let i = 0; i < this.grassPhases.length; i += 1) {
      const positionIndex = i * 3;
      const baseX = this.grassBasePositions[positionIndex];
      const baseY = this.grassBasePositions[positionIndex + 1];
      const baseZ = this.grassBasePositions[positionIndex + 2];
      const rootY = terrainHeightAt(baseX, baseZ);
      const tipWeight = clamp((baseY - rootY) / 0.72, 0, 1);
      const sway = Math.sin(time * 1.9 + this.grassPhases[i] + baseX * 0.21 + baseZ * 0.13) * 0.075 * tipWeight;
      const gust = Math.sin(time * 0.57 + baseX * 0.05) * 0.045 * tipWeight;
      this.grassPositions[positionIndex] = baseX + sway + gust;
      this.grassPositions[positionIndex + 1] = baseY;
      this.grassPositions[positionIndex + 2] = baseZ + sway * 0.38;
    }
    this.grassMesh.setPositions(this.grassPositions);
    this.grassMesh.update();
  }

  private primitive(name: string, type: "box" | "capsule" | "cone" | "cylinder" | "sphere" | "torus", material: StandardMaterial): Entity {
    const entity = new Entity(name);
    entity.addComponent("render", { type, material, castShadows: true, receiveShadows: true });
    this.root.addChild(entity);
    return entity;
  }

  private marker(name: string, color: Color): Entity {
    const material = makeMaterial(`${name}Material`, color, color);
    const marker = this.primitive(name, "torus", material);
    if (marker.render) {
      marker.render.castShadows = false;
      marker.render.receiveShadows = false;
    }
    marker.setLocalScale(0.7, 0.035, 0.7);
    marker.setPosition(0, 0.055, 0);
    return marker;
  }

  private pickGroundPoint(clientX: number, clientY: number): Vec3 | null {
    const ray = this.pointerRay(clientX, clientY);
    if (!ray || Math.abs(ray.direction.y) < 0.0001) return null;
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) return null;
    return addVec3(ray.origin, scaleVec3(ray.direction, t));
  }

  private pickInteractable(clientX: number, clientY: number): Interactable | null {
    const point = this.pickGroundPoint(clientX, clientY);
    if (!point) return null;
    let best: Interactable | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of this.interactables) {
      const distance = Math.hypot(point.x - item.position.x, point.z - item.position.z);
      if (distance <= item.radius && distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best;
  }

  private pointerRay(clientX: number, clientY: number): { origin: Vec3; direction: Vec3 } | null {
    if (!this.camera.camera) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const near = this.camera.camera.screenToWorld(x, y, this.camera.camera.nearClip);
    const far = this.camera.camera.screenToWorld(x, y, this.camera.camera.farClip);
    return { origin: near, direction: normalizeVec3(subVec3(far, near)) };
  }

  private setDestination(point: Vec3, pendingInteract: Interactable | null = null): void {
    this.target = copyVec3(point);
    this.target.y = 0;
    this.path = this.buildPath(this.playerRoot.getPosition(), this.target);
    this.pendingInteract = pendingInteract;
    this.steerPoint = null;
    this.destinationMarker.setPosition(this.target.x, 0.055, this.target.z);
    this.destinationMarker.enabled = !pendingInteract;
  }

  private cancelClickIntent(): void {
    this.target = null;
    this.path = [];
    this.pendingInteract = null;
    this.destinationMarker.enabled = false;
  }

  private moveToInteract(interactable: Interactable): void {
    const playerPosition = this.playerRoot.getPosition();
    const distance = distanceVec3(playerPosition, interactable.position);
    this.pendingInteract = interactable;
    if (distance <= interactable.range) {
      this.performInteraction(interactable);
      return;
    }
    let direction = subVec3(playerPosition, interactable.position);
    direction.y = 0;
    if (lengthSqVec3(direction) < 0.01) direction = vec3(0, 0, 1);
    const standPoint = addVec3(interactable.position, scaleVec3(normalizeVec3(direction), interactable.range * 0.72));
    standPoint.y = 0;
    this.setDestination(standPoint, interactable);
  }

  private tryInteract(): void {
    const target = this.hoveredInteractable ?? this.focusedInteractable ?? this.bestNearbyInteractable();
    if (target) this.moveToInteract(target);
  }

  private performInteraction(interactable: Interactable): void {
    this.pendingInteract = null;
    this.destinationMarker.enabled = false;
    this.focusedInteractable = interactable;
    this.focusMarker.enabled = true;
    this.focusMarker.setLocalScale(1.7, 0.05, 1.7);
    window.setTimeout(() => this.focusMarker.setLocalScale(1.45, 0.045, 1.45), 160);
  }

  private bestNearbyInteractable(): Interactable | null {
    const forward = this.visualForward();
    let best: Interactable | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const item of this.interactables) {
      const delta = subVec3(item.position, this.playerRoot.getPosition());
      delta.y = 0;
      const distance = lengthVec3(delta);
      if (distance > INTERACTION_FOCUS_RANGE) continue;
      const direction = distance > 0.001 ? scaleVec3(delta, 1 / distance) : forward;
      const facingBias = Math.max(0, dotVec3(forward, direction));
      const score = distance - facingBias * 1.15;
      if (score < bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return best;
  }

  private updateTouchGestures(event: PointerEvent): void {
    if (event.pointerType !== "touch") return;
    const touches = [...this.activePointers.values()].filter((pointer) => pointer.pointerType === "touch");
    if (touches.length >= 2) {
      const [a, b] = touches;
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (this.lastPinchDistance > 0) this.zoomBy((this.lastPinchDistance - distance) * 0.025);
      this.lastPinchDistance = distance;
      return;
    }
    this.lastPinchDistance = 0;
    const width = this.canvas.clientWidth;
    if (event.clientX > width * 0.62) {
      if (this.lastRotateX) this.rotateCamera((event.clientX - this.lastRotateX) * TOUCH_ROTATION_SPEED);
      if (!this.lastRotateX) this.lastRotateX = event.clientX;
      this.lastRotateX = event.clientX;
    }
  }

  private buildPath(from: Vec3, to: Vec3): Vec3[] {
    const blocker = this.firstBlockingObstacle(from, to);
    if (!blocker) return [copyVec3(to)];

    const start = new Vec2(from.x, from.z);
    const end = new Vec2(to.x, to.z);
    const travel = normalizeVec2(subVec2(end, start));
    const side = new Vec2(-travel.y, travel.x);
    const clearance = blocker.radius + PLAYER_RADIUS + 0.75;
    const aroundA = vec3(blocker.center.x + side.x * clearance, 0, blocker.center.y + side.y * clearance);
    const aroundB = vec3(blocker.center.x - side.x * clearance, 0, blocker.center.y - side.y * clearance);
    const costA = distanceVec3(from, aroundA) + distanceVec3(aroundA, to);
    const costB = distanceVec3(from, aroundB) + distanceVec3(aroundB, to);
    return [costA <= costB ? aroundA : aroundB, copyVec3(to)];
  }

  private firstBlockingObstacle(from: Vec3, to: Vec3): Obstacle | null {
    const start = new Vec2(from.x, from.z);
    const end = new Vec2(to.x, to.z);
    const segment = subVec2(end, start);
    const lengthSq = lengthSqVec2(segment);
    if (lengthSq < 0.0001) return null;
    for (const obstacle of this.obstacles) {
      const toCenter = subVec2(obstacle.center, start);
      const t = Math.min(1, Math.max(0, dotVec2(toCenter, segment) / lengthSq));
      const closest = addVec2(start, scaleVec2(segment, t));
      if (distanceVec2(closest, obstacle.center) < obstacle.radius + PLAYER_RADIUS + 0.25) return obstacle;
    }
    return null;
  }

  private approachVelocity(current: Vec3, desired: Vec3, dt: number): Vec3 {
    const delta = subVec3(desired, current);
    const distance = lengthVec3(delta);
    if (distance <= 0.0001) return desired;
    const accelerating = lengthSqVec3(desired) > lengthSqVec3(current);
    const maxChange = (accelerating ? MOVE_ACCELERATION : MOVE_DECELERATION) * dt;
    return distance <= maxChange ? desired : addVec3(current, scaleVec3(delta, maxChange / distance));
  }

  private handleKeyboardRotation(dt: number): void {
    const direction = Number(this.keys.has("e")) - Number(this.keys.has("q"));
    if (direction) this.rotateCamera(direction * KEYBOARD_ROTATION_SPEED * dt);
  }

  private handleGamepadActions(dt: number): void {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((item): item is globalThis.Gamepad => Boolean(item?.connected));
    if (!pad) {
      this.lastGamepadButtons.clear();
      return;
    }
    const pressed = new Set<number>();
    pad.buttons.forEach((button, index) => {
      if (button.pressed) pressed.add(index);
    });
    const justPressed = (index: number) => pressed.has(index) && !this.lastGamepadButtons.has(index);
    if (justPressed(0)) this.tryInteract();
    if (justPressed(1)) {
      if (this.target || this.path.length > 0) this.cancelClickIntent();
      else this.dodgeForward();
    }
    if (pressed.has(4)) this.rotateCamera(-GAMEPAD_ROTATION_SPEED * dt);
    if (pressed.has(5)) this.rotateCamera(GAMEPAD_ROTATION_SPEED * dt);
    const rightStickX = pad.axes[2] ?? 0;
    if (Math.abs(rightStickX) > 0.18) this.rotateCamera(rightStickX * GAMEPAD_ROTATION_SPEED * dt);
    this.lastGamepadButtons = pressed;
  }

  private combinedMovementVector(): Vec2 {
    const x = Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft"));
    const y = Number(this.keys.has("w") || this.keys.has("arrowup")) - Number(this.keys.has("s") || this.keys.has("arrowdown"));
    const gamepad = this.gamepadVector();
    const vector = new Vec2(x + gamepad.x, y + gamepad.y);
    return lengthSqVec2(vector) > 1 ? normalizeVec2(vector) : vector;
  }

  private gamepadVector(): Vec2 {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((item): item is globalThis.Gamepad => Boolean(item?.connected));
    if (!pad) return new Vec2();
    const deadZone = 0.18;
    const x = Math.abs(pad.axes[0] ?? 0) > deadZone ? pad.axes[0] ?? 0 : 0;
    const y = Math.abs(pad.axes[1] ?? 0) > deadZone ? -(pad.axes[1] ?? 0) : 0;
    return new Vec2(x, y);
  }

  private dodgeForward(): void {
    const input = this.combinedMovementVector();
    const screenForward = this.screenUpOnGround();
    const right = vec3(-screenForward.z, 0, screenForward.x);
    const forward = lengthSqVec2(input) > 0
      ? normalizeVec3(addVec3(scaleVec3(screenForward, input.y), scaleVec3(right, input.x)))
      : this.visualForward();
    this.cancelClickIntent();
    this.velocity = addVec3(this.velocity, scaleVec3(forward, 2.8));
  }

  private moveWithCollision(delta: Vec3): void {
    const current = this.playerRoot.getPosition();
    const next = addVec3(current, delta);
    next.x = Math.min(24.5, Math.max(-24.5, next.x));
    next.z = Math.min(24.5, Math.max(-24.5, next.z));

    for (const obstacle of this.obstacles) {
      const offset = new Vec2(next.x - obstacle.center.x, next.z - obstacle.center.y);
      const minDistance = obstacle.radius + PLAYER_RADIUS;
      const distance = lengthVec2(offset);
      if (distance > 0.0001 && distance < minDistance) {
        const pushed = scaleVec2(offset, minDistance / distance);
        next.x = obstacle.center.x + pushed.x;
        next.z = obstacle.center.y + pushed.y;
      }
    }
    next.y = terrainHeightAt(next.x, next.z);
    this.playerRoot.setPosition(next);
  }

  private updateFocusMarker(): void {
    this.focusedInteractable = this.hoveredInteractable ?? this.bestNearbyInteractable();
    if (this.focusedInteractable) {
      this.focusMarker.setPosition(this.focusedInteractable.position.x, 0.055, this.focusedInteractable.position.z);
      this.focusMarker.enabled = true;
    } else {
      this.focusMarker.enabled = false;
    }
  }

  private updateOccluders(): void {
    for (const entity of this.occluders) {
      const pos = entity.getPosition();
      const player = this.playerRoot.getPosition();
      const closeToPlayer = (pos.x - player.x) ** 2 + (pos.z - player.z) ** 2 < 14;
      const renders = entity.findComponents("render") as any[];
      for (const render of renders) {
        for (const meshInstance of render.meshInstances ?? []) {
          meshInstance.visible = !closeToPlayer;
        }
      }
    }
  }

  private updateCamera(): void {
    const target = this.playerRoot.getPosition();
    const yaw = this.cameraYaw * Math.PI / 180;
    const pitch = this.cameraPitch * Math.PI / 180;
    const horizontal = Math.cos(pitch) * this.cameraRadius;
    const cameraPosition = vec3(
      target.x + Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * this.cameraRadius,
      target.z + Math.cos(yaw) * horizontal
    );
    this.camera.setPosition(cameraPosition);
    this.camera.lookAt(target.x, target.y + 0.65, target.z);
  }

  private zoomBy(delta: number): void {
    this.cameraRadius = Math.min(29, Math.max(13, this.cameraRadius + delta));
  }

  private rotateCamera(delta: number): void {
    this.cameraYaw += delta * 180 / Math.PI;
  }

  private screenUpOnGround(): Vec3 {
    const yaw = this.cameraYaw * Math.PI / 180;
    return normalizeVec3(vec3(-Math.sin(yaw), 0, -Math.cos(yaw)));
  }

  private visualForward(): Vec3 {
    const yaw = this.visualYaw * Math.PI / 180;
    return normalizeVec3(vec3(Math.sin(yaw), 0, Math.cos(yaw)));
  }
}

class PaintingMode {
  private context: CanvasRenderingContext2D;
  private source: HTMLCanvasElement;
  private target: HTMLCanvasElement;
  private mask: Uint8ClampedArray;
  private painted: Uint8Array;
  private isPainting = false;
  private score = 0;
  private paintedSubjectPixels = 0;
  private readonly width = 960;
  private readonly height = 540;
  private readonly brushRadius = 38;

  constructor(
    private canvas: HTMLCanvasElement,
    private scoreElement: HTMLElement,
    private coverageElement: HTMLElement
  ) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Painting canvas could not be initialized");
    this.context = context;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.source = document.createElement("canvas");
    this.target = document.createElement("canvas");
    this.source.width = this.target.width = this.width;
    this.source.height = this.target.height = this.height;
    this.mask = new Uint8ClampedArray(this.width * this.height);
    this.painted = new Uint8Array(this.width * this.height);
    this.createImages();
    this.bind();
    this.reset();
  }

  reset(): void {
    this.score = 0;
    this.paintedSubjectPixels = 0;
    this.painted.fill(0);
    this.context.drawImage(this.source, 0, 0);
    this.updateStats();
  }

  private bind(): void {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.isPainting = true;
      this.paintAt(event);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (this.isPainting) this.paintAt(event);
    });
    this.canvas.addEventListener("pointerup", () => {
      this.isPainting = false;
    });
    this.canvas.addEventListener("pointercancel", () => {
      this.isPainting = false;
    });
  }

  private createImages(): void {
    const sourceContext = this.source.getContext("2d");
    const targetContext = this.target.getContext("2d");
    if (!sourceContext || !targetContext) throw new Error("Painting buffers could not be initialized");

    const sourceGradient = sourceContext.createLinearGradient(0, 0, this.width, this.height);
    sourceGradient.addColorStop(0, "#273033");
    sourceGradient.addColorStop(1, "#6a6054");
    sourceContext.fillStyle = sourceGradient;
    sourceContext.fillRect(0, 0, this.width, this.height);
    sourceContext.fillStyle = "rgba(20, 20, 22, 0.46)";
    for (let i = 0; i < 90; i += 1) {
      sourceContext.beginPath();
      sourceContext.arc(Math.random() * this.width, Math.random() * this.height, 8 + Math.random() * 42, 0, Math.PI * 2);
      sourceContext.fill();
    }

    const targetGradient = targetContext.createLinearGradient(0, 0, this.width, this.height);
    targetGradient.addColorStop(0, "#d9c7a4");
    targetGradient.addColorStop(0.55, "#b55d47");
    targetGradient.addColorStop(1, "#27384a");
    targetContext.fillStyle = targetGradient;
    targetContext.fillRect(0, 0, this.width, this.height);
    targetContext.fillStyle = "#1a1d20";
    targetContext.fillRect(0, 410, this.width, 130);
    targetContext.fillStyle = "#e8d7b1";
    targetContext.beginPath();
    targetContext.ellipse(480, 276, 145, 190, 0.05, 0, Math.PI * 2);
    targetContext.fill();
    targetContext.fillStyle = "#22262a";
    targetContext.beginPath();
    targetContext.arc(430, 244, 18, 0, Math.PI * 2);
    targetContext.arc(530, 244, 18, 0, Math.PI * 2);
    targetContext.fill();
    targetContext.strokeStyle = "#723928";
    targetContext.lineWidth = 11;
    targetContext.beginPath();
    targetContext.arc(480, 315, 50, 0.12, Math.PI - 0.12);
    targetContext.stroke();
    targetContext.fillStyle = "#332016";
    targetContext.beginPath();
    targetContext.ellipse(480, 125, 165, 80, -0.02, Math.PI, Math.PI * 2);
    targetContext.fill();
    targetContext.strokeStyle = "rgba(255,255,255,0.55)";
    targetContext.lineWidth = 3;
    targetContext.strokeRect(330, 88, 300, 390);

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const dx = (x - 480) / 155;
        const dy = (y - 276) / 198;
        const inFace = dx * dx + dy * dy < 1;
        const inFrame = x >= 330 && x <= 630 && y >= 88 && y <= 478;
        this.mask[y * this.width + x] = inFace || inFrame ? 1 : 0;
      }
    }
  }

  private paintAt(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * this.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * this.height);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

    const centerIndex = y * this.width + x;
    this.score += this.mask[centerIndex] ? (this.painted[centerIndex] ? -2 : 8) : -5;
    this.revealBrush(x, y);
    this.updateStats();
  }

  private revealBrush(cx: number, cy: number): void {
    this.context.save();
    this.context.beginPath();
    const gradient = this.context.createRadialGradient(cx, cy, 0, cx, cy, this.brushRadius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    this.context.fillStyle = gradient;
    this.context.arc(cx, cy, this.brushRadius, 0, Math.PI * 2);
    this.context.clip();
    this.context.drawImage(
      this.target,
      cx - this.brushRadius,
      cy - this.brushRadius,
      this.brushRadius * 2,
      this.brushRadius * 2,
      cx - this.brushRadius,
      cy - this.brushRadius,
      this.brushRadius * 2,
      this.brushRadius * 2
    );
    this.context.restore();

    const minX = Math.max(0, cx - this.brushRadius);
    const maxX = Math.min(this.width - 1, cx + this.brushRadius);
    const minY = Math.max(0, cy - this.brushRadius);
    const maxY = Math.min(this.height - 1, cy + this.brushRadius);
    const radiusSq = this.brushRadius * this.brushRadius;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radiusSq) {
          const index = y * this.width + x;
          if (!this.painted[index]) {
            this.painted[index] = 1;
            if (this.mask[index]) this.paintedSubjectPixels += 1;
          }
        }
      }
    }
  }

  private updateStats(): void {
    const subjectPixels = this.mask.reduce((sum, value) => sum + value, 0);
    this.scoreElement.textContent = String(this.score);
    this.coverageElement.textContent = `${Math.min(100, Math.round((this.paintedSubjectPixels / subjectPixels) * 100))}%`;
  }
}

class App {
  private canvas = bySelector<HTMLCanvasElement>(selectors.canvas);
  private splash = bySelector<HTMLElement>(selectors.splash);
  private mainMenu = bySelector<HTMLElement>(selectors.mainMenu);
  private hud = bySelector<HTMLElement>(selectors.hud);
  private paintingScreen = bySelector<HTMLElement>(selectors.paintingScreen);
  private cutsceneScreen = bySelector<HTMLElement>(selectors.cutsceneScreen);
  private modeLabel = bySelector<HTMLElement>(selectors.modeLabel);
  private pcApp: Application;
  private music = new MusicLoop();
  private menuBackground: MenuBackground;
  private exploration: ExplorationMode;
  private painting: PaintingMode;

  constructor() {
    this.pcApp = new Application(this.canvas, {
      keyboard: new Keyboard(window),
      mouse: new Mouse(this.canvas),
      touch: "ontouchstart" in window ? new TouchDevice(this.canvas) : undefined,
      graphicsDeviceOptions: { antialias: true }
    });
    this.pcApp.setCanvasFillMode(FILLMODE_FILL_WINDOW);
    this.pcApp.setCanvasResolution(RESOLUTION_AUTO);
    this.pcApp.start();
    this.menuBackground = new MenuBackground(this.pcApp);
    this.exploration = new ExplorationMode(this.pcApp, this.canvas);
    this.painting = new PaintingMode(
      bySelector<HTMLCanvasElement>(selectors.paintingCanvas),
      bySelector<HTMLElement>(selectors.paintScore),
      bySelector<HTMLElement>(selectors.paintCoverage)
    );
    this.pcApp.on("update", (dt: number) => this.update(dt));
    this.bind();
    window.addEventListener("resize", () => this.resize());
    void this.openRequestedStage();
  }

  private bind(): void {
    bySelector<HTMLElement>(selectors.beginButton).addEventListener("click", (event) => {
      if ((event.target as HTMLElement).tagName.toLowerCase() === "a") return;
      void this.begin();
    });
    bySelector<HTMLElement>(selectors.beginButton).addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void this.begin();
      }
    });
    bySelector<HTMLButtonElement>(selectors.newGameButton).addEventListener("click", () => this.startNewGame());
    bySelector<HTMLButtonElement>(selectors.loadGameButton).addEventListener("click", () => this.loadGame());
    bySelector<HTMLButtonElement>(selectors.paintingModeButton).addEventListener("click", () => this.showPainting());
    bySelector<HTMLButtonElement>(selectors.exploreModeButton).addEventListener("click", () => this.showExplore());
    bySelector<HTMLButtonElement>(selectors.menuModeButton).addEventListener("click", () => this.showMenu());
    bySelector<HTMLButtonElement>(selectors.paintingDoneButton).addEventListener("click", () => this.showExplore());
  }

  private update(dt: number): void {
    this.menuBackground.update();
    this.exploration.update(dt);
  }

  private async begin(): Promise<void> {
    await this.music.start();
    await this.preload();
    this.showMenu();
  }

  private async openRequestedStage(): Promise<void> {
    const stage = Number(new URLSearchParams(window.location.search).get("s") ?? 0);
    if (![1, 2, 3].includes(stage)) return;
    await this.preload();
    setHidden(this.splash, true);
    if (stage === 1) this.showCutscene(false);
    if (stage === 2) this.showExplore();
    if (stage === 3) this.showPainting();
  }

  private async preload(): Promise<void> {
    await Promise.allSettled([`${RESOURCE_ROOT}${HERO_MODEL}`].map((url) => fetch(url, { cache: "force-cache" })));
  }

  private showMenu(): void {
    this.menuBackground.setActive(true);
    this.exploration.setActive(false);
    setHidden(this.splash, true);
    setHidden(this.mainMenu, false);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, true);
  }

  private startNewGame(): void {
    localStorage.setItem("painter-of-makli-save", JSON.stringify({ startedAt: new Date().toISOString(), scene: "explore" }));
    this.showCutscene(true);
  }

  private loadGame(): void {
    const save = localStorage.getItem("painter-of-makli-save");
    if (save) {
      this.showExplore();
      return;
    }
    this.startNewGame();
  }

  private showCutscene(advanceToExplore: boolean): void {
    this.menuBackground.setActive(false);
    this.exploration.setActive(false);
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, false);
    bySelector<HTMLElement>(selectors.subtitleLine).textContent = "The first image waits beneath the dust.";
    if (advanceToExplore) window.setTimeout(() => this.showExplore(), 2600);
  }

  private showExplore(): void {
    this.menuBackground.setActive(false);
    this.exploration.setActive(true);
    this.modeLabel.textContent = "Exploration";
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, false);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, true);
  }

  private showPainting(): void {
    this.menuBackground.setActive(false);
    this.exploration.setActive(false);
    this.painting.reset();
    this.modeLabel.textContent = "Painting";
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, false);
    setHidden(this.cutsceneScreen, true);
  }

  private resize(): void {
    this.pcApp.resizeCanvas();
  }
}

new App();
