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
    center_x: number,
    center_y: number,
    scale: number,
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
    type: "render";
    params: RenderParams;
  }
  | {
    type: "draw";
    params: RenderParams;
  };

export type WorkerMessage = { type: "done" };

export interface RenderParams {
  width: number;
  height: number;
  center_x: number;
  center_y: number;
  scale: number;
}
