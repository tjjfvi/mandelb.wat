/// <reference lib="dom"/>

import { HostMessage, WorkerMessage } from "./shared.ts";

const start = Date.now();

class RenderWorker {
  worker;
  nextDraw = -1;
  lastStart = Date.now();
  nextId;
  running = false;

  constructor(readonly id: number, readonly group: RenderWorker[]) {
    this.worker = new Worker("./worker.js");
    this.send({ type: "size", width: canvas.width, height: canvas.height });
    this.nextId = (this.id + 1) % this.group.length;

    this.worker.addEventListener("message", (event) => {
      const msg = event.data as WorkerMessage;
      render(msg.buffer);
      const time = Date.now() - this.lastStart;
      console.log(
        Date.now() - start,
        "worker",
        this.id,
        "done",
        time,
        this.nextDraw - Date.now(),
      );
      const next = this.group[this.nextId];
      next.nextDraw = Date.now() + time / this.group.length;
      if (!next.running) {
        next.running = true;
        next.start();
      }
      this.start();
    });
  }

  start() {
    if (Date.now() >= this.nextDraw) {
      this.render();
    } else {
      setTimeout(() => {
        this.render();
      }, this.nextDraw - Date.now());
    }
  }

  render() {
    console.log(Date.now() - start, "worker", this.id, "start");
    this.lastStart = Date.now();
    this.send({ type: "render" });
  }

  send(msg: HostMessage) {
    this.worker.postMessage(msg);
  }
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const workers = Array(3);

for (let i = 0; i < workers.length; i++) {
  workers[i] = new RenderWorker(i, workers);
}

workers[0].running = true;
workers[0].start();

console.time("tick");

function render(buffer: SharedArrayBuffer) {
  console.timeEnd("tick");
  const imageData = new ImageData(
    new Uint8ClampedArray(
      buffer,
      0,
      canvas.width * canvas.height * 4,
    ).slice(),
    canvas.width,
    canvas.height,
  );
  ctx.putImageData(imageData, 0, 0);
  console.time("tick");
}
