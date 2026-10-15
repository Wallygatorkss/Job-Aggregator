type GlassCardProps = {
  title: string;
  description: string;
  tag?: string;
};

function GlassCard({ title, description, tag }: GlassCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
      {tag ? (
        <span className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-white/40">
          {tag}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  );
}

export default GlassCard;
