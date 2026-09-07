import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';

/**
 * Creates a strip geometry for a single 3D ribbon
 */
function createRibbonStripGeometry(segments = 110) {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const i2 = i * 2;

    uvs[i2 * 2] = 0;
    uvs[i2 * 2 + 1] = t;
    uvs[(i2 + 1) * 2] = 1;
    uvs[(i2 + 1) * 2 + 1] = t;

    if (i < segments) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      // Two triangles per quad segment
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

export const LiquidBackground3D = () => {
  const containerRef = useRef(null);
  const { settings } = useApp();
  const speedRef = useRef(settings.fluidSpeed);
  const glowRef = useRef(settings.glowIntensity);

  useEffect(() => {
    speedRef.current = settings.fluidSpeed;
    glowRef.current = settings.glowIntensity;
  }, [settings.fluidSpeed, settings.glowIntensity]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Central 3D Group holding all ribbon strands
    const group = new THREE.Group();
    scene.add(group);

    // Configuration for multiple colorful ribbon strands (madaming piraso na parang ribbon)
    const ribbonConfigs = [
      {
        color: 0x00f2fe, // Electric Cyan
        emissive: 0x012c3b,
        baseY: 1.6,
        baseZ: -0.6,
        rotZ: 0.16,
        width: 0.68,
        speed: 1.15,
        freq: 0.44,
        amp: 0.85,
        phase: 0.0,
        twistSpeed: 0.85,
        span: 17,
      },
      {
        color: 0xec4899, // Vivid Magenta / Hot Pink
        emissive: 0x3d0b21,
        baseY: 0.6,
        baseZ: 0.2,
        rotZ: -0.14,
        width: 0.62,
        speed: 1.35,
        freq: 0.52,
        amp: 0.95,
        phase: 1.7,
        twistSpeed: 1.05,
        span: 16,
      },
      {
        color: 0xa855f7, // Liquid Violet / Purple
        emissive: 0x240742,
        baseY: -0.5,
        baseZ: -0.4,
        rotZ: 0.12,
        width: 0.72,
        speed: 0.95,
        freq: 0.4,
        amp: 0.88,
        phase: 3.1,
        twistSpeed: 0.75,
        span: 18,
      },
      {
        color: 0x10b981, // Emerald Aqua
        emissive: 0x023021,
        baseY: -1.5,
        baseZ: -1.0,
        rotZ: -0.2,
        width: 0.58,
        speed: 1.25,
        freq: 0.48,
        amp: 0.82,
        phase: 4.6,
        twistSpeed: 0.92,
        span: 16,
      },
      {
        color: 0x38bdf8, // Bright Sky Blue
        emissive: 0x06283d,
        baseY: 2.6,
        baseZ: -1.4,
        rotZ: -0.12,
        width: 0.64,
        speed: 1.05,
        freq: 0.36,
        amp: 0.78,
        phase: 2.3,
        twistSpeed: 0.7,
        span: 19,
      },
      {
        color: 0xf59e0b, // Sunset Amber / Coral
        emissive: 0x3b1c02,
        baseY: -2.5,
        baseZ: -0.2,
        rotZ: 0.22,
        width: 0.54,
        speed: 1.45,
        freq: 0.56,
        amp: 0.88,
        phase: 5.4,
        twistSpeed: 1.15,
        span: 15,
      },
      {
        color: 0x6366f1, // Royal Indigo
        emissive: 0x141642,
        baseY: 0.05,
        baseZ: -1.8,
        rotZ: 0.06,
        width: 0.7,
        speed: 0.88,
        freq: 0.34,
        amp: 0.72,
        phase: 0.85,
        twistSpeed: 0.62,
        span: 20,
      },
    ];

    const ribbons = [];

    ribbonConfigs.forEach((cfg) => {
      const geo = createRibbonStripGeometry(110);
      const mat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.35,
        roughness: 0.16,
        metalness: 0.12,
        transmission: 0.65,
        thickness: 0.5,
        ior: 1.45,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        sheen: 1.0,
        sheenColor: new THREE.Color(cfg.color),
        sheenRoughness: 0.25,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = cfg.rotZ;
      group.add(mesh);

      ribbons.push({ mesh, geo, cfg });
    });

    // Responsive camera & scale fitter so multiple ribbons fit gracefully on all screens
    const updateCameraFit = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      camera.aspect = aspect;

      if (aspect < 1) {
        // Mobile portrait: scale group and position camera to fit the ribbons inside phone width
        const scale = Math.max(0.52, Math.min(0.78, aspect * 1.15));
        group.scale.set(scale, scale, scale);
        camera.position.z = 9.2;
      } else {
        group.scale.set(1, 1, 1);
        camera.position.z = 7.5;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    updateCameraFit();

    // Multi-color dynamic atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0x0a1128, 2.8);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x00f2fe, 5.0, 25);
    pointLightCyan.position.set(5, 4, 5);
    scene.add(pointLightCyan);

    const pointLightPink = new THREE.PointLight(0xec4899, 5.0, 25);
    pointLightPink.position.set(-5, -3, 4);
    scene.add(pointLightPink);

    const pointLightViolet = new THREE.PointLight(0xa855f7, 4.5, 22);
    pointLightViolet.position.set(0, -4, 3);
    scene.add(pointLightViolet);

    // Mouse & Touch tracking for gentle interactive parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = x * 0.35;
      targetY = y * 0.35;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -(touch.clientY / window.innerHeight) * 2 + 1;
        targetX = x * 0.25;
        targetY = y * 0.25;
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      updateCameraFit();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currentSpeed = speedRef.current;
      const currentGlow = glowRef.current;

      // Smooth interaction tilt
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      group.rotation.y = mouseX * 0.25;
      group.rotation.x = -mouseY * 0.25;

      const baseTime = elapsedTime * currentSpeed;

      // Animate each ribbon piece independently with dynamic waving & twisting physics
      ribbons.forEach(({ geo, cfg }) => {
        const posAttr = geo.attributes.position;
        const posArr = posAttr.array;
        const segments = 110;
        const tSpeed = baseTime * cfg.speed;

        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = (t - 0.5) * cfg.span;

          // Harmonic wavy center-line path
          const waveY =
            Math.sin(x * cfg.freq + tSpeed * 1.35 + cfg.phase) * cfg.amp +
            Math.cos(x * cfg.freq * 0.5 + tSpeed * 0.8) * 0.35;

          const waveZ =
            Math.cos(x * cfg.freq * 0.75 + tSpeed * 1.2 + cfg.phase) * (cfg.amp * 0.75);

          const centerY = cfg.baseY + waveY;
          const centerZ = cfg.baseZ + waveZ;

          // Ribbon 3D spiral twist
          const twistAngle = x * 0.38 + tSpeed * cfg.twistSpeed + cfg.phase;
          const cosA = Math.cos(twistAngle);
          const sinA = Math.sin(twistAngle);
          const halfW = cfg.width * 0.5;

          // Offset normal vector for ribbon width
          const offX = sinA * 0.15 * halfW;
          const offY = cosA * halfW;
          const offZ = sinA * halfW;

          const i2 = i * 2;
          const p1 = i2 * 3;
          const p2 = (i2 + 1) * 3;

          // Left ribbon edge
          posArr[p1] = x + offX;
          posArr[p1 + 1] = centerY + offY;
          posArr[p1 + 2] = centerZ + offZ;

          // Right ribbon edge
          posArr[p2] = x - offX;
          posArr[p2 + 1] = centerY - offY;
          posArr[p2 + 2] = centerZ - offZ;
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
      });

      // Pulse colorful lights along the ribbons
      pointLightCyan.intensity = 5.0 * currentGlow + Math.sin(elapsedTime * 1.8) * 1.2;
      pointLightPink.intensity = 5.0 * currentGlow + Math.cos(elapsedTime * 1.6) * 1.2;
      pointLightViolet.intensity = 4.5 * currentGlow + Math.sin(elapsedTime * 1.4) * 0.9;

      pointLightCyan.position.x = 5 + Math.sin(elapsedTime * 0.5) * 1.5;
      pointLightPink.position.y = -3 + Math.cos(elapsedTime * 0.6) * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      ribbons.forEach(({ geo, mesh }) => {
        geo.dispose();
        mesh.material.dispose();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="liquid-3d-bg"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.82,
        overflow: 'hidden',
        transition: 'opacity 0.4s ease',
      }}
    />
  );
};
