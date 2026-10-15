import { useEffect, useState } from 'react';

export const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number; opacity: number }>>([]);

  useEffect(() => {
    const list = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 8,
      duration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    const raf = requestAnimationFrame(() => setParticles(list));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.size > 2 ? '#f5e6d3' : '#d4a574',
            opacity: p.opacity,
            animation: `pulse ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: p.size > 2 ? `0 0 ${p.size * 2}px ${p.size}px rgba(212, 165, 116, 0.3)` : 'none',
          }}
        />
      ))}
    </div>
  );
};
