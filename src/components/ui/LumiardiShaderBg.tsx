'use client';

import React, { useEffect, useRef } from 'react';

export interface LumiardiShaderBgProps {
  className?: string;
}

export const LumiardiShaderBg: React.FC<LumiardiShaderBgProps> = ({ className = 'w-full h-full' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl', {
      powerPreference: 'high-performance',
      alpha: true,
      antialias: false, // Desabilitado para shaders 2D de tela cheia (ganho de 30% em GPU)
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let animationFrameId: number;
    let isVisible = true;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p.x * 43758.5453123) * fract(p.y * 22578.1459));
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution;
        
        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.04 * u_time);
        q.y = fbm(st + vec2(2.5, 1.3));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.1 * q + vec2(1.7, 9.2) + 0.06 * u_time + mouse.x * 0.08);
        r.y = fbm(st + 1.1 * q + vec2(8.3, 2.8) + 0.05 * u_time + mouse.y * 0.08);

        float f = fbm(st + r * 1.0);

        vec3 colorBg = vec3(0.05, 0.04, 0.03);
        vec3 colorBronze = vec3(0.60, 0.42, 0.24);
        vec3 colorGold = vec3(0.78, 0.64, 0.38);
        vec3 colorGoldBright = vec3(0.90, 0.78, 0.48);
        vec3 colorIvory = vec3(0.96, 0.94, 0.90);

        vec3 col = mix(colorBg, colorBronze, clamp(f * 2.0, 0.0, 1.0));
        col = mix(col, colorGold, clamp(length(q) * 1.1, 0.0, 1.0));
        col = mix(col, colorGoldBright, clamp(length(r.x) * 0.75, 0.0, 1.0));
        col = mix(col, colorIvory, clamp(f * r.y * 0.4, 0.0, 0.35));

        float mouseDist = length(st - mouse);
        float mouseLight = smoothstep(0.45, 0.0, mouseDist);
        col += colorGold * mouseLight * 0.08;

        float dist = distance(st, vec2(0.5));
        col *= smoothstep(1.1, 0.3, dist);

        float grain = (hash(st * u_time * 4.0) - 0.5) * 0.02;
        col += grain;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function createShader(glContext: WebGLRenderingContext, type: number, source: string) {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = window.innerHeight - e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const resizeCanvas = () => {
      if (!canvas) return;
      const isMobile = window.innerWidth < 768;
      // Em mobile, DPR de 0.85 a 1.0 garante fluidez absoluta de 60fps sem consumo excessivo de bateria
      const dpr = isMobile ? 0.9 : Math.min(window.devicePixelRatio || 1, 1.2);
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) return;

      resizeCanvas();

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, (time - startTime) * 0.001);
      gl.uniform2f(mouseUniformLocation, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    // IntersectionObserver: pausa o loop quando o elemento sai da tela
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(container);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
      />
    </div>
  );
};
