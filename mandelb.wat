(module
  (import "ctx" "memory" (memory 512 512 shared))
  (import "ctx" "id" (global $id i32))
  (import "ctx" "count" (global $count i32))

  (import "log" "u32" (func $log_u32 (param i32)))
  (import "log" "f64" (func $log_f64 (param f64)))
  (func $dbg_u32 (param $v i32) (result i32) local.get $v call $log_u32 local.get $v)
  (func $dbg_f64 (param $v f64) (result f64) local.get $v call $log_f64 local.get $v)

  (export "memory" (memory 0))

  (global $escape2 (mut f64) (f64.const 16))
  (global $max_iters (mut i32) (i32.const 1024))
  (export "escape2" (global $escape2))
  (export "max_iters" (global $max_iters))
  
  (global $epsilon (mut f64) (f64.const 1e-12))
  (export "epsilon" (global $epsilon))

  (func (export "draw")
    (param $width i32)    
    (param $height i32)    

    (local $min f64)
    (local $max f64)
    (local $v f64)
    (local $c i32)

    (local $i i32) (local $im i32) (local $j i32)

    (local.set $im (i32.shl (i32.mul (local.get $width) (local.get $height)) (i32.const 3)))

    (local.set $min (f64.const inf))

    (loop $i
      (local.tee $v (f64.load (local.get $i)))
      (local.set $min (f64.min (local.get $min)))
      (if (f64.eq (local.get $v) (f64.const inf)) (then) (else
        (local.set $max (f64.max (local.get $v) (local.get $max)))
      ))

      (local.tee $i (i32.add (local.get $i) (i32.const 8)))
      (br_if $i (i32.lt_u (local.get $im)))
    )

    (call $log_f64 (local.get $min))
    (call $log_f64 (local.get $max))

    (local.set $i (i32.const 0))
    (local.set $j (local.get $im))
    (loop $j
      (local.tee $v (f64.sub (local.get $min) (f64.load (local.get $i))))
      (if (f64.eq (f64.const -inf)) (then 
        (local.set $c (i32.const 0))
      ) (else
        ;; (i32.trunc_f64_u (f64.mul (f64.div (f64.sub (local.get $v) (local.get $min)) (f64.sub (local.get $max) (local.get $min))) (f64.const 255)))
        (if (f64.gt (local.get $v) (f64.const 0)) (then (call $log_f64 (local.get $v))))
        (i32.sub (i32.const 255) (i32.trunc_f64_u (f64.mul (call $exp2 (f64.div (local.get $v) (f64.const 1))) (f64.sqrt) (f64.sqrt) (f64.sqrt) (f64.const 255))))
        (local.set $c)
      ))

      (i32.store8 offset=0 (local.get $j) (i32.const 0))
      (i32.store8 offset=1 (local.get $j) (i32.const 0))
      (i32.store8 offset=2 (local.get $j) (local.get $c))
      (i32.store8 offset=3 (local.get $j) (i32.const 255))

      (local.set $j (i32.add (local.get $j) (i32.const 4)))
      (local.tee $i (i32.add (local.get $i) (i32.const 8)))
      (br_if $j (i32.lt_u (local.get $im)))
    )
  )
  
  (func (export "calc")
    (param $width i32)    
    (param $height i32)    
    (param $center_x f64)    
    (param $center_y f64)    
    (param $scale f64)    

    (local $i i32)
    (local $x f64) (local $y f64)
    (local $j i32)
    (local $chunk_len i32) (local $row_len i32) (local $grid_len i32)
    (local $chunk_width f64)
    (local $row_width f64)

    (local.set $i (i32.shl (global.get $id) (i32.const 3)))
    (local.set $chunk_len (i32.shl (global.get $count) (i32.const 3)))

    (local.set $x (f64.sub (local.get $center_x) (f64.mul (f64.mul (f64.convert_i32_u (local.get $width)) (local.get $scale)) (f64.const 0.5))))
    (local.set $y (f64.sub (local.get $center_y) (f64.mul (f64.mul (f64.convert_i32_u (local.get $height)) (local.get $scale)) (f64.const 0.5))))

    (local.tee $row_len (i32.shl (local.get $width) (i32.const 3)))
    (local.set $grid_len (i32.mul (local.get $height)))

    (local.set $chunk_width (f64.mul (local.get $scale) (f64.convert_i32_u (global.get $count))))
    (local.set $row_width (f64.mul (local.get $scale) (f64.convert_i32_u (local.get $width))))

    (local.set $x (f64.add (local.get $x) (f64.mul (local.get $scale) (f64.convert_i32_u (global.get $id)))))
    (loop $y
      (local.tee $j (i32.add (local.get $j) (local.get $row_len)))
      (loop $x
        (f64.store (local.get $i) (call $calc_point (local.get $x) (local.get $y)))

        (local.set $x (f64.add (local.get $x) (local.get $chunk_width)))
        (local.tee $i (i32.add (local.get $i) (local.get $chunk_len)))
        (br_if $x (i32.lt_u (local.get $j)))
      )
      (local.set $x (f64.sub (local.get $x) (local.get $row_width)))
      (local.set $y (f64.add (local.get $y) (local.get $scale)))
      (br_if $y (i32.lt_u (local.get $grid_len)))
    )
  )

  ;; (func $draw_pixel
  ;;   (param $x f64) (param $y f64) (param $i i32)
  ;;   (local $o f64)

  ;;   (local.tee $o (call $point (local.get $x) (local.get $y)))

  ;;   (if (f64.eq (f64.const -1)) (then
  ;;     (i32.store (local.get $i) (i32.const 0xff000000))
  ;;   ) (else
      
  ;;     (i32.store8 offset=0 (local.get $i) (call $color_f (f64.const 0) (local.get $y)))
  ;;     (i32.store8 offset=1 (local.get $i) (call $color_f (f64.const 8) (local.get $y)))
  ;;     (i32.store8 offset=2 (local.get $i) (call $color_f (f64.const 4) (local.get $y)))
  ;;     (i32.store8 offset=3 (local.get $i) (i32.const 255))
  ;;   ))
  ;; )

  ;; (func $color_f (param $n f64) (param $v f64) (result i32)
  ;;   (local.set $n (f64.add (local.get $n) (f64.mul (local.get $v) (f64.const 12))))
  ;;   (loop $mod (if (f64.ge (local.get $n) (f64.const 12)) (then
  ;;     (local.set $n (f64.sub (local.get $n) (f64.const 12)))
  ;;     (br $mod)
  ;;   )))

  ;;   (f64.sub (f64.const 0.5) (f64.max (f64.const -0.5) (f64.min (f64.const 0.5) (f64.min
  ;;     (f64.sub (local.get $n) (f64.const 3))
  ;;     (f64.sub (f64.const 9) (local.get $n))
  ;;   ))))

  ;;   (i32.trunc_f64_u (f64.mul (f64.const 255)))
  ;; )
  
  (func $calc_point (param $x0 f64) (param $y0 f64) (result f64)
    (local $x f64) (local $y f64)
    (local $x2 f64) (local $y2 f64)
    (local $xl f64) (local $yl f64)
    (local $i i32) (local $o f64)

    ;; (local.set $x0 (f64.const -0.5))
    ;; (local.set $y0 (f64.const -0.6))

    (local.set $o (f64.const 1))
    (local.set $xl (local.get $x))
    (local.set $yl (local.get $y))
    (local.set $x2 (f64.mul (local.get $x) (local.get $x)))
    (local.set $y2 (f64.mul (local.get $y) (local.get $y)))

    (block $skip (loop $cont
      (local.set $y (f64.add (f64.mul (f64.add (local.get $x) (local.get $x)) (local.get $y)) (local.get $y0)))
      (local.tee $x (f64.add (f64.sub (local.get $x2) (local.get $y2)) (local.get $x0)))
      (local.tee $x2 (f64.mul (local.get $x)))
      (local.tee $y2 (f64.mul (local.get $y) (local.get $y)))
      (if (f64.ge (f64.add) (global.get $escape2))
        (then
          (local.set $o (f64.sub
            (f64.convert_i32_u (i32.add (i32.const 2) (local.get $i)))
            (call $log2 (call $log2 (f64.add (local.get $x2) (local.get $y2))))
          ))
        )
        (else
          (if (i32.and (local.get $i) (i32.const 15)) (then
            (if (f64.le (f64.add
              (f64.abs (f64.sub (local.get $x) (local.get $xl)))
              (f64.abs (f64.sub (local.get $y) (local.get $yl)))
            ) (global.get $epsilon)) (then
              (local.set $o (f64.const inf))
              (br $skip)
            ))
          ) (else
            (local.set $xl (local.get $x))
            (local.set $yl (local.get $y))
          ))
          (local.tee $i (i32.add (local.get $i) (i32.const 1)))
          (br_if $cont (i32.lt_u (global.get $max_iters)))
          (local.set $o (f64.const inf))
        )
      )
    ))

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

  (func $exp2 (param $n f64) (result f64) (local $b i64)
    (i64.shl (i64.add (call $i64_max_s (i64.const -1023) (call $i64_min_s (i64.const 1024) (i64.trunc_f64_s (local.get $n)))) (i64.const 1023)) (i64.const 52))
    (f64.reinterpret_i64)
  )
  (func $i64_min_s (param $x i64) (param $y i64) (result i64)
    (if (i64.gt_s (local.get $x) (local.get $y)) (then (local.set $x (local.get $y))))
    (local.get $x)
  )
  (func $i64_max_s (param $x i64) (param $y i64) (result i64)
    (if (i64.lt_s (local.get $x) (local.get $y)) (then (local.set $x (local.get $y))))
    (local.get $x)
  )
)