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

const params: RenderParams = {
  width: canvas.width,
  height: canvas.height,
  // center_x: 0,
  // center_y: 0,
  // center_y: .8,
  center_x: -0.101096363845,
  center_y: 0.95628651,
  // scale: .003125 / 2.5,
  scale: .003125,
};

let lastTick = Date.now();

tick();

async function tick() {
  console.time("tick");
  params.scale /= 1.05 ** ((Date.now() - lastTick) / 100);
  lastTick = Date.now();
  await Promise.all(workers.map(async (worker) => {
    send(worker, { type: "render", params });
    await done(worker);
  }));
  send(workers[0], { type: "draw", params });
  await done(workers[0]);
  let x = canvas.width * canvas.height * 4;
  const imageData = new ImageData(
    new Uint8ClampedArray(
      memory.buffer,
      x * 2,
      x,
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

function done(worker: Worker) {
  return new Promise<void>((resolve) =>
    worker.addEventListener("message", function handler(event) {
      const msg = event.data as WorkerMessage;
      if (msg.type === "done") {
        resolve();
        worker.removeEventListener("message", handler);
      }
    })
  );
}
