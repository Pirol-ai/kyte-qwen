# kyte for Qwen Code

**kyte** is the company OS by [Pirol Labs](https://pirol.ai): customers, contacts, deals, projects,
hours, invoices, goals, people and the company's documents, in one workspace. This repository is a
[Qwen Code](https://github.com/QwenLM/qwen-code) extension that serves that workspace to it — ask which projects still have unbilled hours,
book three hours on an implementation, look up who is out next week.

Qwen Code works **as you**: it sees exactly what your role in kyte may see and changes only what
your role may change.

## What you need

The **kyte command line**, installed and signed in once:

1. Install it — macOS and Linux: `curl -fsSL https://updates.pirol.ai/cli/install.sh | sh`
2. Sign in for this package's own folder: `kyte login --db ~/.kyte/qwen`

The folder is this connection's own copy of the workspace, kept apart from any kyte session you
run in a terminal, so the two never compete for one database.

## Install

```
qwen extensions install Pirol-ai/kyte-qwen
```

One line: Qwen Code installs an extension straight from a Git repository, so there is no
marketplace to add first. Then start a new Qwen Code session — the server is started at session
start, so a running session does not pick it up. `/extensions` shows it with its server's live
connection status.

## Use it

Ask in plain words: *"Which projects for Meyer GmbH still have unbilled hours?"*, *"Book three
hours on the Northwind implementation for today"*, *"Who is out next week?"*. Qwen Code looks
things up with the kyte tools before it answers and says afterwards what it changed.

## Settings

Two variables, for the cases where the defaults do not fit:

- `KYTE_PROGRAM` — the kyte program, if it is installed somewhere the installer does not put it.
  The installer's own place is `~/.local/bin/kyte`.
- `KYTE_QWEN_DB` — another data folder than `~/.kyte/qwen`.

## Where it works

macOS and Linux. The server is started through `/bin/sh`, because the command line is handed to
the program without a shell and `~` would arrive as a folder literally named `~`. On Windows, add
the server by hand under `mcpServers` in `~/.qwen/settings.json`, with an absolute path to
`kyte.exe` and to the data folder.

## Why this is not an Agent Plugins v1 package

Qwen Code documents the portable [Agent Plugins v1](https://agent-plugins.org/) format, and a v1
package does install here: the skill arrives and the extension is listed with *Origin:
AgentPlugins*. **Its MCP server is not registered.** Checked against Qwen Code 0.27.4 with the
file named `mcp.json` and `.mcp.json`, with and without the `$schema` and the `"type": "stdio"`
the v1 schema requires, and with the path declared in the manifest — *MCP servers:* stayed empty
every time, while the same server in `qwen-extension.json` is registered at once, and named back
to you during the install.

So this ships in Qwen Code's own extension format. If v1 starts carrying servers, moving is a
small change — the server definition is the same object either way.

## What it runs, sends and stores

- **Runs:** the `kyte` program on your own computer, as `kyte mcp`, in its own data folder.
- **Sends:** what Qwen Code reads through these tools goes to the model Qwen Code is using, as
  with any tool you give it. kyte itself keeps your workspace in step with **your company's kyte
  team server**, run by your company itself or by Pirol on its behalf in German data centres. This
  package sends nothing anywhere else.
- **Stores:** an encrypted local copy of your workspace in the data folder. Every change Qwen Code
  makes is recorded in kyte as made by an agent on your behalf.
- **Never:** builds apps or extensions, runs commands, or reads your files — only the data tools of
  your kyte workspace exist for it.

## Checking it

`sh check.sh` walks the whole path in a throwaway `HOME`, so neither your Qwen Code nor your
workspace is touched: it installs the package, looks at what Qwen registered, and talks to the
server. It needs `qwen`, `node` and `kyte` on the machine.
`node --test tests/*.test.mjs` checks the manifest alone and runs on every pull request.

## Support

Questions and problems:
[github.com/Pirol-ai/kyte-qwen/issues](https://github.com/Pirol-ai/kyte-qwen/issues).
Documentation: [kyte.pirol.ai/docs/en/mcp/](https://kyte.pirol.ai/docs/en/mcp/) ·
Privacy: [pirol.ai/privacy](https://pirol.ai/privacy) · Terms: [pirol.ai/terms](https://pirol.ai/terms)

## License

MIT — see [LICENSE](LICENSE). The licence covers this package; the kyte program it starts is
licensed separately.
