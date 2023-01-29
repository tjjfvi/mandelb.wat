/// <reference lib="dom"/>

import { HostMessage, WorkerMessage } from "./shared.ts";

interface Position {
  c: {
    x: number;
    y: number;
    s: number;
  };
  z: {
    x: number;
    y: number;
    s: number;
  };
}

class Fractal {
  ctx;
  memory = new WebAssembly.Memory({
    initial: 2048,
    maximum: 2048,
    shared: true,
  });
  workerCount = 16;
  workers = Array.from({ length: this.workerCount }, (_, id) => {
    const worker = new Worker("./worker.js");
    send(worker, {
      type: "init",
      ctx: { memory: this.memory, id, count: this.workerCount },
    });
    return worker;
  });

  constructor(
    public pos: Position,
    public canvas: HTMLCanvasElement,
    public key: "z" | "c",
  ) {
    this.ctx = this.canvas.getContext("2d")!;

    let dragging = false;
    let drag = [0, 0, 0, 0] satisfies [] | number[];
    canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      drag = [e.clientX, e.clientY, position[key].x, position[key].y];
    });
    canvas.addEventListener("mouseup", () => {
      dragging = false;
    });
    canvas.addEventListener("mousemove", (e) => {
      if (dragging) {
        position[key].x = drag[2] - (e.clientX - drag[0]) * position[key].s;
        position[key].y = drag[3] - (e.clientY - drag[1]) * position[key].s;
      }
    });

    canvas.addEventListener("wheel", (e) => {
      drag = [e.clientX, e.clientY, position.c.x, position.c.y];
      position[key].s *= 1.001 ** e.deltaY;
    });

    canvas.addEventListener("dblclick", () => {
      dragging = false;
      position[key] = { ...initial[key] };
    });
  }

  async tick() {
    console.time(this.key);
    const { width, height } = this.canvas;
    const imageSize = width * height * 4;
    await Promise.all(this.workers.map(async (worker) => {
      send(worker, {
        type: "calc",
        params: [
          width,
          height,
          this.pos.c.x,
          this.pos.c.y,
          this.key === "c" ? this.pos.c.s : 0,
          this.pos.z.x,
          this.pos.z.y,
          this.key === "z" ? this.pos.z.s : 0,
        ],
      });
      await done(worker);
    }));
    send(this.workers[0], {
      type: "draw",
      params: [width, height],
    });
    await done(this.workers[0]);
    const imageData = new ImageData(
      new Uint8ClampedArray(
        this.memory.buffer,
        imageSize * 2,
        imageSize,
      ).slice(),
      width,
      height,
    );
    this.ctx.putImageData(imageData, 0, 0);
    console.timeEnd(this.key);
    requestAnimationFrame(() => this.tick());
  }
}
// params:
// RenderParams = {
//   width: canvas.width,
//   height: canvas.height,
//   cx: -.75,
//   cy: 0,
//   zs: .003125,
//   zx: 0,
//   zy: 0,
//   cs: .003125,
// };

const initial: Position = {
  c: {
    x: 0,
    y: 0,
    s: 0.003125,
  },
  z: {
    x: 0,
    y: 0,
    s: 0.003125,
  },
};

const position: Position = {
  c: { ...initial.c },
  z: { ...initial.z },
};

const mandelbrot = new Fractal(
  position,
  document.getElementById("mandelbrot") as HTMLCanvasElement,
  "c",
);
const julia = new Fractal(
  position,
  document.getElementById("julia") as HTMLCanvasElement,
  "z",
);

resize();

// deno-lint-ignore no-window-prefix
window.addEventListener("resize", resize);

mandelbrot.tick();
julia.tick();

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

function resize() {
  mandelbrot.canvas.width = julia.canvas.width = (window.innerWidth / 2) | 0;
  mandelbrot.canvas.height = julia.canvas.height = window.innerHeight;
}
