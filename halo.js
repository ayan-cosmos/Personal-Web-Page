/* =========================================================
   Halo shapes: rotating particle models
   Each <canvas class="halo-canvas"> reads its axis ratios
   from data-q (b/a) and data-s (c/a).
========================================================= */

(function () {

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    // Seeded random numbers: the same particles on every visit
    function makeRandom(seed) {
        return function () {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
    }


    // Centrally concentrated particle cloud inside a unit sphere
    function makeParticles(count, seed) {
        var rand = makeRandom(seed);
        var pts = [];

        for (var i = 0; i < count; i++) {
            var z = 2 * rand() - 1;
            var phi = 2 * Math.PI * rand();
            var rxy = Math.sqrt(1 - z * z);
            var r = Math.pow(rand(), 1.4);

            pts.push({
                x: rxy * Math.cos(phi) * r,
                y: rxy * Math.sin(phi) * r,
                z: z * r,
                w: 0.35 + 0.5 * rand()
            });
        }
        return pts;
    }


    function setupHalo(canvas, index) {
        var ctx = canvas.getContext("2d");

        var q = parseFloat(canvas.dataset.q);   // b / a
        var s = parseFloat(canvas.dataset.s);   // c / a

        var particles = makeParticles(6000, 1234567 + index * 99991);

        var yaw = 0.55;       // turn about the short axis c (vertical)
        var tilt = 0.75;     // slight tilt so the shape reads in 3D
        var width = 0, height = 0;
        var dragging = false, lastX = 0, lastY = 0;
        var visible = true;
        var rgb = "23, 23, 23";


        function readColour() {
            var c = getComputedStyle(canvas).color.match(/\d+/g);
            if (c) rgb = c[0] + ", " + c[1] + ", " + c[2];
        }


        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        }


        function draw() {
            ctx.clearRect(0, 0, width, height);

            var scale = Math.min(width, height * 1.25) * 0.47;
            var cy = Math.cos(yaw), sy = Math.sin(yaw);
            var ct = Math.cos(tilt), st = Math.sin(tilt);
            var dot = Math.max(1, Math.min(width, height) / 220);

            // short axis c is vertical on screen
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];

                var X = p.x * 1;     // along a
                var Y = p.z * s;     // along c (vertical)
                var Z = p.y * q;     // along b

                var x1 = X * cy + Z * sy;
                var z1 = -X * sy + Z * cy;

                var y2 = Y * ct - z1 * st;
                var z2 = Y * st + z1 * ct;

                var depth = 0.6 + 0.4 * (1 - (z2 + 1) / 2);

                ctx.fillStyle = "rgba(" + rgb + "," + (p.w * depth * 0.8).toFixed(3) + ")";
                ctx.fillRect(width / 2 + x1 * scale, height / 2 - y2 * scale, dot, dot);
            }
        }


        function frame() {
            if (!dragging && !reduceMotion && visible) {
                yaw += 0.003;
                draw();
            }
            requestAnimationFrame(frame);
        }


        canvas.addEventListener("pointerdown", function (e) {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.setPointerCapture(e.pointerId);
        });

        canvas.addEventListener("pointermove", function (e) {
            if (!dragging) return;
            yaw += (e.clientX - lastX) * 0.01;
            tilt = Math.max(-1.4, Math.min(1.4, tilt + (e.clientY - lastY) * 0.01));
            lastX = e.clientX;
            lastY = e.clientY;
            draw();
        });

        canvas.addEventListener("pointerup", function () { dragging = false; });
        canvas.addEventListener("pointercancel", function () { dragging = false; });


        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }).observe(canvas);
        }

        window.addEventListener("resize", resize);

        readColour();
        resize();
        requestAnimationFrame(frame);
    }


    document.querySelectorAll(".halo-canvas").forEach(setupHalo);

})();
