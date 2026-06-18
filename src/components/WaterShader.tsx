import { useEffect, useRef } from 'react';

const VS = `attribute vec2 a_position; void main(){ gl_Position = vec4(a_position,0.,1.); }`;

const FS = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_light;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float fbm(vec2 p){ float v=0.,a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.1+vec2(1.7,9.2); a*=0.5; } return v; }
  void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution; uv.y = 1.-uv.y;
    float t = u_time * 0.16;
    vec2 wuv = uv * vec2(3.2, 2.0);
    float w1 = fbm(wuv + vec2(t*0.7, t*0.4));
    float w2 = fbm(wuv + vec2(-t*0.5, t*0.6) + vec2(w1*0.6));
    float w3 = fbm(wuv + vec2(t*0.3, -t*0.3) + vec2(w2*0.5));
    float ripple = (sin(w1*8. + t*2.5)*0.5+0.5) * (sin(w2*6. - t*1.8)*0.5+0.5);
    vec3 deep  = mix(vec3(0.01,0.04,0.10), vec3(0.86,0.88,0.93), u_light);
    vec3 mid   = mix(vec3(0.03,0.08,0.18), vec3(0.90,0.92,0.96), u_light);
    vec3 light = mix(vec3(0.08,0.18,0.32), vec3(0.97,0.95,0.88), u_light);
    vec3 col = mix(deep, mid, w3);
    col = mix(col, light, ripple*0.35);
    float caustic = pow(ripple, 3.5) * 0.65;
    col += vec3(0.90,0.68,0.22) * caustic * (0.4 + 0.6*fbm(wuv*2.0 + vec2(t))) * (1.0 - u_light*0.5);
    col += vec3(0.1,0.25,0.5)  * exp(-8.0*length(uv-vec2(0.25,0.35))) * 0.35 * (0.5+0.5*sin(t*1.3));
    col += vec3(0.5,0.18,0.12) * exp(-10.0*length(uv-vec2(0.75,0.6)))  * 0.25 * (0.5+0.5*sin(t*1.7+1.0));
    col += vec3(0.8,0.65,0.2)  * exp(-12.0*length(uv-vec2(0.5,0.2)))   * 0.20 * (0.5+0.5*sin(t*2.1+2.0));
    float v = 1.0 - smoothstep(0.4, 1.2, length(uv-0.5)*1.6);
    col *= v*0.9 + 0.1;
    col = pow(clamp(col,0.,1.), vec3(0.85));
    gl_FragColor = vec4(col,1.);
  }`;

interface Props {
  /** 0 = oscuro, 1 = claro */
  light?: number;
}

/** Fondo WebGL animado (shader de agua con cáusticas doradas). */
export default function WaterShader({ light = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, 'u_time');
    const uR = gl.getUniformLocation(prog, 'u_resolution');
    const uL = gl.getUniformLocation(prog, 'u_light');

    const start = performance.now();
    let raf = 0;
    const tick = () => {
      gl.uniform1f(uT, (performance.now() - start) / 1000);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uL, light);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [light]);

  return <canvas ref={canvasRef} className="bg-canvas" />;
}
