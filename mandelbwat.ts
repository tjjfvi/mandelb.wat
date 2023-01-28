/// <reference lib="dom"/>

import { HostMessage, RenderParams, WorkerMessage } from "./shared.ts";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const memory = new WebAssembly.Memory({
  initial: 512,
  maximum: 512,
  shared: true,
});

const workerCount = 16;
const workers = Array.from({ length: workerCount }, (_, id) => {
  const worker = new Worker("./worker.js");
  send(worker, { type: "init", ctx: { memory, id, count: workerCount } });
  return worker;
});

const renderParams: RenderParams = {
  width: canvas.width,
  height: canvas.height,
  center_x: -0.101096363845,
  center_y: 0.95628651,
  scale: .003125,
};

let lastTick = Date.now();

tick();

async function tick() {
  console.time("tick");
  renderParams.scale /= 1.05 ** ((Date.now() - lastTick) / 100);
  lastTick = Date.now();
  await Promise.all(workers.map(render));
  // await render(workers[]);
  const imageData = new ImageData(
    new Uint8ClampedArray(
      memory.buffer,
      0,
      canvas.width * canvas.height * 4,
    ).slice(),
    canvas.width,
    canvas.height,
  );
  ctx.putImageData(imageData, 0, 0);
  console.timeEnd("tick");
  requestAnimationFrame(tick);
}

function send(worker: Worker, msg: HostMessage) {
  worker.postMessage(msg);
}

function render(worker: Worker) {
  send(worker, { type: "render", params: renderParams });
  return new Promise<void>((resolve) =>
    worker.addEventListener("message", function handler(event) {
      const msg = event.data as WorkerMessage;
      if (msg.type === "render") {
        resolve();
        worker.removeEventListener("message", handler);
      }
    })
  );
}
