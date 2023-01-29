export type WasmImports = {
  ctx: {
    memory: WebAssembly.Memory;
    id: WebAssembly.Global;
    count: WebAssembly.Global;
  };
  log: {
    u32: (value: number) => void;
    f64: (value: number) => void;
  };
};

export interface WasmExports {
  memory: WebAssembly.Memory;
  calc(
    width: number,
    height: number,
    cx: number,
    cy: number,
    cs: number,
    zx: number,
    zy: number,
    zs: number,
  ): void;
  draw(width: number, height: number): void;
}

export interface WorkerCtx {
  id: number;
  count: number;
  memory: WebAssembly.Memory;
}

export type HostMessage =
  | {
    type: "init";
    ctx: WorkerCtx;
  }
  | {
    type: "calc";
    params: Parameters<WasmExports["calc"]>;
  }
  | {
    type: "draw";
    params: Parameters<WasmExports["draw"]>;
  };

export type WorkerMessage = { type: "done" };