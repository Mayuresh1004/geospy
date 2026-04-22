#!/usr/bin/env node

const childProcess = require("node:child_process");

const originalFork = childProcess.fork;

childProcess.fork = function patchedFork(modulePath, args, options) {
  let normalizedArgs = args;
  let normalizedOptions = options;

  // Support fork(modulePath, options) signature.
  if (
    normalizedOptions === undefined &&
    normalizedArgs &&
    !Array.isArray(normalizedArgs) &&
    typeof normalizedArgs === "object"
  ) {
    normalizedOptions = normalizedArgs;
    normalizedArgs = undefined;
  }

  const finalOptions = normalizedOptions ? { ...normalizedOptions } : {};

  // Next 16 dev uses stdio: "inherit". On some Node 22 builds this drops IPC.
  // The dev child expects process.send/process.on("message"), so enforce IPC.
  if (finalOptions.stdio === "inherit") {
    finalOptions.stdio = ["inherit", "inherit", "inherit", "ipc"];
  } else if (Array.isArray(finalOptions.stdio) && !finalOptions.stdio.includes("ipc")) {
    finalOptions.stdio = [...finalOptions.stdio, "ipc"];
  }

  return originalFork.call(this, modulePath, normalizedArgs, finalOptions);
};

require("next/dist/bin/next");
