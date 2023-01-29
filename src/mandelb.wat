(module
  (import "ctx" "memory" (memory 2048 2048 shared))
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

    (local.set $i (i32.const 0))
    (local.set $j (local.get $im))
    (loop $j
      (local.tee $v (f64.load (local.get $i)))
      (if (f64.eq (f64.const inf)) (then 
        (local.set $c (i32.const 0))
      ) (else
        (local.set $v (f64.sub (local.get $min) (local.get $v)))
        (i32.sub (i32.const 255) (i32.trunc_f64_u (f64.mul (call $exp2 (f64.div (local.get $v) (f64.const 16))) (f64.const 255))))
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
    (param $x f64)
    (param $y f64)
    (param $z f64)
    (param $w f64)
    (param $ix f64)
    (param $iy f64)
    (param $iz f64)
    (param $iw f64)
    (param $jx f64)
    (param $jy f64)
    (param $jz f64)
    (param $jw f64)

    (local $cx f64)
    (local $cy f64)
    (local $cz f64)
    (local $cw f64)
    (local $i i32)
    (local $io i32)
    (local $j i32)
    (local $hi f64)
    (local $hj f64)
    (local $chunk_len i32)
    (local $row_len i32)
    (local $grid_len i32)

    (local.set $io (i32.shl (global.get $id) (i32.const 3)))
    (local.set $chunk_len (i32.shl (global.get $count) (i32.const 3)))

    (local.set $hi (f64.mul (f64.convert_i32_u (local.get $width)) (f64.const 0.5)))
    (local.set $hj (f64.mul (f64.convert_i32_u (local.get $height)) (f64.const 0.5)))
    (local.set $x (f64.sub (f64.sub (local.get $x) (f64.mul (local.get $hi) (local.get $ix))) (f64.mul (local.get $hj) (local.get $jx))))
    (local.set $y (f64.sub (f64.sub (local.get $y) (f64.mul (local.get $hi) (local.get $iy))) (f64.mul (local.get $hj) (local.get $jy))))
    (local.set $z (f64.sub (f64.sub (local.get $z) (f64.mul (local.get $hi) (local.get $iz))) (f64.mul (local.get $hj) (local.get $jz))))
    (local.set $w (f64.sub (f64.sub (local.get $w) (f64.mul (local.get $hi) (local.get $iw))) (f64.mul (local.get $hj) (local.get $jw))))

    (local.tee $row_len (i32.shl (local.get $width) (i32.const 3)))
    (local.set $grid_len (i32.mul (local.get $height)))

    (local.set $x (f64.add (local.get $x) (f64.mul (local.get $ix) (f64.convert_i32_u (global.get $id)))))
    (local.set $y (f64.add (local.get $y) (f64.mul (local.get $iy) (f64.convert_i32_u (global.get $id)))))
    (local.set $z (f64.add (local.get $z) (f64.mul (local.get $iz) (f64.convert_i32_u (global.get $id)))))
    (local.set $w (f64.add (local.get $w) (f64.mul (local.get $iw) (f64.convert_i32_u (global.get $id)))))

    (local.set $ix (f64.mul (local.get $ix) (f64.convert_i32_u (global.get $count))))
    (local.set $iy (f64.mul (local.get $iy) (f64.convert_i32_u (global.get $count))))
    (local.set $iz (f64.mul (local.get $iz) (f64.convert_i32_u (global.get $count))))
    (local.set $iw (f64.mul (local.get $iw) (f64.convert_i32_u (global.get $count))))

    (loop $y
      (local.set $cx (local.get $x))
      (local.set $cy (local.get $y))
      (local.set $cz (local.get $z))
      (local.set $cw (local.get $w))
      (local.set $i (i32.add (local.get $j) (local.get $io)))
      (local.tee $j (i32.add (local.get $j) (local.get $row_len)))
      (loop $x
        (f64.store (local.get $i) (call $calc_point (local.get $cx) (local.get $cy) (local.get $cz) (local.get $cw)))

        (local.set $cx (f64.add (local.get $cx) (local.get $ix)))
        (local.set $cy (f64.add (local.get $cy) (local.get $iy)))
        (local.set $cz (f64.add (local.get $cz) (local.get $iz)))
        (local.set $cw (f64.add (local.get $cw) (local.get $iw)))
        (local.tee $i (i32.add (local.get $i) (local.get $chunk_len)))
        (br_if $x (i32.lt_u (local.get $j)))
      )
      (local.set $x (f64.add (local.get $x) (local.get $jx)))
      (local.set $y (f64.add (local.get $y) (local.get $jy)))
      (local.set $z (f64.add (local.get $z) (local.get $jz)))
      (local.set $w (f64.add (local.get $w) (local.get $jw)))
      (br_if $y (i32.lt_u (local.get $grid_len)))
    )
  )

  (func $calc_point (param $cx f64) (param $cy f64) (param $zx f64) (param $zy f64) (result f64)
    (local $zx2 f64) (local $zy2 f64)
    (local $pzx f64) (local $pzy f64)
    (local $i i32) (local $o f64)

    (local.set $o (f64.const 1))
    (local.set $pzx (local.get $zx))
    (local.set $pzy (local.get $zy))
    (local.set $zx2 (f64.mul (local.get $zx) (local.get $zx)))
    (local.set $zy2 (f64.mul (local.get $zy) (local.get $zy)))

    (block $skip (loop $cont
      (local.set $zy (f64.add (f64.mul (f64.add (local.get $zx) (local.get $zx)) (local.get $zy)) (local.get $cy)))
      (local.tee $zx (f64.add (f64.sub (local.get $zx2) (local.get $zy2)) (local.get $cx)))
      (local.tee $zx2 (f64.mul (local.get $zx)))
      (local.tee $zy2 (f64.mul (local.get $zy) (local.get $zy)))
      (if (f64.ge (f64.add) (global.get $escape2))
        (then
          (local.set $o (f64.sub
            (f64.convert_i32_u (i32.add (i32.const 2) (local.get $i)))
            (call $log2 (call $log2 (f64.add (local.get $zx2) (local.get $zy2))))
          ))
        )
        (else
          (if (i32.and (local.get $i) (i32.const 15)) (then
            (if (f64.le (f64.add
              (f64.abs (f64.sub (local.get $zx) (local.get $pzx)))
              (f64.abs (f64.sub (local.get $zy) (local.get $pzy)))
            ) (global.get $epsilon)) (then
              (local.set $o (f64.const inf))
              (br $skip)
            ))
          ) (else
            (local.set $pzx (local.get $zx))
            (local.set $pzy (local.get $zy))
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
    (f64.add (f64.const 3.92221))
    (f64.mul (local.get $n))
    (f64.add (f64.const -1.44851))
    (f64.add)
  )

  (func $exp2 (param $n f64) (result f64) (local $b i64)
    (i64.shl (i64.add (call $i64_max_s (i64.const -1023) (call $i64_min_s (i64.const 1024) (i64.trunc_f64_s (local.get $n)))) (i64.const 1023)) (i64.const 52))
    (f64.reinterpret_i64)
    (local.tee $n (f64.sub (local.get $n) (f64.trunc (local.get $n))))
    (f64.mul (f64.const 0.0136021))
    (f64.add (f64.const 0.0512905))
    (f64.mul (local.get $n))
    (f64.add (f64.const 0.242393))
    (f64.mul (local.get $n))
    (f64.add (f64.const 0.692597))
    (f64.mul (local.get $n))
    (f64.add (f64.const 1))
    (f64.mul)
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