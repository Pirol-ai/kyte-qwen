// Starts the plugin's MCP server the way Qwen Code starts it, and asks it what it can do.
//
// Qwen Code reads qwen-extension.json and runs `command` with `args` in the environment it was
// itself started in, plus whatever `env` names. This does the same, from the same file, so what
// is checked here is what ships — not a second description of it that can drift.
//
// It prints the server's name, its instructions and its tools, and exits non-zero when the
// handshake does not come back.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(here, "..");
const { mcpServers } = JSON.parse(readFileSync(join(pluginRoot, "qwen-extension.json"), "utf8"));

const [name, server] = Object.entries(mcpServers)[0];
const env = { ...process.env, ...(server.env ?? {}) };

const child = spawn(server.command, server.args ?? [], {
  cwd: server.cwd ? join(pluginRoot, server.cwd) : pluginRoot,
  env,
  stdio: ["pipe", "pipe", "pipe"],
});

const seconds = Number(process.env.PROBE_TIMEOUT_SEC ?? 90);
const give_up = setTimeout(() => {
  console.error(`no answer within ${seconds}s`);
  child.kill("SIGTERM");
  process.exit(1);
}, seconds * 1000);

let stderr = "";
child.stderr.on("data", (chunk) => (stderr += chunk));

const say = (message) => child.stdin.write(JSON.stringify(message) + "\n");

say({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "kyte-qwen-check", version: "0" },
  },
});

let buffer = "";
let started = Date.now();

child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }

    if (message.id === 1) {
      const server_name = message.result?.serverInfo?.name ?? "(unnamed)";
      console.log(`server:       ${name} → ${server_name} ${message.result?.serverInfo?.version ?? ""}`);
      console.log(`handshake:    ${Date.now() - started} ms`);
      const instructions = (message.result?.instructions ?? "").split("\n")[0];
      if (instructions) console.log(`first line:   ${instructions}`);
      say({ jsonrpc: "2.0", method: "notifications/initialized" });
      started = Date.now();
      say({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    }

    if (message.id === 2) {
      const tools = message.result?.tools ?? [];
      console.log(`tools:        ${tools.length} after ${Date.now() - started} ms`);
      for (const tool of tools.slice(0, 8)) console.log(`              ${tool.name}`);
      if (tools.length > 8) console.log(`              … and ${tools.length - 8} more`);
      clearTimeout(give_up);
      child.kill("SIGTERM");
      process.exit(tools.length > 0 ? 0 : 1);
    }
  }
});

child.on("exit", (code) => {
  clearTimeout(give_up);
  console.error(`the server stopped (exit ${code})`);
  if (stderr.trim()) console.error(stderr.trim().split("\n").slice(-5).join("\n"));
  process.exit(1);
});
