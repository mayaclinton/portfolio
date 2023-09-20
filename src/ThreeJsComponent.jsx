import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const ThreeJsComponent = () => {
  const canvasRef = useRef();

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    const controls = new OrbitControls(camera, canvasRef.current);

    // Sphere Geometry
const geometry = new THREE.SphereGeometry(1, 512, 512);

// Material (ShaderMaterial)
const material = new THREE.ShaderMaterial({
  vertexShader: `
    
    uniform float uTime;
    uniform vec2 uMouse;

    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vNormal;

   //	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

//color conv

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
    void main(){

        float noise = snoise(position * 20. + (uTime * 0.1));
        vec3 newPosition = position * (noise + 0.5);



    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);


        vUv = uv;
        vColor = hsv2rgb(vec3(noise * 0.1 + (uTime*0.05) , 0.8, 0.8));
        vNormal = normal;
    }

    `,
 fragmentShader: `
         
     uniform vec2 uMouse;
     
    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vNormal;

    
    void main(){
         
        vec3 color = mix(vNormal, vColor, vec3(vUv,1.));

        gl_FragColor = vec4(color,1.0);
    }
    
    `,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
  },
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Particles
const count = 5000;
const positionArray = new Float32Array(count * 3);

// ... (rest of your particle generation code)

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));

// Particle Material (ShaderMaterial)
const particleMat = new THREE.ShaderMaterial({
  vertexShader: `
    
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uSize;
    uniform float uPixelRatio;

    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vNormal;

    void main(){

      vec3 p = position;
      p.y += 0.1 * (sin(p.y * 10. + uTime * 1.5) * 0.5 + 0.5);
      p.x += 0.1 * (cos(p.x * 10. + uTime * 1.5) * 0.5 + 0.5);
      // p.z += 0.1 * (sin(p.x * 10. + uTime) * 0.5 + 0.5);




      vec4 modelPosition = modelViewMatrix * vec4(p, 1.0);

      gl_PointSize = uSize * uPixelRatio;
      gl_PointSize *= (1.0 / -modelPosition.z);

    gl_Position = projectionMatrix * modelPosition ;

        vUv = uv;
        vNormal = normal;
    }

    `,
 fragmentShader: `
         
     uniform vec2 uMouse;
    uniform float uTime;

     
    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vNormal;

    
    void main(){
         

       
        gl_FragColor = vec4(0.62f, 0.86f, 1.0f, 0.77f);
    }
    
    `,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uSize: { value: 0.5 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
});

const points = new THREE.Points(particleGeo, particleMat);
scene.add(points);

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

    // Animation loop
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // ... (rest of your animation code)

      // Render
      renderer.render(scene, camera);

      // Call animate again on the next frame
      requestAnimationFrame(animate);
    };

    // Start the animation loop
    animate();

    // Handle window resizing
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      sizes.width = innerWidth;
      sizes.height = innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl" />;
};

export default ThreeJsComponent;
