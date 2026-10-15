import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  title: string;
  description: string;
}

export const StatCard = ({ icon: Icon, value, title, description }: StatCardProps) => (
  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-[#333] transition-colors">
    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-4">
      <Icon size={18} className="text-[#d4a574]" />
    </div>
    <div className="text-[#d4a574] text-2xl font-bold mb-2">{value}</div>
    <div className="text-white font-medium text-sm mb-1">{title}</div>
    <div className="text-gray-500 text-xs leading-relaxed">{description}</div>
  </div>
);
