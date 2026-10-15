import React from 'react';

interface StatBadgeProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
}

export const StatBadge = ({ icon: Icon, value, label }: StatBadgeProps) => (
  <div className="flex items-center gap-3 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#333] rounded-xl px-4 py-3">
    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
      <Icon size={18} className="text-[#d4a574]" />
    </div>
    <div>
      <div className="text-white font-bold text-lg">{value}</div>
      <div className="text-gray-400 text-xs">{label}</div>
    </div>
  </div>
);
