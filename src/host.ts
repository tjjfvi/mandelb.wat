/// <reference lib="dom"/>

import { Matrix5 } from "./matrix.ts";
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

let transform = Matrix5.mul(
  Matrix5.scale(.003125),
  Matrix5.identity,
  // [
  //   [0, 0, 1, 0, 0],
  //   [0, 0, 0, 1, 0],
  //   [1, 0, 0, 0, 0],
  //   [0, 1, 0, 0, 0],
  //   [0, 0, 0, 0, 1],
  // ],
);

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
    public canvas: HTMLCanvasElement,
    public key: "z" | "c",
  ) {
    this.ctx = this.canvas.getContext("2d")!;

    let drag: [boolean, number, number, Matrix5] | undefined;
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    canvas.addEventListener("mousedown", (e) => {
      console.log(e.button);
      drag = [e.button === 0, e.clientX, e.clientY, transform];
    });
    canvas.addEventListener("mouseup", (e) => {
      console.log(e.button);
      drag = undefined;
    });
    canvas.addEventListener("mousemove", (e) => {
      if (drag) {
        let base = [drag[1] - e.clientX, drag[2] - e.clientY] as const;
        const horiz = base[0] ** 2 > base[1] ** 2;
        if (e.shiftKey || !drag[0]) {
          if (Math.max(Math.abs(base[0]), Math.abs(base[1])) > 10) {
            if (horiz) {
              drag[2] = e.clientY;
            } else {
              drag[1] = e.clientX;
            }
          }
          base = horiz ? [base[0], 0] : [0, base[1]];
        }
        if (drag[0]) {
          transform = Matrix5.mul(
            drag[3],
            Matrix5.translate(
              (this.key === "c") === (drag[0])
                ? [...base, 0, 0]
                : [0, 0, ...base],
            ),
          );
        } else {
          const angle = (horiz ? base[0] : base[1]) / 100;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          transform = Matrix5.mul(
            drag[3],
            this.key === "c"
              ? horiz
                ? [
                  [cos, 0, sin, 0, 0],
                  [0, 1, 0, 0, 0],
                  [-sin, 0, cos, 0, 0],
                  [0, 0, 0, 1, 0],
                  [0, 0, 0, 0, 1],
                ]
                : [
                  [1, 0, 0, 0, 0],
                  [0, cos, 0, sin, 0],
                  [0, 0, 1, 0, 0],
                  [0, -sin, 0, cos, 0],
                  [0, 0, 0, 0, 1],
                ]
              : horiz
              ? [
                [1, 0, 0, 0, 0],
                [0, cos, -sin, 0, 0],
                [0, sin, cos, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1],
              ]
              : [
                [cos, 0, 0, -sin, 0],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [sin, 0, 0, cos, 0],
                [0, 0, 0, 0, 1],
              ],
          );
        }
      }
    });

    canvas.addEventListener("wheel", (e) => {
      if (drag) drag = [drag[0], e.clientX, e.clientY, transform];
      transform = Matrix5.mul(
        transform,
        Matrix5.scale(1.001 ** e.deltaY),
      );
    });

    canvas.addEventListener("dblclick", () => {
      drag = undefined;
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
          ...Matrix5.apply(
            transform,
            [0, 0, 0, 0],
          ),
          ...Matrix5.apply(
            transform,
            this.key === "c" ? [1, 0, 0, 0] : [0, 0, 1, 0],
            false,
          ),
          ...Matrix5.apply(
            transform,
            this.key === "c" ? [0, 1, 0, 0] : [0, 0, 0, 1],
            false,
          ),
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
    s: 0.003125 * 3,
  },
  z: {
    x: 0,
    y: 0,
    s: 0.003125 * 3,
  },
};

const position: Position = {
  c: { ...initial.c },
  z: { ...initial.z },
};

const mandelbrot = new Fractal(
  document.getElementById("mandelbrot") as HTMLCanvasElement,
  "c",
);
const julia = new Fractal(
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
