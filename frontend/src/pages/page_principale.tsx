import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Offers from '../components/offers'
import Detail from '../components/detail'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/useAuth'
function PagePrincipale() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, role, clearSession } = useAuth()
  const resolvedRole = role ?? 'USER'
  const initialOfferId = searchParams.get('offerId')
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(initialOfferId)
  const [totalOffers, setTotalOffers] = useState<number | null>(null)
  const [displayedCount, setDisplayedCount] = useState<number | null>(null)
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)
  const [q, setQ] = useState<string | undefined>(undefined)
  const [locationFilter, setLocationFilter] = useState<string[] | undefined>(undefined)
  const [salaryMin, setSalaryMin] = useState<number | null | undefined>(undefined)
  const [salaryMax, setSalaryMax] = useState<number | null | undefined>(undefined)
  const [experience, setExperience] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState<string | undefined>(undefined)
  const [contractTypes, setContractTypes] = useState<string[] | undefined>(undefined)


  const params = useMemo(() => ({ q, locations: locationFilter, contractTypes, salaryMin, salaryMax, experience, sort }), [q, locationFilter, contractTypes, salaryMin, salaryMax, experience, sort]);

  const location = useLocation();

  useEffect(() => {
    const stateOfferId = (location.state as any)?.offerId as string | undefined;
    const sp = new URLSearchParams(location.search);
    const qOffer = stateOfferId ?? sp.get('offerId');
    if (!qOffer) return;

    const timer = window.setTimeout(() => {
      setSelectedOfferId(qOffer);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <div className="relative min-h-screen bg-[#0b0d10] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70 z-0">
        <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-[#f6d889]/10 blur-3xl" />
        <div className="absolute right-[-5%] top-40 h-96 w-96 rounded-full bg-[#f6d889]/5 blur-[120px]" />
        <div className="absolute right-10 top-[30rem] h-40 w-40 rounded-full bg-[#f6d889]/10 blur-3xl" />
      </div>
      <div className="gold-particles pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 min-h-screen">
        <Sidebar />

  <main className="min-h-screen flex h-screen flex-col px-8 py-8 lg:pl-[120px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-full border border-white/10 bg-[#121318]/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/70">
                {isAuthenticated ? `Connecté · ${resolvedRole}` : 'Mode invité'}
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={clearSession}
                    className="rounded-full border border-white/10 bg-[#121318]/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#d8b25e]/40 hover:text-white"
                  >
                    Se déconnecter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="rounded-full border border-[#d8b25e]/40 bg-[#1a1a1a] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#f6d889] transition hover:bg-[#222] hover:text-white"
                  >
                    Se connecter
                  </button>
                )}
              </div>
            </div>

            <PageHeader total={totalOffers} displayed={displayedCount ?? undefined} collapsed={headerCollapsed} onSearch={(s) => setQ(s)} />
          </div>
            
          <section className="grid gap-8 lg:grid-cols-12 flex-1 min-h-0">
            <div className="lg:col-span-5 flex min-h-0">
              <div className="flex w-full flex-col min-h-0">
                <Offers
                selectedOfferId={selectedOfferId}
                onSelectOffer={setSelectedOfferId}
                  params={params}
                  onFilterChange={(idx) => {
                    console.log('filter clicked', idx)
                  }}
                  onLocationSelect={(locs) => setLocationFilter(locs)}
                  onContractChange={(types) => setContractTypes(types)}
                  onSalaryChange={(min, max) => {
                    setSalaryMin(min ?? undefined);
                    setSalaryMax(max ?? undefined);
                  }}
                  onExperienceSelect={(lvl) => setExperience(lvl)}
                  onSortChange={(s) => setSort(s)}
                  onOfferUpdated={() => setDetailRefreshKey((k) => k + 1)}
                  onTotal={(t) => setTotalOffers(t)}
                  onDisplayedCount={(c) => setDisplayedCount(c)}
                  onHeaderCollapseChange={(c) => setHeaderCollapsed(c)}
                  onFirstOffer={(id) => {
                  setSelectedOfferId((cur) => cur ?? id);
                }}
                />
              </div>
            </div>
            <div className="lg:col-span-7 flex min-h-0">
              <div className="flex w-full flex-col min-h-0">
                <Detail selectedOfferId={selectedOfferId} onHeaderCollapseChange={(c) => setHeaderCollapsed(c)} refreshKey={detailRefreshKey} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default PagePrincipale
