// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Fractal {
    ctx;
    memory;
    workerCount;
    workers;
    constructor(pos, canvas, key){
        this.pos = pos;
        this.canvas = canvas;
        this.key = key;
        this.memory = new WebAssembly.Memory({
            initial: 2048,
            maximum: 2048,
            shared: true
        });
        this.workerCount = 16;
        this.workers = Array.from({
            length: this.workerCount
        }, (_, id)=>{
            const worker = new Worker("./worker.js");
            send(worker, {
                type: "init",
                ctx: {
                    memory: this.memory,
                    id,
                    count: this.workerCount
                }
            });
            return worker;
        });
        this.ctx = this.canvas.getContext("2d");
        let dragging = false;
        let drag = [
            0,
            0,
            0,
            0
        ];
        canvas.addEventListener("mousedown", (e)=>{
            dragging = true;
            drag = [
                e.clientX,
                e.clientY,
                position[key].x,
                position[key].y
            ];
        });
        canvas.addEventListener("mouseup", ()=>{
            dragging = false;
        });
        canvas.addEventListener("mousemove", (e)=>{
            if (dragging) {
                position[key].x = drag[2] - (e.clientX - drag[0]) * position[key].s;
                position[key].y = drag[3] - (e.clientY - drag[1]) * position[key].s;
            }
        });
        canvas.addEventListener("wheel", (e)=>{
            drag = [
                e.clientX,
                e.clientY,
                position.c.x,
                position.c.y
            ];
            position[key].s *= 1.001 ** e.deltaY;
        });
        canvas.addEventListener("dblclick", ()=>{
            dragging = false;
            position[key] = {
                ...initial[key]
            };
        });
    }
    async tick() {
        console.time(this.key);
        const imageSize = this.canvas.width * this.canvas.height * 4;
        await Promise.all(this.workers.map(async (worker)=>{
            send(worker, {
                type: "calc",
                params: [
                    this.canvas.width,
                    this.canvas.height,
                    this.pos.c.x,
                    this.pos.c.y,
                    this.key === "c" ? this.pos.c.s : 0,
                    this.pos.z.x,
                    this.pos.z.y,
                    this.key === "z" ? this.pos.z.s : 0
                ]
            });
            await done(worker);
        }));
        send(this.workers[0], {
            type: "draw",
            params: [
                this.canvas.width,
                this.canvas.height
            ]
        });
        await done(this.workers[0]);
        console.log(imageSize, this.canvas.width, this.canvas.height);
        const imageData = new ImageData(new Uint8ClampedArray(this.memory.buffer, imageSize * 2, imageSize).slice(), this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imageData, 0, 0);
        console.timeEnd(this.key);
        requestAnimationFrame(()=>this.tick());
    }
    pos;
    canvas;
    key;
}
const initial = {
    c: {
        x: 0,
        y: 0,
        s: 0.003125
    },
    z: {
        x: 0,
        y: 0,
        s: 0.003125
    }
};
const position = {
    c: {
        ...initial.c
    },
    z: {
        ...initial.z
    }
};
const mandelbrot = new Fractal(position, document.getElementById("mandelbrot"), "c");
const julia = new Fractal(position, document.getElementById("julia"), "z");
resize();
window.addEventListener("resize", resize);
mandelbrot.tick();
julia.tick();
function send(worker, msg) {
    worker.postMessage(msg);
}
function done(worker) {
    return new Promise((resolve)=>worker.addEventListener("message", function handler(event) {
            const msg = event.data;
            if (msg.type === "done") {
                resolve();
                worker.removeEventListener("message", handler);
            }
        }));
}
function resize() {
    mandelbrot.canvas.width = julia.canvas.width = window.innerWidth / 2 | 0;
    mandelbrot.canvas.height = julia.canvas.height = window.innerHeight;
}
