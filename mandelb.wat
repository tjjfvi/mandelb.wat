(module
  (import "canvas" "memory" (memory 1))  
  (import "canvas" "width" (global $width (mut i32)))  
  (import "canvas" "height" (global $height (mut i32)))  

  (import "log" "u32" (func $log_u32 (param i32)))
  (import "log" "f64" (func $log_f64 (param f64)))
  (func $dbg_u32 (param $v i32) (result i32) local.get $v call $log_u32 local.get $v)
  (func $dbg_f64 (param $v f64) (result f64) local.get $v call $log_f64 local.get $v)

  (global $center_x (mut f64) (f64.const -0.75))
  (global $center_y (mut f64) (f64.const 0))
  ;; (global $scale (mut f64) (f64.const 0.003125))
  (global $scale (mut f64) (f64.const 0.00015933191591218493))

  (global $escape2 (mut f64) (f64.const 4))
  (global $max_iters (mut i32) (i32.const 128))
  
  (global $2epsilon (mut f64) (f64.const 1e-6))

  (export "scale" (global $scale))
  
  (func (export "draw")
    (local $x f64) (local $y f64)
    (local $i i32) (local $j i32)
    (local $xi f64)
    (local $row_size i32) (local $grid_size i32)

    (local.set $xi (f64.sub (global.get $center_x) (f64.mul (f64.mul (f64.convert_i32_u (global.get $width)) (global.get $scale)) (f64.const 0.5))))
    (local.set $y (f64.sub (global.get $center_y) (f64.mul (f64.mul (f64.convert_i32_u (global.get $height)) (global.get $scale)) (f64.const 0.5))))

    (local.tee $row_size (i32.mul (global.get $width) (i32.const 4)))
    (local.set $grid_size (i32.mul (global.get $height)))

    (loop $y
      (local.set $x (local.get $xi))
      (local.tee $j (i32.add (local.get $j) (local.get $row_size)))
      (loop $x
        (call $draw_pixel (local.get $x) (local.get $y) (local.get $i))

        (local.set $x (f64.add (local.get $x) (global.get $scale)))
        (local.tee $i (i32.add (local.get $i) (i32.const 4)))
        (br_if $x (i32.lt_u (local.get $j)))
      )
      (local.set $y (f64.add (local.get $y) (global.get $scale)))
      (br_if $y (i32.lt_u (local.get $grid_size)))
    )
  )

  (func $draw_pixel
    (param $x f64) (param $y f64) (param $i i32)
    (local $v i32)

    (local.set $v (i32.trunc_f64_u (f64.mul (call $point (local.get $x) (local.get $y)) (f64.const 255))))
    ;; (local.set $v (i32.mul (f64.gt (local.get $x) (f64.const 0)) (i32.const 255)))

    (i32.store8 offset=0 (local.get $i) (local.get $v))
    (i32.store8 offset=1 (local.get $i) (local.get $v))
    (i32.store8 offset=2 (local.get $i) (local.get $v))
    (i32.store8 offset=3 (local.get $i) (i32.const 255))
  )
  
  (func $point (param $x0 f64) (param $y0 f64) (result f64)
    (local $x f64) (local $y f64)
    (local $x2 f64) (local $y2 f64)
    (local $i i32) (local $o f64)

    (local $xl f64) (local $yl f64)
    (local $n f64)

    (block $foo
    (block $skip (loop $cont
      (local.set $y (f64.add (f64.mul (f64.add (local.get $x) (local.get $x)) (local.get $y)) (local.get $y0)))
      (local.tee $x (f64.add (f64.sub (local.get $x2) (local.get $y2)) (local.get $x0)))
      (local.tee $x2 (f64.mul (local.get $x)))
      (local.tee $y2 (f64.mul (local.get $y) (local.get $y)))
      (if (f64.ge (f64.add) (global.get $escape2))
        (then
          ;; (local.set $o (f64.const 1))
          (local.set $o (f64.sub (f64.const 1) (f64.div (f64.add (local.get $o) (f64.convert_i32_u (local.get $i))) (f64.convert_i32_u (global.get $max_iters)))))
        )
        (else
          (br_if $skip (f64.le (f64.add
            (f64.abs (f64.sub (local.get $x) (local.get $xl)))
            (f64.abs (f64.sub (local.get $y) (local.get $yl)))
          ) (global.get $2epsilon)))
          (if (i32.eq (i32.const 0) (i32.and (local.get $i) (i32.const 15))) (then
            (local.set $xl (local.get $x))
            (local.set $yl (local.get $y))
          ))
          (local.tee $i (i32.add (local.get $i) (i32.const 1)))
          (br_if $cont (i32.lt_u (global.get $max_iters)))
        )
      )
    )
    (br $foo)
    )
    ;; (local.set $o (f64.const 1))
          ;; (local.set $o (f64.sub (f64.const 1) (f64.div (f64.add (local.get $o) (f64.convert_i32_u (local.get $i))) (f64.convert_i32_u (global.get $max_iters)))))

  )

    (local.get $o)
  )

  (func $log2 (param $n f64) (result f64) (local $b i64)
    (local.tee $b (i64.reinterpret_f64 (local.get $n)))
    (i64.shr_u (i64.const 52))
    (i64.and (i64.const 1023))
    (f64.convert_i64_u)
    (local.get $b)
    (i64.and (i64.const 0x000fffffffffffff))
    (i64.or  (i64.const 0x3ff0000000000000))
    (f64.reinterpret_i64)
    (local.tee $n)
    (f64.mul (f64.const -0.0769658))
    (f64.add (f64.const 0.60395))
    (f64.mul (local.get $n))
    (f64.add (f64.const -1.99934))
    (f64.mul (local.get $n))
    (f64.add (f64.const +3.92221))
    (f64.mul (local.get $n))
    (f64.add (f64.const -1.44851))
    (f64.add)
  )
)