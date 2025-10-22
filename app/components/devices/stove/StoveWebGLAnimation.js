'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * StoveWebGLAnimation - WebGL icon animation for stove status
 *
 * Creates distinctive shader-based animations:
 * - OFF: Rotating snowflake (raymarched 3D shader)
 * - START/WORK: Ghibli-style flame (shader with fan/power params)
 * - ERROR: Warning triangle (Three.js)
 *
 * @param {Object} props
 * @param {string} props.status - Stove status (OFF, START, WORK, ERROR)
 * @param {number} props.fanLevel - Fan level 1-6 (affects flame movement)
 * @param {number} props.powerLevel - Power level 1-5 (affects flame height/intensity)
 */
export default function StoveWebGLAnimation({ status = 'OFF', fanLevel = 3, powerLevel = 3 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const objectsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const shaderCanvasRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  // Use shader-based animations
  const statusUpper = status.toUpperCase();
  const useShaderSnowflake = statusUpper.includes('OFF');
  const useShaderFlame = statusUpper.includes('START') || statusUpper.includes('WORK');
  const useShaderError = statusUpper.includes('ERROR') || statusUpper.includes('ALARM');
  const useThreeJS = !useShaderSnowflake && !useShaderFlame && !useShaderError; // Fallback only

  // Debug logging
  useEffect(() => {
    console.log('StoveWebGLAnimation - Status:', status, 'Snowflake:', useShaderSnowflake, 'Flame:', useShaderFlame, 'Error:', useShaderError, 'ThreeJS:', useThreeJS);
  }, [status, useShaderSnowflake, useShaderFlame, useShaderError, useThreeJS]);

  // Shader-based snowflake effect (WebGL2 raymarching)
  useEffect(() => {
    if (!useShaderSnowflake) {
      console.log('Not using shader snowflake, status is:', status);
      return;
    }
    if (!shaderCanvasRef.current) {
      console.log('Canvas ref not ready yet');
      return;
    }

    const canvas = shaderCanvasRef.current;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });

    if (!gl) {
      console.warn('WebGL2 not available for snowflake shader');
      setWebglError(true);
      return;
    }

    console.log('WebGL2 snowflake shader initialized successfully');

    let animationId;
    let startTime = performance.now();
    let resizeObserver;

    // Interaction state
    let dragging = false, px = 0, py = 0, ax = 0, ay = 0;

    // Vertex shader (fullscreen triangle)
    const vertexShaderSource = `#version 300 es
precision highp float;
void main(){
  vec2 v[3];
  v[0]=vec2(-1.0,-1.0); v[1]=vec2(3.0,-1.0); v[2]=vec2(-1.0,3.0);
  gl_Position = vec4(v[gl_VertexID],0.0,1.0);
}`;

    // Fragment shader (Ghibli-style 2D snowflake)
    const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uDrag;

// Hash per noise
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

// Smooth noise
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(hash21(i), hash21(i+vec2(1,0)), u.x),
    mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x),
    u.y
  );
}

// Rotazione 2D
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// Hexagon shape
float sdHex(vec2 p, float r){
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p)*sign(p.y);
}

// Rhombus shape (per le punte)
float sdRhombus(vec2 p, vec2 b){
  p = abs(p);
  float h = clamp((-2.0*min(p.x*b.x,p.y*b.y)+b.x*b.y)/(b.x*b.x+b.y*b.y), 0.0, 1.0);
  return length(p-vec2(b.x,b.y)*h)*sign(p.x*b.y+p.y*b.x-b.x*b.y);
}

// Circle
float sdCircle(vec2 p, float r){
  return length(p) - r;
}

// Ghibli-style snowflake shape (cartoon 2D)
float sdGhibliSnowflake(vec2 p, float t){
  // Centro esagonale
  float d = sdHex(p, 0.12);

  // 6 punte principali (simmetriche)
  for(int i=0; i<6; i++){
    float angle = float(i) * 3.14159265 / 3.0; // 60 gradi
    vec2 dir = vec2(cos(angle), sin(angle));

    // Punta principale - romboidale
    vec2 pp = rot(-angle) * p;

    // Corpo della punta (allungato verso esterno)
    float mainSpike = sdRhombus(pp - vec2(0.22, 0.0), vec2(0.14, 0.025));
    d = min(d, mainSpike);

    // Piccole punte laterali (2 per lato) - stile Ghibli
    for(int side=-1; side<=1; side+=2){
      // Prima punta laterale (vicina al centro)
      vec2 p1 = pp - vec2(0.15, float(side) * 0.08);
      float spike1 = sdRhombus(p1, vec2(0.06, 0.015));
      d = min(d, spike1);

      // Seconda punta laterale (più lontana)
      vec2 p2 = pp - vec2(0.28, float(side) * 0.12);
      float spike2 = sdRhombus(p2, vec2(0.05, 0.012));
      d = min(d, spike2);
    }

    // Mini decorazioni circolari (Ghibli touch)
    float deco = sdCircle(pp - vec2(0.36, 0.0), 0.022);
    d = min(d, deco);
  }

  // Centro decorativo (piccolo cerchio)
  float centerDeco = sdCircle(p, 0.035);
  d = min(d, centerDeco);

  // Piccoli brillantini casuali (sparkles)
  float sparkle = 1000.0;
  for(int i=0; i<8; i++){
    float fi = float(i);
    float angle = fi * 3.14159265 / 4.0 + t * 0.3;
    float radius = 0.25 + 0.08 * sin(t * 1.5 + fi);
    vec2 sparklePos = vec2(cos(angle), sin(angle)) * radius;

    float sparkSize = 0.015 + 0.008 * sin(t * 3.0 + fi * 0.7);
    sparkle = min(sparkle, sdCircle(p - sparklePos, sparkSize));
  }
  d = min(d, sparkle);

  // Noise organico per bordi irregolari (molto sottile)
  float edgeNoise = noise(p * 30.0 + t * 0.2) * 0.008;
  d += edgeNoise;

  return d;
}

// Palette colori freddi Ghibli
vec3 snowflakeColor(float t){
  t = clamp(t, 0.0, 1.0);

  // Colori ghiaccio cartoon
  vec3 deepIce = vec3(0.4, 0.65, 0.85);       // Azzurro scuro
  vec3 ice = vec3(0.55, 0.75, 0.95);          // Azzurro
  vec3 lightIce = vec3(0.7, 0.85, 1.0);       // Azzurro chiaro
  vec3 crystalBlue = vec3(0.85, 0.95, 1.0);   // Azzurro cristallino
  vec3 shimmer = vec3(0.95, 0.98, 1.0);       // Bianco shimmer

  vec3 col;
  if(t < 0.2){
    col = mix(deepIce, ice, t/0.2);
  }
  else if(t < 0.4){
    col = mix(ice, lightIce, (t-0.2)/0.2);
  }
  else if(t < 0.65){
    col = mix(lightIce, crystalBlue, (t-0.4)/0.25);
  }
  else{
    col = mix(crystalBlue, shimmer, (t-0.65)/0.35);
  }

  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;

  // Zoom per container rettangolare (più compatto)
  float aspectRatio = uRes.x / uRes.y;
  if(aspectRatio > 1.0){
    uv *= 1.35;  // Landscape
  } else {
    uv *= 1.45;  // Portrait
  }

  float t = uTime * 0.6;  // Rotazione lenta e delicata

  // Position - con breathing animation
  vec2 p = uv;

  // Gentle breathing (espansione/contrazione)
  float breath = 0.05 * sin(t * 1.2);
  p /= (1.0 + breath);

  // Rotazione del fiocco
  float rotation = t * 0.5 + uDrag.x * 3.14159;
  p = rot(rotation) * p;

  // Leggera oscillazione (floating)
  p.y += 0.02 * sin(t * 0.8);
  p.x += 0.015 * sin(t * 1.1);

  // Get distance
  float d = sdGhibliSnowflake(p, t);

  // Intensity field
  float intensity = smoothstep(0.03, -0.01, d);

  // Core brightness
  float core = smoothstep(0.08, -0.05, d);
  intensity = max(intensity, core);

  // Apply snowflake colors
  vec3 col = snowflakeColor(intensity);

  // Dark outline (anime style)
  float outline = smoothstep(0.012, 0.0, abs(d));
  col = mix(col, vec3(0.2, 0.35, 0.5), outline * 0.6);

  // Soft glow around snowflake
  float glow = exp(-4.0 * max(0.0, d));
  col += vec3(0.5, 0.7, 1.0) * glow * 0.25;

  // Sparkle highlights (Ghibli touch)
  float sparkleHighlight = pow(max(0.0, noise(p * 40.0 + t * 0.5)), 8.0);
  col += vec3(0.8, 0.9, 1.0) * sparkleHighlight * intensity * 0.4;

  // Cold ambient glow
  float ambientGlow = exp(-2.5 * length(uv));
  col += vec3(0.3, 0.5, 0.7) * ambientGlow * 0.15;

  // Vignette
  float vign = smoothstep(1.6, 0.3, length(uv));
  col *= 0.5 + 0.5 * vign;

  // Tone mapping
  col = col / (1.0 + col * 0.3);

  // Gamma
  col = pow(col, vec3(0.92));

  fragColor = vec4(col, 1.0);
}`;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const uniforms = {
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uDrag: gl.getUniformLocation(prog, 'uDrag')
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        console.log('Canvas resized to:', w, 'x', h, 'clientSize:', canvas.clientWidth, 'x', canvas.clientHeight);
      }
    }

    function handlePointerDown(e) {
      dragging = true; px = e.clientX; py = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }

    function handlePointerUp(e) {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    }

    function handlePointerMove(e) {
      if (!dragging) return;
      ax += (e.clientX - px) / canvas.clientWidth; px = e.clientX;
      ay += (e.clientY - py) / canvas.clientHeight; py = e.clientY;
      ay = Math.max(-0.45, Math.min(0.45, ay));
    }

    function animate() {
      resize();
      const t = (performance.now() - startTime) * 0.001;
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, t);
      gl.uniform2f(uniforms.uDrag, ax, ay);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationId = requestAnimationFrame(animate);
    }

    // Initial resize before starting animation
    resize();

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
    };
  }, [useShaderSnowflake, status]);

  // Shader-based Ghibli flame effect (WebGL2)
  useEffect(() => {
    if (!useShaderFlame) {
      console.log('Not using shader flame, status is:', status);
      return;
    }
    if (!shaderCanvasRef.current) {
      console.log('Canvas ref not ready yet for flame');
      return;
    }

    const canvas = shaderCanvasRef.current;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });

    if (!gl) {
      console.warn('WebGL2 not available for flame shader');
      setWebglError(true);
      return;
    }

    console.log('WebGL2 Ghibli flame shader initialized successfully');

    let animationId;
    let startTime = performance.now();
    let resizeObserver;

    // Vertex shader (fullscreen triangle)
    const vertexShaderSource = `#version 300 es
precision highp float;
void main(){
  vec2 v[3];
  v[0]=vec2(-1.0,-1.0); v[1]=vec2(3.0,-1.0); v[2]=vec2(-1.0,3.0);
  gl_Position = vec4(v[gl_VertexID],0.0,1.0);
}`;

    // Fragment shader (Calcifer from Howl's Moving Castle)
    const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform int   uFan;
uniform int   uPower;

// Simple hash
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

// Smooth value noise
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(hash21(i), hash21(i+vec2(1,0)), u.x),
    mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x),
    u.y
  );
}

// Calcifer body shape - cartoon fire with harmonious tongues
float sdCalcifer(vec2 p, float t, float fanSpeed){
  // Base body - larger and rounder for cartoon look
  float body = length(p - vec2(0.0, -0.15)) - 0.25;

  // Bottom roundness for droplet shape
  body = min(body, length(p - vec2(0.0, -0.25)) - 0.18);

  // 3 main flame tongues - cleaner cartoon look
  float tongues = 1000.0;

  for(int i=0; i<3; i++){
    float fi = float(i);

    // Spread tongues horizontally (left, center, right)
    float angle = (fi - 1.0) * 0.5;

    // Synchronized phase for more unified movement
    float phase = t * fanSpeed + fi * 2.0;

    // Lower height variation - more compact
    float heightVar = 0.25 + 0.08 * sin(phase);

    // Gentle sway - smooth and harmonious
    float sway = 0.04 * sin(phase * 1.3);

    // Tip position - much lower than before
    vec2 tipPos = vec2(angle * 0.3 + sway, 0.05 + heightVar);

    // Base position on body surface
    vec2 basePos = vec2(angle * 0.2, -0.05);

    vec2 toTip = tipPos - basePos;
    float tongueLen = length(toTip);
    vec2 tongueDir = toTip / tongueLen;

    // Project point onto tongue axis
    vec2 fromBase = p - basePos;
    float proj = dot(fromBase, tongueDir);
    proj = clamp(proj, 0.0, tongueLen);

    vec2 onAxis = basePos + tongueDir * proj;

    // Width tapering - smooth cartoon taper
    float normalizedPos = proj / tongueLen;
    float width = 0.12 * pow(1.0 - normalizedPos, 1.8);

    // Gentle wave motion - unified and smooth
    float wave = 0.020 * sin(proj * 8.0 - phase * 2.5);
    wave += 0.012 * sin(proj * 14.0 + phase * 3.5);

    // Distance to tongue
    float tongueDist = length(p - onAxis) - width - wave;

    tongues = min(tongues, tongueDist);
  }

  // Union con blend più morbido
  float d = min(body, tongues);

  // Smooth min per transizione naturale corpo->lingue
  float k = 0.10;
  float h = clamp(0.5 + 0.5*(body - tongues)/k, 0.0, 1.0);
  d = mix(body, tongues, h) - k*h*(1.0-h);

  // Noise organico per bordi irregolari
  float edgeNoise = noise(p * 20.0 + t * fanSpeed * 0.5) * 0.015;
  d += edgeNoise;

  return d;
}

// Calcifer color palette - warm orange/yellow (no white core)
vec3 calciferColor(float t){
  t = clamp(t, 0.0, 1.0);

  // Warm fire colors - no white, more orange/red
  vec3 deepRed = vec3(0.85, 0.15, 0.02);      // Outer - deep red
  vec3 darkOrange = vec3(1.1, 0.35, 0.05);    // Dark orange
  vec3 brightOrange = vec3(1.5, 0.55, 0.08);  // Bright orange
  vec3 golden = vec3(1.7, 0.85, 0.15);        // Golden
  vec3 warmYellow = vec3(1.9, 1.3, 0.35);     // Warm yellow (no white!)

  vec3 col;
  if(t < 0.15){
    col = mix(deepRed, darkOrange, t/0.15);
  }
  else if(t < 0.35){
    col = mix(darkOrange, brightOrange, (t-0.15)/0.2);
  }
  else if(t < 0.6){
    col = mix(brightOrange, golden, (t-0.35)/0.25);
  }
  else{
    col = mix(golden, warmYellow, (t-0.6)/0.4);
  }

  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;

  // Zoom per adattarsi al nuovo container rettangolare
  float aspectRatio = uRes.x / uRes.y;
  if(aspectRatio > 1.0){
    // Landscape: zoom per contenere in altezza
    uv *= 1.15;
  } else {
    // Portrait o quadrato: zoom normale
    uv *= 1.25;
  }

  float fan = float(clamp(uFan, 1, 6));
  float power = float(clamp(uPower, 1, 5));

  // Fan controls speed (0.5x to 2.5x)
  float fanSpeed = mix(0.5, 2.5, (fan-1.0)/5.0);

  // Power controls size (0.65x to 1.05x) - ulteriormente ridotto per nuovo container
  float powerScale = mix(0.65, 1.05, (power-1.0)/4.0);

  // Time
  float t = uTime * fanSpeed;

  // Position and scale
  vec2 p = uv;
  // Offset verticale dinamico: power alto = abbasso per centrare
  float verticalOffset = mix(0.12, 0.02, (power-1.0)/4.0);
  p.y += verticalOffset;
  p /= powerScale;

  // Breathing animation (Calcifer bounces) - ridotto
  float breath = 0.06 * sin(t * 2.0);
  p.y -= breath;
  p.x *= (1.0 + breath * 0.4);

  // Get distance to Calcifer
  float d = sdCalcifer(p, t, fanSpeed);

  // Create intensity field
  float intensity = smoothstep(0.04, -0.02, d);

  // Bright core
  float core = smoothstep(0.12, -0.08, d);
  intensity = max(intensity, core);

  // Apply Calcifer colors
  vec3 col = calciferColor(intensity);

  // Dark outline (anime style)
  float outline = smoothstep(0.015, 0.0, abs(d));
  col = mix(col, vec3(0.15, 0.08, 0.03), outline * 0.7);

  // Glow around Calcifer
  float glow = exp(-3.5 * max(0.0, d));
  col += vec3(1.0, 0.6, 0.2) * glow * 0.3;

  // Base glow (Calcifer sits on surface) - adattato
  float baseGlow = exp(-6.5 * length(uv - vec2(0.0, -0.4)));
  col += vec3(1.2, 0.5, 0.1) * baseGlow * 0.4;

  // Vignette - adattata al nuovo zoom
  float vign = smoothstep(1.5, 0.3, length(uv));
  col *= 0.4 + 0.6 * vign;

  // Tone mapping
  col = col / (1.0 + col * 0.4);

  // Gamma correction
  col = pow(col, vec3(0.9));

  fragColor = vec4(col, 1.0);
}`;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Flame shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Flame program error:', gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const uniforms = {
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uFan: gl.getUniformLocation(prog, 'uFan'),
      uPower: gl.getUniformLocation(prog, 'uPower')
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        console.log('Flame canvas resized to:', w, 'x', h);
      }
    }

    function animate() {
      resize();
      const t = (performance.now() - startTime) * 0.001;

      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, t);
      gl.uniform1i(uniforms.uFan, Math.max(1, Math.min(6, fanLevel || 3)));
      gl.uniform1i(uniforms.uPower, Math.max(1, Math.min(5, powerLevel || 3)));

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationId = requestAnimationFrame(animate);
    }

    resize();

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
    };
  }, [useShaderFlame, fanLevel, powerLevel, status]);

  // Shader-based Warning Fire for ERROR state (WebGL2)
  useEffect(() => {
    if (!useShaderError) {
      console.log('Not using shader error, status is:', status);
      return;
    }
    if (!shaderCanvasRef.current) {
      console.log('Canvas ref not ready yet for error');
      return;
    }

    const canvas = shaderCanvasRef.current;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });

    if (!gl) {
      console.warn('WebGL2 not available for error shader');
      setWebglError(true);
      return;
    }

    console.log('WebGL2 Warning Fire shader initialized successfully');

    let animationId;
    let startTime = performance.now();
    let resizeObserver;

    // Vertex shader (fullscreen triangle)
    const vertexShaderSource = `#version 300 es
precision highp float;
void main(){
  vec2 v[3];
  v[0]=vec2(-1.0,-1.0); v[1]=vec2(3.0,-1.0); v[2]=vec2(-1.0,3.0);
  gl_Position = vec4(v[gl_VertexID],0.0,1.0);
}`;

    // Fragment shader (Warning Fire - triangular danger flame)
    const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;

// Hash
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

// Noise
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(hash21(i), hash21(i+vec2(1,0)), u.x),
    mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x),
    u.y
  );
}

// Warning triangle flame shape
float sdWarningFlame(vec2 p, float t){
  // Base triangle (pointing up like warning sign)
  float y = p.y + 0.15; // Lower slightly
  float x = p.x;

  // Triangle base
  float triangleW = 0.5 * (1.0 - y*0.8);
  float triangleDist = max(abs(x) - triangleW, -y);

  // Top rounded
  if(y > 0.5){
    triangleDist = length(p - vec2(0.0, 0.35)) - 0.2;
  }

  // Add aggressive flame tongues on edges (3 per side)
  float tongues = 1000.0;

  for(int side=-1; side<=1; side+=2){
    for(int i=0; i<3; i++){
      float fi = float(i);
      float heightPos = mix(0.1, 0.5, fi/2.0);

      // Phase for animation
      float phase = t * 2.5 + fi * 1.5 + float(side) * 0.7;

      // Tongue extends outward from triangle edge
      float edgeX = triangleW * (1.0 - heightPos*0.8) * float(side);
      float tongueLen = 0.12 + 0.08 * sin(phase);
      float tongueW = 0.06 * (1.0 - fi/3.0);

      vec2 tongueBase = vec2(edgeX, heightPos - 0.15);
      float tongueAngle = float(side) * 0.5 + 0.3 * sin(phase * 1.3);

      vec2 tongueDir = vec2(cos(tongueAngle), sin(tongueAngle));
      vec2 fromBase = p - tongueBase;
      float along = dot(fromBase, tongueDir);
      along = clamp(along, 0.0, tongueLen);

      vec2 onTongue = tongueBase + tongueDir * along;
      float tongueDist = length(p - onTongue) - tongueW * (1.0 - along/tongueLen);

      // Add wave
      tongueDist -= 0.015 * sin(along * 12.0 - phase * 3.0);

      tongues = min(tongues, tongueDist);
    }
  }

  // Combine triangle and tongues
  float d = min(triangleDist, tongues);

  // Smooth blend
  float k = 0.06;
  float h = clamp(0.5 + 0.5*(triangleDist - tongues)/k, 0.0, 1.0);
  d = mix(triangleDist, tongues, h) - k*h*(1.0-h);

  // Edge noise
  d += noise(p * 15.0 + t * 1.5) * 0.012;

  return d;
}

// Warning color palette (red/orange/yellow)
vec3 warningColors(float t){
  t = clamp(t, 0.0, 1.0);

  // Danger colors
  vec3 darkRed = vec3(0.7, 0.1, 0.05);      // Deep red
  vec3 red = vec3(1.1, 0.2, 0.08);          // Red
  vec3 brightRed = vec3(1.4, 0.4, 0.1);     // Bright red-orange
  vec3 orange = vec3(1.7, 0.65, 0.12);      // Orange
  vec3 yellowAlert = vec3(1.9, 1.1, 0.25);  // Yellow alert

  vec3 col;
  if(t < 0.2){
    col = mix(darkRed, red, t/0.2);
  }
  else if(t < 0.4){
    col = mix(red, brightRed, (t-0.2)/0.2);
  }
  else if(t < 0.65){
    col = mix(brightRed, orange, (t-0.4)/0.25);
  }
  else{
    col = mix(orange, yellowAlert, (t-0.65)/0.35);
  }

  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;

  // Zoom per adattarsi al nuovo container rettangolare
  float aspectRatio = uRes.x / uRes.y;
  if(aspectRatio > 1.0){
    // Landscape: zoom per contenere in altezza
    uv *= 1.2;
  } else {
    // Portrait o quadrato: zoom normale
    uv *= 1.3;
  }

  float t = uTime * 1.2; // Faster animation for urgency

  // Position - adattato per nuovo container
  vec2 p = uv;
  p.y += 0.08;

  // Aggressive pulsing (warning feeling) - leggermente ridotto
  float pulse = 0.10 * sin(t * 3.5);
  p.y -= pulse * 0.5;
  p.x *= (1.0 + pulse);

  // Get distance
  float d = sdWarningFlame(p, t);

  // Intensity
  float intensity = smoothstep(0.05, -0.02, d);

  // Bright core
  float core = smoothstep(0.15, -0.08, d);
  intensity = max(intensity, core);

  // Apply warning colors
  vec3 col = warningColors(intensity);

  // Dark outline
  float outline = smoothstep(0.018, 0.0, abs(d));
  col = mix(col, vec3(0.15, 0.05, 0.02), outline * 0.8);

  // Pulsing glow (urgent)
  float glowPulse = 0.5 + 0.5 * sin(t * 4.0);
  float glow = exp(-4.0 * max(0.0, d)) * glowPulse;
  col += vec3(1.2, 0.3, 0.1) * glow * 0.4;

  // Base glow - adattato
  float baseGlow = exp(-7.5 * length(uv - vec2(0.0, -0.35)));
  col += vec3(1.3, 0.4, 0.1) * baseGlow * 0.5;

  // Vignette - adattata al nuovo zoom
  float vign = smoothstep(1.5, 0.3, length(uv));
  col *= 0.4 + 0.6 * vign;

  // Tone mapping
  col = col / (1.0 + col * 0.35);

  // Gamma
  col = pow(col, vec3(0.88));

  fragColor = vec4(col, 1.0);
}`;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Error program error:', gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const uniforms = {
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime')
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        console.log('Error canvas resized to:', w, 'x', h);
      }
    }

    function animate() {
      resize();
      const t = (performance.now() - startTime) * 0.001;

      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, t);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationId = requestAnimationFrame(animate);
    }

    resize();

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
    };
  }, [useShaderError, status]);

  // Three.js-based effects (fallback only)
  useEffect(() => {
    if (!useThreeJS || !containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup (zoom closer for larger objects)
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 3.5; // Closer camera = larger objects
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Create animation based on status
    createAnimation(scene, status, objectsRef);

    // Animation loop
    let time = 0;
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.016; // ~60fps

      updateAnimation(objectsRef.current, status, time);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Dispose all objects
      objectsRef.current.forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
        scene.remove(obj);
      });
      objectsRef.current = [];

      // Dispose renderer
      if (renderer && container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
    };
  }, [status, useThreeJS]);

  if (webglError && (useShaderSnowflake || useShaderFlame || useShaderError)) {
    // Fallback: show error message
    const fallbackIcon = useShaderError ? '⚠️' : (useShaderFlame ? '🔥' : '❄️');
    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="text-center text-xs text-white/40">
          <div className="text-4xl mb-2">{fallbackIcon}</div>
          <div>WebGL2 non disponibile</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full"
    >
      {(useShaderSnowflake || useShaderFlame || useShaderError) && (
        <canvas
          ref={shaderCanvasRef}
          className="w-full h-full touch-none"
          style={{ display: 'block' }}
        />
      )}
    </div>
  );
}

/**
 * Create animation objects based on status
 */
function createAnimation(scene, status, objectsRef) {
  const statusUpper = status.toUpperCase();
  const objects = [];

  if (statusUpper.includes('OFF')) {
    // SNOWFLAKE + COLD PARTICLES
    objects.push(...createSnowflake());
  } else if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) {
    // ERROR WARNING SIGNAL
    objects.push(...createErrorSignal());
  } else if (statusUpper.includes('START')) {
    // MODERATE FLAME
    objects.push(...createFlame(false));
  } else if (statusUpper.includes('WORK')) {
    // INTENSE FLAME
    objects.push(...createFlame(true));
  } else {
    // Default: moderate flame
    objects.push(...createFlame(false));
  }

  objectsRef.current = objects;
  objects.forEach(obj => scene.add(obj));
}

/**
 * Create rotating snowflake with cold particles
 * Uses advanced raymarching shader for realistic ice crystal appearance
 */
function createSnowflake() {
  const objects = [];

  // Use shader-based realistic snowflake instead of geometry
  // This will be rendered separately via WebGL2 canvas overlay
  // Mark with special type to use shader rendering
  const placeholder = new THREE.Group();
  placeholder.userData = { type: 'snowflake_shader' };
  objects.push(placeholder);

  return objects;
}

/**
 * Create error warning signal
 */
function createErrorSignal() {
  const objects = [];

  // Warning triangle outline
  const triangleShape = new THREE.Shape();
  const height = 1.2;
  const base = 1.0;

  triangleShape.moveTo(0, height / 2);
  triangleShape.lineTo(-base / 2, -height / 2);
  triangleShape.lineTo(base / 2, -height / 2);
  triangleShape.lineTo(0, height / 2);

  const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
  const triangleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3333,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
  triangle.userData = { type: 'error_triangle' };
  objects.push(triangle);

  // Triangle border (thicker outline)
  const borderGeometry = new THREE.BufferGeometry();
  const borderVertices = new Float32Array([
    0, height / 2, 0,
    -base / 2, -height / 2, 0,
    base / 2, -height / 2, 0,
    0, height / 2, 0,
  ]);
  borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));

  const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 3,
  });
  const border = new THREE.Line(borderGeometry, borderMaterial);
  border.userData = { type: 'error_border' };
  objects.push(border);

  // Exclamation mark - vertical bar
  const barGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.05);
  const exclMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1,
  });
  const bar = new THREE.Mesh(barGeometry, exclMaterial);
  bar.position.y = 0.05;
  bar.userData = { type: 'exclamation_bar' };
  objects.push(bar);

  // Exclamation mark - dot
  const dotGeometry = new THREE.CircleGeometry(0.06, 16);
  const dot = new THREE.Mesh(dotGeometry, exclMaterial);
  dot.position.y = -0.3;
  dot.userData = { type: 'exclamation_dot' };
  objects.push(dot);

  // Warning particles (flashing around)
  const particleCount = 30;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const lifetimes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const radius = 0.8 + Math.random() * 0.3;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

    lifetimes[i] = Math.random();
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff6600,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.userData = { type: 'error_particles' };
  objects.push(particles);

  return objects;
}

/**
 * Create animated flame
 * @param {boolean} intense - True for WORK state, false for START state
 */
function createFlame(intense) {
  const objects = [];

  const particleCount = intense ? 500 : 300;
  const baseColor = intense ?
    new THREE.Color(0xff3000) : // Red-orange for WORK
    new THREE.Color(0xff8800); // Orange for START

  // Main flame particles
  const flameGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const lifetimes = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Start particles at bottom in circular pattern
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.3;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = -1.5 + Math.random() * 0.3;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;

    // Velocity upward with variation
    const upwardSpeed = intense ? 0.04 : 0.03;
    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = upwardSpeed + Math.random() * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

    // Color gradient (red to yellow/orange)
    const colorMix = Math.random();
    if (intense) {
      // WORK: Red to orange
      colors[i * 3] = 1;
      colors[i * 3 + 1] = colorMix * 0.4;
      colors[i * 3 + 2] = 0;
    } else {
      // START: Orange to yellow
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + colorMix * 0.4;
      colors[i * 3 + 2] = colorMix * 0.1;
    }

    sizes[i] = intense ? 0.2 + Math.random() * 0.15 : 0.15 + Math.random() * 0.1;
    lifetimes[i] = Math.random();
  }

  flameGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  flameGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  flameGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  flameGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
  flameGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const flameMaterial = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: intense ? 0.95 : 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const flame = new THREE.Points(flameGeometry, flameMaterial);
  flame.userData = { type: 'flame', intense };
  objects.push(flame);

  // Core glow (more intense for WORK)
  if (intense) {
    const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.7,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = -0.3;
    glow.userData = { type: 'flame_glow' };
    objects.push(glow);
  }

  return objects;
}

/**
 * Update animation based on status
 */
function updateAnimation(objects, status, time) {
  objects.forEach(obj => {
    const type = obj.userData.type;

    // Snowflake animation now handled by WebGL2 shader (see useEffect above)
    if (type === 'snowflake_shader') {
      // No update needed - shader handles all animation
      return;
    }

    if (type === 'flame') {
      const positions = obj.geometry.attributes.position.array;
      const velocities = obj.geometry.attributes.velocity.array;
      const lifetimes = obj.geometry.attributes.lifetime.array;
      const intense = obj.userData.intense;
      const speed = intense ? 0.015 : 0.012;

      for (let i = 0; i < positions.length / 3; i++) {
        lifetimes[i] += speed;

        if (lifetimes[i] > 1) {
          // Reset particle
          lifetimes[i] = 0;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.3;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = -1.5;
          positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
        } else {
          // Move particle upward
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];

          // Add turbulence
          const turbulence = intense ? 0.015 : 0.01;
          positions[i * 3] += Math.sin(time * 3 + i * 0.1) * turbulence;
          positions[i * 3 + 2] += Math.cos(time * 3 + i * 0.1) * turbulence;

          // Narrow the flame as it rises
          const narrowingFactor = 1 - lifetimes[i] * 0.3;
          positions[i * 3] *= narrowingFactor;
          positions[i * 3 + 2] *= narrowingFactor;
        }
      }

      obj.geometry.attributes.position.needsUpdate = true;
      obj.geometry.attributes.lifetime.needsUpdate = true;

      // Flicker effect
      obj.material.opacity = (intense ? 0.95 : 0.85) + Math.sin(time * 5) * 0.05;
    }

    if (type === 'flame_glow') {
      // Pulsing glow effect
      const scale = 1 + Math.sin(time * 6) * 0.3;
      obj.scale.set(scale, scale, scale);
      obj.material.opacity = 0.5 + Math.sin(time * 6) * 0.2;
    }

    if (type === 'error_triangle') {
      // Pulsing triangle
      const scale = 1 + Math.sin(time * 4) * 0.15;
      obj.scale.set(scale, scale, scale);
      obj.material.opacity = 0.7 + Math.sin(time * 4) * 0.2;
    }

    if (type === 'error_border') {
      // Pulsing border
      const scale = 1 + Math.sin(time * 4) * 0.15;
      obj.scale.set(scale, scale, scale);
    }

    if (type === 'exclamation_bar' || type === 'exclamation_dot') {
      // Flashing exclamation mark
      obj.material.opacity = 0.6 + Math.sin(time * 6) * 0.4;
    }

    if (type === 'error_particles') {
      const positions = obj.geometry.attributes.position.array;
      const lifetimes = obj.geometry.attributes.lifetime.array;

      for (let i = 0; i < positions.length / 3; i++) {
        lifetimes[i] += 0.015;

        if (lifetimes[i] > 1) {
          lifetimes[i] = 0;
        }

        // Pulsing outward
        const angle = Math.atan2(positions[i * 3 + 1], positions[i * 3]);
        const baseRadius = 1.0;
        const radius = baseRadius + Math.sin(time * 3 + i) * 0.2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
      }

      obj.geometry.attributes.position.needsUpdate = true;
      obj.geometry.attributes.lifetime.needsUpdate = true;

      // Flashing opacity
      obj.material.opacity = 0.5 + Math.sin(time * 5) * 0.3;
    }
  });
}
