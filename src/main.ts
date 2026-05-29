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
const MAKLI_TERRAIN_ATLAS = "makli_lit_albedo_atlas.webp";
const MAKLI_ATLAS_METADATA = "makli_necropolis_atlas_metadata.json";
const HERO_MODEL = "yusuf.glb";
const GHOST_MODEL = "ghost.glb";
const SONGS = ["song1", "song2"] as const;
const CUTSCENE_VIDEO_BY_STAGE = {
  1: "vid1",
  3: "vid2",
  5: "vid3"
} as const;
const FULL_VOLUME = 10 ** (-4 / 20);
const CUTSCENE_VOLUME = 10 ** (-18 / 20);
const VOLUME_TWEEN_SECONDS = 2;
const CUTSCENE_SKIP_SECONDS = 2;
const CUTSCENE_END_DELAY_SECONDS = 2;
const STAGE_2_DESTINATION_NODE = "tripo_node_9ceb5ec4-f59b-4e91-85d9-771bd6b140b1_inst.004";
const MAKLI_MAP_SCALE = 2 / 3;
const STAGE_2_DESTINATION_FALLBACK = new Vector3(-1.7665 * MAKLI_MAP_SCALE, 0, 8.177 * MAKLI_MAP_SCALE);
const STAGE_2_PATH_COMPLETION_RATIO = 0.92;
const STAGE_2_INITIAL_CAMERA_YAW = 45;
const WALK_SPEED = 1.35 * 0.9 * 0.8;
const HERO_WALK_ANIMATION_SPEED_RATIO = 2.03 * 1.8 * 1.8;
const MODEL_FORWARD_OFFSET = 90;
const KEYBOARD_ROTATION_SPEED = 1.9;
const POINTER_ROTATION_SPEED = 0.0065;
const GAMEPAD_ROTATION_SPEED = 2.4;
const THREAT_CLICK_RADIUS = 2.8;
const THREAT_CLICK_RAY_WIDTH = 0.4;
const CLICK_PULSE_SECONDS = 0.42;
const THREAT_SPEED = 2.5;
const THREAT_BASE_MAX_COUNT = 8;
const THREAT_DESTINATION_MAX_COUNT = 38;
const THREAT_FREQUENCY_MULTIPLIER = 0.75;
const THREAT_BASE_SPAWN_DELAY = 0.8 / THREAT_FREQUENCY_MULTIPLIER;
const THREAT_DESTINATION_SPAWN_DELAY = 0.21 / THREAT_FREQUENCY_MULTIPLIER;
const CLICK_PULSE_HEIGHT = 0.33;
const FIXED_LIGHTING_TUNING: LightingTuning = { emissive: 0.006, shadowDarkness: 2, lightness: 6 };
const TERRAIN_DIFFUSE_BOOST = 2.15;
const TERRAIN_EMISSIVE_BOOST = 0.18;
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
const GRASS_CLUMP_RADIUS = 0.52;
const GRASS_MIN_CLUMPS_PER_PATCH = 2;
const GRASS_MAX_CLUMPS_PER_PATCH = 4;
const GRASS_PATHSIDE_BONUS_RADIUS = 16;
const GRASS_MIN_BLADES_PER_CLUMP = 10;
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
  mainMenuVideo: "#mainMenuVideo",
  newGameButton: "#newGameButton",
  hud: "#hud",
  exploreScore: "#exploreScore",
  paintingScreen: "#paintingScreen",
  paintingCanvas: "#paintingCanvas",
  paintScore: "#paintScore",
  paintTimer: "#paintTimer",
  paintingPrompt: "#paintingPrompt",
  cutsceneScreen: "#cutsceneScreen",
  cutsceneVideo: "#cutsceneVideo",
  cutsceneFallback: "#cutsceneFallback",
  skipIndicator: "#skipIndicator",
  stagePrompt: "#stagePrompt"
} as const;

type Threat = {
  root: TransformNode;
  visualRoot: TransformNode | null;
  velocity: Vector3;
  radius: number;
  bobPhase: number;
};

type ClickPulse = {
  mesh: Mesh;
  material: StandardMaterial;
  startedAt: number;
};

type LightingTuning = {
  emissive: number;
  shadowDarkness: number;
  lightness: number;
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
  pos.y *= 1.7; // height
  pos.x *= 0.4; // width
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
  private audio = new Audio();
  private songIndex = 0;
  private targetVolume = FULL_VOLUME;
  private tweenFrame = 0;
  private retryBound = false;
  private started = false;

  constructor() {
    this.audio.preload = "auto";
    this.audio.loop = false;
    this.audio.volume = FULL_VOLUME;
    this.audio.addEventListener("ended", () => this.playNextSong());
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.songIndex = 0;
    this.playCurrentSong();
  }

  setCutsceneDucked(ducked: boolean): void {
    this.tweenTo(ducked ? CUTSCENE_VOLUME : FULL_VOLUME);
  }

  private playCurrentSong(): void {
    this.audio.src = this.songSource(SONGS[this.songIndex]);
    this.audio.currentTime = 0;
    this.tryPlay();
  }

  private tryPlay(): void {
    const playPromise = this.audio.play();
    if (playPromise) {
      playPromise.catch(() => this.retryAfterGesture());
    }
  }

  private playNextSong(): void {
    this.songIndex = (this.songIndex + 1) % SONGS.length;
    this.playCurrentSong();
  }

  private songSource(name: string): string {
    return `${RESOURCE_ROOT}${name}.${this.prefersWebmOpus() ? "webm" : "m4a"}`;
  }

  private prefersWebmOpus(): boolean {
    return Boolean(this.audio.canPlayType('audio/webm; codecs="opus"'));
  }

  private retryAfterGesture(): void {
    if (this.retryBound) return;
    this.retryBound = true;
    const retry = () => {
      this.retryBound = false;
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      if (!this.audio.paused) return;
      this.tryPlay();
    };
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
  }

  private tweenTo(volume: number): void {
    this.targetVolume = volume;
    window.cancelAnimationFrame(this.tweenFrame);
    const from = this.audio.volume;
    const startedAt = performance.now();
    const duration = VOLUME_TWEEN_SECONDS * 1000;
    const step = (now: number) => {
      const t = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - (1 - t) * (1 - t);
      this.audio.volume = lerp(from, this.targetVolume, eased);
      if (t < 1) this.tweenFrame = window.requestAnimationFrame(step);
    };
    this.tweenFrame = window.requestAnimationFrame(step);
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
  private pulseRoot: TransformNode;
  private shadowGenerator: ShadowGenerator;
  private keys = new Set<string>();
  private activePointers = new Map<number, PointerEvent>();
  private rotatePointerId: number | null = null;
  private rotateDragLastX = 0;
  private lastPinchDistance = 0;
  private cameraYaw = -45;
  private cameraPitch = 38;
  private cameraRadius = 21;
  private visualYaw = 0;
  private sun: DirectionalLight;
  private pathTime = 0;
  private pathComplete = false;
  private isPaused = false;
  private stage2Active = false;
  private stage2Started = false;
  private stage2Complete = false;
  private stage2EndDistance = Number.POSITIVE_INFINITY;
  private stage2DestinationPoint = STAGE_2_DESTINATION_FALLBACK.clone();
  private onStage2Complete: (() => void) | null = null;
  private heroPathPoints: Vector3[] = FALLBACK_HERO_PATH_POINTS.map((point) => point.clone());
  private spawnTimer = 0;
  private pathSegmentLengths: number[] = [];
  private pathTotalLength = 0;
  private propBlockers: PropBlocker[] = [];
  private propBlockerCells = new Map<string, PropBlocker[]>();
  private propBlockerCellSize = 12;
  private maxPropBlockerRadius = 0;
  private threats: Threat[] = [];
  private clickPulses: ClickPulse[] = [];
  private terrainMeshes: Mesh[] = [];
  private makliAtlasMetadata: MakliAtlasMetadata | null = null;
  private glowLayer: GlowLayer;
  private threatGhostMaterial: StandardMaterial;
  private threatGhostTemplate: TransformNode | null = null;
  private threatGhostHeight = 1;
  private threatGhostRadius = 0.58;
  private terrainAtlasTexture: Texture;
  private grassPatches: Mesh[] = [];
  private grassMaterial!: ShaderMaterial;
  private grassPathAvoidanceRadius = 2;
  private hearts = 3;
  private threatScore = 0;
  private invulnerableUntil = 0;
  private heartElements: HTMLElement[] = [];
  private scoreElement: HTMLElement | null = null;
  private lightingTuning: LightingTuning = FIXED_LIGHTING_TUNING;
  private tunableMaterials = new Set<object>();
  private terrainMaterials = new Set<object>();
  private baseMaterialColors = new WeakMap<object, { diffuse?: Color3; albedo?: Color3 }>();

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
    this.pulseRoot = new TransformNode("clickPulseRoot", scene);

    this.configureScene();

    this.glowLayer = new GlowLayer("drawGlowLayer", scene, { blurKernelSize: 48 });
    this.glowLayer.intensity = 0.72;

    this.threatGhostMaterial = makeMaterial(scene, "threatGhostMaterial", new Color3(0.58, 0.96, 1), new Color3(1.45, 2.2, 2.35));
    this.threatGhostMaterial.alpha = 0.58;
    this.threatGhostMaterial.disableLighting = true;
    this.threatGhostMaterial.disableDepthWrite = true;
    this.threatGhostMaterial.backFaceCulling = false;
    this.threatGhostMaterial.transparencyMode = Material.MATERIAL_ALPHABLEND;

    this.playerRoot.parent = this.root;
    this.mapRoot.parent = this.root;
    this.visualRoot.parent = this.playerRoot;
    this.modelRoot.parent = this.visualRoot;
    this.pulseRoot.parent = this.root;

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
    sun.intensity = 1.28;
    sun.diffuse = new Color3(1, 0.82, 0.6);
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
    this.shadowGenerator.darkness = this.lightingTuning.shadowDarkness;
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
    void this.loadThreatGhost();
    this.updateCamera();
    this.initHeartsUI();
    this.initScoreUI();
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
      this.updateScoreUI();
    }
  }

  startStage2(onComplete: () => void): void {
    this.stage2Active = true;
    this.stage2Started = false;
    this.stage2Complete = false;
    this.onStage2Complete = onComplete;
    this.isPaused = true;
    this.cameraYaw = STAGE_2_INITIAL_CAMERA_YAW;
    this.configureStage2PathRange();
    this.threatScore = 0;
    this.updateScoreUI();
    this.clearClickPulses();
    this.clearThreats();
    this.updateHeroPath(0);
  }

  beginStage2(): void {
    if (!this.stage2Active || this.stage2Started) return;
    this.stage2Started = true;
    this.isPaused = false;
  }

  private initHeartsUI(): void {
    const container = document.querySelector("#heartsContainer");
    if (container) {
      this.heartElements = [...container.querySelectorAll<HTMLElement>(".heart")];
    }
  }

  private initScoreUI(): void {
    this.scoreElement = document.querySelector(selectors.exploreScore);
    this.updateScoreUI();
  }

  private updateScoreUI(): void {
    if (this.scoreElement) this.scoreElement.textContent = String(this.threatScore);
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
    if (this.isPaused) {
      this.updateClickPulses();
      this.updateCamera();
      this.updateGrassVisibility();
      return;
    }
    this.updateHeroPath(dt);
    this.updateClickPulses();
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
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = this.pickGroundPoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    this.createClickPulse(point);
    this.removeThreatsAlongPointer(event.clientX, event.clientY, point);
  }

  private onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    if (this.rotatePointerId === event.pointerId) {
      this.rotatePointerId = null;
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
        } else if (this.isOriginArtifactPropMesh(mesh)) {
          this.disableOriginArtifactPropMesh(mesh);
        } else {
          this.configureMakliPropMesh(mesh);
        }
      }
      console.timeEnd("[Explore]   mesh hierarchy + configure");

      console.time("[Explore]   hero path + prop blockers");
      this.loadHeroPathFromMap(result.meshes);
      this.loadStage2DestinationFromMap([...result.transformNodes, ...result.meshes]);
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

  private isOriginArtifactPropMesh(mesh: Mesh): boolean {
    if (mesh.getTotalVertices() === 0) return false;
    if (mesh.instances.length > 0 || mesh.thinInstanceCount > 0) return false;
    mesh.computeWorldMatrix(true);
    const center = mesh.getBoundingInfo().boundingBox.centerWorld;
    return Math.hypot(center.x, center.y, center.z) < 0.01;
  }

  private disableOriginArtifactPropMesh(mesh: Mesh): void {
    mesh.isVisible = false;
    mesh.visibility = 0;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.alwaysSelectAsActiveMesh = false;
  }

  private configureMakliTerrainMesh(mesh: Mesh): void {
    const material = new StandardMaterial(`${mesh.name}_bakedMaterial`, this.scene);
    const tint = this.terrainChunkTint(mesh.name);
    material.diffuseTexture = this.terrainAtlasTexture;
    material.diffuseColor = new Color3(tint, tint, tint);
    material.emissiveTexture = this.terrainAtlasTexture;
    material.emissiveColor = new Color3(TERRAIN_EMISSIVE_BOOST, TERRAIN_EMISSIVE_BOOST * 0.86, TERRAIN_EMISSIVE_BOOST * 0.62);
    material.specularColor = Color3.Black();
    material.roughness = 1;
    material.disableLighting = false;
    material.backFaceCulling = false;
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.alwaysSelectAsActiveMesh = true;
    this.terrainMaterials.add(material);
    this.registerTunableMaterial(material);
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
    this.registerTunableMaterial(mesh.material);
    this.shadowGenerator.addShadowCaster(mesh, true);
  }

  private buildPropBlockersFromMetadata(metadata: MakliAtlasMetadata): void {
    const groups = metadata.props?.groups;
    if (!groups) {
      this.propBlockers = [];
      this.rebuildPropBlockerGrid();
      return;
    }
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
    this.rebuildPropBlockerGrid();
  }

  private rebuildPropBlockerGrid(): void {
    this.propBlockerCells.clear();
    this.maxPropBlockerRadius = 0;
    for (const blocker of this.propBlockers) {
      this.maxPropBlockerRadius = Math.max(this.maxPropBlockerRadius, blocker.radius);
      const key = this.propBlockerCellKey(blocker.center.x, blocker.center.y);
      const cell = this.propBlockerCells.get(key);
      if (cell) {
        cell.push(blocker);
      } else {
        this.propBlockerCells.set(key, [blocker]);
      }
    }
  }

  private propBlockerCellKey(x: number, z: number): string {
    return `${Math.floor(x / this.propBlockerCellSize)},${Math.floor(z / this.propBlockerCellSize)}`;
  }

  private propBlockersNear(x: number, z: number, radius: number): PropBlocker[] {
    if (this.propBlockerCells.size === 0) return this.propBlockers;
    const minCellX = Math.floor((x - radius) / this.propBlockerCellSize);
    const maxCellX = Math.floor((x + radius) / this.propBlockerCellSize);
    const minCellZ = Math.floor((z - radius) / this.propBlockerCellSize);
    const maxCellZ = Math.floor((z + radius) / this.propBlockerCellSize);
    const nearby: PropBlocker[] = [];
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        const cell = this.propBlockerCells.get(`${cellX},${cellZ}`);
        if (cell) nearby.push(...cell);
      }
    }
    return nearby;
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
    if (this.stage2Active) this.configureStage2PathRange();
  }

  private loadStage2DestinationFromMap(nodes: readonly { name: string; getAbsolutePosition?: () => Vector3 }[]): void {
    const destinationNode = nodes.find((node) => node.name === STAGE_2_DESTINATION_NODE || node.name.includes(STAGE_2_DESTINATION_NODE));
    const position = destinationNode?.getAbsolutePosition?.();
    if (position) {
      this.stage2DestinationPoint.copyFrom(position);
      this.stage2DestinationPoint.y = 0;
    }
  }

  private configureStage2PathRange(): void {
    if (this.pathTotalLength <= 0) return;
    this.pathTime = this.closestPathDistanceTo(Vector3.Zero());
    this.stage2EndDistance = this.pathTime + (this.pathTotalLength - this.pathTime) * STAGE_2_PATH_COMPLETION_RATIO;
    this.pathComplete = false;
  }

  private closestPathDistanceTo(target: Vector3): number {
    let closestDistance = Number.POSITIVE_INFINITY;
    let closestPathDistance = this.pathTotalLength;
    let walked = 0;
    for (let i = 0; i < this.heroPathPoints.length - 1; i += 1) {
      const a = this.heroPathPoints[i];
      const b = this.heroPathPoints[i + 1];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const lengthSq = abx * abx + abz * abz;
      const t = lengthSq > 0.0001 ? clamp(((target.x - a.x) * abx + (target.z - a.z) * abz) / lengthSq, 0, 1) : 0;
      const projected = new Vector3(a.x + abx * t, 0, a.z + abz * t);
      const distance = Math.hypot(target.x - projected.x, target.z - projected.z);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPathDistance = walked + this.pathSegmentLengths[i] * t;
      }
      walked += this.pathSegmentLengths[i] ?? 0;
    }
    return closestPathDistance;
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
    const endDistance = this.stage2Active ? this.stage2EndDistance : this.pathTotalLength;
    if (this.pathTime >= endDistance) {
      this.pathTime = endDistance;
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
    if (this.stage2Active && this.pathComplete && !this.stage2Complete) {
      this.stage2Complete = true;
      this.isPaused = true;
      window.setTimeout(() => this.onStage2Complete?.(), 250);
    }
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

  private createClickPulse(point: Vector3): void {
    const material = makeMaterial(this.scene, "clickPulseMaterial", new Color3(0.52, 0.96, 1), new Color3(0.18, 0.9, 1));
    material.alpha = 0.78;
    material.disableLighting = true;
    material.disableDepthWrite = true;
    material.backFaceCulling = false;
    material.transparencyMode = Material.MATERIAL_ALPHABLEND;

    const mesh = MeshBuilder.CreateDisc("clickPulse", { radius: 0.2, tessellation: 48 }, this.scene);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(point.x, this.groundHeightAt(point.x, point.z) + CLICK_PULSE_HEIGHT, point.z);
    mesh.material = material;
    mesh.parent = this.pulseRoot;
    this.clickPulses.push({ mesh, material, startedAt: performance.now() });
  }

  private updateClickPulses(): void {
    const now = performance.now();
    for (let i = this.clickPulses.length - 1; i >= 0; i -= 1) {
      const pulse = this.clickPulses[i];
      const progress = clamp((now - pulse.startedAt) / (CLICK_PULSE_SECONDS * 1000), 0, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const radius = lerp(0.35, THREAT_CLICK_RADIUS, eased);
      pulse.mesh.scaling.set(radius, radius, radius);
      pulse.material.alpha = (1 - progress) * 0.72;
      if (progress >= 1) {
        pulse.mesh.dispose(false, false);
        pulse.material.dispose();
        this.clickPulses.splice(i, 1);
      }
    }
  }

  private clearClickPulses(): void {
    for (const pulse of this.clickPulses) {
      pulse.mesh.dispose(false, false);
      pulse.material.dispose();
    }
    this.clickPulses = [];
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
      threat.velocity = scaleVec3(normalizeVec3(toHero), THREAT_SPEED);
      const next = addVec3(threat.root.position, scaleVec3(threat.velocity, dt));
      next.y = this.groundHeightAt(next.x, next.z) + 0.75;
      threat.root.position.copyFrom(next);
      threat.root.rotation.y = Math.atan2(threat.velocity.x, threat.velocity.z);
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

  private pathProgress(): number {
    return this.pathTotalLength > 0 ? clamp(this.pathTime / this.pathTotalLength, 0, 1) : 0;
  }

  private spawnThreat(): void {
    if (!this.threatGhostTemplate) return;

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
    const root = new TransformNode("threatGhost", this.scene);
    root.position.set(spawnX, this.groundHeightAt(spawnX, spawnZ) + 0.75, spawnZ);
    root.parent = this.root;

    const visualRoot = this.threatGhostTemplate.clone("threatGhostVisual", root) as TransformNode | null;
    visualRoot?.setEnabled(true);

    this.threats.push({
      root,
      visualRoot,
      velocity: Vector3.Zero(),
      radius: this.threatGhostRadius,
      bobPhase: Math.random() * Math.PI * 2
    });
  }

  private animateThreat(threat: Threat): void {
    const time = performance.now() * 0.001;
    if (!threat.visualRoot) return;
    const bobAmplitude = this.threatGhostHeight * 0.25;
    threat.visualRoot.position.y = Math.sin(time * Math.PI + threat.bobPhase) * bobAmplitude;
  }

  private removeThreatsAlongPointer(clientX: number, clientY: number, groundPoint: Vector3): void {
    const rect = this.canvas.getBoundingClientRect();
    const ray = this.scene.createPickingRay(clientX - rect.left, clientY - rect.top, null, this.camera);
    const maxDistance = Math.max(0, distanceVec3(ray.origin, groundPoint)) + 8;
    for (let i = this.threats.length - 1; i >= 0; i -= 1) {
      const threat = this.threats[i];
      if (this.doesPointerRayHitThreat(ray, maxDistance, threat, groundPoint)) this.removeThreat(i, true);
    }
  }

  private doesPointerRayHitThreat(ray: Ray, maxDistance: number, threat: Threat, groundPoint: Vector3): boolean {
    const center = threat.root.position;
    const toCenter = subVec3(center, ray.origin);
    const alongRay = toCenter.x * ray.direction.x + toCenter.y * ray.direction.y + toCenter.z * ray.direction.z;
    if (alongRay >= 0 && alongRay <= maxDistance) {
      const closest = addVec3(ray.origin, scaleVec3(ray.direction, alongRay));
      if (distanceVec3(center, closest) <= THREAT_CLICK_RAY_WIDTH + threat.radius) return true;
    }

    const groundDistance = distancePointToSegment2D(new Vector2(center.x, center.z), ray.origin, groundPoint);
    return groundDistance <= THREAT_CLICK_RAY_WIDTH + threat.radius;
  }

  private removeThreat(index: number, scored = false): void {
    const [threat] = this.threats.splice(index, 1);
    threat.root.dispose(false, false);
    if (scored) {
      this.threatScore += 1;
      this.updateScoreUI();
    }
  }

  private clearThreats(): void {
    for (const threat of this.threats) threat.root.dispose(false, false);
    this.threats = [];
    this.spawnTimer = 0;
  }

  private async loadThreatGhost(): Promise<void> {
    try {
      await DracoCompression.Default.whenReadyAsync();
      const result = await SceneLoader.ImportMeshAsync("", RESOURCE_ROOT, GHOST_MODEL, this.scene);
      const assetRoot = new TransformNode("threatGhostTemplate", this.scene);
      assetRoot.parent = this.root;

      for (const node of [...result.transformNodes, ...result.meshes]) {
        if (!node.parent) node.parent = assetRoot;
      }
      for (const mesh of result.meshes) {
        if (!(mesh instanceof Mesh)) continue;
        mesh.isPickable = false;
        mesh.material = this.threatGhostMaterial;
      }

      const bounds = assetRoot.getHierarchyBoundingVectors(true, (mesh) => mesh instanceof Mesh);
      const height = bounds.max.y - bounds.min.y;
      const width = bounds.max.x - bounds.min.x;
      const depth = bounds.max.z - bounds.min.z;
      this.threatGhostHeight = Math.max(0.1, height);
      this.threatGhostRadius = Math.max(0.58, Math.max(width, depth) * 0.5);
      assetRoot.position.y -= bounds.min.y;
      assetRoot.setEnabled(false);
      this.threatGhostTemplate = assetRoot;
    } catch (error) {
      console.error("Unable to load ghost threat model", error);
      this.createFallbackThreatGhost();
    }
  }

  private createFallbackThreatGhost(): void {
    const assetRoot = new TransformNode("fallbackThreatGhostTemplate", this.scene);
    assetRoot.parent = this.root;
    const body = MeshBuilder.CreateCapsule("fallbackThreatGhostBody", { height: 1.2, radius: 0.32 }, this.scene);
    body.position.y = 0.6;
    body.material = this.threatGhostMaterial;
    body.isPickable = false;
    body.parent = assetRoot;
    assetRoot.setEnabled(false);
    this.threatGhostHeight = 1.2;
    this.threatGhostRadius = 0.58;
    this.threatGhostTemplate = assetRoot;
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
          this.registerTunableMaterial(mesh.material);
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
      this.registerTunableMaterial(fallback.material);
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

  setLightingTuning(tuning: LightingTuning): void {
    this.lightingTuning = tuning;
    this.shadowGenerator.darkness = tuning.shadowDarkness;
    for (const material of this.tunableMaterials) this.applyLightingTuning(material);
  }

  private registerTunableMaterial(material: Mesh["material"]): void {
    if (!material) return;
    this.tunableMaterials.add(material);
    const editableMaterial = material as { diffuseColor?: Color3; albedoColor?: Color3 };
    if (!this.baseMaterialColors.has(material)) {
      this.baseMaterialColors.set(material, {
        diffuse: editableMaterial.diffuseColor?.clone(),
        albedo: editableMaterial.albedoColor?.clone()
      });
    }
    this.applyLightingTuning(material);
  }

  private applyLightingTuning(material: object): void {
    const editableMaterial = material as {
      diffuseColor?: Color3;
      albedoColor?: Color3;
      emissiveColor?: Color3;
      directIntensity?: number;
    };
    const baseColors = this.baseMaterialColors.get(material);
    const lightness = this.lightingTuning.lightness;
    if (this.terrainMaterials.has(material)) {
      if (editableMaterial.emissiveColor) {
        editableMaterial.emissiveColor = new Color3(
          TERRAIN_EMISSIVE_BOOST,
          TERRAIN_EMISSIVE_BOOST * 0.86,
          TERRAIN_EMISSIVE_BOOST * 0.62
        );
      }
      if (editableMaterial.directIntensity !== undefined) editableMaterial.directIntensity = 1.32 * lightness;
      if (editableMaterial.diffuseColor && baseColors?.diffuse) {
        editableMaterial.diffuseColor = this.scaledColor(baseColors.diffuse, lightness * TERRAIN_DIFFUSE_BOOST);
      }
      if (editableMaterial.albedoColor && baseColors?.albedo) {
        editableMaterial.albedoColor = this.scaledColor(baseColors.albedo, lightness * TERRAIN_DIFFUSE_BOOST);
      }
      return;
    }
    if (editableMaterial.emissiveColor) {
      editableMaterial.emissiveColor = new Color3(
        this.lightingTuning.emissive,
        this.lightingTuning.emissive * 0.68,
        this.lightingTuning.emissive * 0.34
      );
    }
    if (editableMaterial.directIntensity !== undefined) editableMaterial.directIntensity = 1.32 * lightness;
    if (editableMaterial.diffuseColor && baseColors?.diffuse) {
      editableMaterial.diffuseColor = this.scaledColor(baseColors.diffuse, lightness);
    }
    if (editableMaterial.albedoColor && baseColors?.albedo) {
      editableMaterial.albedoColor = this.scaledColor(baseColors.albedo, lightness);
    }
  }

  private scaledColor(color: Color3, scale: number): Color3 {
    return new Color3(clamp(color.r * scale, 0, 1), clamp(color.g * scale, 0, 1), clamp(color.b * scale, 0, 1));
  }

  private playWalkAnimation(animationGroups: AnimationGroup[]): void {
    const group = animationGroups.find((animation) => {
      const name = animation.name.toLowerCase();
      return name === "nlatrack.004" || name.includes("nlatrack.004") || name.includes("walk");
    }) ?? animationGroups[0];

    if (group) {
      if (group.name !== "NlaTrack.004") console.info(`Using animation track "${group.name}" for "NlaTrack.004"`);
      group.start(true, HERO_WALK_ANIMATION_SPEED_RATIO);
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
      const centerTerrainY = terrainHeightAt(cx, cz);
      const centerShade = this.grassShadeAt(cx, cz, centerY);

      for (let b = 0; b < bladeCount; b++) {
        const angle = hashNoise(cx + b * 2.37, cz - b * 1.91) * Math.PI * 2;
        const distance = Math.sqrt(hashNoise(cx - b * 4.17, cz + b * 3.13)) * radius;
        const bx = cx + Math.cos(angle) * distance;
        const bz = cz + Math.sin(angle) * distance;
        if (bx < patchMinX || bx > patchMinX + GRASS_PATCH_SIZE || bz < patchMinZ || bz > patchMinZ + GRASS_PATCH_SIZE) continue;
        if (this.isGrassPlacementBlocked(bx, bz)) continue;
        const localTerrainDelta = clamp(terrainHeightAt(bx, bz) - centerTerrainY, -0.18, 0.18);
        const y = centerY + localTerrainDelta;
        blades.push({
          x: bx,
          z: bz,
          y: y + 0.012,
          seed: hashNoise(bx * 13.1, bz * 17.9),
          shade: clamp(centerShade + (hashNoise(bx * 5.3, bz * 4.7) - 0.5) * 0.06, 0.52, 1.08)
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
    const radius = this.maxPropBlockerRadius + 0.45;
    if (this.propBlockerCells.size === 0) {
      for (const blocker of this.propBlockers) {
        if (this.doesPropBlockGrassPoint(blocker, x, z)) return true;
      }
      return false;
    }

    const minCellX = Math.floor((x - radius) / this.propBlockerCellSize);
    const maxCellX = Math.floor((x + radius) / this.propBlockerCellSize);
    const minCellZ = Math.floor((z - radius) / this.propBlockerCellSize);
    const maxCellZ = Math.floor((z + radius) / this.propBlockerCellSize);
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        const cell = this.propBlockerCells.get(`${cellX},${cellZ}`);
        if (!cell) continue;
        for (const blocker of cell) {
          if (this.doesPropBlockGrassPoint(blocker, x, z)) return true;
        }
      }
    }
    return false;
  }

  private doesPropBlockGrassPoint(blocker: PropBlocker, x: number, z: number): boolean {
    const dx = x - blocker.center.x;
    const dz = z - blocker.center.y;
    return dx * dx + dz * dz < (blocker.radius + 0.45) * (blocker.radius + 0.45);
  }

  private grassShadeAt(x: number, z: number, y: number): number {
    let shade = clamp(0.76 + y * 0.08 + (fractalNoise(x * 0.05 + 71, z * 0.05 - 19) - 0.5) * 0.18, 0.58, 1.04);
    const shadowDir = new Vector2(LATE_DAY_SUN_DIRECTION.x, LATE_DAY_SUN_DIRECTION.z);
    const shadowLength = Math.max(0.001, Math.hypot(shadowDir.x, shadowDir.y));
    shadowDir.x /= shadowLength;
    shadowDir.y /= shadowLength;

    for (const blocker of this.propBlockersNear(x, z, this.maxPropBlockerRadius * 6.8)) {
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

type PaintingRoundAssets = {
  outline: HTMLImageElement;
  painting: HTMLImageElement;
  mask: Uint8Array;
  winner: HTMLImageElement;
  subjectPixels: number;
};

class PaintingMode {
  private context: CanvasRenderingContext2D;
  private revealCanvas = document.createElement("canvas");
  private revealContext: CanvasRenderingContext2D;
  private painted: Uint8Array;
  private assets: PaintingRoundAssets | null = null;
  private phase: "inactive" | "loading" | "prompt" | "painting" | "judging" = "inactive";
  private isPainting = false;
  private currentRound = 0;
  private timer = 60;
  private penaltyPoints = 0;
  private score = 0;
  private paintedSubjectPixels = 0;
  private judgedSeconds = 0;
  private lastPenaltyAt = -1000;
  private onComplete: (() => void) | null = null;
  private readonly size = 1254;
  private readonly judgingWidth = 2508;
  private readonly roundCount = 4;
  private readonly brushRadius = Math.round(1254 / 15);

  constructor(
    private screen: HTMLElement,
    private canvas: HTMLCanvasElement,
    private scoreElement: HTMLElement,
    private timerElement: HTMLElement,
    private promptElement: HTMLElement
  ) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const revealContext = this.revealCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || !revealContext) throw new Error("Painting canvas could not be initialized");
    this.context = context;
    this.revealContext = revealContext;
    this.revealCanvas.width = this.size;
    this.revealCanvas.height = this.size;
    this.painted = new Uint8Array(this.size * this.size);
    this.bind();
    this.setCanvasSquare();
  }

  start(onComplete: () => void): void {
    this.onComplete = onComplete;
    this.currentRound = 0;
    void this.loadRound(0);
  }

  update(dt: number): void {
    if (this.phase === "painting") {
      this.timer = Math.max(0, this.timer - dt);
      this.updateStats();
      if (this.timer <= 0) this.beginJudging();
    } else if (this.phase === "judging") {
      this.judgedSeconds += dt;
      this.renderJudging();
      if (this.judgedSeconds >= 7) this.advanceRound();
    }
  }

  private bind(): void {
    this.promptElement.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (this.phase === "prompt") this.beginPainting();
    });
    this.canvas.addEventListener("pointerdown", (event) => {
      if (this.phase !== "painting") return;
      event.preventDefault();
      this.canvas.setPointerCapture(event.pointerId);
      this.isPainting = true;
      this.paintAt(event);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (this.phase === "painting" && this.isPainting) this.paintAt(event);
    });
    this.canvas.addEventListener("pointerup", () => {
      this.isPainting = false;
    });
    this.canvas.addEventListener("pointercancel", () => {
      this.isPainting = false;
    });
  }

  private async loadRound(index: number): Promise<void> {
    this.phase = "loading";
    this.screen.classList.remove("is-judging", "is-finished");
    setHidden(this.promptElement, true);
    this.setCanvasSquare();
    this.clearCanvas();
    try {
      const round = index + 1;
      const [outline, painting, maskImage, winner] = await Promise.all([
        this.loadImage(`${RESOURCE_ROOT}outline-${round}.webp`),
        this.loadImage(`${RESOURCE_ROOT}painting-${round}.webp`),
        this.loadImage(`${RESOURCE_ROOT}mask-${round}.png`),
        this.loadImage(`${RESOURCE_ROOT}winner-${round}.webp`)
      ]);
      const { mask, subjectPixels } = this.readMask(maskImage);
      this.assets = { outline, painting, mask, winner, subjectPixels };
      this.resetRound();
      this.phase = "prompt";
      setHidden(this.promptElement, false);
      this.renderPainting();
    } catch (error) {
      console.error("Unable to load painting round assets", error);
      this.onComplete?.();
    }
  }

  private beginPainting(): void {
    this.phase = "painting";
    setHidden(this.promptElement, true);
    this.updateStats();
  }

  private resetRound(): void {
    this.timer = 60;
    this.penaltyPoints = 0;
    this.score = 0;
    this.paintedSubjectPixels = 0;
    this.judgedSeconds = 0;
    this.lastPenaltyAt = -1000;
    this.isPainting = false;
    this.painted.fill(0);
    this.revealContext.clearRect(0, 0, this.size, this.size);
    this.updateStats();
  }

  private paintAt(event: PointerEvent): void {
    const point = this.canvasPoint(event);
    if (!point) return;
    const now = performance.now();
    const badRatio = this.badBrushRatio(point.x, point.y);
    if (badRatio > 0.5 && now - this.lastPenaltyAt >= 1000) {
      this.penaltyPoints += 1;
      this.lastPenaltyAt = now;
    }
    this.revealBrush(point.x, point.y);
    this.recalculateScore();
    this.renderPainting();
    this.updateStats();
    if (this.assets && this.paintedSubjectPixels >= this.assets.subjectPixels) this.beginJudging();
  }

  private revealBrush(cx: number, cy: number): void {
    const gradient = this.revealContext.createRadialGradient(cx, cy, 0, cx, cy, this.brushRadius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0.88)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    this.revealContext.fillStyle = gradient;
    this.revealContext.beginPath();
    this.revealContext.arc(cx, cy, this.brushRadius, 0, Math.PI * 2);
    this.revealContext.fill();

    const minX = Math.max(0, cx - this.brushRadius);
    const maxX = Math.min(this.size - 1, cx + this.brushRadius);
    const minY = Math.max(0, cy - this.brushRadius);
    const maxY = Math.min(this.size - 1, cy + this.brushRadius);
    const radiusSq = this.brushRadius * this.brushRadius;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radiusSq) continue;
        const index = y * this.size + x;
        if (!this.painted[index]) {
          this.painted[index] = 1;
          if (this.assets?.mask[index]) this.paintedSubjectPixels += 1;
        }
      }
    }
  }

  private badBrushRatio(cx: number, cy: number): number {
    if (!this.assets) return 1;
    let checked = 0;
    let bad = 0;
    const minX = Math.max(0, cx - this.brushRadius);
    const maxX = Math.min(this.size - 1, cx + this.brushRadius);
    const minY = Math.max(0, cy - this.brushRadius);
    const maxY = Math.min(this.size - 1, cy + this.brushRadius);
    const radiusSq = this.brushRadius * this.brushRadius;
    for (let y = minY; y <= maxY; y += 3) {
      for (let x = minX; x <= maxX; x += 3) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radiusSq) continue;
        checked += 1;
        const index = y * this.size + x;
        if (!this.assets.mask[index] || this.painted[index]) bad += 1;
      }
    }
    return checked > 0 ? bad / checked : 1;
  }

  private renderPainting(): void {
    if (!this.assets) return;
    this.context.clearRect(0, 0, this.size, this.size);
    this.context.save();
    this.context.drawImage(this.assets.painting, 0, 0, this.size, this.size);
    this.context.globalCompositeOperation = "destination-in";
    this.context.drawImage(this.revealCanvas, 0, 0);
    this.context.restore();
    this.context.drawImage(this.assets.outline, 0, 0, this.size, this.size);
  }

  private beginJudging(): void {
    if (this.phase === "judging") return;
    this.phase = "judging";
    this.isPainting = false;
    this.judgedSeconds = 0;
    this.screen.classList.add("is-judging", "is-finished");
    setHidden(this.promptElement, true);
    this.setCanvasJudging();
    this.renderJudging();
  }

  private renderJudging(): void {
    if (!this.assets) return;
    const slide = clamp(this.judgedSeconds / 1.2, 0, 1);
    const fade = clamp(this.judgedSeconds / 1.4, 0, 1);
    const leftX = lerp(this.size * 0.5, 0, slide);
    this.context.clearRect(0, 0, this.judgingWidth, this.size);
    this.context.fillStyle = "#07080a";
    this.context.fillRect(0, 0, this.judgingWidth, this.size);
    this.context.drawImage(this.assets.painting, leftX, 0, this.size, this.size);
    this.context.save();
    this.context.globalAlpha = fade;
    this.context.drawImage(this.assets.winner, this.size, 0, this.size, this.size);
    this.context.restore();

    if (this.judgedSeconds < 3) {
      const alpha = 0.28 + Math.sin(this.judgedSeconds * Math.PI * 3.2) * 0.28 + 0.44;
      this.context.save();
      this.context.globalAlpha = clamp(alpha, 0, 1);
      this.context.fillStyle = "#fff2c2";
      this.context.font = "800 88px Inter, sans-serif";
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";
      this.context.fillText("Judging...", this.size, this.size * 0.5);
      this.context.restore();
    } else {
      this.drawCheckmark();
    }
  }

  private drawCheckmark(): void {
    const cx = this.size * 1.5;
    const cy = this.size * 0.5;
    this.context.save();
    this.context.strokeStyle = "#f1c84b";
    this.context.lineWidth = 46;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.shadowColor = "rgba(0, 0, 0, 0.55)";
    this.context.shadowBlur = 24;
    this.context.beginPath();
    this.context.moveTo(cx - 170, cy + 10);
    this.context.lineTo(cx - 55, cy + 125);
    this.context.lineTo(cx + 190, cy - 150);
    this.context.stroke();
    this.context.restore();
  }

  private advanceRound(): void {
    this.currentRound += 1;
    if (this.currentRound >= this.roundCount) {
      this.phase = "inactive";
      this.screen.classList.remove("is-judging", "is-finished");
      this.clearCanvas();
      this.onComplete?.();
      return;
    }
    void this.loadRound(this.currentRound);
  }

  private canvasPoint(event: PointerEvent): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * this.size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * this.size);
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return null;
    return { x, y };
  }

  private recalculateScore(): void {
    if (!this.assets || this.assets.subjectPixels <= 0) {
      this.score = 0;
      return;
    }
    const coveragePercent = Math.floor((this.paintedSubjectPixels / this.assets.subjectPixels) * 100);
    this.score = Math.max(0, Math.min(1000, coveragePercent * 10) - this.penaltyPoints);
  }

  private updateStats(): void {
    this.recalculateScore();
    this.scoreElement.textContent = String(this.score);
    this.timerElement.textContent = String(Math.ceil(this.timer));
  }

  private readMask(maskImage: HTMLImageElement): { mask: Uint8Array; subjectPixels: number } {
    const buffer = document.createElement("canvas");
    buffer.width = this.size;
    buffer.height = this.size;
    const context = buffer.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Mask buffer could not be initialized");
    context.drawImage(maskImage, 0, 0, this.size, this.size);
    const data = context.getImageData(0, 0, this.size, this.size).data;
    const mask = new Uint8Array(this.size * this.size);
    let subjectPixels = 0;
    for (let i = 0; i < mask.length; i += 1) {
      const offset = i * 4;
      const isSubject = data[offset + 3] > 16 && data[offset] + data[offset + 1] + data[offset + 2] > 16;
      if (isSubject) {
        mask[i] = 1;
        subjectPixels += 1;
      }
    }
    return { mask, subjectPixels: Math.max(1, subjectPixels) };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load ${src}`));
      image.src = src;
    });
  }

  private setCanvasSquare(): void {
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  private setCanvasJudging(): void {
    this.canvas.width = this.judgingWidth;
    this.canvas.height = this.size;
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class App {
  private canvas = bySelector<HTMLCanvasElement>(selectors.canvas);
  private splash = bySelector<HTMLElement>(selectors.splash);
  private mainMenu = bySelector<HTMLElement>(selectors.mainMenu);
  private mainMenuVideo = bySelector<HTMLVideoElement>(selectors.mainMenuVideo);
  private hud = bySelector<HTMLElement>(selectors.hud);
  private paintingScreen = bySelector<HTMLElement>(selectors.paintingScreen);
  private cutsceneScreen = bySelector<HTMLElement>(selectors.cutsceneScreen);
  private cutsceneVideo = bySelector<HTMLVideoElement>(selectors.cutsceneVideo);
  private cutsceneFallback = bySelector<HTMLElement>(selectors.cutsceneFallback);
  private skipIndicator = bySelector<HTMLElement>(selectors.skipIndicator);
  private stagePrompt = bySelector<HTMLElement>(selectors.stagePrompt);
  private engine: Engine;
  private scene: Scene;
  private lastFrameTime = performance.now();
  private music = new MusicLoop();
  private menuBackground: MenuBackground;
  private exploration: ExplorationMode;
  private painting: PaintingMode;
  private activeStage = 0;
  private skipPressStartedAt = 0;
  private skipFrame = 0;
  private cutsceneAdvanceTimer = 0;
  private cutsceneCompleted = false;
  private cutsceneOnDone: (() => void) | null = null;
  private menuReadyToken = 0;

  constructor() {
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true });
    this.scene = new Scene(this.engine);
    this.menuBackground = new MenuBackground(this.scene);
    this.exploration = new ExplorationMode(this.scene, this.canvas);
    this.painting = new PaintingMode(
      bySelector<HTMLElement>(selectors.paintingScreen),
      bySelector<HTMLCanvasElement>(selectors.paintingCanvas),
      bySelector<HTMLElement>(selectors.paintScore),
      bySelector<HTMLElement>(selectors.paintTimer),
      bySelector<HTMLElement>(selectors.paintingPrompt)
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
    this.music.start();
    void this.openRequestedStage();
  }

  private bind(): void {
    this.splash.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("a")) return;
      void this.begin();
    });
    bySelector<HTMLElement>(selectors.beginButton).addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void this.begin();
      }
    });
    bySelector<HTMLButtonElement>(selectors.newGameButton).addEventListener("click", (event) => {
      event.stopPropagation();
      this.startNewGame();
    });
    this.mainMenu.addEventListener("click", () => {
      if (!this.mainMenu.classList.contains("hidden")) this.startNewGame();
    });
    window.addEventListener("keydown", () => {
      if (!this.mainMenu.classList.contains("hidden")) this.startNewGame();
    });
    this.stagePrompt.addEventListener("pointerdown", () => this.beginStage2());
    window.addEventListener("keydown", () => this.beginStage2());
    window.addEventListener("keydown", () => this.startSkipHold());
    window.addEventListener("keyup", () => this.stopSkipHold());
    window.addEventListener("pointerdown", () => this.startSkipHold());
    window.addEventListener("pointerup", () => this.stopSkipHold());
    window.addEventListener("pointercancel", () => this.stopSkipHold());
  }

  private update(dt: number): void {
    this.menuBackground.update();
    this.exploration.update(dt);
    this.painting.update(dt);
  }

  private async begin(): Promise<void> {
    this.music.start();
    await this.preload();
    this.showMenu();
  }

  private async openRequestedStage(): Promise<void> {
    const stage = Number(new URLSearchParams(window.location.search).get("s") ?? 0);
    if (![1, 2, 3, 4, 5].includes(stage)) return;
    await this.preload();
    setHidden(this.splash, true);
    if (stage === 1) this.showCutscene(1, () => this.showStage2());
    if (stage === 2) this.showStage2();
    if (stage === 3) this.showCutscene(3, () => this.showPainting());
    if (stage === 4) this.showPainting();
    if (stage === 5) this.showStage5();
  }

  private async preload(): Promise<void> {
    await Promise.allSettled([
      DracoCompression.Default.whenReadyAsync(),
      fetch(`${RESOURCE_ROOT}${HERO_MODEL}`, { cache: "force-cache" }),
      fetch(this.videoSource("mainmenu"), { cache: "force-cache" }),
      fetch(this.videoSource("vid1"), { cache: "force-cache" }),
      fetch(this.videoSource("vid2"), { cache: "force-cache" }),
      fetch(this.videoSource("vid3"), { cache: "force-cache" })
    ]);
  }

  private showMenu(): void {
    const readyToken = ++this.menuReadyToken;
    this.mainMenu.classList.add("main-menu-loading");
    this.menuBackground.setActive(false);
    this.exploration.setActive(false);
    this.music.setCutsceneDucked(false);
    this.stopCutsceneVideo();
    this.activeStage = 0;
    setHidden(this.splash, true);
    setHidden(this.mainMenu, false);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, true);
    setHidden(this.stagePrompt, true);
    void this.playMainMenuVideoWhenReady(readyToken);
  }

  private startNewGame(): void {
    this.menuReadyToken += 1;
    localStorage.setItem("painter-of-makli-save", JSON.stringify({ startedAt: new Date().toISOString(), scene: "explore" }));
    this.showCutscene(1, () => this.showStage2());
  }

  private showCutscene(stage: keyof typeof CUTSCENE_VIDEO_BY_STAGE, onDone: () => void): void {
    this.activeStage = stage;
    this.menuBackground.setActive(false);
    this.exploration.setActive(false);
    this.music.setCutsceneDucked(true);
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, false);
    setHidden(this.stagePrompt, true);
    this.cutsceneFallback.classList.remove("hidden");
    this.cutsceneVideo.src = this.videoSource(CUTSCENE_VIDEO_BY_STAGE[stage]);
    this.cutsceneVideo.currentTime = 0;
    window.clearTimeout(this.cutsceneAdvanceTimer);
    this.cutsceneCompleted = false;
    this.cutsceneOnDone = onDone;
    this.cutsceneVideo.onended = () => {
      if (!this.isCutsceneAtNaturalEnd()) {
        const playPromise = this.cutsceneVideo.play();
        if (playPromise) playPromise.catch(() => undefined);
        return;
      }
      this.finishCutsceneAfterDelay(stage, onDone);
    };
    this.cutsceneVideo.oncanplay = () => this.cutsceneFallback.classList.add("hidden");
    const playPromise = this.cutsceneVideo.play();
    if (playPromise) playPromise.catch(() => undefined);
  }

  private isCutsceneAtNaturalEnd(): boolean {
    const duration = this.cutsceneVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return true;
    return this.cutsceneVideo.currentTime >= duration - 0.15;
  }

  private finishCutsceneAfterDelay(stage: keyof typeof CUTSCENE_VIDEO_BY_STAGE, onDone: () => void): void {
    if (this.cutsceneCompleted) return;
    this.cutsceneCompleted = true;
    this.stopSkipHold();
    this.music.setCutsceneDucked(false);
    this.cutsceneAdvanceTimer = window.setTimeout(() => {
      if (this.activeStage === stage && !this.cutsceneScreen.classList.contains("hidden")) onDone();
    }, CUTSCENE_END_DELAY_SECONDS * 1000);
  }

  private showStage2(): void {
    this.activeStage = 2;
    this.showExplore();
    this.exploration.startStage2(() => this.showCutscene(3, () => this.showPainting()));
    setHidden(this.stagePrompt, false);
  }

  private beginStage2(): void {
    if (this.activeStage !== 2 || this.stagePrompt.classList.contains("hidden")) return;
    setHidden(this.stagePrompt, true);
    this.exploration.beginStage2();
  }

  private showExplore(): void {
    this.menuBackground.setActive(false);
    this.exploration.setActive(true);
    this.music.setCutsceneDucked(false);
    this.stopCutsceneVideo();
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, false);
    setHidden(this.paintingScreen, true);
    setHidden(this.cutsceneScreen, true);
  }

  private showPainting(): void {
    this.activeStage = 4;
    this.menuBackground.setActive(false);
    this.exploration.setActive(false);
    this.music.setCutsceneDucked(false);
    this.stopCutsceneVideo();
    this.painting.start(() => this.showStage5());
    setHidden(this.splash, true);
    setHidden(this.mainMenu, true);
    setHidden(this.hud, true);
    setHidden(this.paintingScreen, false);
    setHidden(this.cutsceneScreen, true);
    setHidden(this.stagePrompt, true);
  }

  private showStage5(): void {
    this.showCutscene(5, () => this.showMenu());
  }

  private stopCutsceneVideo(): void {
    window.clearTimeout(this.cutsceneAdvanceTimer);
    this.cutsceneVideo.pause();
    this.cutsceneVideo.onended = null;
    this.cutsceneVideo.oncanplay = null;
    this.cutsceneVideo.removeAttribute("src");
    this.cutsceneVideo.load();
    this.cutsceneOnDone = null;
    this.stopSkipHold();
  }

  private async playMainMenuVideoWhenReady(readyToken: number): Promise<void> {
    this.mainMenuVideo.currentTime = 0;
    const playPromise = this.mainMenuVideo.play();
    if (playPromise) await playPromise.catch(() => undefined);
    await this.waitForVideoFrame(this.mainMenuVideo);
    if (this.menuReadyToken === readyToken && !this.mainMenu.classList.contains("hidden")) {
      this.mainMenu.classList.remove("main-menu-loading");
    }
  }

  private waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        video.removeEventListener("loadeddata", done);
        video.removeEventListener("canplay", done);
        resolve();
      };
      video.addEventListener("loadeddata", done, { once: true });
      video.addEventListener("canplay", done, { once: true });
    });
  }

  private videoSource(name: string): string {
    return `${RESOURCE_ROOT}${name}.${this.prefersWebmVideo() ? "webm" : "mp4"}`;
  }

  private prefersWebmVideo(): boolean {
    return Boolean(this.cutsceneVideo.canPlayType('video/webm; codecs="av01"')) || Boolean(this.cutsceneVideo.canPlayType("video/webm"));
  }

  private startSkipHold(): void {
    if (![1, 3, 5].includes(this.activeStage) || this.cutsceneScreen.classList.contains("hidden")) return;
    if (this.skipPressStartedAt > 0) return;
    this.skipPressStartedAt = performance.now();
    setHidden(this.skipIndicator, false);
    this.updateSkipHold();
  }

  private stopSkipHold(): void {
    this.skipPressStartedAt = 0;
    window.cancelAnimationFrame(this.skipFrame);
    this.skipIndicator.style.setProperty("--skip-progress", "0");
    setHidden(this.skipIndicator, true);
  }

  private updateSkipHold(): void {
    if (this.skipPressStartedAt <= 0) return;
    const progress = clamp((performance.now() - this.skipPressStartedAt) / (CUTSCENE_SKIP_SECONDS * 1000), 0, 1);
    this.skipIndicator.style.setProperty("--skip-progress", String(progress));
    if (progress >= 1) {
      this.cutsceneVideo.pause();
      const onDone = this.cutsceneOnDone;
      if (onDone && this.activeStage in CUTSCENE_VIDEO_BY_STAGE) {
        this.finishCutsceneAfterDelay(this.activeStage as keyof typeof CUTSCENE_VIDEO_BY_STAGE, onDone);
      }
      return;
    }
    this.skipFrame = window.requestAnimationFrame(() => this.updateSkipHold());
  }

  private resize(): void {
    this.engine.resize();
  }
}

new App();
