# mandelb.wat

> A real-time interactive 4D explorer of the Mandelbrot set, written in WAT.

View it online at https://mandelbwat.t6.fyi/.

Drag to move, scroll to scale, right-click drag to rotate. Press `r` to reset.

Black points correspond to points in the Mandelbrot set, and bright points
denote points almost in the Mandelbrot set. As you zoom in, the colors are
dynamically adjusted to reveal fine detail that would otherwise be lost.

By default, the left pane shows the *xy*-plane, which is the canonical
Mandelbrot set, and the right pane shows the *zw*-plane, which corresponds to
the canonical Julia sets. Translating in the left pane results in different
Julia sets on the right.

As each pane shows two orthogonal planes from the 4D space, only one point is
shown in both panes simultaneously, and is located at the center of each pane.
Thus, translating in the left pane changes the *xy*-coordinates of the center
point, causing the right plane to show the corresponding *zw*-plane. Conversely,
translating in the right pane changes the *zw*-coordinates of the center point,
causing the left plane to the corresponding *xy*-plane.

Rotating the space causes the two panes to show different cross-sections of the
Mandelbrot set. Rotations in 4D happen *within planes*[^1] (similar to a 2D
rotations). In 4D, you can rotate in 6 independent planes. The viewer allows you
to rotate in 4[^2]. To rotate in the...
- *xz*-plane: drag horizontally on the left pane
- *yw*-plane: drag vertically on the left pane
- *zy*-plane: drag horizontally on the right pane
- *wx*-plane: drag vertically on the right pane

The core calculations are implemented in hand-written WAT (WebAssembly Text
format), which transpiles to WASM. The WAT takes:
- the 4D coordinates of the center point
- the 4D orientation
- the scale factor
- the output dimensions

Using these, it calculates for each point in the view whether they are in or close to
the set, and from this writes an image into its memory.

A frontend written in TypeScript calls the WASM in Web Workers to parallelize
the rendering across many threads and render the image onto the screen.

Due to the highly complex fractal nature of the set, there are at times sections
that look like rendering errors, but are faithful depictions of the true
structure. This can often be verified by zooming in on points and observing
further fractal detail, as expected. Various viewpoints have been checked
against other renderings of the Mandelbrot set, and all have aligned correctly.
At first, many angled views may seem very non-intuitive, but with continued
exploration, one can notice patterns and consistencies.

[^1]: Really, all rotations happen within planes. It's just that in 3D, it's
natural to rotate around the axes (orthogonal lines). In 4D, you could also
represent the rotations orthogonally, but then rotations would happen *around
orthogonal planes*. Rotation within planes is more intuitive, as you can just
ignore the orthogonal dimensions.

[^2]: You can't directly rotate in the two planes actively visible to you,
unless you tilt your head.
