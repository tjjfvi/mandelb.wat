export type Vector4 = [number, number, number, number];
export type Matrix5 = [
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number],
];

export namespace Matrix5 {
  export const identity: Matrix5 = [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ];

  export function scale(f: number): Matrix5 {
    return [
      [f, 0, 0, 0, 0],
      [0, f, 0, 0, 0],
      [0, 0, f, 0, 0],
      [0, 0, 0, f, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  export function translate(v: Vector4): Matrix5 {
    return [
      [1, 0, 0, 0, v[0]],
      [0, 1, 0, 0, v[1]],
      [0, 0, 1, 0, v[2]],
      [0, 0, 0, 1, v[3]],
      [0, 0, 0, 0, 1],
    ];
  }

  export function mul(a: Matrix5, b: Matrix5): Matrix5 {
    return Array.from(
      { length: 5 },
      (_, i) => Array.from({ length: 5 }, (_, j) => get(i, j)),
    ) as Matrix5;
    function get(i: number, j: number) {
      return 0 +
        a[i][0] * b[0][j] +
        a[i][1] * b[1][j] +
        a[i][2] * b[2][j] +
        a[i][3] * b[3][j] +
        a[i][4] * b[4][j];
    }
  }

  export function apply(m: Matrix5, v: Vector4, trans = true): Vector4 {
    return Array.from({ length: 4 }, (_, i) => get(i)) as Vector4;
    function get(i: number) {
      return 0 +
        m[i][0] * v[0] +
        m[i][1] * v[1] +
        m[i][2] * v[2] +
        m[i][3] * v[3] +
        (trans ? m[i][4] : 0);
    }
  }
}
