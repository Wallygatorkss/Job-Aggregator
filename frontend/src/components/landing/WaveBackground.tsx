import { useEffect, useState } from 'react';
import { FloatingParticles } from './FloatingParticles';

export const WaveBackground = () => {
  const [dots, setDots] = useState<Array<{ id: number; cx: number; cy: number; r: number; opacity: number }>>([]);

  useEffect(() => {
    const list = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      cx: 400 + (i % 10) * 45 + Math.random() * 20,
      cy: 100 + Math.floor(i / 10) * 80 + Math.random() * 40,
      r: Math.random() * 1.5 + 0.5,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    const raf = requestAnimationFrame(() => setDots(list));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute right-0 top-0 w-full md:w-3/5 h-full overflow-hidden pointer-events-none">
      <svg viewBox="0 0 900 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#d4a574" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#f5e6d3" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f5e6d3" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4a574" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#d4a574" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f5e6d3" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="glow1" cx="70%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#f5e6d3" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow areas */}
        <ellipse cx="650" cy="200" rx="300" ry="200" fill="url(#glow1)" />
        <ellipse cx="750" cy="400" rx="250" ry="180" fill="url(#glow1)" opacity="0.6" />

        {/* Main flowing wave lines */}
        {Array.from({ length: 35 }, (_, i) => {
          const yBase = 30 + i * 18;
          const amplitude = 40 + (i % 3) * 20;
          return (
            <path
              key={`main-${i}`}
              d={`M 150 ${yBase} Q ${300 + i * 5} ${yBase - amplitude} ${450 + i * 3} ${yBase} T ${750 + i * 2} ${yBase + amplitude / 2} T 900 ${yBase}`}
              fill="none"
              stroke={i % 3 === 0 ? "url(#waveGrad1)" : "#d4a574"}
              strokeWidth={0.3 + (i % 5) * 0.15}
              opacity={0.15 + (i / 70)}
            />
          );
        })}

        {/* Secondary wave layers */}
        {Array.from({ length: 25 }, (_, i) => {
          const yBase = 80 + i * 22;
          return (
            <path
              key={`sec-${i}`}
              d={`M 250 ${yBase} Q ${400} ${yBase - 30} ${550} ${yBase} T ${750} ${yBase + 20} T 900 ${yBase - 10}`}
              fill="none"
              stroke="#f5e6d3"
              strokeWidth={0.2 + (i % 4) * 0.1}
              opacity={0.1 + (i / 80)}
            />
          );
        })}

        {/* Bright accent lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={`bright-${i}`}
            d={`M ${300 + i * 30} ${50 + i * 60} Q ${500 + i * 20} ${20 + i * 60} ${700 + i * 15} ${60 + i * 60}`}
            fill="none"
            stroke="#f5e6d3"
            strokeWidth="1"
            opacity={0.4 + (i / 20)}
          />
        ))}

        {/* Small dot clusters along paths */}
        {dots.map((d) => (
          <circle key={`dot-${d.id}`} cx={d.cx} cy={d.cy} r={d.r} fill="#f5e6d3" opacity={d.opacity} />
        ))}
      </svg>
      <FloatingParticles />
    </div>
  );
};
