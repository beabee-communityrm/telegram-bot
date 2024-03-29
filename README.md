# Beabee Telegram Workspace

Welcome to the Beabee Workspace, a multi-project development environment managed
using Visual Studio Code's Workspace feature. This workspace is structured to
facilitate the development and management of two distinct, yet interconnected
projects:

1. **Beabee Telegram Bot** (Directory: `telegram-bot`): Developed using Deno,
   this project focuses on creating a Telegram bot for the Beabee platform. It
   utilizes TypeScript and is designed to interact with the Telegram Bot API
   using [Grammy](https://grammy.dev/) and with the Beabee API using
   `beabee-client`.

2. **Beabee Client** (Directory: `beabee-client`): Initially developed in Deno,
   this client is intended to serve as a versatile library for interacting with
   the Beabee API. It is being designed with cross-platform compatibility in
   mind, aiming to support Deno, Node.js, and browser environments in the
   future.

## Using This Workspace

To get started with this workspace:

- Ensure you have Deno installed. We recommend using a
  [Deno Version Manager (DVM)](https://github.com/justjavac/dvm) for easier
  migration between different versions of Deno.
- Ensure you have Visual Studio Code installed with support for Deno.
- Clone this repository and open the `telegram-bot-deno.code-workspace`
  workspace file in VSCode.

| Note: At the moment there are some issues working with multi-root workspaces
and the Deno extension for VSCode. See issues:
[#1](https://github.com/denoland/vscode_deno/issues/787),
[#2](https://github.com/denoland/vscode_deno/issues/488) and
[#3](https://github.com/denoland/deno/issues/21769). We workaround this by
making the same import entries in all `deno.json` files, this will be removed
later when the VSCode Deno extension gets along better with the workspace
feature.

For detailed information on working with multi-root workspaces in Visual Studio
Code, refer to the
[VSCode documentation on Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces).

Each project within the workspace has its own dedicated README file for specific
setup instructions and more detailed information:

- For the Beabee Telegram Bot, refer to
  [`telegram-bot/README.md`](./telegram-bot).
- For the Beabee Client, check out [`beabee-client/README.md`](./beabee-client).
