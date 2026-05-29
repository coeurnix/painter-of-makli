import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";

const rootDir = process.cwd();
const resourcesDir = resolve(rootDir, "resources");
const dracoDir = resolve(rootDir, "node_modules", "@babylonjs", "core", "assets", "Draco");
const logDir = resolve(rootDir, "logs");
const clientLogPath = resolve(logDir, "client-errors.log");

function copyDir(source: string, target: string): void {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const from = join(source, entry);
    const to = join(target, entry);
    const fileStat = statSync(from);
    if (fileStat.isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

function mimeType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".glb":
      return "model/gltf-binary";
    case ".gltf":
      return "model/gltf+json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".av1":
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return /(?:^|[/\\])song\d+\.webm$/i.test(filePath) ? "audio/webm" : "video/webm";
    case ".m4a":
      return "audio/mp4";
    case ".ogg":
      return "audio/ogg";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".json":
      return "application/json";
    case ".wasm":
      return "application/wasm";
    case ".js":
      return "text/javascript";
    default:
      return "application/octet-stream";
  }
}

function painterDevPlugin(): Plugin {
  return {
    name: "painter-dev-resources-and-client-log",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        if (req.method === "POST" && req.url === "/__client-log") {
          const chunks: Buffer[] = [];
          req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          req.on("end", async () => {
            try {
              await mkdir(logDir, { recursive: true });
              const body = Buffer.concat(chunks).toString("utf8");
              await appendFile(clientLogPath, `${new Date().toISOString()} ${body}\n`);
              res.statusCode = 204;
              res.end();
            } catch (error) {
              res.statusCode = 500;
              res.end(String(error));
            }
          });
          return;
        }

        if (req.method === "GET" && req.url.startsWith("/resources/")) {
          const decodedPath = decodeURIComponent(req.url.split("?")[0]);
          const relativePath = normalize(decodedPath.replace(/^\/resources\//, ""));
          const filePath = resolve(resourcesDir, relativePath);
          const safePrefix = `${resourcesDir}${sep}`;
          if (filePath !== resourcesDir && filePath.startsWith(safePrefix)) {
            try {
              const fileStat = await stat(filePath);
              if (fileStat.isFile()) {
                res.setHeader("Content-Type", mimeType(filePath));
                res.end(await readFile(filePath));
                return;
              }
            } catch {
              // Fall through to Vite's normal 404 handling.
            }
          }
        }

        if (req.method === "GET" && req.url.startsWith("/draco/")) {
          const decodedPath = decodeURIComponent(req.url.split("?")[0]);
          const relativePath = normalize(decodedPath.replace(/^\/draco\//, ""));
          const filePath = resolve(dracoDir, relativePath);
          const safePrefix = `${dracoDir}${sep}`;
          if (filePath !== dracoDir && filePath.startsWith(safePrefix)) {
            try {
              const fileStat = await stat(filePath);
              if (fileStat.isFile()) {
                res.setHeader("Content-Type", mimeType(filePath));
                res.end(await readFile(filePath));
                return;
              }
            } catch {
              // Fall through to Vite's normal 404 handling.
            }
          }
        }

        next();
      });
    },
    closeBundle() {
      const outputResources = resolve(rootDir, "dist", "resources");
      const outputDraco = resolve(rootDir, "dist", "draco");
      copyDir(resourcesDir, outputResources);
      copyDir(dracoDir, outputDraco);
      const rel = relative(rootDir, outputResources);
      this.info(`Copied resources to ${rel}`);
      this.info(`Copied Draco decoder assets to ${relative(rootDir, outputDraco)}`);
    }
  };
}

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false
  },
  plugins: [painterDevPlugin()]
});
