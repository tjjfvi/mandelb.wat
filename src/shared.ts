export type WasmImports = {
  ctx: {
    memory: WebAssembly.Memory
    id: WebAssembly.Global
    count: WebAssembly.Global
  }
  log: {
    u32: (value: number) => void
    f64: (value: number) => void
  }
  math: {
    atan2: (x: number, y: number) => number
  }
}

export interface WasmExports {
  memory: WebAssembly.Memory
  calc(
    width: number,
    height: number,
    x: number,
    y: number,
    z: number,
    w: number,
    ix: number,
    iy: number,
    iz: number,
    iw: number,
    jx: number,
    jy: number,
    jz: number,
    jw: number,
  ): void
  draw(width: number, height: number): void
}

export interface WorkerCtx {
  id: number
  count: number
  memory: WebAssembly.Memory
}

export type CalcParams = Parameters<WasmExports["calc"]>
export type DrawParams = Parameters<WasmExports["draw"]>
export type HostMessage =
  | {
    type: "init"
    ctx: WorkerCtx
  }
  | {
    type: "calc"
    params: CalcParams
  }
  | {
    type: "draw"
    params: DrawParams
  }

export type WorkerMessage = { type: "done" }
