function Search() {
  return (
    <div className="futuristic-surface w-full max-w-4xl rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-iris">Smart Search</p>
          <h2 className="text-xl font-bold text-deepIris">Trouve ton prochain job en quelques secondes</h2>
        </div>
        <span className="rounded-full border border-mint/70 bg-mint/30 px-3 py-1 text-xs font-semibold text-deepIris">
          IA Assistée
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Rechercher un poste, une compétence..."
          className="w-full rounded-2xl border border-iris/25 bg-white px-4 py-3 text-sm text-deepIris outline-none transition placeholder:text-iris/70 focus:border-ultraViolet focus:ring-2 focus:ring-ultraViolet/25"
        />
        <button className="rounded-2xl bg-gradient-to-r from-ultraViolet to-purple-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ultraViolet/25 transition hover:brightness-110">
          Rechercher
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-iceBlue/40 bg-iceBlue/20 px-3 py-1 text-xs font-semibold text-deepIris">Remote</span>
        <span className="rounded-full border border-mint/50 bg-mint/25 px-3 py-1 text-xs font-semibold text-deepIris">CDI</span>
        <span className="rounded-full border border-roseMist/60 bg-roseMist/35 px-3 py-1 text-xs font-semibold text-deepIris">React / TypeScript</span>
        <span className="rounded-full border border-peach/70 bg-peach/35 px-3 py-1 text-xs font-semibold text-deepIris">Montpellier</span>
      </div>
    </div>
  )
}

export default Search