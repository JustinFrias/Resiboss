import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

export const TiltCard = ({ children, className = '', style = {}, maxRotation = 3, scale = 1.005, onClick }) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const { settings } = useApp();

  const handleMouseMove = (e) => {
    if (!settings.enable3DTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * maxRotation;
    const rotateY = ((x - centerX) / centerX) * maxRotation;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transform: settings.enable3DTilt ? transform : 'none',
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
        position: 'relative',
      }}
    >
      {children}
      {settings.enable3DTilt && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.4), transparent 60%)`,
            opacity: glare.opacity,
            transition: 'opacity 0.2s ease',
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
};
