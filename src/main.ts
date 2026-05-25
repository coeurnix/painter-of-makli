import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import "@babylonjs/core/Culling/ray";
import { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { DracoCompression } from "@babylonjs/core/Meshes/Compression/dracoCompression";
import "@babylonjs/loaders/glTF";
import "./styles.css";

const RESOURCE_ROOT = "/resources/";
const PROP_ROOT = `${RESOURCE_ROOT}props/`;
const HERO_MODEL = "yusuf.glb";
const WALK_SPEED = 1.9;
const MODEL_FORWARD_OFFSET = 90;
const KEYBOARD_ROTATION_SPEED = 1.9;
const POINTER_ROTATION_SPEED = 0.0065;
const GAMEPAD_ROTATION_SPEED = 2.4;
const DRAW_MAX_LENGTH = 20;
const DRAW_MAX_SECONDS = 3;
const DRAW_CORE_Y = 0.135;
const DRAW_HALO_Y = 0.105;
const DRAW_CORE_HALF_WIDTH = 0.075;
const DRAW_HALO_HALF_WIDTH = 0.22;
const HERO_PATH_CLEARANCE = 2.4;
const THREAT_SPEED = 1.18;
const THREAT_AVOIDANCE_RANGE = 2.8;
const TERRAIN_TEXTURE_SIZE = 1024;
const PROP_FILES = [
  "graves.glb",
  "large+ruins (1).glb",
  "large+ruins (2).glb",
  "large+ruins (3).glb",
  "large+ruins.glb",
  "plant (1).glb",
  "plant (2).glb",
  "plant (3).glb",
  "plant.glb",
  "rocks (1).glb",
  "rocks (2).glb",
  "rocks.glb",
  "ruins (1).glb",
  "ruins.glb"
] as const;
const HERO_PATH_POINTS = [
  new Vector3(-28, 0, -17),
  new Vector3(-20, 0, -7),
  new Vector3(-9, 0, -10),
  new Vector3(2, 0, -2),
  new Vector3(12, 0, 3),
  new Vector3(25, 0, 15)
] as const;

DracoCompression.Configuration = {
  decoder: {
    wasmUrl: "/draco/draco_wasm_wrapper_gltf.js",
    wasmBinaryUrl: "/draco/draco_decoder_gltf.wasm",
    fallbackUrl: "/draco/draco_decoder_gltf.js"
  }
};

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

type Threat = {
  root: TransformNode;
  particles: Mesh[];
  velocity: Vector3;
  spin: number;
  radius: number;
};

type PropPlacement = {
  file: string;
  category: "graves" | "plant" | "rocks" | "ruins";
  position: Vector3;
  rotationY: number;
  scale: number;
  blocker: PropBlocker;
};

type PropBlocker = {
  center: Vector2;
  halfSize: Vector2;
  rotationY: number;
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

function shouldPostClientLog(): boolean {
  return new URLSearchParams(location.search).has("s");
}

function postClientLog(level: "error" | "warn" | "unhandledrejection", args: unknown[]): void {
  if (!shouldPostClientLog()) return;
  const payload = JSON.stringify({
    level,
    href: location.href,
    stage: new URLSearchParams(location.search).get("s"),
    at: new Date().toISOString(),
    userAgent: navigator.userAgent,
    args: args.map((arg) => {
      if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack };
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
const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  originalConsoleWarn(...args);
  postClientLog("warn", args);
};
window.addEventListener("unhandledrejection", (event) => postClientLog("unhandledrejection", [event.reason]));
window.addEventListener("error", (event) => postClientLog("error", [event.error ?? event.message]));

function makeMaterial(scene: Scene, name: string, color: Color3, emissive = Color3.Black()): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.emissiveColor = emissive;
  return material;
}

function addVec3(a: Vector3, b: Vector3): Vector3 {
  return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subVec3(a: Vector3, b: Vector3): Vector3 {
  return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scaleVec3(value: Vector3, scalar: number): Vector3 {
  return new Vector3(value.x * scalar, value.y * scalar, value.z * scalar);
}

function lengthVec3(value: Vector3): number {
  return Math.hypot(value.x, value.y, value.z);
}

function normalizeVec3(value: Vector3): Vector3 {
  const length = lengthVec3(value);
  return length > 0.00001 ? scaleVec3(value, 1 / length) : Vector3.Zero();
}

function distanceVec3(a: Vector3, b: Vector3): number {
  return lengthVec3(subVec3(a, b));
}

function subVec2(a: Vector2, b: Vector2): Vector2 {
  return new Vector2(a.x - b.x, a.y - b.y);
}

function lengthVec2(value: Vector2): number {
  return Math.hypot(value.x, value.y);
}

function distanceVec2(a: Vector2, b: Vector2): number {
  return lengthVec2(subVec2(a, b));
}

function distancePointToSegment2D(point: Vector2, a: Vector3, b: Vector3): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lengthSq = abx * abx + abz * abz;
  if (lengthSq < 0.0001) return Math.hypot(point.x - a.x, point.y - a.z);
  const t = Math.min(1, Math.max(0, ((point.x - a.x) * abx + (point.y - a.z) * abz) / lengthSq));
  return Math.hypot(point.x - (a.x + abx * t), point.y - (a.z + abz * t));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function hashNoise(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hashNoise(ix, iz);
  const b = hashNoise(ix + 1, iz);
  const c = hashNoise(ix, iz + 1);
  const d = hashNoise(ix + 1, iz + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sz);
}

function fractalNoise(x: number, z: number): number {
  return valueNoise(x, z) * 0.5 +
    valueNoise(x * 2.1 + 19.4, z * 2.1 - 7.8) * 0.28 +
    valueNoise(x * 4.3 - 4.2, z * 4.3 + 11.7) * 0.16 +
    valueNoise(x * 9.1 + 2.1, z * 9.1 - 3.9) * 0.06;
}

function lerpAngleDegrees(from: number, to: number, amount: number): number {
  const delta = Math.atan2(Math.sin((to - from) * Math.PI / 180), Math.cos((to - from) * Math.PI / 180));
  return from + (delta * 180 / Math.PI) * amount;
}

function terrainHeightAt(_x: number, _z: number): number {
  return 0;
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
  private root: TransformNode;
  private camera: FreeCamera;
  private pillars: Mesh[] = [];

  constructor(private scene: Scene) {
    this.root = new TransformNode("menuRoot", scene);
    this.root.setEnabled(false);

    this.camera = new FreeCamera("menuCamera", new Vector3(0, 7, 14), scene);
    this.camera.fov = 52 * Math.PI / 180;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 180;
    this.camera.setTarget(new Vector3(0, 0.5, 0));
    this.camera.parent = this.root;

    const ambient = new HemisphericLight("menuAmbient", new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.45;
    ambient.diffuse = new Color3(0.55, 0.5, 0.42);
    ambient.parent = this.root;

    const key = new DirectionalLight("menuKey", new Vector3(0.45, -0.72, 0.52), scene);
    key.intensity = 2.2;
    key.diffuse = new Color3(1, 0.86, 0.62);
    key.parent = this.root;

    const ground = this.primitive("menuGround", "box", makeMaterial(scene, "menuGroundMaterial", new Color3(0.08, 0.075, 0.065)));
    ground.scaling.set(36, 0.08, 36);
    ground.position.set(0, -0.04, 0);

    const stone = makeMaterial(scene, "menuStoneMaterial", new Color3(0.46, 0.42, 0.35), new Color3(0.025, 0.02, 0.012));
    for (let i = 0; i < 18; i += 1) {
      const pillar = this.primitive(`menuPillar${i}`, "cylinder", stone);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 5.5 + (i % 4) * 1.7;
      const height = 1.5 + Math.random() * 3;
      pillar.scaling.set(0.7, height, 0.7);
      pillar.position.set(Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius);
      pillar.rotation.y = angle;
      this.pillars.push(pillar);
    }
  }

  setActive(active: boolean): void {
    this.root.setEnabled(active);
    if (active) this.scene.activeCamera = this.camera;
  }

  update(): void {
    if (!this.root.isEnabled()) return;
    const time = performance.now() * 0.00008;
    const x = Math.cos(Math.PI * 1.15 + Math.sin(time) * 0.08) * 14;
    const z = Math.sin(Math.PI * 1.15 + Math.sin(time) * 0.08) * 14;
    this.camera.position.set(x, 6.2, z);
    this.camera.setTarget(new Vector3(0, 0.7, 0));
    this.pillars.forEach((pillar, index) => {
      pillar.position.y = pillar.scaling.y * 0.5 + Math.sin(time * 8 + index) * 0.03;
    });
  }

  private primitive(name: string, type: "box" | "cylinder", material: StandardMaterial): Mesh {
    const mesh = type === "box"
      ? MeshBuilder.CreateBox(name, { size: 1 }, this.scene)
      : MeshBuilder.CreateCylinder(name, { height: 1, diameter: 1, tessellation: 24 }, this.scene);
    mesh.material = material;
    mesh.parent = this.root;
    return mesh;
  }
}

class ExplorationMode {
  private root: TransformNode;
  private camera: FreeCamera;
  private playerRoot: TransformNode;
  private visualRoot: TransformNode;
  private modelRoot: TransformNode;
  private drawRoot: TransformNode;
  private shadowGenerator: ShadowGenerator;
  private keys = new Set<string>();
  private activePointers = new Map<number, PointerEvent>();
  private rotatePointerId: number | null = null;
  private drawPointerId: number | null = null;
  private rotateDragLastX = 0;
  private lastPinchDistance = 0;
  private cameraYaw = -45;
  private cameraPitch = 38;
  private cameraRadius = 21;
  private visualYaw = 0;
  private pathTime = 0;
  private pathForward = true;
  private spawnTimer = 0;
  private drawingStartedAt = 0;
  private drawLength = 0;
  private pathSegmentLengths: number[] = [];
  private pathTotalLength = 0;
  private drawPoints: Vector3[] = [];
  private propPlacements: PropPlacement[] = [];
  private propBlockers: PropBlocker[] = [];
  private propClusters: Record<PropPlacement["category"], Vector2[]> = {
    graves: [],
    plant: [],
    rocks: [],
    ruins: []
  };
  private threats: Threat[] = [];
  private drawMesh: Mesh | null = null;
  private drawHaloMesh: Mesh | null = null;
  private trailMesh: Mesh | null = null;
  private trailPoints: Vector3[] = [];
  private drawMaterial: StandardMaterial;
  private drawHaloMaterial: StandardMaterial;
  private trailMaterial: StandardMaterial;
  private glowLayer: GlowLayer;
  private threatMaterial: StandardMaterial;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement) {
    this.root = new TransformNode("exploreRoot", scene);
    this.root.setEnabled(false);
    this.playerRoot = new TransformNode("playerRoot", scene);
    this.visualRoot = new TransformNode("visualRoot", scene);
    this.modelRoot = new TransformNode("modelRoot", scene);
    this.drawRoot = new TransformNode("drawRoot", scene);

    this.configureScene();

    this.glowLayer = new GlowLayer("drawGlowLayer", scene, { blurKernelSize: 48 });
    this.glowLayer.intensity = 0.72;

    this.drawMaterial = makeMaterial(scene, "paintedGroundLineMaterial", new Color3(0.52, 0.96, 1), new Color3(0.28, 1, 1));
    this.drawMaterial.alpha = 0.96;
    this.drawMaterial.disableLighting = true;
    this.drawMaterial.disableDepthWrite = true;
    this.drawMaterial.backFaceCulling = false;
    this.drawHaloMaterial = makeMaterial(scene, "paintedGroundLineHaloMaterial", new Color3(0.14, 0.76, 0.86), new Color3(0.08, 0.72, 0.86));
    this.drawHaloMaterial.alpha = 0.34;
    this.drawHaloMaterial.disableLighting = true;
    this.drawHaloMaterial.disableDepthWrite = true;
    this.drawHaloMaterial.backFaceCulling = false;
    this.trailMaterial = makeMaterial(scene, "yusufTrailMaterial", new Color3(0.30, 0.23, 0.15), new Color3(0.02, 0.012, 0.006));
    this.trailMaterial.alpha = 0.54;
    this.trailMaterial.backFaceCulling = false;
    this.trailMaterial.disableDepthWrite = true;
    this.threatMaterial = makeMaterial(scene, "threatVortexMaterial", new Color3(0.012, 0.01, 0.018), new Color3(0.035, 0.008, 0.055));
    this.threatMaterial.alpha = 0.82;
    this.threatMaterial.disableDepthWrite = true;

    this.playerRoot.parent = this.root;
    this.visualRoot.parent = this.playerRoot;
    this.modelRoot.parent = this.visualRoot;
    this.drawRoot.parent = this.root;

    this.camera = new FreeCamera("exploreCamera", new Vector3(0, 10, -14), scene);
    this.camera.fov = 31 * Math.PI / 180;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 160;
    this.camera.parent = this.root;

    const ambient = new HemisphericLight("ambient", new Vector3(-0.4, 1, 0.55), scene);
    ambient.intensity = 0.22;
    ambient.diffuse = new Color3(0.42, 0.38, 0.34);
    ambient.groundColor = new Color3(0.08, 0.065, 0.045);
    ambient.parent = this.root;

    const sun = new DirectionalLight("shadowLight", new Vector3(-0.4, -1, -0.35), scene);
    sun.intensity = 2.0;
    sun.diffuse = new Color3(1, 0.84, 0.58);
    sun.position.set(4, 10, 4);
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 55;
    sun.autoUpdateExtends = true;
    sun.parent = this.root;
    this.shadowGenerator = new ShadowGenerator(2048, sun);
    this.shadowGenerator.useContactHardeningShadow = true;
    this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.08;
    this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    this.shadowGenerator.bias = 0.0006;
    this.shadowGenerator.normalBias = 0.02;
    this.shadowGenerator.darkness = 0.45;

    this.prepareHeroPath();
    this.createPropPlacements();
    this.createTerrain();
    this.bindInput();
    void this.loadHero();
    void this.loadProps();
    this.updateCamera();
  }

  private configureScene(): void {
    this.scene.clearColor = new Color4(0.32, 0.28, 0.22, 1);
    this.scene.ambientColor = new Color3(0.12, 0.10, 0.08);
    this.scene.fogMode = Scene.FOGMODE_NONE;
    this.scene.imageProcessingConfiguration.exposure = 0.78;
    this.scene.imageProcessingConfiguration.contrast = 1.38;
  }

  setActive(active: boolean): void {
    this.root.setEnabled(active);
    if (active) this.scene.activeCamera = this.camera;
  }

  update(dt: number): void {
    if (!this.root.isEnabled()) return;
    this.handleKeyboardRotation(dt);
    this.handleGamepadCamera(dt);
    this.updateHeroPath(dt);
    this.updateDrawing();
    this.updateThreats(dt);
    this.updateCamera();
  }

  private bindInput(): void {
    window.addEventListener("keydown", (event) => this.keys.add(event.key.toLowerCase()));
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
    if (!this.root.isEnabled()) return;
    this.activePointers.set(event.pointerId, event);
    if (this.rotatePointerId === event.pointerId) {
      event.preventDefault();
      this.rotateCamera((event.clientX - this.rotateDragLastX) * POINTER_ROTATION_SPEED);
      this.rotateDragLastX = event.clientX;
      return;
    }
    this.updatePinch(event);
    if (this.drawPointerId === event.pointerId) {
      event.preventDefault();
      const point = this.pickGroundPoint(event.clientX, event.clientY);
      if (point) this.appendDrawPoint(point);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.root.isEnabled()) return;
    this.activePointers.set(event.pointerId, event);
    if (event.pointerType === "mouse" && (event.button === 1 || event.button === 2)) {
      event.preventDefault();
      this.rotatePointerId = event.pointerId;
      this.rotateDragLastX = event.clientX;
      this.canvas.setPointerCapture?.(event.pointerId);
      return;
    }
    if (this.drawPointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    const point = this.pickGroundPoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    this.drawPointerId = event.pointerId;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.startDrawing(point);
  }

  private onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    if (this.rotatePointerId === event.pointerId) {
      this.rotatePointerId = null;
      this.canvas.releasePointerCapture?.(event.pointerId);
    }
    if (this.drawPointerId === event.pointerId) {
      this.finishDrawing();
      this.drawPointerId = null;
      this.canvas.releasePointerCapture?.(event.pointerId);
    }
    this.lastPinchDistance = 0;
  }

  private createTerrain(): void {
    const terrain = MeshBuilder.CreateGround("plainTerrain", { width: 140, height: 140, subdivisions: 16 }, this.scene);
    const material = new StandardMaterial("plainTerrainMaterial", this.scene);
    const { diffuse, normal } = this.createTerrainTextures();
    material.diffuseTexture = diffuse;
    material.bumpTexture = normal;
    material.diffuseColor = new Color3(0.72, 0.65, 0.48);
    material.specularColor = new Color3(0.05, 0.045, 0.035);
    material.roughness = 0.86;
    material.useParallax = true;
    material.parallaxScaleBias = 0.025;
    terrain.material = material;
    terrain.receiveShadows = true;
    terrain.parent = this.root;
  }

  private createTerrainTextures(): { diffuse: DynamicTexture; normal: DynamicTexture } {
    const diffuse = new DynamicTexture("terrainDiffuseTexture", { width: TERRAIN_TEXTURE_SIZE, height: TERRAIN_TEXTURE_SIZE }, this.scene, true);
    const normal = new DynamicTexture("terrainNormalTexture", { width: TERRAIN_TEXTURE_SIZE, height: TERRAIN_TEXTURE_SIZE }, this.scene, true);
    const diffuseContext = diffuse.getContext();
    const normalContext = normal.getContext();
    const diffuseImage = new ImageData(TERRAIN_TEXTURE_SIZE, TERRAIN_TEXTURE_SIZE);
    const normalImage = new ImageData(TERRAIN_TEXTURE_SIZE, TERRAIN_TEXTURE_SIZE);

    for (let y = 0; y < TERRAIN_TEXTURE_SIZE; y += 1) {
      for (let x = 0; x < TERRAIN_TEXTURE_SIZE; x += 1) {
        const worldX = (x / TERRAIN_TEXTURE_SIZE - 0.5) * 140;
        const worldZ = (y / TERRAIN_TEXTURE_SIZE - 0.5) * 140;
        const broad = fractalNoise(worldX * 0.025, worldZ * 0.025);
        const stones = fractalNoise(worldX * 0.12 + 11, worldZ * 0.12 - 5);
        const grit = hashNoise(worldX * 2.1, worldZ * 2.1);
        const pathDistance = this.distanceToHeroPath(new Vector2(worldX, worldZ));
        const pathWear = clamp(1 - pathDistance / 3.8, 0, 1);
        const rock = clamp((stones - 0.56) * 1.9, 0, 1);
        const dirt = clamp((broad - 0.32) * 1.45 + pathWear * 0.55, 0, 1);
        const sand = clamp(1 - rock * 0.8 - dirt * 0.38, 0, 1);
        const r = 115 * sand + 98 * dirt + 86 * rock + grit * 13;
        const g = 93 * sand + 72 * dirt + 80 * rock + grit * 10;
        const b = 58 * sand + 42 * dirt + 66 * rock + grit * 8;
        const i = (y * TERRAIN_TEXTURE_SIZE + x) * 4;
        diffuseImage.data[i] = clamp(r + pathWear * 16, 0, 255);
        diffuseImage.data[i + 1] = clamp(g + pathWear * 10, 0, 255);
        diffuseImage.data[i + 2] = clamp(b + pathWear * 3, 0, 255);
        diffuseImage.data[i + 3] = 255;

        const hL = fractalNoise((worldX - 0.35) * 0.12, worldZ * 0.12);
        const hR = fractalNoise((worldX + 0.35) * 0.12, worldZ * 0.12);
        const hD = fractalNoise(worldX * 0.12, (worldZ - 0.35) * 0.12);
        const hU = fractalNoise(worldX * 0.12, (worldZ + 0.35) * 0.12);
        normalImage.data[i] = clamp(128 - (hR - hL) * 185, 0, 255);
        normalImage.data[i + 1] = clamp(128 - (hU - hD) * 185, 0, 255);
        normalImage.data[i + 2] = 225;
        normalImage.data[i + 3] = 255;
      }
    }

    diffuseContext.putImageData(diffuseImage, 0, 0);
    normalContext.putImageData(normalImage, 0, 0);
    diffuse.update(false);
    normal.update(false);
    diffuse.wrapU = diffuse.wrapV = Texture.WRAP_ADDRESSMODE;
    normal.wrapU = normal.wrapV = Texture.WRAP_ADDRESSMODE;
    diffuse.uScale = diffuse.vScale = 3.5;
    normal.uScale = normal.vScale = 3.5;
    return { diffuse, normal };
  }

  private prepareHeroPath(): void {
    this.pathSegmentLengths = [];
    this.pathTotalLength = 0;
    for (let i = 0; i < HERO_PATH_POINTS.length - 1; i += 1) {
      const length = distanceVec3(HERO_PATH_POINTS[i], HERO_PATH_POINTS[i + 1]);
      this.pathSegmentLengths.push(length);
      this.pathTotalLength += length;
    }
  }

  private createPropPlacements(): void {
    const placements: PropPlacement[] = [];
    const counts = { ruins: 130, rocks: 240, plant: 320, graves: 90 };
    this.createPropClusters();
    for (const category of Object.keys(counts) as PropPlacement["category"][]) {
      const files = PROP_FILES.filter((file) => this.propCategory(file) === category);
      for (let i = 0; i < counts[category]; i += 1) {
        const placement = this.randomPropPlacement(category, files);
        if (placement) placements.push(placement);
      }
    }
    this.propPlacements = placements;
    this.propBlockers = placements.map((placement) => placement.blocker);
  }

  private randomPropPlacement(category: PropPlacement["category"], files: readonly string[]): PropPlacement | null {
    const profile = this.propProfile(category);
    for (let attempt = 0; attempt < 900; attempt += 1) {
      const file = this.choosePropFile(category, files);
      const scale = this.propScale(file);
      const halfSize = new Vector2(profile.halfX * scale, profile.halfZ * scale);
      const radius = Math.hypot(halfSize.x, halfSize.y);
      const center = Math.random() < 0.78
        ? this.randomClusteredPoint(category, radius)
        : this.randomPointNearPath(radius);
      const rotationY = category === "ruins"
        ? Math.floor(Math.random() * 4) * Math.PI / 2
        : Math.random() * Math.PI * 2;
      const blocker: PropBlocker = {
        center,
        halfSize,
        rotationY,
        radius
      };
      if (!this.canPlaceProp(blocker, profile.clearance)) continue;
      return {
        file,
        category,
        position: new Vector3(center.x, file.includes("large+ruins") ? -0.24 : -0.08, center.y),
        rotationY,
        scale,
        blocker
      };
    }
    return null;
  }

  private createPropClusters(): void {
    const counts = { ruins: 12, rocks: 18, plant: 22, graves: 8 };
    for (const category of Object.keys(counts) as PropPlacement["category"][]) {
      this.propClusters[category] = [];
      for (let i = 0; i < counts[category]; i += 1) {
        this.propClusters[category].push(this.randomPointNearPath(category === "ruins" ? 4.5 : 1.2));
      }
    }
  }

  private randomClusteredPoint(category: PropPlacement["category"], radius: number): Vector2 {
    const clusters = this.propClusters[category];
    if (clusters.length === 0) return this.randomPointNearPath(radius);
    const center = clusters[Math.floor(Math.random() * clusters.length)];
    const spread = category === "plant" ? 7 : category === "rocks" ? 6 : category === "graves" ? 4.5 : 8.5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * spread + radius;
    return new Vector2(center.x + Math.cos(angle) * distance, center.y + Math.sin(angle) * distance);
  }

  private choosePropFile(category: PropPlacement["category"], files: readonly string[]): string {
    if (category !== "ruins") return files[Math.floor(Math.random() * files.length)];
    const large = files.filter((file) => file.includes("large+ruins"));
    const regular = files.filter((file) => !file.includes("large+ruins"));
    const pool = large.length > 0 && Math.random() < 0.16 ? large : regular.length > 0 ? regular : files;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private propScale(file: string): number {
    return file.includes("large+ruins") ? 6 : 2;
  }

  private randomPointNearPath(radius: number): Vector2 {
    const segmentIndex = Math.floor(Math.random() * (HERO_PATH_POINTS.length - 1));
    const start = HERO_PATH_POINTS[segmentIndex];
    const end = HERO_PATH_POINTS[segmentIndex + 1];
    const t = Math.random();
    const x = lerp(start.x, end.x, t);
    const z = lerp(start.z, end.z, t);
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz) || 1;
    const side = Math.random() < 0.5 ? -1 : 1;
    const offset = HERO_PATH_CLEARANCE + radius + 0.5 + Math.random() * 15;
    const alongJitter = (Math.random() - 0.5) * 4.5;
    return new Vector2(
      x + (-dz / length) * offset * side + (dx / length) * alongJitter,
      z + (dx / length) * offset * side + (dz / length) * alongJitter
    );
  }

  private propCategory(file: string): PropPlacement["category"] {
    if (file.includes("plant")) return "plant";
    if (file.includes("rocks")) return "rocks";
    if (file.includes("graves")) return "graves";
    return "ruins";
  }

  private propProfile(category: PropPlacement["category"]): { halfX: number; halfZ: number; scaleMin: number; scaleMax: number; clearance: number } {
    switch (category) {
      case "plant":
        return { halfX: 0.24, halfZ: 0.24, scaleMin: 1, scaleMax: 1, clearance: 0.08 };
      case "rocks":
        return { halfX: 0.45, halfZ: 0.38, scaleMin: 1, scaleMax: 1, clearance: 0.12 };
      case "graves":
        return { halfX: 0.56, halfZ: 0.42, scaleMin: 1, scaleMax: 1, clearance: 0.16 };
      case "ruins":
        return { halfX: 0.62, halfZ: 0.48, scaleMin: 1, scaleMax: 1, clearance: 0.22 };
    }
  }

  private canPlaceProp(blocker: PropBlocker, clearance: number): boolean {
    for (let i = 0; i < HERO_PATH_POINTS.length - 1; i += 1) {
      if (distancePointToSegment2D(blocker.center, HERO_PATH_POINTS[i], HERO_PATH_POINTS[i + 1]) < HERO_PATH_CLEARANCE + blocker.radius) {
        return false;
      }
    }
    for (const existing of this.propBlockers) {
      if (distanceVec2(blocker.center, existing.center) < blocker.radius + existing.radius + clearance) return false;
    }
    this.propBlockers.push(blocker);
    return true;
  }

  private distanceToHeroPath(point: Vector2): number {
    let distance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < HERO_PATH_POINTS.length - 1; i += 1) {
      distance = Math.min(distance, distancePointToSegment2D(point, HERO_PATH_POINTS[i], HERO_PATH_POINTS[i + 1]));
    }
    return distance;
  }

  private async loadProps(): Promise<void> {
    try {
      await DracoCompression.Default.whenReadyAsync();
      const containers = new Map<string, Awaited<ReturnType<typeof SceneLoader.LoadAssetContainerAsync>>>();
      await Promise.all(PROP_FILES.map(async (file) => {
        containers.set(file, await SceneLoader.LoadAssetContainerAsync(PROP_ROOT, file, this.scene));
      }));

      this.propPlacements.forEach((placement, index) => {
        const container = containers.get(placement.file);
        if (!container) return;
        const root = new TransformNode(`prop_${placement.category}_${index}`, this.scene);
        root.position.copyFrom(placement.position);
        root.rotation.y = placement.rotationY;
        root.scaling.setAll(placement.scale);
        root.parent = this.root;
        const entries = container.instantiateModelsToScene((name) => `${root.name}_${name}`, false);
        for (const node of entries.rootNodes) {
          node.parent = root;
          if (node instanceof Mesh) this.configurePropMesh(node);
          for (const mesh of node.getChildMeshes(false)) {
            if (mesh instanceof Mesh) this.configurePropMesh(mesh);
          }
        }
      });
    } catch (error) {
      console.error("Unable to load explore props", error);
    }
  }

  private configurePropMesh(mesh: Mesh): void {
    mesh.receiveShadows = true;
    mesh.visibility = 1;
    this.makeMaterialOpaque(mesh.material);
    this.shadowGenerator.addShadowCaster(mesh, true);
  }

  private updateHeroPath(dt: number): void {
    this.pathTime += dt * WALK_SPEED * (this.pathForward ? 1 : -1);
    if (this.pathTime >= this.pathTotalLength) {
      this.pathTime = this.pathTotalLength;
      this.pathForward = false;
    } else if (this.pathTime <= 0) {
      this.pathTime = 0;
      this.pathForward = true;
    }

    const position = this.pathPositionAt(this.pathTime);
    const tangent = normalizeVec3(subVec3(
      this.pathPositionAt(this.pathTime + (this.pathForward ? 0.12 : -0.12)),
      this.pathPositionAt(this.pathTime)
    ));
    this.playerRoot.position.copyFrom(position);
    this.updateHeroTrail(position);
    const yaw = Math.atan2(tangent.x, tangent.z) * 180 / Math.PI;
    this.visualYaw = lerpAngleDegrees(this.visualYaw, yaw, Math.min(1, dt * 12));
    this.visualRoot.rotation.set(0, (this.visualYaw + MODEL_FORWARD_OFFSET) * Math.PI / 180, 0);
    this.visualRoot.position.set(0, 0, 0);
  }

  private updateHeroTrail(position: Vector3): void {
    const last = this.trailPoints[this.trailPoints.length - 1];
    if (last && distanceVec3(last, position) < 0.82) return;
    const roughPoint = new Vector3(
      position.x + (hashNoise(position.x * 1.7, position.z * 1.7) - 0.5) * 0.34,
      0.045,
      position.z + (hashNoise(position.x * 2.3 + 9.1, position.z * 2.3 - 3.4) - 0.5) * 0.34
    );
    this.trailPoints.push(roughPoint);
    if (this.trailPoints.length > 220) this.trailPoints.shift();
    if (this.trailPoints.length < 2) return;
    this.trailMesh = this.updateStrokeMesh(this.trailMesh, "yusufRoughTrail", this.trailPoints, 0.42, 0.045, this.trailMaterial, false);
  }

  private pathPositionAt(distance: number): Vector3 {
    const clampedDistance = Math.min(this.pathTotalLength, Math.max(0, distance));
    let remaining = clampedDistance;
    for (let i = 0; i < this.pathSegmentLengths.length; i += 1) {
      const segmentLength = this.pathSegmentLengths[i];
      if (remaining <= segmentLength || i === this.pathSegmentLengths.length - 1) {
        const t = segmentLength > 0 ? remaining / segmentLength : 0;
        return this.catmullRomPoint(i, t);
      }
      remaining -= segmentLength;
    }
    return HERO_PATH_POINTS[HERO_PATH_POINTS.length - 1].clone();
  }

  private catmullRomPoint(segmentIndex: number, t: number): Vector3 {
    const p0 = HERO_PATH_POINTS[Math.max(0, segmentIndex - 1)];
    const p1 = HERO_PATH_POINTS[segmentIndex];
    const p2 = HERO_PATH_POINTS[Math.min(HERO_PATH_POINTS.length - 1, segmentIndex + 1)];
    const p3 = HERO_PATH_POINTS[Math.min(HERO_PATH_POINTS.length - 1, segmentIndex + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    return new Vector3(
      0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      terrainHeightAt(0, 0),
      0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
    );
  }

  private startDrawing(point: Vector3): void {
    this.clearDrawing();
    this.drawingStartedAt = performance.now();
    this.drawLength = 0;
    point.y = DRAW_CORE_Y;
    this.drawPoints = [point];
    this.updateDrawPreviewMarker(point);
  }

  private appendDrawPoint(point: Vector3): void {
    if (this.drawPoints.length === 0) return;
    point.y = DRAW_CORE_Y;
    const last = this.drawPoints[this.drawPoints.length - 1];
    const segmentLength = distanceVec3(last, point);
    if (segmentLength < 0.18) return;
    const remaining = DRAW_MAX_LENGTH - this.drawLength;
    const clampedPoint = segmentLength > remaining
      ? addVec3(last, scaleVec3(normalizeVec3(subVec3(point, last)), remaining))
      : point;
    clampedPoint.y = DRAW_CORE_Y;
    this.drawPoints.push(clampedPoint);
    this.drawLength += Math.min(segmentLength, remaining);
    this.updateDrawMesh(false);
    if (this.drawLength >= DRAW_MAX_LENGTH - 0.001) this.finishDrawing();
  }

  private updateDrawing(): void {
    if (this.drawPointerId === null || this.drawPoints.length < 2) return;
    if ((performance.now() - this.drawingStartedAt) / 1000 >= DRAW_MAX_SECONDS) this.finishDrawing();
  }

  private finishDrawing(): void {
    const completedPointerId = this.drawPointerId;
    if (this.drawPoints.length >= 3) {
      this.updateDrawMesh(true);
      const polygon = this.drawPoints.map((point) => new Vector2(point.x, point.z));
      this.removeThreatsInside(polygon);
      window.setTimeout(() => this.clearDrawing(), 380);
    } else {
      this.clearDrawing();
    }
    this.drawPointerId = null;
    if (completedPointerId !== null) this.canvas.releasePointerCapture?.(completedPointerId);
  }

  private updateDrawMesh(close: boolean): void {
    const points = close && this.drawPoints.length > 2 ? [...this.drawPoints, this.drawPoints[0]] : this.drawPoints;
    if (points.length < 2) return;
    this.drawHaloMesh = this.updateStrokeMesh(this.drawHaloMesh, "paintedGroundLineHalo", points, DRAW_HALO_HALF_WIDTH, DRAW_HALO_Y, this.drawHaloMaterial);
    this.drawMesh = this.updateStrokeMesh(this.drawMesh, "paintedGroundLine", points, DRAW_CORE_HALF_WIDTH, DRAW_CORE_Y, this.drawMaterial);
  }

  private updateDrawPreviewMarker(point: Vector3): void {
    this.drawHaloMesh?.dispose();
    this.drawMesh?.dispose();
    this.drawHaloMesh = MeshBuilder.CreateDisc("paintedGroundLineHalo", { radius: 0.25, tessellation: 32 }, this.scene);
    this.drawHaloMesh.rotation.x = Math.PI / 2;
    this.drawHaloMesh.position.set(point.x, DRAW_HALO_Y, point.z);
    this.drawHaloMesh.material = this.drawHaloMaterial;
    this.drawHaloMesh.parent = this.drawRoot;
    this.glowLayer.addIncludedOnlyMesh(this.drawHaloMesh);
    this.drawMesh = MeshBuilder.CreateDisc("paintedGroundLine", { radius: 0.1, tessellation: 32 }, this.scene);
    this.drawMesh.rotation.x = Math.PI / 2;
    this.drawMesh.position.set(point.x, DRAW_CORE_Y, point.z);
    this.drawMesh.material = this.drawMaterial;
    this.drawMesh.parent = this.drawRoot;
    this.glowLayer.addIncludedOnlyMesh(this.drawMesh);
  }

  private updateStrokeMesh(
    mesh: Mesh | null,
    name: string,
    points: Vector3[],
    halfWidth: number,
    y: number,
    material: StandardMaterial,
    glow = true
  ): Mesh {
    const strokeMesh = mesh ?? new Mesh(name, this.scene);
    strokeMesh.position.set(0, 0, 0);
    strokeMesh.rotation.set(0, 0, 0);
    strokeMesh.scaling.set(1, 1, 1);
    const vertexData = this.createStrokeVertexData(points, halfWidth, y);
    vertexData.applyToMesh(strokeMesh, true);
    strokeMesh.material = material;
    strokeMesh.parent = this.drawRoot;
    if (glow) this.glowLayer.addIncludedOnlyMesh(strokeMesh);
    return strokeMesh;
  }

  private createStrokeVertexData(points: Vector3[], halfWidth: number, y: number): VertexData {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const previous = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const direction = normalizeVec3(subVec3(next, previous));
      const side = new Vector3(-direction.z, 0, direction.x);
      positions.push(
        points[i].x + side.x * halfWidth, y, points[i].z + side.z * halfWidth,
        points[i].x - side.x * halfWidth, y, points[i].z - side.z * halfWidth
      );
      if (i < points.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    VertexData.ComputeNormals(positions, indices, vertexData.normals = []);
    return vertexData;
  }

  private clearDrawing(): void {
    this.drawPoints = [];
    this.drawLength = 0;
    this.drawHaloMesh?.dispose();
    this.drawMesh?.dispose();
    this.drawHaloMesh = null;
    this.drawMesh = null;
  }

  private updateThreats(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.threats.length < 10) {
      this.spawnThreat();
      this.spawnTimer = 1.3 + Math.random() * 1.8;
    }

    const heroPosition = this.playerRoot.position;
    for (let i = this.threats.length - 1; i >= 0; i -= 1) {
      const threat = this.threats[i];
      const toHero = subVec3(heroPosition, threat.root.position);
      toHero.y = 0;
      const steering = addVec3(normalizeVec3(toHero), this.propAvoidance(threat.root.position, threat.radius));
      threat.velocity = scaleVec3(normalizeVec3(steering), THREAT_SPEED);
      const next = addVec3(threat.root.position, scaleVec3(threat.velocity, dt));
      next.y = 0.75;
      threat.root.position.copyFrom(next);
      threat.spin += dt * 210;
      threat.root.rotation.y = threat.spin * Math.PI / 180;
      this.animateThreat(threat, dt);
      if (distanceVec3(next, heroPosition) < 1.05) this.removeThreat(i);
    }
  }

  private propAvoidance(position: Vector3, radius: number): Vector3 {
    let avoidance = Vector3.Zero();
    const point = new Vector2(position.x, position.z);
    for (const blocker of this.propBlockers) {
      if (distanceVec2(point, blocker.center) > blocker.radius + THREAT_AVOIDANCE_RANGE + radius) continue;
      const closest = this.closestPointOnBlocker(point, blocker);
      let away = subVec2(point, closest);
      let distance = lengthVec2(away);
      if (distance < 0.001) {
        away = subVec2(point, blocker.center);
        distance = Math.max(0.001, lengthVec2(away));
      }
      const influence = Math.max(0, 1 - distance / (THREAT_AVOIDANCE_RANGE + radius));
      avoidance = addVec3(avoidance, new Vector3((away.x / distance) * influence * 2.25, 0, (away.y / distance) * influence * 2.25));
    }
    return avoidance;
  }

  private closestPointOnBlocker(point: Vector2, blocker: PropBlocker): Vector2 {
    const cos = Math.cos(-blocker.rotationY);
    const sin = Math.sin(-blocker.rotationY);
    const dx = point.x - blocker.center.x;
    const dz = point.y - blocker.center.y;
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    const clampedX = Math.min(blocker.halfSize.x, Math.max(-blocker.halfSize.x, localX));
    const clampedZ = Math.min(blocker.halfSize.y, Math.max(-blocker.halfSize.y, localZ));
    const worldCos = Math.cos(blocker.rotationY);
    const worldSin = Math.sin(blocker.rotationY);
    return new Vector2(
      blocker.center.x + clampedX * worldCos - clampedZ * worldSin,
      blocker.center.y + clampedX * worldSin + clampedZ * worldCos
    );
  }

  private spawnThreat(): void {
    const heroPosition = this.playerRoot.position;
    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 25;
    const root = new TransformNode("threatVortex", this.scene);
    root.position.set(heroPosition.x + Math.cos(angle) * distance, 0.75, heroPosition.z + Math.sin(angle) * distance);
    root.parent = this.root;

    const particles: Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      const particle = i % 3 === 0
        ? MeshBuilder.CreateTorus(`threatCloud${i}`, { diameter: 0.72, thickness: 0.09, tessellation: 20 }, this.scene)
        : MeshBuilder.CreateSphere(`threatCloud${i}`, { diameter: 0.68, segments: 16 }, this.scene);
      particle.material = this.threatMaterial;
      particle.parent = root;
      particles.push(particle);
    }

    this.threats.push({ root, particles, velocity: Vector3.Zero(), spin: Math.random() * 360, radius: 0.58 });
  }

  private animateThreat(threat: Threat, dt: number): void {
    for (let i = 0; i < threat.particles.length; i += 1) {
      const particle = threat.particles[i];
      const t = performance.now() * 0.001 + i * 0.87 + dt;
      const radius = 0.14 + i * 0.048;
      const height = 0.08 + (i / threat.particles.length) * 0.78;
      particle.position.set(Math.cos(t * 2.6) * radius, height, Math.sin(t * 3.1) * radius);
      const scale = 0.46 + Math.sin(t * 2.2) * 0.08;
      particle.scaling.set(scale * (i % 3 === 0 ? 1.4 : 1), scale * 0.72, scale);
      particle.rotation.set((78 + Math.sin(t) * 14) * Math.PI / 180, t * 120 * Math.PI / 180, 0);
    }
  }

  private removeThreatsInside(polygon: Vector2[]): void {
    for (let i = this.threats.length - 1; i >= 0; i -= 1) {
      const position = this.threats[i].root.position;
      if (this.pointInPolygon(new Vector2(position.x, position.z), polygon)) this.removeThreat(i);
    }
  }

  private removeThreat(index: number): void {
    const [threat] = this.threats.splice(index, 1);
    threat.root.dispose(false, true);
  }

  private pointInPolygon(point: Vector2, polygon: Vector2[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const a = polygon[i];
      const b = polygon[j];
      const crosses = (a.y > point.y) !== (b.y > point.y);
      const xAtY = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 0.000001) + a.x;
      if (crosses && point.x < xAtY) inside = !inside;
    }
    return inside;
  }

  private async loadHero(): Promise<void> {
    try {
      await DracoCompression.Default.whenReadyAsync();
      const result = await SceneLoader.ImportMeshAsync("", RESOURCE_ROOT, HERO_MODEL, this.scene);
      const assetRoot = new TransformNode("yusufAssetRoot", this.scene);
      assetRoot.parent = this.modelRoot;
      for (const node of [...result.transformNodes, ...result.meshes]) {
        if (!node.parent) node.parent = assetRoot;
      }
      for (const mesh of result.meshes) {
        if (mesh instanceof Mesh) {
          mesh.receiveShadows = true;
          this.makeHeroMeshReadable(mesh);
          this.shadowGenerator.addShadowCaster(mesh, true);
        }
      }
      this.playWalkAnimation(result.animationGroups);
    } catch (error) {
      console.error("Unable to load hero model", error);
      const fallback = MeshBuilder.CreateCapsule("fallbackHero", { height: 1.8, radius: 0.34 }, this.scene);
      fallback.position.y = 0.9;
      fallback.material = makeMaterial(this.scene, "fallbackHeroMaterial", new Color3(0.18, 0.23, 0.28));
      fallback.parent = this.modelRoot;
      this.shadowGenerator.addShadowCaster(fallback);
    }
  }

  private makeHeroMeshReadable(mesh: Mesh): void {
    mesh.visibility = 1;
    const material = mesh.material as {
      alpha?: number;
      backFaceCulling?: boolean;
      emissiveColor?: Color3;
      albedoColor?: Color3;
      forceDepthWrite?: boolean;
      fogEnabled?: boolean;
      transparencyMode?: number | null;
    } | null;
    if (!material) return;
    material.backFaceCulling = false;
    material.alpha = 1;
    material.forceDepthWrite = true;
    material.fogEnabled = false;
    material.transparencyMode = Material.MATERIAL_OPAQUE;
    if (material.emissiveColor) material.emissiveColor = new Color3(0.08, 0.075, 0.065);
    if (material.albedoColor && material.albedoColor.r + material.albedoColor.g + material.albedoColor.b < 0.08) {
      material.albedoColor = new Color3(0.42, 0.38, 0.32);
    }
  }

  private makeMaterialOpaque(material: Mesh["material"]): void {
    const editableMaterial = material as {
      alpha?: number;
      forceDepthWrite?: boolean;
      fogEnabled?: boolean;
      transparencyMode?: number | null;
    } | null;
    if (!editableMaterial) return;
    editableMaterial.alpha = 1;
    editableMaterial.forceDepthWrite = true;
    editableMaterial.fogEnabled = false;
    editableMaterial.transparencyMode = Material.MATERIAL_OPAQUE;
  }

  private playWalkAnimation(animationGroups: AnimationGroup[]): void {
    const group = animationGroups.find((animation) => {
      const name = animation.name.toLowerCase();
      return name === "nlatrack.004" || name.includes("nlatrack.004") || name.includes("walk");
    }) ?? animationGroups[0];

    if (group) {
      if (group.name !== "NlaTrack.004") console.info(`Using animation track "${group.name}" for "NlaTrack.004"`);
      group.start(true, 1);
    } else {
      console.error("Missing Yusuf walk animation", animationGroups.map((animation) => animation.name));
    }
  }

  private pickGroundPoint(clientX: number, clientY: number): Vector3 | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ray = this.scene.createPickingRay(x, y, Matrix.Identity(), this.camera);
    if (Math.abs(ray.direction.y) < 0.0001) return null;
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) return null;
    return addVec3(ray.origin, scaleVec3(ray.direction, t));
  }

  private updatePinch(event: PointerEvent): void {
    if (event.pointerType !== "touch") return;
    const touches = [...this.activePointers.values()].filter((pointer) => pointer.pointerType === "touch");
    if (touches.length < 2) {
      this.lastPinchDistance = 0;
      return;
    }
    const [a, b] = touches;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (this.lastPinchDistance > 0) this.zoomBy((this.lastPinchDistance - distance) * 0.025);
    this.lastPinchDistance = distance;
    this.rotateCamera(((a.clientX + b.clientX) * 0.5 - event.clientX) * POINTER_ROTATION_SPEED * 0.25);
  }

  private handleKeyboardRotation(dt: number): void {
    const direction = Number(this.keys.has("e")) - Number(this.keys.has("q"));
    if (direction) this.rotateCamera(direction * KEYBOARD_ROTATION_SPEED * dt);
  }

  private handleGamepadCamera(dt: number): void {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((item): item is globalThis.Gamepad => Boolean(item?.connected));
    if (!pad) return;
    if (pad.buttons[4]?.pressed) this.rotateCamera(-GAMEPAD_ROTATION_SPEED * dt);
    if (pad.buttons[5]?.pressed) this.rotateCamera(GAMEPAD_ROTATION_SPEED * dt);
    const rightStickX = pad.axes[2] ?? 0;
    if (Math.abs(rightStickX) > 0.18) this.rotateCamera(rightStickX * GAMEPAD_ROTATION_SPEED * dt);
  }

  private updateCamera(): void {
    const target = this.playerRoot.position;
    const yaw = this.cameraYaw * Math.PI / 180;
    const pitch = this.cameraPitch * Math.PI / 180;
    const horizontal = Math.cos(pitch) * this.cameraRadius;
    const cameraPosition = new Vector3(
      target.x + Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * this.cameraRadius,
      target.z + Math.cos(yaw) * horizontal
    );
    this.camera.position.copyFrom(cameraPosition);
    this.camera.setTarget(new Vector3(target.x, target.y + 0.65, target.z));
  }

  private zoomBy(delta: number): void {
    this.cameraRadius = Math.min(34, Math.max(10, this.cameraRadius + delta));
  }

  private rotateCamera(delta: number): void {
    this.cameraYaw += delta * 180 / Math.PI;
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
  private engine: Engine;
  private scene: Scene;
  private lastFrameTime = performance.now();
  private music = new MusicLoop();
  private menuBackground: MenuBackground;
  private exploration: ExplorationMode;
  private painting: PaintingMode;

  constructor() {
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true });
    this.scene = new Scene(this.engine);
    this.menuBackground = new MenuBackground(this.scene);
    this.exploration = new ExplorationMode(this.scene, this.canvas);
    this.painting = new PaintingMode(
      bySelector<HTMLCanvasElement>(selectors.paintingCanvas),
      bySelector<HTMLElement>(selectors.paintScore),
      bySelector<HTMLElement>(selectors.paintCoverage)
    );
    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      this.update(dt);
      this.scene.render();
    });
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
    await Promise.allSettled([
      DracoCompression.Default.whenReadyAsync(),
      fetch(`${RESOURCE_ROOT}${HERO_MODEL}`, { cache: "force-cache" })
    ]);
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
    this.engine.resize();
  }
}

new App();
