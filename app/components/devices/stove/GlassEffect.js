'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * GlassEffect - WebGL frosted glass effect for data boxes
 * Creates a subtle animated transparency effect using WebGL shaders
 *
 * @param {Object} props
 * @param {string} props.bgColor - Background color as hex string (e.g., '#ff5500')
 * @param {number} props.opacity - Base opacity 0-1 (default: 0.15)
 */
export default function GlassEffect({ bgColor = '#ffffff', opacity = 0.15 }) {
  const canvasRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      console.warn('WebGL2 non disponibile per effetto vetro');
      setWebglError(true);
      return;
    }

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

    // Fragment shader (glassmorphism effect - più intenso)
    const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uColor;
uniform float uOpacity;

// Simple hash for noise
float hash21(vec2 p){
  return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);
}

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

// Frosted glass texture (più pronunciato)
float frostPattern(vec2 uv, float time){
  // Multi-scale noise for stronger frosted effect
  float n = 0.0;
  n += noise(uv * 6.0 + time * 0.08) * 0.6;
  n += noise(uv * 12.0 - time * 0.12) * 0.3;
  n += noise(uv * 24.0 + time * 0.06) * 0.15;
  n += noise(uv * 48.0 - time * 0.1) * 0.075;

  return n;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.25;

  // Get frost pattern (più intenso)
  float frost = frostPattern(uv * 3.5, t);

  // Subtle shimmer effect
  float shimmer = sin(uv.x * 8.0 + t * 1.2) * sin(uv.y * 8.0 - t * 1.2) * 0.05;

  // Distortion effect for glass refraction
  vec2 distortion = vec2(
    noise(uv * 15.0 + t * 0.1),
    noise(uv * 15.0 - t * 0.1)
  ) * 0.01;

  uv += distortion;

  // Combine with stronger alpha variation
  float alpha = uOpacity + frost * 0.08 + shimmer;
  alpha = clamp(alpha, 0.0, 1.0);

  // Apply color with transparency
  vec3 color = uColor;

  // More pronounced brightness variation for glass depth
  color *= 0.92 + frost * 0.16;

  // Add slight edge highlights (glass reflection)
  float edgeX = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x);
  float edgeY = smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
  float edge = min(edgeX, edgeY);
  color += vec3(1.0) * (1.0 - edge) * 0.08;

  fragColor = vec4(color, alpha);
}`;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Glass shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      setWebglError(true);
      return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Glass program error:', gl.getProgramInfoLog(prog));
      setWebglError(true);
      return;
    }

    gl.useProgram(prog);

    const uniforms = {
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uColor: gl.getUniformLocation(prog, 'uColor'),
      uOpacity: gl.getUniformLocation(prog, 'uOpacity')
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Parse color
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [1, 1, 1];
    };

    const colorRgb = hexToRgb(bgColor);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function animate() {
      resize();
      const t = (performance.now() - startTime) * 0.001;

      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, t);
      gl.uniform3f(uniforms.uColor, colorRgb[0], colorRgb[1], colorRgb[2]);
      gl.uniform1f(uniforms.uOpacity, opacity);

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
  }, [bgColor, opacity]);

  if (webglError) {
    // Fallback CSS
    return (
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          backgroundColor: bgColor,
          opacity: opacity
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
