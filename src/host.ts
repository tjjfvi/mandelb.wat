/// <reference lib="dom"/>

import { debounce } from "https://deno.land/std@0.167.0/async/debounce.ts"
import lzstring from "https://esm.sh/lz-string@1.4.4"
import { Matrix } from "./matrix.ts"
import { CalcParams, HostMessage, WorkerMessage } from "./shared.ts"

class WorkerGroup {
  memory = new WebAssembly.Memory({
    initial: 2048,
    maximum: 2048,
    shared: true,
  })
  workerCount = 16
  workers = Array.from({ length: this.workerCount }, (_, id) => {
    const worker = new Worker("./worker.js")
    send(worker, {
      type: "init",
      ctx: { memory: this.memory, id, count: this.workerCount },
    })
    return worker
  })

  ctx
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!
  }

  rendering = false
  queuedRender?: CalcParams
  render(...params: CalcParams): void
  async render(...params: CalcParams) {
    if (this.rendering) {
      this.queuedRender = params
      return
    }
    this.rendering = true
    const [width, height] = params
    const imageSize = width * height * 4
    await Promise.all(
      this.workers.map(async (worker) => {
        send(worker, { type: "calc", params })
        await done(worker)
      }),
    )
    send(this.workers[0], { type: "draw", params: [width, height] })
    await done(this.workers[0])
    const img = new ImageData(
      new Uint8ClampedArray(
        this.memory.buffer,
        imageSize * 2,
        imageSize,
      ).slice(),
      width,
      height,
    )
    this.ctx.putImageData(img, 0, 0)
    this.rendering = false
    if (this.queuedRender) {
      params = this.queuedRender
      this.queuedRender = undefined
      this.render(...params)
    }
  }
}

const body = document.body

body.addEventListener("contextmenu", (e) => {
  e.preventDefault()
})

const defaultTransform = Matrix.mul(
  Matrix.scale(.003125),
  Matrix.identity,
)

let transform = parseHash() ?? defaultTransform

const setHash = debounce(_setHash, 100)

let width = 0
let height = 0
const ab = new WorkerGroup(
  document.getElementById("ab") as HTMLCanvasElement,
)
const cd = new WorkerGroup(
  document.getElementById("cd") as HTMLCanvasElement,
)

resize()
render()

window.addEventListener("resize", resize)

interface DragState {
  target: "ab" | "cd"
  lock: boolean
  axis?: 0 | 1
  rotate: boolean
  reference: [number, number]
  base: Matrix
}

let drag: DragState | undefined

body.addEventListener("keydown", (e) => {
  if (e.key === "r") {
    drag = undefined
    transform = defaultTransform
    render()
  }
})

body.addEventListener("mousedown", (e) => {
  const rotate = e.button === 2
  ;(e.target! as HTMLElement).classList.add("active")
  drag = {
    target: e.target === ab.canvas ? "ab" : "cd",
    lock: rotate || e.shiftKey,
    rotate,
    reference: [e.clientX, e.clientY],
    base: transform,
  }
})

body.addEventListener("mouseup", (e) => {
  if (!drag) return
  ;(drag.target === "ab" ? ab : cd).canvas.classList.remove("active")
  drag = undefined
})

body.addEventListener("mousemove", (e) => {
  if (!drag) return
  let delta: [number, number] = [
    drag.reference[0] - e.clientX,
    drag.reference[1] - e.clientY,
  ]
  if (drag.lock) {
    if (drag.axis === undefined) {
      const a0 = Math.abs(delta[0])
      const a1 = Math.abs(delta[1])
      if (a0 > 20 || a1 > 20) {
        drag.axis = Math.abs(delta[0]) > Math.abs(delta[1]) ? 0 : 1
      }
    }
    if (drag.axis !== undefined) {
      delta[1 - drag.axis] = 0
    }
  }
  if (!drag.rotate) {
    transform = Matrix.mul(
      drag.base,
      Matrix.translate(
        drag.target === "ab" ? [...delta, 0, 0] : [0, 0, ...delta],
      ),
    )
  } else if (drag.axis !== undefined) {
    const angle = delta[drag.axis] / 100
    transform = Matrix.mul(
      drag.base,
      drag.target === "ab"
        ? (drag.axis === 0 ? Matrix.rotateXZ(angle) : Matrix.rotateYW(angle))
        : (drag.axis === 0 ? Matrix.rotateZY(angle) : Matrix.rotateWX(angle)),
    )
  }
  render()
})

body.addEventListener("wheel", (e) => {
  drag = undefined
  transform = Matrix.mul(
    transform,
    Matrix.scale(1.001 ** e.deltaY),
  )
  render()
})

function send(worker: Worker, msg: HostMessage) {
  worker.postMessage(msg)
}

function done(worker: Worker) {
  return new Promise<void>((resolve) =>
    worker.addEventListener("message", function handler(event) {
      const msg = event.data as WorkerMessage
      if (msg.type === "done") {
        resolve()
        worker.removeEventListener("message", handler)
      }
    })
  )
}

function resize() {
  width = ab.canvas.width = cd.canvas.width = (window.innerWidth / 2) | 0
  height = ab.canvas.height = cd.canvas.height = window.innerHeight
  render()
}

function render() {
  const [a, b, c, d, x] = transform
  ab.render(width, height, ...x, ...a, ...b)
  cd.render(width, height, ...x, ...c, ...d)
  setHash()
}

function parseHash(): Matrix | undefined {
  if (!location.hash) return undefined
  const data = (
    lzstring.decompressFromEncodedURIComponent(
      location.hash.slice(1),
    )!
  ).split(",").map((x) => +x)
  return [
    data.slice(0, 4),
    data.slice(4, 8),
    data.slice(8, 12),
    data.slice(12, 16),
    data.slice(16),
  ] as Matrix
}

function _setHash() {
  history.replaceState(
    {},
    "",
    "#"
      + lzstring.compressToEncodedURIComponent(
        transform.flat().join(","),
      ),
  )
}
