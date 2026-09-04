import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';

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
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Floating Prisms & Liquid Spheres
    const group = new THREE.Group();
    scene.add(group);

    // 1. Organic Fluid Liquid Torus Knot Mesh
    const knotGeo = new THREE.TorusKnotGeometry(2.2, 0.65, 128, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      emissive: 0x1d1147,
      roughness: 0.15,
      metalness: 0.2,
      transmission: 0.9,
      ior: 1.45,
      thickness: 1.2,
      specularColor: 0xa855f7,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });
    const liquidMesh = new THREE.Mesh(knotGeo, knotMat);
    group.add(liquidMesh);

    // 2. Floating Iridescent Diamond Prisms
    const prismCount = 18;
    const prisms = [];
    const octaGeo = new THREE.OctahedronGeometry(0.35, 0);
    const icosaGeo = new THREE.IcosahedronGeometry(0.25, 0);

    const prismMat1 = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.5,
      transparent: true,
      opacity: 0.7,
    });

    const prismMat2 = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.5,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < prismCount; i++) {
      const geo = i % 2 === 0 ? octaGeo : icosaGeo;
      const mat = i % 2 === 0 ? prismMat1 : prismMat2;
      const mesh = new THREE.Mesh(geo, mat);
      
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 1
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const rotSpeed = {
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.5) * 0.015,
      };

      const floatSpeed = 0.001 + Math.random() * 0.002;
      const initialY = mesh.position.y;

      prisms.push({ mesh, rotSpeed, floatSpeed, initialY });
      group.add(mesh);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a1026, 2.5);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x00f2fe, 5, 20);
    pointLightCyan.position.set(4, 3, 4);
    scene.add(pointLightCyan);

    const pointLightViolet = new THREE.PointLight(0xa855f7, 5, 20);
    pointLightViolet.position.set(-4, -3, 3);
    scene.add(pointLightViolet);

    const pointLightEmerald = new THREE.PointLight(0x10b981, 3, 15);
    pointLightEmerald.position.set(0, 4, -2);
    scene.add(pointLightEmerald);

    // Mouse Tracking for dynamic responsiveness
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = x * 0.6;
      targetY = y * 0.6;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currentSpeed = speedRef.current;
      const currentGlow = glowRef.current;

      // Smooth camera / group tilt with mouse
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      group.rotation.y = mouseX * 0.4;
      group.rotation.x = -mouseY * 0.4;

      // Rotate central fluid mesh
      liquidMesh.rotation.x = elapsedTime * 0.22 * currentSpeed;
      liquidMesh.rotation.y = elapsedTime * 0.28 * currentSpeed;

      // Animate lights with pulsing intensities
      pointLightCyan.intensity = 5 * currentGlow + Math.sin(elapsedTime * 2) * 1.2;
      pointLightViolet.intensity = 5 * currentGlow + Math.cos(elapsedTime * 1.8) * 1.2;
      pointLightCyan.position.x = 4 + Math.sin(elapsedTime * 0.6) * 1.5;
      pointLightViolet.position.y = -3 + Math.cos(elapsedTime * 0.8) * 1.5;

      // Animate floating prisms
      prisms.forEach((p, idx) => {
        p.mesh.rotation.x += p.rotSpeed.x * currentSpeed;
        p.mesh.rotation.y += p.rotSpeed.y * currentSpeed;
        p.mesh.rotation.z += p.rotSpeed.z * currentSpeed;
        p.mesh.position.y = p.initialY + Math.sin(elapsedTime * 1.2 + idx) * 0.35;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
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
