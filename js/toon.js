/* =========================================================
   Toon Shader Lab
   A raymarched toon / cel shader running in WebGL, with live controls.
   EDIT ME:
     - DEFAULTS      the starting look (also what "Reset" returns to)
     - PRESETS       one-click looks
     - CONTROLS      which sliders/colours are shown, and their ranges
     - SHAPES        the models in the picker (add one in the GLSL map() too)
     - the GLSL      FS_SRC below is the actual shader
   Falls back to a simple 2D sphere if WebGL isn't available.
   ========================================================= */
(function () {
  "use strict";

  var root = document.getElementById("toon");
  if (!root) return;
  var cv = document.getElementById("toonCanvas");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- settings ---------- */
  var DEFAULTS = {
    base: "#ff7a59", shadow: "#3b2a7a", outline: "#0b0a14",
    bands: 3, threshold: 0.5, softness: 0.04,
    specSize: 0.5, specStrength: 0.9,
    rim: 0.6, outlineWidth: 0.5, halftone: 0.0,
    shape: 0, az: 0.9, el: 0.7
  };
  var PRESETS = {
    "Anime":  {},
    "Comic":  { base: "#ffd23f", shadow: "#d1495b", bands: 2, softness: 0.0, specStrength: 0.0, rim: 0.0, outlineWidth: 0.8, halftone: 1.0, threshold: 0.55 },
    "Clay":   { base: "#e9c7a5", shadow: "#8c6a55", bands: 5, softness: 0.5, specStrength: 0.15, rim: 0.2, outlineWidth: 0.1, halftone: 0.0, threshold: 0.45 },
    "Neon":   { base: "#66e8ff", shadow: "#2a1b6e", outline: "#a6ffcb", bands: 3, softness: 0.08, specStrength: 1.0, rim: 1.0, outlineWidth: 0.35, halftone: 0.0, threshold: 0.5 }
  };
  var SHAPES = ["Sphere", "Torus", "Cube", "Blob"];
  var CONTROLS = [
    { k: "base",         label: "Base colour",   type: "color" },
    { k: "shadow",       label: "Shadow colour", type: "color" },
    { k: "outline",      label: "Outline colour",type: "color" },
    { k: "bands",        label: "Light bands",   type: "range", min: 1, max: 6, step: 1 },
    { k: "threshold",    label: "Shadow threshold", type: "range", min: 0.1, max: 0.9, step: 0.01 },
    { k: "softness",     label: "Edge softness", type: "range", min: 0, max: 0.6, step: 0.01 },
    { k: "specSize",     label: "Highlight size",type: "range", min: 0.05, max: 1, step: 0.01 },
    { k: "specStrength", label: "Highlight strength", type: "range", min: 0, max: 1, step: 0.01 },
    { k: "rim",          label: "Rim light",     type: "range", min: 0, max: 1, step: 0.01 },
    { k: "outlineWidth", label: "Outline width", type: "range", min: 0, max: 1, step: 0.01 },
    { k: "halftone",     label: "Halftone shadows", type: "range", min: 0, max: 1, step: 0.01 }
  ];

  var S = {}, spin = !reduce, tOffset = 0, visible = true, dirty = true;
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function load(p) { S = copy(DEFAULTS); for (var k in p) S[k] = p[k]; S.shape = p && p.shape != null ? p.shape : S.shape; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  function lightDir() {
    return [Math.cos(S.el) * Math.sin(S.az), Math.sin(S.el), Math.cos(S.el) * Math.cos(S.az)];
  }

  /* ---------- UI ---------- */
  var ui = {};
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function buildUI() {
    var box = document.getElementById("toonControls");
    CONTROLS.forEach(function (c) {
      var row = el("label", "toon-ctl " + c.type);
      var name = el("span", "toon-name", c.label);
      var input = el("input");
      input.type = c.type;
      input.setAttribute("aria-label", c.label);
      if (c.type === "range") { input.min = c.min; input.max = c.max; input.step = c.step; }
      var val = el("output", "toon-val");
      input.addEventListener("input", function () {
        S[c.k] = c.type === "range" ? parseFloat(input.value) : input.value;
        sync(c.k); dirty = true; updateCode();
      });
      row.appendChild(name);
      row.appendChild(input);
      row.appendChild(val);
      box.appendChild(row);
      ui[c.k] = { input: input, out: val, c: c };
    });

    var sh = document.getElementById("toonShapes");
    SHAPES.forEach(function (n, i) {
      var b = el("button", "toon-chip", n); b.type = "button";
      b.addEventListener("click", function () { S.shape = i; syncAll(); dirty = true; updateCode(); });
      sh.appendChild(b);
    });
    var pr = document.getElementById("toonPresets");
    Object.keys(PRESETS).forEach(function (n) {
      var b = el("button", "toon-chip", n); b.type = "button"; b.setAttribute("data-preset", n);
      b.addEventListener("click", function () {
        var keep = { shape: S.shape, az: S.az, el: S.el };
        load(PRESETS[n]); S.shape = keep.shape; S.az = keep.az; S.el = keep.el;
        syncAll(); dirty = true; updateCode();
      });
      pr.appendChild(b);
    });

    var spinBtn = document.getElementById("toonSpin");
    function spinUI() { spinBtn.setAttribute("aria-pressed", spin ? "true" : "false"); spinBtn.classList.toggle("on", spin); }
    spinBtn.addEventListener("click", function () { spin = !spin; spinUI(); dirty = true; });
    spinUI();
    document.getElementById("toonReset").addEventListener("click", function () { load({}); syncAll(); dirty = true; updateCode(); });
    document.getElementById("toonCopy").addEventListener("click", function () {
      var btn = this, txt = document.getElementById("toonCode").textContent;
      function done(m) { btn.textContent = m; setTimeout(function () { btn.textContent = "Copy HLSL"; }, 1400); }
      try { navigator.clipboard.writeText(txt).then(function () { done("Copied!"); }, function () { done("Copy failed"); }); }
      catch (e) { done("Copy failed"); }
    });
  }

  function fmt(c, v) {
    if (c.type === "color") return String(v).toUpperCase();
    return c.step >= 1 ? String(Math.round(v)) : (+v).toFixed(2);
  }
  function sync(k) { var u = ui[k]; u.input.value = S[k]; u.out.textContent = fmt(u.c, S[k]); }
  function syncAll() {
    for (var k in ui) sync(k);
    var chips = document.querySelectorAll("#toonShapes .toon-chip");
    for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("on", i === S.shape);
  }

  /* ---------- live HLSL readout ---------- */
  function f3(a) { return "float3(" + a.map(function (x) { return x.toFixed(2); }).join(", ") + ")"; }
  function updateCode() {
    var pre = document.getElementById("toonCode");
    if (!pre) return;
    pre.textContent =
"// Toon_Lit.hlsl  (URP-style, values from the sliders)\n" +
"static const float3 _BaseColor    = " + f3(hex(S.base)) + ";\n" +
"static const float3 _ShadowColor  = " + f3(hex(S.shadow)) + ";\n" +
"static const float  _Bands        = " + S.bands + ";\n" +
"static const float  _Threshold    = " + S.threshold.toFixed(2) + ";\n" +
"static const float  _Softness     = " + S.softness.toFixed(2) + ";\n" +
"static const float  _SpecSize     = " + S.specSize.toFixed(2) + ";\n" +
"static const float  _SpecStrength = " + S.specStrength.toFixed(2) + ";\n" +
"static const float  _Rim          = " + S.rim.toFixed(2) + ";\n" +
"static const float  _OutlineWidth = " + S.outlineWidth.toFixed(2) + ";\n\n" +
"float3 ToonLit(float3 N, float3 L, float3 V)\n{\n" +
"    float ndl = dot(N, L) * 0.5 + 0.5 + (0.5 - _Threshold) * 0.8;\n" +
"    float f   = saturate(ndl) * _Bands;\n" +
"    float h   = max(_Softness * 0.5, 0.003);\n" +
"    float lit = (floor(f) + smoothstep(0.5 - h, 0.5 + h, frac(f))) / _Bands;\n" +
"    float3 col = lerp(_ShadowColor, _BaseColor, saturate(lit));\n\n" +
"    float nh   = dot(N, normalize(L + V));\n" +
"    float spec = smoothstep(1 - _SpecSize * 0.12 - 0.004, 1 - _SpecSize * 0.12 + 0.004, nh);\n" +
"    col = lerp(col, 1, spec * _SpecStrength);\n\n" +
"    float rim = pow(1 - saturate(dot(N, V)), 3) * saturate(dot(N, L) + 0.4);\n" +
"    col += smoothstep(0.35, 0.4, rim) * _Rim * lerp(_BaseColor, 1, 0.5);\n" +
"    return col;\n}\n";
  }

  /* ---------- WebGL ---------- */
  var FS_SRC = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime;",
    "uniform vec3 uBase, uShadow, uOutlineCol, uLight;",
    "uniform float uBands, uThresh, uSoft, uSpecSize, uSpecStr, uRim, uOutline, uHalf, uShape;",
    "mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }",
    "float map(vec3 p){",
    "  p.xz = rot(uTime) * p.xz;",
    "  p.yz = rot(0.35) * p.yz;",
    "  if (uShape < 0.5) return length(p) - 1.0;",
    "  if (uShape < 1.5) { vec2 q = vec2(length(p.xz) - 0.78, p.y); return length(q) - 0.36; }",
    "  if (uShape < 2.5) { vec3 q = abs(p) - vec3(0.62); return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.22; }",
    "  return length(p) - 0.86 + 0.13 * sin(4.0 * p.x + 1.3) * sin(4.0 * p.y + 0.7) * sin(4.0 * p.z + 2.1);",
    "}",
    "vec3 calcN(vec3 p){ vec2 e = vec2(0.002, 0.0);",
    "  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }",
    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;",
    "  vec3 ro = vec3(0.0, 0.0, 3.6);",
    "  vec3 rd = normalize(vec3(uv, -2.4));",
    "  float t = 0.0, minD = 1e3; bool hit = false;",
    "  for (int i = 0; i < 80; i++){",
    "    float d = map(ro + rd * t);",
    "    minD = min(minD, d);",
    "    if (d < 0.0008){ hit = true; break; }",
    "    t += d; if (t > 8.0) break;",
    "  }",
    "  if (!hit){",
    "    float edge = (1.0 - smoothstep(uOutline * 0.055 - 0.004, uOutline * 0.055, minD)) * step(0.001, uOutline);",
    "    gl_FragColor = vec4(uOutlineCol * edge, edge); return;",
    "  }",
    "  vec3 p = ro + rd * t, n = calcN(p), v = -rd, l = normalize(uLight);",
    "  float ndl = dot(n, l) * 0.5 + 0.5 + (0.5 - uThresh) * 0.8;",
    "  float f = clamp(ndl, 0.0, 1.0) * uBands;",
    "  float h = max(uSoft * 0.5, 0.003);",
    "  float lit = (floor(f) + smoothstep(0.5 - h, 0.5 + h, fract(f))) / uBands;",
    "  vec3 col = mix(uShadow, uBase, clamp(lit, 0.0, 1.0));",
    "  vec2 g = fract(gl_FragCoord.xy / 7.0) - 0.5;",
    "  float dots = 1.0 - smoothstep(-0.02, 0.02, length(g) - 0.36 * (1.0 - clamp(lit, 0.0, 1.0)));",
    "  col = mix(col, uShadow * 0.5, uHalf * dots * (1.0 - clamp(lit, 0.0, 1.0)));",
    "  float nh = dot(n, normalize(l + v));",
    "  float thr = 1.0 - uSpecSize * 0.12;",
    "  float spec = smoothstep(thr - 0.004, thr + 0.004, nh) * step(0.0, dot(n, l));",
    "  col = mix(col, vec3(1.0), spec * uSpecStr);",
    "  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * max(dot(n, l) + 0.4, 0.0);",
    "  col += smoothstep(0.35, 0.4, rim) * uRim * mix(uBase, vec3(1.0), 0.5);",
    "  float inner = (1.0 - smoothstep(uOutline * 0.3 - 0.004, uOutline * 0.3, dot(n, v))) * step(0.001, uOutline);",
    "  col = mix(col, uOutlineCol, inner);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");
  var VS_SRC = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var gl = null, prog = null, loc = {};
  function initGL() {
    try { gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false }) || cv.getContext("experimental-webgl"); } catch (e) { gl = null; }
    if (!gl || !gl.createShader) { gl = null; return false; }
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS_SRC), fs = sh(gl.FRAGMENT_SHADER, FS_SRC);
    if (!vs || !fs) { gl = null; return false; }
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    ["uRes", "uTime", "uBase", "uShadow", "uOutlineCol", "uLight", "uBands", "uThresh", "uSoft", "uSpecSize", "uSpecStr", "uRim", "uOutline", "uHalf", "uShape"]
      .forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
    return true;
  }

  function drawGL() {
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    var L = lightDir();
    gl.uniform2f(loc.uRes, cv.width, cv.height);
    gl.uniform1f(loc.uTime, tOffset);
    gl.uniform3fv(loc.uBase, hex(S.base)); gl.uniform3fv(loc.uShadow, hex(S.shadow)); gl.uniform3fv(loc.uOutlineCol, hex(S.outline));
    gl.uniform3fv(loc.uLight, L);
    gl.uniform1f(loc.uBands, S.bands); gl.uniform1f(loc.uThresh, S.threshold); gl.uniform1f(loc.uSoft, S.softness);
    gl.uniform1f(loc.uSpecSize, S.specSize); gl.uniform1f(loc.uSpecStr, S.specStrength); gl.uniform1f(loc.uRim, S.rim);
    gl.uniform1f(loc.uOutline, S.outlineWidth); gl.uniform1f(loc.uHalf, S.halftone); gl.uniform1f(loc.uShape, S.shape);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- 2D fallback (sphere only) ---------- */
  var c2 = null;
  function draw2D() {
    var N = 160;
    if (cv.width !== N) { cv.width = N; cv.height = N; }
    c2 = c2 || cv.getContext("2d");
    if (!c2) return;
    var img = c2.createImageData(N, N), d = img.data, L = lightDir(), b = hex(S.base), sd = hex(S.shadow), o = hex(S.outline);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = (x / N) * 2 - 1, v = 1 - (y / N) * 2, r2 = u * u + v * v, i = (y * N + x) * 4;
      var rr = 0.62;
      if (r2 > rr * rr) { d[i + 3] = 0; continue; }
      var nz = Math.sqrt(rr * rr - r2) / rr, nx = u / rr, ny = v / rr;
      var ndl = nx * L[0] + ny * L[1] + nz * L[2];
      var s = Math.min(1, Math.max(0, ndl * 0.5 + 0.5 + (0.5 - S.threshold) * 0.8)) * S.bands;
      var fl = Math.floor(s), fr = s - fl, h = Math.max(S.softness * 0.5, 0.003);
      var k = Math.min(1, Math.max(0, (fr - (0.5 - h)) / (2 * h)));
      var lit = Math.min(1, (fl + k) / S.bands);
      var edge = nz < S.outlineWidth * 0.3;
      for (var c = 0; c < 3; c++) d[i + c] = 255 * (edge ? o[c] : sd[c] + (b[c] - sd[c]) * lit);
      d[i + 3] = 255;
    }
    c2.putImageData(img, 0, 0);
  }

  /* ---------- interaction: drag to move the light ---------- */
  function initDrag() {
    var down = false, lx = 0, ly = 0;
    cv.style.touchAction = "none";
    cv.addEventListener("pointerdown", function (e) { down = true; lx = e.clientX; ly = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) {} cv.classList.add("drag"); });
    cv.addEventListener("pointermove", function (e) {
      if (!down) return;
      S.az -= (e.clientX - lx) * 0.012;
      S.el = Math.max(-1.2, Math.min(1.45, S.el + (e.clientY - ly) * 0.012));
      lx = e.clientX; ly = e.clientY; dirty = true;
    });
    function up() { down = false; cv.classList.remove("drag"); }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("keydown", function (e) {
      var m = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
      if (m) { S.az += m[0]; S.el = Math.max(-1.2, Math.min(1.45, S.el - m[1])); dirty = true; e.preventDefault(); }
    });
    cv.tabIndex = 0;
  }

  /* ---------- boot ---------- */
  load({});
  buildUI();
  syncAll();
  updateCode();
  initDrag();

  var useGL = initGL();
  if (!useGL) {
    var msg = document.getElementById("toonMsg");
    if (msg) { msg.hidden = false; msg.textContent = "WebGL isn't available here, so this is a simplified preview (sphere only)."; }
  }

  var last = 0;
  function frame(now) {
    window.requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (spin && useGL) { tOffset += dt * 0.6; dirty = true; }
    if (!dirty) return;
    dirty = false;
    if (useGL) drawGL(); else draw2D();
  }
  window.requestAnimationFrame(frame);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) dirty = true; }, { threshold: 0 }).observe(root);
  }
  window.__toon = { state: S, get: function () { return S; }, setPreset: function (n) { var b = document.querySelector('[data-preset="' + n + '"]'); if (b) b.click(); } };
})();
