import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";
import { DracoCompression } from "@babylonjs/core/Meshes/Compression/dracoCompression";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import "@babylonjs/loaders/glTF";
import "./styles.css";

const RESOURCE_ROOT = "/resources/";
const MAKLI_MAP_ROOT = `${RESOURCE_ROOT}makli/`;
const MAKLI_MAP_MODEL = "makli_necropolis_long_instanced.glb";
const MAKLI_TERRAIN_ATLAS = "makli_lit_albedo_atlas.png";
const MAKLI_ATLAS_METADATA = "makli_necropolis_atlas_metadata.json";
const HERO_MODEL = "yusuf.glb";
const MAKLI_MAP_SCALE = 2 / 3;
const WALK_SPEED = 1.35;
const MODEL_FORWARD_OFFSET = 90;
const KEYBOARD_ROTATION_SPEED = 1.9;
const POINTER_ROTATION_SPEED = 0.0065;
const GAMEPAD_ROTATION_SPEED = 2.4;
const DRAW_MAX_LENGTH = 10;
const DRAW_MAX_SECONDS = 3;
const DRAW_Y_OFFSET = 0.05;
const DRAW_CORE_HALF_WIDTH = 0.075;
const DRAW_HALO_HALF_WIDTH = 0.22;
const THREAT_SPEED = 2.4;
const THREAT_AVOIDANCE_RANGE = 2.8;
const THREAT_BASE_MAX_COUNT = 8;
const THREAT_DESTINATION_MAX_COUNT = 18;
const THREAT_BASE_SPAWN_DELAY = 1.6;
const THREAT_DESTINATION_SPAWN_DELAY = 0.42;
const TERRAIN_TEXTURE_SIZE = 1024;
const TERRAIN_LENGTH = 150;
const TERRAIN_WIDTH = 80;
const TERRAIN_LENGTH_SUBDIVISIONS = 216;
const TERRAIN_WIDTH_SUBDIVISIONS = 115;
const GRASS_PATCH_SIZE = 8;
const GRASS_WIND_STRENGTH = 0.05;
const GRASS_WIND_FREQUENCY = 1.2;
const GRASS_DENSITY_NOISE_SCALE = 0.06;
const GRASS_DENSITY_THRESHOLD = 0.18;
const GRASS_MIN_ELEVATION = -0.45;
const GRASS_CLUMP_RADIUS = 0.42;
const GRASS_MIN_CLUMPS_PER_PATCH = 10;
const GRASS_MAX_CLUMPS_PER_PATCH = 13;
const GRASS_PATHSIDE_BONUS_RADIUS = 16;
const GRASS_MIN_BLADES_PER_CLUMP = 20;
const GRASS_MAX_BLADES_PER_CLUMP = 45;
const LATE_DAY_SUN_DIRECTION = new Vector3(-0.616, -0.391, -0.684).normalize();
const FALLBACK_HERO_PATH_POINTS = [
  new Vector3(240.000 * MAKLI_MAP_SCALE, 0, -17.595 * MAKLI_MAP_SCALE),
  new Vector3(224.906 * MAKLI_MAP_SCALE, 0, -20.038 * MAKLI_MAP_SCALE),
  new Vector3(209.811 * MAKLI_MAP_SCALE, 0, -18.634 * MAKLI_MAP_SCALE),
  new Vector3(194.717 * MAKLI_MAP_SCALE, 0, -13.073 * MAKLI_MAP_SCALE),
  new Vector3(179.623 * MAKLI_MAP_SCALE, 0, -5.524 * MAKLI_MAP_SCALE),
  new Vector3(164.528 * MAKLI_MAP_SCALE, 0, 0.904 * MAKLI_MAP_SCALE),
  new Vector3(149.434 * MAKLI_MAP_SCALE, 0, 4.396 * MAKLI_MAP_SCALE),
  new Vector3(134.340 * MAKLI_MAP_SCALE, 0, 5.607 * MAKLI_MAP_SCALE),
  new Vector3(119.245 * MAKLI_MAP_SCALE, 0, 6.872 * MAKLI_MAP_SCALE),
  new Vector3(104.151 * MAKLI_MAP_SCALE, 0, 10.107 * MAKLI_MAP_SCALE),
  new Vector3(89.057 * MAKLI_MAP_SCALE, 0, 15.071 * MAKLI_MAP_SCALE),
  new Vector3(73.962 * MAKLI_MAP_SCALE, 0, 19.382 * MAKLI_MAP_SCALE),
  new Vector3(58.868 * MAKLI_MAP_SCALE, 0, 20.294 * MAKLI_MAP_SCALE),
  new Vector3(43.774 * MAKLI_MAP_SCALE, 0, 16.830 * MAKLI_MAP_SCALE),
  new Vector3(28.679 * MAKLI_MAP_SCALE, 0, 10.606 * MAKLI_MAP_SCALE),
  new Vector3(13.585 * MAKLI_MAP_SCALE, 0, 4.667 * MAKLI_MAP_SCALE),
  new Vector3(-1.509 * MAKLI_MAP_SCALE, 0, 1.266 * MAKLI_MAP_SCALE),
  new Vector3(-16.604 * MAKLI_MAP_SCALE, 0, 0.308 * MAKLI_MAP_SCALE),
  new Vector3(-31.698 * MAKLI_MAP_SCALE, 0, -0.328 * MAKLI_MAP_SCALE),
  new Vector3(-46.792 * MAKLI_MAP_SCALE, 0, -2.865 * MAKLI_MAP_SCALE),
  new Vector3(-61.887 * MAKLI_MAP_SCALE, 0, -7.643 * MAKLI_MAP_SCALE),
  new Vector3(-76.981 * MAKLI_MAP_SCALE, 0, -12.664 * MAKLI_MAP_SCALE),
  new Vector3(-92.075 * MAKLI_MAP_SCALE, 0, -15.035 * MAKLI_MAP_SCALE),
  new Vector3(-107.170 * MAKLI_MAP_SCALE, 0, -13.192 * MAKLI_MAP_SCALE),
  new Vector3(-122.264 * MAKLI_MAP_SCALE, 0, -8.142 * MAKLI_MAP_SCALE),
  new Vector3(-137.358 * MAKLI_MAP_SCALE, 0, -2.747 * MAKLI_MAP_SCALE),
  new Vector3(-152.453 * MAKLI_MAP_SCALE, 0, 0.395 * MAKLI_MAP_SCALE),
  new Vector3(-167.547 * MAKLI_MAP_SCALE, 0, 0.809 * MAKLI_MAP_SCALE),
  new Vector3(-182.642 * MAKLI_MAP_SCALE, 0, 0.304 * MAKLI_MAP_SCALE),
  new Vector3(-197.736 * MAKLI_MAP_SCALE, 0, 1.313 * MAKLI_MAP_SCALE),
  new Vector3(-212.830 * MAKLI_MAP_SCALE, 0, 4.760 * MAKLI_MAP_SCALE),
  new Vector3(-227.925 * MAKLI_MAP_SCALE, 0, 9.149 * MAKLI_MAP_SCALE),
  new Vector3(-240.000 * MAKLI_MAP_SCALE, 0, 11.404 * MAKLI_MAP_SCALE)
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

type PropBlocker = {
  center: Vector2;
  halfSize: Vector2;
  rotationY: number;
  radius: number;
};

type MakliAtlasMetadata = {
  map?: {
    length?: number;
    width?: number;
    terrainTriangles?: number;
    pathHalfWidth?: number;
    pathSmoothMargin?: number;
  };
  atlas?: {
    regions?: Array<{ object?: string; type?: string; uMin?: number; vMin?: number; uMax?: number; vMax?: number }>;
  };
  props?: {
    instancingMode?: string;
    groups?: Record<string, MakliPropMetadata[]>;
  };
};

type MakliPropMetadata = {
  object?: string;
  translation?: number[];
  rotationEuler?: number[];
  finalFootprintSize?: number;
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

function terrainHeightAt(x: number, z: number): number {
  return (
    (fractalNoise(x * 0.006, z * 0.006) - 0.5) * 2.4 +
    (fractalNoise(x * 0.018 + 43.7, z * 0.018 - 18.2) - 0.5) * 0.9 +
    (fractalNoise(x * 0.045 - 12.4, z * 0.045 + 33.1) - 0.5) * 0.3 +
    (fractalNoise(x * 0.11 + 7.3, z * 0.11 - 21.5) - 0.5) * 0.08
  );
}

ShaderStore.ShadersStore["grassVertexShader"] = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

attribute vec3 aColorSeed;
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;

uniform mat4 worldViewProjection;
uniform mat4 world;
uniform float uTime;
uniform float uWindStrength;
uniform float uWindFrequency;

varying float vHeightRatio;
varying float vColorSeed;
varying float vShade;

void main() {
  vec3 pos = position;
  float heightRatio = uv.y;

  float phase = aColorSeed.y;
  float bend = heightRatio * heightRatio;
  float wind1 = sin(uTime * uWindFrequency + phase) * uWindStrength * bend;
  float wind2 = sin(uTime * uWindFrequency * 1.7 + phase * 1.3 + pos.x * 0.5) * uWindStrength * 0.4 * bend;

  pos.x += wind1 + wind2;
  pos.z += wind2 * 0.6;

  mat4 instanceWorld = mat4(world0, world1, world2, world3);
  gl_Position = worldViewProjection * instanceWorld * vec4(pos, 1.0);
  vHeightRatio = heightRatio;
  vColorSeed = aColorSeed.x;
  vShade = aColorSeed.z;
}
`;

ShaderStore.ShadersStore["grassFragmentShader"] = /* glsl */ `
precision highp float;

varying float vHeightRatio;
varying float vColorSeed;
varying float vShade;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uAmbient;

void main() {
  vec3 baseCol = vec3(0.529, 0.427, 0.298);
  vec3 greenShift = vec3(0.42, 0.52, 0.22);
  vec3 tipColor = vec3(0.58, 0.55, 0.32);

  vec3 bladeColor = mix(baseCol, greenShift, vColorSeed * 0.6 + 0.2);
  float heightBright = mix(0.7, 1.1, vHeightRatio);
  bladeColor *= heightBright;
  bladeColor = mix(bladeColor, tipColor, vHeightRatio * 0.3);

  vec3 normal = vec3(0.0, 1.0, 0.0);
  vec3 lightToSurface = normalize(-uSunDirection);
  float NdotL = max(dot(normal, lightToSurface), 0.0);
  float diffuse = NdotL * 0.65;
  float wrapDiffuse = max((dot(normal, lightToSurface) + 0.5) / 1.5, 0.0) * 0.35;

  vec3 ambient = bladeColor * uAmbient;
  vec3 lit = bladeColor * (diffuse + wrapDiffuse) * uSunColor + ambient;
  lit *= vShade;

  float alpha = 1.0;
  if (vHeightRatio > 0.85) {
    alpha = 1.0 - (vHeightRatio - 0.85) / 0.15;
  }

  gl_FragColor = vec4(lit, alpha);
}
`;

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
  private mapRoot: TransformNode;
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
  private sun: DirectionalLight;
  private pathTime = 0;
  private pathComplete = false;
  private heroPathPoints: Vector3[] = FALLBACK_HERO_PATH_POINTS.map((point) => point.clone());
  private spawnTimer = 0;
  private drawingStartedAt = 0;
  private drawLength = 0;
  private pathSegmentLengths: number[] = [];
  private pathTotalLength = 0;
  private drawPoints: Vector3[] = [];
  private propBlockers: PropBlocker[] = [];
  private threats: Threat[] = [];
  private drawMesh: Mesh | null = null;
  private drawHaloMesh: Mesh | null = null;
  private terrainMeshes: Mesh[] = [];
  private makliAtlasMetadata: MakliAtlasMetadata | null = null;
  private drawMaterial: StandardMaterial;
  private drawHaloMaterial: StandardMaterial;
  private glowLayer: GlowLayer;
  private threatMaterial: StandardMaterial;
  private threatWispMaterial: StandardMaterial;
  private terrainAtlasTexture: Texture;
  private grassPatches: Mesh[] = [];
  private grassMaterial!: ShaderMaterial;
  private grassPathAvoidanceRadius = 2;
  private hearts = 3;
  private invulnerableUntil = 0;
  private heartElements: HTMLElement[] = [];

  constructor(private scene: Scene, private canvas: HTMLCanvasElement) {
    console.time("[Explore] constructor total");
    console.time("[Explore] scene + materials");
    this.root = new TransformNode("exploreRoot", scene);
    this.root.setEnabled(false);
    this.mapRoot = new TransformNode("makliMapRoot", scene);
    this.mapRoot.scaling.setAll(MAKLI_MAP_SCALE);
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
    this.threatMaterial = makeMaterial(scene, "threatVortexMaterial", new Color3(0.08, 0.06, 0.1), new Color3(0.1, 0.05, 0.14));
    this.threatMaterial.alpha = 0.72;
    this.threatMaterial.disableDepthWrite = true;
    this.threatWispMaterial = makeMaterial(scene, "threatWispMaterial", new Color3(0.1, 0.08, 0.13), new Color3(0.13, 0.06, 0.17));
    this.threatWispMaterial.alpha = 0.42;
    this.threatWispMaterial.disableDepthWrite = true;

    this.playerRoot.parent = this.root;
    this.mapRoot.parent = this.root;
    this.visualRoot.parent = this.playerRoot;
    this.modelRoot.parent = this.visualRoot;
    this.drawRoot.parent = this.root;

    this.camera = new FreeCamera("exploreCamera", new Vector3(0, 10, -14), scene);
    this.camera.fov = 31 * Math.PI / 180;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 160;
    this.camera.parent = this.root;

    const ambient = new HemisphericLight("ambient", new Vector3(-0.18, 1, 0.32), scene);
    ambient.intensity = 0.1;
    ambient.diffuse = new Color3(0.34, 0.39, 0.47);
    ambient.groundColor = new Color3(0.15, 0.11, 0.07);
    ambient.parent = this.root;

    const sun = new DirectionalLight("shadowLight", LATE_DAY_SUN_DIRECTION.clone(), scene);
    sun.intensity = 0.96;
    sun.diffuse = new Color3(1, 0.74, 0.48);
    sun.specular = new Color3(0.12, 0.08, 0.04);
    sun.position.copyFrom(LATE_DAY_SUN_DIRECTION.scale(-80));
    sun.autoUpdateExtends = false;
    sun.autoCalcShadowZBounds = false;
    sun.orthoLeft = -18;
    sun.orthoRight = 18;
    sun.orthoTop = 18;
    sun.orthoBottom = -18;
    sun.shadowMinZ = 0.1;
    sun.shadowMaxZ = 130;
    sun.parent = this.root;
    sun.includedOnlyMeshes = [];
    this.shadowGenerator = new ShadowGenerator(1024, sun);
    this.shadowGenerator.useContactHardeningShadow = true;
    this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.14;
    this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    this.shadowGenerator.bias = 0.0006;
    this.shadowGenerator.normalBias = 0.02;
    this.shadowGenerator.darkness = 0.52;
    this.sun = sun;
    this.terrainAtlasTexture = new Texture(`${MAKLI_MAP_ROOT}${MAKLI_TERRAIN_ATLAS}`, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
    this.terrainAtlasTexture.name = "makliLitAlbedoAtlas";
    this.terrainAtlasTexture.hasAlpha = false;
    console.timeEnd("[Explore] scene + materials");

    console.time("[Explore] prepareHeroPath");
    this.prepareHeroPath();
    console.timeEnd("[Explore] prepareHeroPath");

    this.bindInput();
    void this.loadMakliMap();
    void this.loadHero();
    this.updateCamera();
    this.initHeartsUI();
    console.timeEnd("[Explore] constructor total");
  }

  private configureScene(): void {
    this.scene.clearColor = new Color4(0.43, 0.35, 0.24, 1);
    this.scene.ambientColor = new Color3(0.25, 0.19, 0.12);
    this.scene.fogMode = Scene.FOGMODE_NONE;
    this.scene.imageProcessingConfiguration.exposure = 0.84;
    this.scene.imageProcessingConfiguration.contrast = 1.3;
  }

  setActive(active: boolean): void {
    this.root.setEnabled(active);
    if (active) {
      this.scene.activeCamera = this.camera;
      this.hearts = 3;
      this.invulnerableUntil = 0;
      this.updateHeartsUI();
    }
  }

  private initHeartsUI(): void {
    const container = document.querySelector("#heartsContainer");
    if (container) {
      this.heartElements = [...container.querySelectorAll<HTMLElement>(".heart")];
    }
  }

  private updateHeartsUI(): void {
    for (let i = 0; i < this.heartElements.length; i += 1) {
      const el = this.heartElements[i];
      if (i >= this.hearts) {
        el.classList.add("lost");
      } else {
        el.classList.remove("lost");
      }
      el.classList.remove("hit");
    }
    if (this.hearts < this.heartElements.length && this.heartElements[this.hearts]) {
      this.heartElements[this.hearts].classList.add("hit");
    }
  }

  update(dt: number): void {
    if (!this.root.isEnabled()) return;
    this.handleKeyboardRotation(dt);
    this.handleGamepadCamera(dt);
    this.updateHeroPath(dt);
    this.updateDrawing();
    this.updateThreats(dt);
    this.updateCamera();
    this.updateGrassVisibility();
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

  private async loadMakliMap(): Promise<void> {
    console.time("[Explore] loadMakliMap total");
    try {
      console.time("[Explore]   fetch metadata + load GLB");
      const [metadata, result] = await Promise.all([
        this.loadMakliAtlasMetadata(),
        SceneLoader.ImportMeshAsync("", MAKLI_MAP_ROOT, MAKLI_MAP_MODEL, this.scene)
      ]);
      console.timeEnd("[Explore]   fetch metadata + load GLB");
      this.makliAtlasMetadata = metadata;

      console.time("[Explore]   mesh hierarchy + configure");
      for (const node of [...result.transformNodes, ...result.meshes]) {
        if (!node.parent) node.parent = this.mapRoot;
      }

      this.terrainMeshes = [];
      for (const mesh of result.meshes) {
        if (!(mesh instanceof Mesh)) continue;
        mesh.parent = mesh.parent ?? this.mapRoot;
        mesh.isPickable = true;
        mesh.checkCollisions = true;

        if (this.isTerrainChunk(mesh.name)) {
          this.configureMakliTerrainMesh(mesh);
          this.terrainMeshes.push(mesh);
        } else {
          this.configureMakliPropMesh(mesh);
        }
      }
      console.timeEnd("[Explore]   mesh hierarchy + configure");

      console.time("[Explore]   hero path + prop blockers");
      this.loadHeroPathFromMap(result.meshes);
      this.buildPropBlockersFromMetadata(metadata);
      this.prepareHeroPath();
      this.logMakliMapInstanceStats(result.meshes);
      console.timeEnd("[Explore]   hero path + prop blockers");

      const mapLength = (metadata.map?.length ?? 480) * MAKLI_MAP_SCALE;
      const mapWidth = (metadata.map?.width ?? 120) * MAKLI_MAP_SCALE;
      this.grassPathAvoidanceRadius = Math.max(1.6, (metadata.map?.pathHalfWidth ?? 4) * MAKLI_MAP_SCALE * 0.72);
      console.time("[Explore]   createGrass");
      this.createGrass(mapLength, mapWidth);
      console.timeEnd("[Explore]   createGrass");
    } catch (error) {
      console.error("Unable to load baked Makli map, using fallback terrain", error);
      this.createFallbackTerrain();
    }
    console.timeEnd("[Explore] loadMakliMap total");
  }

  private async loadMakliAtlasMetadata(): Promise<MakliAtlasMetadata> {
    const response = await fetch(`${MAKLI_MAP_ROOT}${MAKLI_ATLAS_METADATA}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`Unable to load ${MAKLI_ATLAS_METADATA}: ${response.status}`);
    return await response.json() as MakliAtlasMetadata;
  }

  private isTerrainChunk(name: string): boolean {
    return /^Terrain_AtlasChunk_0[0-3](?:$|[._])/.test(name);
  }

  private configureMakliTerrainMesh(mesh: Mesh): void {
    const material = new StandardMaterial(`${mesh.name}_bakedMaterial`, this.scene);
    const tint = this.terrainChunkTint(mesh.name);
    material.diffuseTexture = this.terrainAtlasTexture;
    material.emissiveTexture = this.terrainAtlasTexture;
    material.diffuseColor = Color3.Black();
    material.emissiveColor = new Color3(tint, tint, tint);
    material.specularColor = Color3.Black();
    material.roughness = 1;
    material.disableLighting = true;
    material.backFaceCulling = false;
    mesh.material = material;
    mesh.receiveShadows = false;
    mesh.alwaysSelectAsActiveMesh = true;
    material.freeze();
  }

  private terrainChunkTint(name: string): number {
    const match = name.match(/Terrain_AtlasChunk_0([0-3])/);
    if (!match) return 1;
    return [0.98, 1.03, 1.07, 0.98][Number(match[1])] ?? 1;
  }

  private configureMakliPropMesh(mesh: Mesh): void {
    mesh.receiveShadows = true;
    mesh.visibility = 1;
    this.sun.includedOnlyMeshes.push(mesh);
    this.makeMaterialOpaque(mesh.material);
    this.liftPropMaterial(mesh.material);
    this.shadowGenerator.addShadowCaster(mesh, true);
  }

  private buildPropBlockersFromMetadata(metadata: MakliAtlasMetadata): void {
    const groups = metadata.props?.groups;
    if (!groups) return;
    const blockers: PropBlocker[] = [];
    for (const entries of Object.values(groups)) {
      for (const entry of entries) {
        const translation = entry.translation;
        if (!translation || translation.length < 2) continue;
        const size = Math.max(1.2, entry.finalFootprintSize ?? 2.5);
        const half = size * MAKLI_MAP_SCALE * 0.5;
        blockers.push({
          center: new Vector2(-translation[0] * MAKLI_MAP_SCALE, -translation[1] * MAKLI_MAP_SCALE),
          halfSize: new Vector2(half, half),
          rotationY: entry.rotationEuler?.[2] ?? 0,
          radius: half * Math.SQRT2
        });
      }
    }
    this.propBlockers = blockers;
  }

  private logMakliMapInstanceStats(meshes: readonly unknown[]): void {
    let instancedMeshes = 0;
    let thinInstances = 0;
    let uniqueGeometryIds = 0;
    const geometryIds = new Set<string>();
    for (const mesh of meshes) {
      const maybeMesh = mesh as {
        geometry?: { uniqueId: number };
        thinInstanceCount?: number;
        getClassName?: () => string;
      };
      if (maybeMesh.getClassName?.() === "InstancedMesh") instancedMeshes += 1;
      if (maybeMesh.thinInstanceCount) thinInstances += maybeMesh.thinInstanceCount;
      if (maybeMesh.geometry) geometryIds.add(String(maybeMesh.geometry.uniqueId));
    }
    uniqueGeometryIds = geometryIds.size;
    console.info(
      `Makli map loaded: ${this.terrainMeshes.length} terrain chunks, ` +
      `${uniqueGeometryIds} unique geometries, ${instancedMeshes} instanced meshes, ${thinInstances} thin instances, ` +
      `atlas regions ${this.makliAtlasMetadata?.atlas?.regions?.length ?? 0}`
    );
  }

  private createFallbackTerrain(): void {
    const lengthSubdivs = TERRAIN_LENGTH_SUBDIVISIONS;
    const widthSubdivs = TERRAIN_WIDTH_SUBDIVISIONS;
    const lengthVerts = lengthSubdivs + 1;
    const widthVerts = widthSubdivs + 1;
    const totalVerts = lengthVerts * widthVerts;

    const positions = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const indices: number[] = [];

    for (let z = 0; z <= widthSubdivs; z++) {
      for (let x = 0; x <= lengthSubdivs; x++) {
        const i = z * lengthVerts + x;
        const worldX = (x / lengthSubdivs - 0.5) * TERRAIN_LENGTH;
        const worldZ = (z / widthSubdivs - 0.5) * TERRAIN_WIDTH;
        positions[i * 3] = worldX;
        positions[i * 3 + 1] = terrainHeightAt(worldX, worldZ);
        positions[i * 3 + 2] = worldZ;
        uvs[i * 2] = x / lengthSubdivs;
        uvs[i * 2 + 1] = z / widthSubdivs;
      }
    }

    for (let z = 0; z < widthSubdivs; z++) {
      for (let x = 0; x < lengthSubdivs; x++) {
        const base = z * lengthVerts + x;
        indices.push(
          base, base + 1, base + lengthVerts,
          base + 1, base + lengthVerts + 1, base + lengthVerts
        );
      }
    }

    const terrain = new Mesh("terrain", this.scene);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;
    const normals = new Float32Array(totalVerts * 3);
    VertexData.ComputeNormals(positions, indices, normals);
    vertexData.normals = normals;
    vertexData.applyToMesh(terrain);

    const material = new StandardMaterial("terrainMaterial", this.scene);
    const { diffuse, normal } = this.createTerrainTextures();
    material.diffuseTexture = diffuse;
    material.bumpTexture = normal;
    material.diffuseColor = new Color3(1, 1, 1);
    material.specularColor = new Color3(0.06, 0.05, 0.04);
    material.specularPower = 12;
    material.roughness = 0.9;
    material.useParallax = true;
    material.parallaxScaleBias = 0.12;
    terrain.material = material;
    terrain.receiveShadows = true;
    terrain.parent = this.root;
    this.terrainMeshes = [terrain];
    this.createGrass(TERRAIN_LENGTH, TERRAIN_WIDTH);
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
        const worldX = (x / TERRAIN_TEXTURE_SIZE - 0.5) * TERRAIN_LENGTH;
        const worldZ = (y / TERRAIN_TEXTURE_SIZE - 0.5) * TERRAIN_WIDTH;
        const broad = fractalNoise(worldX * 0.025, worldZ * 0.025);
        const stones = fractalNoise(worldX * 0.12 + 11, worldZ * 0.12 - 5);
        const grit = hashNoise(worldX * 2.1, worldZ * 2.1);
        const pathDistance = this.distanceToHeroPath(new Vector2(worldX, worldZ));
        const pathWear = clamp(1 - pathDistance / 6.5, 0, 1);
        const rock = clamp((stones - 0.56) * 1.9, 0, 1);
        const dirt = clamp((broad - 0.32) * 1.45 + pathWear * 0.55, 0, 1);
        const sand = clamp(1 - rock * 0.8 - dirt * 0.38, 0, 1);
        const r = 125 * sand + 95 * dirt + 85 * rock + grit * 7;
        const g = 100 * sand + 75 * dirt + 72 * rock + grit * 5;
        const b = 68 * sand + 50 * dirt + 58 * rock + grit * 4;
        const i = (y * TERRAIN_TEXTURE_SIZE + x) * 4;
        diffuseImage.data[i] = clamp(r + pathWear * 12, 0, 255);
        diffuseImage.data[i + 1] = clamp(g + pathWear * 8, 0, 255);
        diffuseImage.data[i + 2] = clamp(b + pathWear * 2, 0, 255);
        diffuseImage.data[i + 3] = 255;

        const hL = fractalNoise((worldX - 0.35) * 0.12, worldZ * 0.12);
        const hR = fractalNoise((worldX + 0.35) * 0.12, worldZ * 0.12);
        const hD = fractalNoise(worldX * 0.12, (worldZ - 0.35) * 0.12);
        const hU = fractalNoise(worldX * 0.12, (worldZ + 0.35) * 0.12);
        normalImage.data[i] = clamp(128 - (hR - hL) * 185, 0, 255);
        normalImage.data[i + 1] = clamp(128 - (hU - hD) * 185, 0, 255);
        normalImage.data[i + 2] = 225;
        const height = fractalNoise(worldX * 0.08, worldZ * 0.08);
        normalImage.data[i + 3] = clamp(height * 255, 0, 255);
      }
    }

    diffuseContext.putImageData(diffuseImage, 0, 0);
    normalContext.putImageData(normalImage, 0, 0);
    diffuse.update(false);
    normal.update(false);
    diffuse.uScale = diffuse.vScale = 1;
    normal.uScale = normal.vScale = 1;
    return { diffuse, normal };
  }

  private prepareHeroPath(): void {
    for (const point of this.heroPathPoints) {
      point.y = this.groundHeightAt(point.x, point.z);
    }
    this.pathSegmentLengths = [];
    this.pathTotalLength = 0;
    for (let i = 0; i < this.heroPathPoints.length - 1; i += 1) {
      const length = distanceVec3(this.heroPathPoints[i], this.heroPathPoints[i + 1]);
      this.pathSegmentLengths.push(length);
      this.pathTotalLength += length;
    }
  }

  private loadHeroPathFromMap(meshes: readonly unknown[]): void {
    const pathMeshes = meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh && (() => {
      const names: string[] = [];
      for (let node: { name: string; parent: unknown } | null = mesh; node; node = this.parentNodeWithName(node.parent)) {
        names.push(node.name);
      }
      return names.some((name) => name.includes("Walkable_Path_Centerline_Debug"));
    })());

    const points = pathMeshes.flatMap((mesh) => this.extractPathPointsFromMesh(mesh));
    if (points.length < 2) {
      const debugNode = this.scene.getTransformNodeByName("Walkable_Path_Centerline_Debug");
      if (debugNode) {
        console.warn("Walkable_Path_Centerline_Debug is present but has no exported mesh vertices; using fallback Yusuf path.");
      }
      return;
    }

    this.heroPathPoints = this.orderPathPoints(points);
    console.info(`Loaded Yusuf path from Walkable_Path_Centerline_Debug with ${this.heroPathPoints.length} points.`);
  }

  private parentNodeWithName(parent: unknown): { name: string; parent: unknown } | null {
    if (parent && typeof parent === "object" && "name" in parent && typeof parent.name === "string") {
      return parent as { name: string; parent: unknown };
    }
    return null;
  }

  private extractPathPointsFromMesh(mesh: Mesh): Vector3[] {
    const positions = mesh.getVerticesData("position");
    if (!positions || positions.length < 6) return [];
    mesh.computeWorldMatrix(true);
    const worldMatrix = mesh.getWorldMatrix();
    const points: Vector3[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const point = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), worldMatrix);
      if (points.length === 0 || distanceVec3(points[points.length - 1], point) > 0.03) points.push(point);
    }
    return points;
  }

  private orderPathPoints(points: Vector3[]): Vector3[] {
    const remaining = points.map((point) => point.clone());
    const startIndex = remaining.reduce((best, point, index) => point.x < remaining[best].x ? index : best, 0);
    const ordered = [remaining.splice(startIndex, 1)[0]];

    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let nearestIndex = 0;
      let nearestDistance = distanceVec3(last, remaining[0]);
      for (let i = 1; i < remaining.length; i += 1) {
        const distance = distanceVec3(last, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      ordered.push(remaining.splice(nearestIndex, 1)[0]);
    }

    return ordered;
  }

  private distanceToHeroPath(point: Vector2): number {
    let distance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.heroPathPoints.length - 1; i += 1) {
      distance = Math.min(distance, distancePointToSegment2D(point, this.heroPathPoints[i], this.heroPathPoints[i + 1]));
    }
    return distance;
  }

  private distanceToHeroPathXZ(x: number, z: number): number {
    let distance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.heroPathPoints.length - 1; i += 1) {
      const a = this.heroPathPoints[i];
      const b = this.heroPathPoints[i + 1];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const lengthSq = abx * abx + abz * abz;
      if (lengthSq < 0.0001) {
        distance = Math.min(distance, Math.hypot(x - a.x, z - a.z));
        continue;
      }
      const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / lengthSq, 0, 1);
      distance = Math.min(distance, Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)));
    }
    return distance;
  }

  private updateHeroPath(dt: number): void {
    if (this.pathComplete) return;
    this.pathTime += dt * WALK_SPEED;
    if (this.pathTime >= this.pathTotalLength) {
      this.pathTime = this.pathTotalLength;
      this.pathComplete = true;
    }

    const position = this.pathPositionAt(this.pathTime);
    position.y = this.groundHeightAt(position.x, position.z);
    const tangent = normalizeVec3(subVec3(
      this.pathPositionAt(Math.min(this.pathTotalLength, this.pathTime + 0.12)),
      this.pathPositionAt(this.pathTime)
    ));
    this.playerRoot.position.copyFrom(position);
    this.sun.position.copyFrom(position.subtract(LATE_DAY_SUN_DIRECTION.scale(80)));
    const yaw = Math.atan2(tangent.x, tangent.z) * 180 / Math.PI;
    this.visualYaw = lerpAngleDegrees(this.visualYaw, yaw, Math.min(1, dt * 12));
    this.visualRoot.rotation.set(0, (this.visualYaw + MODEL_FORWARD_OFFSET) * Math.PI / 180, 0);
    this.visualRoot.position.set(0, 0, 0);
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
    return this.heroPathPoints[this.heroPathPoints.length - 1].clone();
  }

  private catmullRomPoint(segmentIndex: number, t: number): Vector3 {
    const p0 = this.heroPathPoints[Math.max(0, segmentIndex - 1)];
    const p1 = this.heroPathPoints[segmentIndex];
    const p2 = this.heroPathPoints[Math.min(this.heroPathPoints.length - 1, segmentIndex + 1)];
    const p3 = this.heroPathPoints[Math.min(this.heroPathPoints.length - 1, segmentIndex + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    return new Vector3(
      0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
    );
  }

  private startDrawing(point: Vector3): void {
    this.clearDrawing();
    this.drawingStartedAt = performance.now();
    this.drawLength = 0;
    point.y += DRAW_Y_OFFSET;
    this.drawPoints = [point];
    this.updateDrawPreviewMarker(point);
  }

  private appendDrawPoint(point: Vector3): void {
    if (this.drawPoints.length === 0) return;
    point.y += DRAW_Y_OFFSET;
    const last = this.drawPoints[this.drawPoints.length - 1];
    const segmentLength = distanceVec3(last, point);
    if (segmentLength < 0.18) return;
    const remaining = DRAW_MAX_LENGTH - this.drawLength;
    const clampedPoint = segmentLength > remaining
      ? addVec3(last, scaleVec3(normalizeVec3(subVec3(point, last)), remaining))
      : point;
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
    this.drawHaloMesh = this.updateStrokeMesh(this.drawHaloMesh, "paintedGroundLineHalo", points, DRAW_HALO_HALF_WIDTH, this.drawHaloMaterial);
    this.drawMesh = this.updateStrokeMesh(this.drawMesh, "paintedGroundLine", points, DRAW_CORE_HALF_WIDTH, this.drawMaterial);
  }

  private updateDrawPreviewMarker(point: Vector3): void {
    this.drawHaloMesh?.dispose();
    this.drawMesh?.dispose();
    this.drawHaloMesh = MeshBuilder.CreateDisc("paintedGroundLineHalo", { radius: 0.25, tessellation: 32 }, this.scene);
    this.drawHaloMesh.rotation.x = Math.PI / 2;
    this.drawHaloMesh.position.set(point.x, point.y - 0.02, point.z);
    this.drawHaloMesh.material = this.drawHaloMaterial;
    this.drawHaloMesh.parent = this.drawRoot;
    this.drawMesh = MeshBuilder.CreateDisc("paintedGroundLine", { radius: 0.1, tessellation: 32 }, this.scene);
    this.drawMesh.rotation.x = Math.PI / 2;
    this.drawMesh.position.set(point.x, point.y + 0.02, point.z);
    this.drawMesh.material = this.drawMaterial;
    this.drawMesh.parent = this.drawRoot;
  }

  private updateStrokeMesh(
    mesh: Mesh | null,
    name: string,
    points: Vector3[],
    halfWidth: number,
    material: StandardMaterial,
  ): Mesh {
    const strokeMesh = mesh ?? new Mesh(name, this.scene);
    strokeMesh.position.set(0, 0, 0);
    strokeMesh.rotation.set(0, 0, 0);
    strokeMesh.scaling.set(1, 1, 1);
    const vertexData = this.createStrokeVertexData(points, halfWidth);
    vertexData.applyToMesh(strokeMesh, true);
    strokeMesh.material = material;
    strokeMesh.parent = this.drawRoot;
    return strokeMesh;
  }

  private createStrokeVertexData(points: Vector3[], halfWidth: number): VertexData {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const previous = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const direction = normalizeVec3(subVec3(next, previous));
      const side = new Vector3(-direction.z, 0, direction.x);
      positions.push(
        points[i].x + side.x * halfWidth, points[i].y, points[i].z + side.z * halfWidth,
        points[i].x - side.x * halfWidth, points[i].y, points[i].z - side.z * halfWidth
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
    const progress = this.pathProgress();
    const maxThreats = Math.round(lerp(THREAT_BASE_MAX_COUNT, THREAT_DESTINATION_MAX_COUNT, progress));
    if (this.spawnTimer <= 0 && this.threats.length < maxThreats) {
      this.spawnThreat();
      const spawnDelay = lerp(THREAT_BASE_SPAWN_DELAY, THREAT_DESTINATION_SPAWN_DELAY, progress);
      this.spawnTimer = spawnDelay * (0.72 + Math.random() * 0.56);
    }

    const heroPosition = this.playerRoot.position;
    for (let i = this.threats.length - 1; i >= 0; i -= 1) {
      const threat = this.threats[i];
      const toHero = subVec3(heroPosition, threat.root.position);
      toHero.y = 0;
      const steering = addVec3(normalizeVec3(toHero), this.propAvoidance(threat.root.position, threat.radius));
      threat.velocity = scaleVec3(normalizeVec3(steering), THREAT_SPEED);
      const next = addVec3(threat.root.position, scaleVec3(threat.velocity, dt));
      next.y = this.groundHeightAt(next.x, next.z) + 0.75;
      threat.root.position.copyFrom(next);
      threat.spin += dt * 210;
      threat.root.rotation.y = threat.spin * Math.PI / 180;
      this.animateThreat(threat);
      if (distanceVec3(next, heroPosition) < 1.05) {
        this.removeThreat(i);
        if (performance.now() > this.invulnerableUntil) {
          this.hearts = Math.max(0, this.hearts - 1);
          this.invulnerableUntil = performance.now() + 1500;
          this.updateHeartsUI();
        }
      }
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

  private pathProgress(): number {
    return this.pathTotalLength > 0 ? clamp(this.pathTime / this.pathTotalLength, 0, 1) : 0;
  }

  private spawnThreat(): void {
    const heroPosition = this.playerRoot.position;
    const progress = this.pathProgress();
    const lookAheadDistance = lerp(9, 18, progress) + Math.random() * 9;
    const pathTarget = this.pathPositionAt(Math.min(this.pathTotalLength, this.pathTime + lookAheadDistance));
    let toTarget = normalizeVec3(subVec3(pathTarget, heroPosition));
    if (lengthVec3(toTarget) < 0.001) toTarget = new Vector3(Math.cos(this.visualYaw * Math.PI / 180), 0, Math.sin(this.visualYaw * Math.PI / 180));
    const pathSide = Math.random() < 0.5 ? -1 : 1;
    const sideOffset = lerp(9, 5.5, progress) + Math.random() * lerp(12, 7, progress);
    const forwardJitter = (Math.random() - 0.35) * 6;
    const side = new Vector3(-toTarget.z, 0, toTarget.x);
    const spawnCenter = addVec3(pathTarget, addVec3(scaleVec3(side, sideOffset * pathSide), scaleVec3(toTarget, forwardJitter)));
    const distanceFromHero = distanceVec3(spawnCenter, heroPosition);
    const minDistance = lerp(14, 8, progress);
    const awayFromHero = normalizeVec3(subVec3(spawnCenter, heroPosition));
    const spawnPosition = distanceFromHero < minDistance && lengthVec3(awayFromHero) > 0.001
      ? addVec3(heroPosition, scaleVec3(awayFromHero, minDistance))
      : spawnCenter;
    const spawnX = spawnPosition.x;
    const spawnZ = spawnPosition.z;
    const root = new TransformNode("threatVortex", this.scene);
    root.position.set(spawnX, this.groundHeightAt(spawnX, spawnZ) + 0.75, spawnZ);
    root.parent = this.root;

    const particles: Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const particle = MeshBuilder.CreateDisc(`threatDust${i}`, { radius: 0.24, tessellation: 12 }, this.scene);
      particle.material = this.threatMaterial;
      particle.rotation.x = Math.PI / 2;
      particle.parent = root;
      particles.push(particle);
    }
    for (let i = 0; i < 4; i += 1) {
      const particle = MeshBuilder.CreateDisc(`threatSmoke${i}`, { radius: 0.4, tessellation: 14 }, this.scene);
      particle.material = this.threatMaterial;
      particle.rotation.x = Math.PI / 2;
      particle.parent = root;
      particles.push(particle);
    }
    for (let i = 0; i < 4; i += 1) {
      const particle = MeshBuilder.CreateDisc(`threatWisp${i}`, { radius: 0.55, tessellation: 12 }, this.scene);
      particle.material = this.threatWispMaterial;
      particle.rotation.x = Math.PI / 2;
      particle.parent = root;
      particles.push(particle);
    }
    for (let i = 0; i < 3; i += 1) {
      const particle = MeshBuilder.CreateSphere(`threatEmber${i}`, { diameter: 0.14, segments: 6 }, this.scene);
      particle.material = this.threatMaterial;
      particle.parent = root;
      particles.push(particle);
    }

    this.threats.push({ root, particles, velocity: Vector3.Zero(), spin: Math.random() * 360, radius: 0.58 });
  }

  private animateThreat(threat: Threat): void {
    const time = performance.now() * 0.001;
    for (let i = 0; i < threat.particles.length; i += 1) {
      const p = threat.particles[i];
      const t = time + i * 0.73;
      const layer = i < 3 ? 0 : i < 7 ? 1 : i < 11 ? 2 : 3;
      const spiralSpeed = 4.5 - layer * 0.8;
      const baseRadius = 0.06 + layer * 0.11;
      const radius = baseRadius + Math.sin(t * 2.5 + i * 1.3) * 0.04;
      const baseHeight = layer === 0 ? 0.06 : layer === 1 ? 0.28 : layer === 2 ? 0.58 : 0.32;
      const height = baseHeight + Math.sin(t * 2.8 + i * 0.9) * 0.07;
      p.position.set(
        Math.cos(t * spiralSpeed + i * 1.57) * radius,
        height,
        Math.sin(t * spiralSpeed + i * 1.57) * radius
      );
      if (layer < 3) {
        const s = 0.48 + layer * 0.14 + Math.sin(t * 2.2 + i) * 0.09;
        p.scaling.set(s, s * 0.2, s);
        p.rotation.set(Math.PI / 2 + Math.sin(t + i) * 0.25, t * 1.5, 0);
      } else {
        const s = 0.22 + Math.sin(t * 3.5) * 0.07;
        p.scaling.set(s, s, s);
      }
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
    console.time("[Explore] loadHero total");
    try {
      console.time("[Explore]   Draco ready");
      await DracoCompression.Default.whenReadyAsync();
      console.timeEnd("[Explore]   Draco ready");
      console.time("[Explore]   load Yusuf GLB");
      const result = await SceneLoader.ImportMeshAsync("", RESOURCE_ROOT, HERO_MODEL, this.scene);
      console.timeEnd("[Explore]   load Yusuf GLB");
      const assetRoot = new TransformNode("yusufAssetRoot", this.scene);
      assetRoot.parent = this.modelRoot;
      for (const node of [...result.transformNodes, ...result.meshes]) {
        if (!node.parent) node.parent = assetRoot;
      }
      for (const mesh of result.meshes) {
        if (mesh instanceof Mesh) {
          mesh.receiveShadows = true;
          this.makeHeroMeshReadable(mesh);
          this.sun.includedOnlyMeshes.push(mesh);
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
      this.sun.includedOnlyMeshes.push(fallback);
      this.shadowGenerator.addShadowCaster(fallback);
    }
    console.timeEnd("[Explore] loadHero total");
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
    if (material.emissiveColor) material.emissiveColor = Color3.Black();
    if (material.albedoColor && material.albedoColor.r + material.albedoColor.g + material.albedoColor.b < 0.08) {
      material.albedoColor = new Color3(0.42, 0.38, 0.32);
    }
    if (material.albedoColor) {
      material.albedoColor = new Color3(
        Math.min(1, material.albedoColor.r * 1.6),
        Math.min(1, material.albedoColor.g * 1.6),
        Math.min(1, material.albedoColor.b * 1.6)
      );
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

  private liftPropMaterial(material: Mesh["material"]): void {
    const editableMaterial = material as {
      diffuseTexture?: unknown;
      albedoTexture?: unknown;
      emissiveTexture?: unknown;
      emissiveColor?: Color3;
      diffuseColor?: Color3;
      albedoColor?: Color3;
      specularColor?: Color3;
      specularPower?: number;
      specularIntensity?: number;
      roughness?: number;
      metallic?: number;
      environmentIntensity?: number;
      directIntensity?: number;
    } | null;
    if (!editableMaterial) return;

    const hasBaseTexture = Boolean(editableMaterial.albedoTexture ?? editableMaterial.diffuseTexture);
    editableMaterial.emissiveTexture = undefined;
    editableMaterial.emissiveColor = new Color3(0.006, 0.004, 0.002);
    editableMaterial.specularColor = Color3.Black();
    editableMaterial.specularPower = 8;
    editableMaterial.specularIntensity = 0.03;
    editableMaterial.roughness = 0.94;
    editableMaterial.metallic = 0;
    editableMaterial.environmentIntensity = 0.08;
    editableMaterial.directIntensity = 1.32;

    if (hasBaseTexture) {
      if (editableMaterial.diffuseColor) editableMaterial.diffuseColor = Color3.White();
      if (editableMaterial.albedoColor) editableMaterial.albedoColor = Color3.White();
      return;
    }

    if (editableMaterial.diffuseColor) editableMaterial.diffuseColor = new Color3(0.46, 0.37, 0.25);
    if (editableMaterial.albedoColor) editableMaterial.albedoColor = new Color3(0.46, 0.37, 0.25);
  }

  private playWalkAnimation(animationGroups: AnimationGroup[]): void {
    const group = animationGroups.find((animation) => {
      const name = animation.name.toLowerCase();
      return name === "nlatrack.004" || name.includes("nlatrack.004") || name.includes("walk");
    }) ?? animationGroups[0];

    if (group) {
      if (group.name !== "NlaTrack.004") console.info(`Using animation track "${group.name}" for "NlaTrack.004"`);
      group.start(true, 1.56);
    } else {
      console.error("Missing Yusuf walk animation", animationGroups.map((animation) => animation.name));
    }
  }

  private createGrassBladeVertexData(): VertexData {
    const halfW = 0.031;
    const segH = 0.135;
    const positions = new Float32Array([
      -halfW, 0, 0,
      halfW, 0, 0,
      -halfW * 0.7, segH, 0,
      halfW * 0.7, segH, 0,
      -halfW * 0.38, segH * 2, 0,
      halfW * 0.38, segH * 2, 0,
      0, segH * 3, 0,
    ]);
    const uvs = new Float32Array([
      0, 0, 1, 0,
      0, 0.33, 1, 0.33,
      0, 0.67, 1, 0.67,
      0.5, 1,
    ]);
    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
    const vd = new VertexData();
    vd.positions = positions;
    vd.uvs = uvs;
    vd.indices = indices;
    const normals = new Float32Array(positions.length);
    VertexData.ComputeNormals(positions, indices, normals);
    vd.normals = normals;
    return vd;
  }

  private createGrass(mapLength: number, mapWidth: number): void {
    console.time("[Explore]     grass blade data + shader material");
    const bladeData = this.createGrassBladeVertexData();
    this.grassMaterial = new ShaderMaterial("grassMaterial", this.scene,
      { vertex: "grass", fragment: "grass" },
      {
        attributes: ["position", "uv", "world0", "world1", "world2", "world3", "aColorSeed"],
        uniforms: ["worldViewProjection", "world", "uTime", "uSunDirection", "uWindStrength", "uWindFrequency", "uSunColor", "uAmbient"],
        needAlphaBlending: true,
      }
    );
    this.grassMaterial.backFaceCulling = false;
    this.grassMaterial.setFloat("uWindStrength", GRASS_WIND_STRENGTH);
    this.grassMaterial.setFloat("uWindFrequency", GRASS_WIND_FREQUENCY);
    this.grassMaterial.setVector3("uSunDirection", LATE_DAY_SUN_DIRECTION);
    this.grassMaterial.setColor3("uSunColor", new Color3(1.08, 0.82, 0.54));
    this.grassMaterial.setFloat("uAmbient", 0.38);
    console.timeEnd("[Explore]     grass blade data + shader material");

    const originX = -mapLength / 2;
    const originZ = -mapWidth / 2;
    const cols = Math.ceil(mapLength / GRASS_PATCH_SIZE);
    const rows = Math.ceil(mapWidth / GRASS_PATCH_SIZE);

    console.time("[Explore]     grass patch creation");
    console.log(`[Explore]     grass grid: ${cols}x${rows} = ${cols * rows} patches`);
    this.grassPatches = [];
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const patch = this.createGrassPatch(col, row, bladeData, originX, originZ);
        if (patch) this.grassPatches.push(patch);
      }
    }
    console.timeEnd("[Explore]     grass patch creation");
    console.log(`[Explore]     created ${this.grassPatches.length} grass patches`);
  }

  private createGrassPatch(col: number, row: number, bladeData: VertexData, originX: number, originZ: number): Mesh | null {
    const patchMinX = originX + col * GRASS_PATCH_SIZE;
    const patchMinZ = originZ + row * GRASS_PATCH_SIZE;

    const blades: Array<{ x: number; z: number; y: number; seed: number; shade: number }> = [];
    const patchCenterX = patchMinX + GRASS_PATCH_SIZE * 0.5;
    const patchCenterZ = patchMinZ + GRASS_PATCH_SIZE * 0.5;
    const pathDistance = this.distanceToHeroPathXZ(patchCenterX, patchCenterZ);
    const nearHeroPath = pathDistance < GRASS_PATHSIDE_BONUS_RADIUS;
    const clumpNoise = hashNoise(col * 17.1, row * 23.7);
    const pathBonusClumps = nearHeroPath ? 6 + Math.floor(hashNoise(col * 4.7, row * 8.9) * 5) : 0;
    const clumpCount = GRASS_MIN_CLUMPS_PER_PATCH +
      Math.floor(clumpNoise * (GRASS_MAX_CLUMPS_PER_PATCH - GRASS_MIN_CLUMPS_PER_PATCH + 1)) +
      pathBonusClumps;

    for (let c = 0; c < clumpCount; c++) {
      const cx = patchMinX + hashNoise(col * 11.3 + c * 7.1, row * 13.7) * GRASS_PATCH_SIZE;
      const cz = patchMinZ + hashNoise(col * 5.9, row * 9.1 + c * 3.3) * GRASS_PATCH_SIZE;
      const density = fractalNoise(cx * GRASS_DENSITY_NOISE_SCALE + 100, cz * GRASS_DENSITY_NOISE_SCALE + 200);
      const pathDensityBoost = nearHeroPath ? 0.2 : 0;
      if (density + pathDensityBoost < GRASS_DENSITY_THRESHOLD) continue;
      if (this.isGrassPlacementBlocked(cx, cz)) continue;

      const centerY = this.groundHeightAt(cx, cz);
      if (centerY < GRASS_MIN_ELEVATION && this.distanceToHeroPathXZ(cx, cz) < this.grassPathAvoidanceRadius * 1.8) continue;

      const clumpSeed = hashNoise(cx * 2.1, cz * 2.1);
      const bladeCount = Math.round(lerp(GRASS_MIN_BLADES_PER_CLUMP, GRASS_MAX_BLADES_PER_CLUMP, clumpSeed));
      const radius = GRASS_CLUMP_RADIUS * (0.75 + clumpSeed * 0.7);

      for (let b = 0; b < bladeCount; b++) {
        const angle = hashNoise(cx + b * 2.37, cz - b * 1.91) * Math.PI * 2;
        const distance = Math.sqrt(hashNoise(cx - b * 4.17, cz + b * 3.13)) * radius;
        const bx = cx + Math.cos(angle) * distance;
        const bz = cz + Math.sin(angle) * distance;
        if (bx < patchMinX || bx > patchMinX + GRASS_PATCH_SIZE || bz < patchMinZ || bz > patchMinZ + GRASS_PATCH_SIZE) continue;
        if (this.isGrassPlacementBlocked(bx, bz)) continue;
        const y = this.groundHeightAt(bx, bz);
        if (y < GRASS_MIN_ELEVATION && this.distanceToHeroPathXZ(bx, bz) < this.grassPathAvoidanceRadius * 1.8) continue;
        blades.push({
          x: bx,
          z: bz,
          y: y + 0.012,
          seed: hashNoise(bx * 13.1, bz * 17.9),
          shade: this.grassShadeAt(bx, bz, y)
        });
      }
    }

    if (blades.length === 0) return null;

    const count = blades.length;
    const matrices = new Float32Array(count * 16);
    const colorSeeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const blade = blades[i];
      const rotY = blade.seed * Math.PI * 2;
      const scaleX = 0.72 + hashNoise(blade.x * 3.1, blade.z * 5.7) * 0.52;
      const scaleY = 0.78 + hashNoise(blade.x * 7.3, blade.z * 3.1) * 0.62;
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);

      const base = i * 16;
      matrices[base + 0] = scaleX * cosR;
      matrices[base + 1] = 0;
      matrices[base + 2] = scaleX * sinR;
      matrices[base + 3] = 0;
      matrices[base + 4] = 0;
      matrices[base + 5] = scaleY;
      matrices[base + 6] = 0;
      matrices[base + 7] = 0;
      matrices[base + 8] = -scaleX * sinR;
      matrices[base + 9] = 0;
      matrices[base + 10] = scaleX * cosR;
      matrices[base + 11] = 0;
      matrices[base + 12] = blade.x;
      matrices[base + 13] = blade.y;
      matrices[base + 14] = blade.z;
      matrices[base + 15] = 1;

      colorSeeds[i * 3] = blade.seed;
      colorSeeds[i * 3 + 1] = blade.seed * 6.283;
      colorSeeds[i * 3 + 2] = blade.shade;
    }

    const mesh = new Mesh(`grassPatch_${col}_${row}`, this.scene);
    bladeData.applyToMesh(mesh);
    mesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
    mesh.thinInstanceRegisterAttribute("aColorSeed", 3);
    mesh.thinInstanceSetBuffer("aColorSeed", colorSeeds, 3, true);
    mesh.material = this.grassMaterial;
    mesh.parent = this.root;
    mesh.isPickable = false;
    mesh.receiveShadows = false;
    this.sun.includedOnlyMeshes.push(mesh);
    mesh.thinInstanceRefreshBoundingInfo(true);

    return mesh;
  }

  private isGrassPlacementBlocked(x: number, z: number): boolean {
    if (this.distanceToHeroPathXZ(x, z) < this.grassPathAvoidanceRadius) return true;
    for (const blocker of this.propBlockers) {
      const dx = x - blocker.center.x;
      const dz = z - blocker.center.y;
      if (dx * dx + dz * dz < (blocker.radius + 0.45) * (blocker.radius + 0.45)) return true;
    }
    return false;
  }

  private grassShadeAt(x: number, z: number, y: number): number {
    let shade = clamp(0.76 + y * 0.08 + (fractalNoise(x * 0.05 + 71, z * 0.05 - 19) - 0.5) * 0.18, 0.58, 1.04);
    const shadowDir = new Vector2(LATE_DAY_SUN_DIRECTION.x, LATE_DAY_SUN_DIRECTION.z);
    const shadowLength = Math.max(0.001, Math.hypot(shadowDir.x, shadowDir.y));
    shadowDir.x /= shadowLength;
    shadowDir.y /= shadowLength;

    for (const blocker of this.propBlockers) {
      const toPoint = new Vector2(x - blocker.center.x, z - blocker.center.y);
      const alongShadow = toPoint.x * shadowDir.x + toPoint.y * shadowDir.y;
      if (alongShadow <= 0 || alongShadow > blocker.radius * 5.8) continue;
      const crossShadow = Math.abs(toPoint.x * shadowDir.y - toPoint.y * shadowDir.x);
      const width = blocker.radius * lerp(0.7, 1.35, alongShadow / (blocker.radius * 5.8));
      if (crossShadow < width) {
        const feather = 1 - clamp(crossShadow / width, 0, 1);
        const fade = 1 - clamp(alongShadow / (blocker.radius * 5.8), 0, 1);
        shade *= lerp(1, 0.62, feather * fade);
      }
    }
    return shade;
  }

  private updateGrassVisibility(): void {
    if (this.grassPatches.length === 0) return;
    this.grassMaterial.setFloat("uTime", performance.now() * 0.001);
  }

  private groundHeightAt(x: number, z: number): number {
    if (this.terrainMeshes.length === 0) return terrainHeightAt(x, z);
    const ray = new Ray(new Vector3(x, 80, z), new Vector3(0, -1, 0), 180);
    const result = this.scene.pickWithRay(ray, (mesh) => this.terrainMeshes.includes(mesh as Mesh));
    return result?.hit && result.pickedPoint ? result.pickedPoint.y : terrainHeightAt(x, z);
  }

  private pickGroundPoint(clientX: number, clientY: number): Vector3 | null {
    if (this.terrainMeshes.length === 0) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pickingResult = this.scene.pick(x, y, (mesh) => this.terrainMeshes.includes(mesh as Mesh));
    if (!pickingResult?.hit || !pickingResult.pickedPoint) return null;
    return pickingResult.pickedPoint.clone();
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
    this.cameraRadius = Math.min(26, Math.max(10, this.cameraRadius + delta));
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
