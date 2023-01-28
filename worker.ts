/// <reference lib="webworker"/>

import {
  HostMessage,
  WasmExports,
  WasmImports,
  WorkerMessage,
} from "./shared.ts";

const start = Date.now();

const memory = new WebAssembly.Memory({
  initial: 512,
  maximum: 512,
  shared: true,
});

const wasmImports: WasmImports = {
  env: { memory },
  log: {
    u32: console.log,
    f64: console.log,
  },
};

let wasm!: WasmExports;

const initPromise = WebAssembly.instantiateStreaming(
  fetch("./mandelb.wasm"),
  wasmImports,
)
  .then(({ instance }) => {
    wasm = instance.exports as never;
    this;
  });

self.addEventListener("message", async (event) => {
  await initPromise;
  const msg = event.data as HostMessage;
  if (msg.type === "size") {
    wasm.width.value = msg.width;
    wasm.height.value = msg.height;
  }
  if (msg.type === "render") {
    // wasm.center_x.value = (Date.now() - start) * -.0005;
    wasm.draw();
    send({ type: "render", buffer: memory.buffer as SharedArrayBuffer });
  }
});

function send(msg: WorkerMessage) {
  self.postMessage(msg);
}
