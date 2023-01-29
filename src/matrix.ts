export type Vector = [number, number, number, number];
export namespace Vector {
  export const zero: Vector = [0, 0, 0, 0];
  export const x: Vector = [1, 0, 0, 0];
  export const y: Vector = [0, 1, 0, 0];
  export const z: Vector = [0, 0, 1, 0];
  export const w: Vector = [0, 0, 0, 1];
}

export type Matrix = [
  Vector,
  Vector,
  Vector,
  Vector,
  Vector,
];

export namespace Matrix {
  export const identity: Matrix = [
    Vector.x,
    Vector.y,
    Vector.z,
    Vector.w,
    Vector.zero,
  ];

  export function scale(f: number): Matrix {
    return [
      [f, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, f, 0],
      [0, 0, 0, f],
      Vector.zero,
    ];
  }

  export function translate(v: Vector): Matrix {
    return [
      Vector.x,
      Vector.y,
      Vector.z,
      Vector.w,
      v,
    ];
  }

  export function mul(a: Matrix, b: Matrix): Matrix {
    return [
      [get(0, 0), get(0, 1), get(0, 2), get(0, 3)],
      [get(1, 0), get(1, 1), get(1, 2), get(1, 3)],
      [get(2, 0), get(2, 1), get(2, 2), get(2, 3)],
      [get(3, 0), get(3, 1), get(3, 2), get(3, 3)],
      [get(4, 0), get(4, 1), get(4, 2), get(4, 3)],
    ];
    function get(i: number, j: number) {
      return 0 +
        a[0][j] * b[i][0] +
        a[1][j] * b[i][1] +
        a[2][j] * b[i][2] +
        a[3][j] * b[i][3] +
        a[4][j] * +(i === 4);
    }
  }

  export function rotateXZ(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      [cos, 0, -sin, 0],
      [0, 1, 0, 0],
      [sin, 0, cos, 0],
      [0, 0, 0, 1],
      [0, 0, 0, 0],
    ];
  }

  export function rotateYW(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      [1, 0, 0, 0],
      [0, cos, 0, -sin],
      [0, 0, 1, 0],
      [0, sin, 0, cos],
      [0, 0, 0, 0],
    ];
  }

  export function rotateZY(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      [1, 0, 0, 0],
      [0, cos, sin, 0],
      [0, -sin, cos, 0],
      [0, 0, 0, 1],
      [0, 0, 0, 0],
    ];
  }

  export function rotateWX(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      [cos, 0, 0, sin],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [-sin, 0, 0, cos],
      [0, 0, 0, 0],
    ];
  }
}
