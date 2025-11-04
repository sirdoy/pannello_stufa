'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * GlassEffect - Optimized WebGL liquid glass effect
 *
 * Effetto vetro liquido ultra-leggero che funziona con qualsiasi contenuto sottostante.
 * Utilizza CSS backdrop-filter per il blur e WebGL solo per pattern frost animato.
 *
 * @param {Object} props
 * @param {string} props.bgColor - Background color as hex string (default: '#ffffff')
 * @param {number} props.opacity - Base opacity 0-1 (default: 0.15)
 */
export default function GlassEffect({
  bgColor = '#ffffff',
  opacity = 0.15
}) {
  const canvasRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false, // Disabilita per performance
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      stencil: false
    });

    if (!gl) {
      setWebglError(true);
      return;
    }

    // Abilita blending per trasparenza
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let animationId;
    let startTime = performance.now();
    let resizeObserver;

    // Vertex shader - fullscreen quad
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader - ottimizzato per performance
    const fragmentShaderSource = `
      precision mediump float;

      uniform vec2 uRes;
      uniform float uTime;

      // Hash semplificato per noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Noise ottimizzato
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      // Frost pattern semplificato (3 ottave invece di 4)
      float frost(vec2 uv, float time) {
        float n = 0.0;
        n += noise(uv * 6.0 + time * 0.08) * 0.6;
        n += noise(uv * 12.0 - time * 0.12) * 0.3;
        n += noise(uv * 24.0 + time * 0.06) * 0.1;
        return n;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;

        // Frost pattern animato
        float frostValue = frost(uv * 4.0, uTime * 0.25);

        // Bianco puro per effetto glass (non usa bgColor!)
        vec3 color = vec3(1.0);

        // Shimmer impercettibile
        float shimmer = sin(uv.x * 10.0 + uTime) * sin(uv.y * 10.0 - uTime) * 0.005;

        // Alpha basata solo sul frost pattern
        // Questa è SOLO texture, non colore di sfondo
        float alpha = frostValue * 0.03;

        gl_FragColor = vec4(color, alpha);
      }
    `;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('GlassEffect shader error:', gl.getShaderInfoLog(shader));
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

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('GlassEffect program error:', gl.getProgramInfoLog(program));
      setWebglError(true);
      return;
    }

    gl.useProgram(program);

    // Setup fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const uniforms = {
      resolution: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime')
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (w === 0 || h === 0) return;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function animate() {
      resize();
      const currentTime = (performance.now() - startTime) * 0.001;

      // Clear con alpha 0
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, currentTime);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(animate);
    }

    // Forza resize iniziale
    requestAnimationFrame(() => {
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      animate();
    });

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

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
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        mixBlendMode: 'overlay',
        opacity: 0.15
      }}
    />
  );
}
