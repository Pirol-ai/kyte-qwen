// What a pull request can check without Qwen Code and without kyte on the machine.
//
// check.sh proves the real thing — install the package, see the server registered, talk to it —
// but it needs both programs. These checks need neither, so they run on every pull request and
// catch what actually goes wrong: a manifest Qwen will not read, a server line that no longer
// starts kyte, and the data folder drifting apart between that line and the prose.

import { test } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const readJson = (...parts) => JSON.parse(read(...parts));

const DB = "$HOME/.kyte/qwen";

test("the manifest is the one Qwen Code loads", () => {
  // Qwen Code's own extension manifest, not an Agent Plugins v1 package.
  //
  // Qwen documents v1 as supported, and a v1 package does install: the skill arrives and the
  // extension is listed with "Origin: AgentPlugins". Its server does not. Checked against 0.27.4
  // with the file named mcp.json and .mcp.json, with and without the $schema and the stdio type
  // the v1 schema demands, and with the path declared in the manifest — "MCP servers:" stayed
  // empty every time, while the same server in this manifest is registered at once. So the
  // package ships in the format that works.
  const manifest = readJson("qwen-extension.json");
  assert.strictEqual(manifest.name, "kyte");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.description.length > 40, "the description is what somebody reads first");
  assert.ok(!existsSync(join(root, "plugin.json")), "two manifests is one too many");
});

test("the server line starts kyte, in its own data folder", () => {
  const { mcpServers } = readJson("qwen-extension.json");
  assert.deepStrictEqual(Object.keys(mcpServers), ["kyte"], "one server, called kyte");

  const server = mcpServers.kyte;
  assert.strictEqual(server.command, "/bin/sh");

  const line = (server.args ?? []).join(" ");
  assert.match(line, /\bmcp\b/, "it has to start the MCP server");
  assert.match(line, /KYTE_PROGRAM/, "the program has to be nameable");
  assert.match(line, /KYTE_QWEN_DB/, "the data folder has to be nameable");
  assert.ok(line.includes(DB), `the default folder is ${DB}`);
});

test("the skill is where the specification says it is", () => {
  assert.ok(existsSync(join(root, "skills", "kyte", "SKILL.md")), "skills/<name>/SKILL.md");
  const skill = read("skills", "kyte", "SKILL.md");
  assert.ok(skill.startsWith("---"), "a skill needs its front matter");
  assert.ok(
    skill.includes("kyte login --db ~/.kyte/qwen"),
    "the skill sends people to a folder the server does not serve",
  );
  assert.ok(skill.includes("KYTE_QWEN_DB"), "the skill names the wrong variable");
  assert.ok(!/\bCodex\b/.test(skill), "left over from the Codex plugin this was built from");
});

test("the readme's install line is the one that works", () => {
  assert.ok(read("README.md").includes("qwen extensions install Pirol-ai/kyte-qwen"));
});
