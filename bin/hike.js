#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const DEFAULT_PORT = 8849;

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function getPidFilePath() {
  return path.join(process.cwd(), ".hike", ".pid");
}

function getRunningInstance() {
  const pidFile = getPidFilePath();
  try {
    const content = fs.readFileSync(pidFile, "utf8");
    const [pidStr, portStr] = content.trim().split("\n");
    const pid = parseInt(pidStr, 10);
    const port = parseInt(portStr, 10);
    if (pid && isProcessRunning(pid) && port) {
      return { pid, port };
    }
  } catch (e) {
    // File doesn't exist or can't be read
  }
  return null;
}

function writeInstanceInfo(port) {
  const pidFile = getPidFilePath();
  try {
    fs.writeFileSync(pidFile, `${process.pid}\n${port}`);
  } catch (e) {
    // If we can't write, continue anyway
  }
}

function shouldOpenBrowser() {
  const instance = getRunningInstance();
  if (instance) {
    return false; // Another instance is running
  }
  return true;
}

function openBrowser(url, { forceOpen = false } = {}) {
  if (
    process.env.CI ||
    process.env.HIKE_NO_OPEN === "1" ||
    process.env.HIKE_NO_OPEN === "true"
  ) {
    return;
  }

  if (!forceOpen && !shouldOpenBrowser()) {
    return;
  }

  const platform = process.platform;

  if (platform === "darwin") {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    return;
  }

  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      stdio: "ignore",
      detached: true,
    }).unref();
    return;
  }

  // linux, etc.
  spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
}

function parseArgs(argv) {
  const result = {
    command: "start",
    port: undefined,
    help: false,
    page: undefined,
  };

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "dev" || a === "start") {
      result.command = a;
      continue;
    }

    if (a === "-h" || a === "--help") {
      result.help = true;
      continue;
    }

    if (a === "-p" || a === "--port") {
      const v = args[i + 1];
      i++;
      result.port = v;
      continue;
    }

    if (a.startsWith("--port=")) {
      result.port = a.slice("--port=".length);
      continue;
    }

    // Treat any other non-flag argument as the page name
    if (!a.startsWith("-")) {
      result.page = a
        .replace(/^\.hike[\\/]/, "") // strip .hike/ or .hike\ prefix if provided
        .replace(/\.mdx$/i, ""); // strip .mdx if provided
      continue;
    }
  }

  return result;
}

function usage() {
  return [
    "Usage:",
    "  hike [page]        # run production build, optionally open specific page",
    "  hike start [page]  # same as above",
    "  hike dev [page]    # run Next.js dev server",
    "",
    "Arguments:",
    "  page                 Page name to open (e.g., 'test' or 'folder/page')",
    "",
    "Options:",
    `  -p, --port <port>    Port to listen on (default: ${DEFAULT_PORT})`,
    "  -h, --help           Show this help",
  ].join("\n");
}

function coercePort(portLike) {
  const port = Number(portLike ?? process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isFinite(port) || port <= 0) return null;
  return port;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

function runDev({ root, port, page }) {
  const baseUrl = `http://localhost:${port}`;
  const url = page ? `${baseUrl}/${page}` : baseUrl;
  let opened = false;

  let nextBin;
  try {
    nextBin = require.resolve("next/dist/bin/next", { paths: [root] });
  } catch (e) {
    console.error(
      [
        "Missing Next.js dependency.",
        "Expected to resolve: next/dist/bin/next",
        "",
        "If you're running from source, install deps first:",
        "  npm install",
      ].join("\n"),
    );
    process.exit(1);
  }

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HIKE_CWD: process.cwd(),
    },
    stdio: ["inherit", "pipe", "pipe"],
  });

  const onOutput = (chunk) => {
    const text = String(chunk);
    process.stdout.write(text);

    if (opened) return;
    if (
      text.includes(baseUrl) ||
      /ready|listening|started server/i.test(text)
    ) {
      opened = true;
      openBrowser(url);
      writeInstanceInfo(port);
    }
  };

  child.stdout.on("data", onOutput);
  child.stderr.on("data", (chunk) => process.stderr.write(String(chunk)));
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

function runProd({ root, port, page }) {
  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) {
    console.error(
      [
        "Missing build output.",
        `Expected: ${nextDir}`,
        "",
        "If you're running from source, build first:",
        "  npm install",
        "  npm run build",
      ].join("\n"),
    );
    process.exit(1);
  }

  const baseUrl = `http://localhost:${port}`;
  const url = page ? `${baseUrl}/${page}` : baseUrl;
  let opened = false;

  let nextBin;
  try {
    nextBin = require.resolve("next/dist/bin/next", { paths: [root] });
  } catch (e) {
    console.error(
      [
        "Missing Next.js dependency.",
        "Expected to resolve: next/dist/bin/next",
        "",
        "If you're running from source, install deps first:",
        "  npm install",
      ].join("\n"),
    );
    process.exit(1);
  }

  const child = spawn(
    process.execPath,
    [nextBin, "start", "-p", String(port)],
    {
      cwd: root,
      env: {
        ...process.env,
        PORT: String(port),
        HIKE_CWD: process.cwd(),
      },
      stdio: ["inherit", "pipe", "pipe"],
    },
  );

  const onOutput = (chunk) => {
    const text = String(chunk);
    process.stdout.write(text);

    if (opened) return;
    if (
      text.includes(baseUrl) ||
      /ready|listening|started server/i.test(text)
    ) {
      opened = true;
      openBrowser(url);
      writeInstanceInfo(port);
    }
  };

  child.stdout.on("data", onOutput);
  child.stderr.on("data", (chunk) => process.stderr.write(String(chunk)));
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  console.log("Hike starting...");

  // If a page is specified and an instance is already running, just open the browser
  if (args.page) {
    const instance = getRunningInstance();
    if (instance) {
      const url = `http://localhost:${instance.port}/${args.page}`;
      console.log(`Found running instance on port ${instance.port}`);
      console.log(`Opening ${url}`);
      openBrowser(url, { forceOpen: true });
      return;
    }
  }

  const requestedPort = coercePort(args.port);
  if (requestedPort == null) {
    console.error(`Invalid port: ${String(args.port ?? process.env.PORT)}`);
    process.exit(1);
  }

  const port = await findAvailablePort(requestedPort);
  if (port == null) {
    console.error(`No available port found starting from ${requestedPort}`);
    process.exit(1);
  }

  if (port !== requestedPort) {
    console.log(`Port ${requestedPort} is in use, using ${port} instead`);
  }

  const cwd = process.cwd();
  const mode = args.command === "dev" ? "dev" : "production";
  console.log(`Project: ${path.basename(cwd)} (${cwd})`);
  console.log(`Starting ${mode} server on http://localhost:${port}`);

  const root = path.resolve(__dirname, "..");

  if (args.command === "dev") {
    runDev({ root, port, page: args.page });
    return;
  }

  runProd({ root, port, page: args.page });
}

main();
