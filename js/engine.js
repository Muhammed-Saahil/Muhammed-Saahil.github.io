/* =========================================================
   Engine-style visuals
   1) Hero background: WebGL fragment shader (mouse-reactive grid)
   2) (removed - the Toon Shader lab now lives in js/toon.js)
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1) HERO SHADER - domain-warped "energy plasma" with glowing veins
     --------------------------------------------------------- */
  function initShader() {
    var canvas = document.querySelector(".shader-canvas");
    if (!canvas) return;
    var hero = canvas.closest(".hero");
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    } catch (e) { gl = null; }
    if (!gl) return; // no WebGL: the CSS light show + particles still run

    var vsSrc = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
    var fsSrc = [
      "#ifdef GL_FRAGMENT_PRECISION_HIGH",
      "precision highp float;",
      "#else",
      "precision mediump float;",
      "#endif",
      "uniform vec2 u_res;",
      "uniform float u_time;",
      "uniform vec2 u_mouse;",
      "uniform float u_dpr;", // canvas pixels per CSS pixel
      "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
      "float noise(vec2 p){",
      "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
      "}",
      "float fbm(vec2 p){",
      "  float v = 0.0; float a = 0.5;",
      "  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(11.7, 5.3); a *= 0.5; }",
      "  return v;",
      "}",
      "void main(){",
      "  vec2 frag = gl_FragCoord.xy;",
      "  float k = u_dpr;",
      "  vec2 uvn = frag / u_res;",
      "  vec2 m = u_mouse * u_res;",
      "  vec2 d = frag - m;",
      "  float r = length(d);",
      // shockwave-style ripple radiating from the cursor
      "  float ripple = sin(r / (k * 16.0) - u_time * 3.5) * exp(-r / (k * 170.0)) * 10.0 * k;",
      "  vec2 f2 = frag + normalize(d + vec2(0.0001)) * ripple;",
      "  vec2 p = f2 / (k * 420.0);",
      "  float t = u_time * 0.12;",
      // domain warping: noise fed through noise gives that swirling energy look
      "  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - vec2(t, 0.0)));",
      "  vec2 rr = vec2(fbm(p + 2.5 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 2.5 * q + vec2(8.3, 2.8) - t * 1.1));",
      "  float f = fbm(p + 2.5 * rr);",
      "  vec3 col = mix(vec3(0.03, 0.04, 0.06), vec3(0.12, 0.45, 0.50), smoothstep(0.25, 0.85, f));",
      "  col = mix(col, vec3(0.50, 0.38, 0.95), smoothstep(0.40, 0.95, length(rr)) * smoothstep(0.35, 0.75, q.x) * 0.7);",
      "  col += vec3(0.65, 1.0, 0.80) * pow(clamp(f, 0.0, 1.0), 4.0) * 0.8;",
      // glowing iso-contour lines = energy veins
      "  float vein = exp(-abs(f - 0.52) * 26.0) + 0.6 * exp(-abs(f - 0.70) * 30.0);",
      "  col += vec3(0.40, 0.91, 1.0) * vein * 0.7;",
      "  float glow = exp(-r / (k * 260.0));",
      "  col += glow * vec3(0.15, 0.40, 0.45);",
      "  float a = clamp(f * f * 1.5 + vein * 0.55 + glow * 0.25, 0.0, 1.0);",
      // calmer behind the headline (left), fade out toward the bottom edge
      "  a *= mix(0.45, 1.0, smoothstep(0.05, 0.9, uvn.x));",
      "  a *= mix(0.25, 1.0, smoothstep(0.0, 0.45, uvn.y));",
      "  a = clamp(a * 0.85, 0.0, 0.9);",
      "  gl_FragColor = vec4(col * a, a);",
      "}"
    ].join("\n");

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("Shader compile error:", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, vsSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");
    var uDpr = gl.getUniformLocation(prog, "u_dpr");
    gl.clearColor(0, 0, 0, 0);

    // Render at a fraction of screen resolution (soft noise upscales nicely)
    // and drop it further automatically if the frame rate suffers.
    var scale = 0.5;
    var target = { x: 0.7, y: 0.5 };
    var cur = { x: 0.7, y: 0.5 };
    var active = false;
    var lastT = 0;
    var raf = 0;
    var visible = true;
    var ema = 0.016, frames = 0, lastNow = 0;

    function resize() {
      var w = Math.max(1, Math.floor(hero.offsetWidth * scale));
      var h = Math.max(1, Math.floor(hero.offsetHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    }

    function draw(t) {
      lastT = t;
      if (!active) {
        // idle: the "light" drifts around on its own
        target.x = 0.5 + 0.3 * Math.cos(t * 0.35);
        target.y = 0.5 + 0.25 * Math.sin(t * 0.5);
      }
      cur.x += (target.x - cur.x) * 0.07;
      cur.y += (target.y - cur.y) * 0.07;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, cur.x, cur.y);
      gl.uniform1f(uDpr, scale);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var t0 = performance.now();
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) { lastNow = 0; return; }
      if (lastNow) {
        ema = ema * 0.92 + ((now - lastNow) / 1000) * 0.08;
        frames++;
        if (frames > 40 && ema > 0.030 && scale > 0.3) {
          scale *= 0.85; frames = 0; ema = 0.016; resize();
        }
      }
      lastNow = now;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    function kick() {
      if (!raf && visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(loop);
    }

    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
      active = true;
    });
    hero.addEventListener("mouseleave", function () { active = false; });
    window.addEventListener("resize", function () { resize(); draw(lastT); });
    document.addEventListener("visibilitychange", kick);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        kick();
      }).observe(hero);
    }

    resize();
    draw(0);
    kick();
  }

  function boot() { initShader(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
