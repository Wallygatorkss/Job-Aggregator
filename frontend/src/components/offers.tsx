import { useRef, useCallback } from "react";
import CardOffer from "./card-offer";
import FiltersBar from "./FiltersBar";
import { useOffers, type OfferApiItem } from "../hook/useOffers";

import type { OfferQueryParams } from "../hook/useOffers";

type OffersProps = {
  selectedOfferId: string | null;
  onSelectOffer: (id: string) => void;
  onTotal?: (total: number | null) => void;
  onFirstOffer?: (id: string) => void;
  onDisplayedCount?: (count: number) => void;
  onHeaderCollapseChange?: (collapsed: boolean) => void;
  params?: OfferQueryParams;
  onFilterChange?: (filterIndex: number) => void;
  onLocationSelect?: (locations?: string[]) => void;
  onContractChange?: (types?: string[]) => void;
  onSalaryChange?: (min?: number | null, max?: number | null) => void;
  onExperienceSelect?: (level?: string) => void;
  onSortChange?: (sort?: string) => void;
  onOfferUpdated?: () => void;
};

function Offers({ selectedOfferId, onSelectOffer, onTotal, onFirstOffer, onDisplayedCount, onHeaderCollapseChange, params, onFilterChange, onLocationSelect, onContractChange, onSalaryChange, onExperienceSelect, onSortChange, onOfferUpdated }: OffersProps) {
  const { offers, loading, fetchOffers, hasMore, total, removeOffer, patchOffer } = useOffers(params);

  if (typeof onTotal === 'function' && total !== null) {
    onTotal(total);
  }

  if (offers.length > 0 && typeof onFirstOffer === 'function' && !selectedOfferId) {
    onFirstOffer(offers[0].id);
  }

  if (typeof onDisplayedCount === 'function') {
    onDisplayedCount(offers.length);
  }

  const listRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const collapsed = target.scrollTop > 10;
    if (typeof onHeaderCollapseChange === 'function') {
      onHeaderCollapseChange(collapsed);
    }
  }, [onHeaderCollapseChange]);

  return (
    <section className="flex h-full w-full flex-col gap-5">
  <FiltersBar onFilterChange={onFilterChange} onLocationSelect={onLocationSelect} onContractChange={onContractChange} onSalaryChange={onSalaryChange} onExperienceSelect={onExperienceSelect} onSortChange={onSortChange} />
  <div ref={listRef} onScroll={handleScroll} className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
  {offers.map((offer: OfferApiItem) => (
          <CardOffer
            key={offer.id}
            {...offer}
            isSelected={selectedOfferId === offer.id}
            onSelect={onSelectOffer}
            onDeleted={removeOffer}
            onUpdated={(id, patch) => { patchOffer(id, patch); onOfferUpdated?.(); }}
          />
        ))}
        {loading && offers.length > 0 && (
          <div className="py-4 text-center text-sm text-gray-500">Chargement…</div>
        )}

        {!hasMore && offers.length === 0 && !loading && (
          <div className="py-4 text-center text-sm text-gray-500">Aucune offre trouvée</div>
        )}

        {/* Charger plus button */}
        <div className="mt-2 flex items-center justify-center">
          {hasMore ? (
            <button
              className="rounded-md bg-[#f6d889] px-4 py-2 text-sm font-semibold text-[#1a1203] hover:opacity-90 disabled:opacity-60"
              onClick={() => fetchOffers()}
              disabled={loading}
            >
              {loading ? "Chargement..." : "Charger plus"}
            </button>
          ) : (
            offers.length > 0 && (
              <div className="py-4 text-center text-sm text-gray-500">Plus d'offres</div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default Offers
