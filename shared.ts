export type WasmImports = {
  env: {
    memory: WebAssembly.Memory;
  };
  log: {
    u32: (value: number) => void;
    f64: (value: number) => void;
  };
};

export interface WasmExports {
  memory: WebAssembly.Memory;
  center_x: WebAssembly.Global;
  center_y: WebAssembly.Global;
  width: WebAssembly.Global;
  height: WebAssembly.Global;
  scale: WebAssembly.Global;
  draw: () => void;
}

export type HostMessage =
  | {
    type: "size";
    width: number;
    height: number;
  }
  | {
    type: "render";
  };

export type WorkerMessage = {
  type: "render";
  buffer: SharedArrayBuffer;
};
