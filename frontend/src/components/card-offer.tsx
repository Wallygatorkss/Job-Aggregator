import { useEffect, useState } from 'react';
import { Bookmark, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { formatContractType } from '../utils/contractTypes';
import { isOfferSaved, toggleSavedOffer, createSavedOfferAsync, deleteSavedOfferAsync } from '../utils/savedOffers';

const API = 'http://localhost:3000';

export type CardOfferProps = {
  id: string;
  title: string;
  small_company?: { company_name?: string | null; fallback_gallery_url?: string | null } | null;
  details?: { salary_min?: number | null; salary_max?: number | null } | null;
  contract_types?: { contract_type?: string | null }[];
  formatted_places?: { place?: string | null }[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, patch: { title?: string; company_name?: string; place?: string; contract_type?: string }) => void;
};

const DB_CONTRACT_OPTIONS: Record<string, string> = {
  'CDI': 'permanent', 'CDD': 'fixedTerm', 'Stage': 'internship',
  'Alternance': 'apprenticeship', 'Temps partiel': 'partTime', 'Freelance': 'freelance',
};

const REMOTE_OPTIONS = ['Non précisé', 'full_remote', 'partial_remote', 'no_remote'];
const REMOTE_LABELS: Record<string, string> = {
  'Non précisé': 'Non précisé', 'full_remote': 'Full remote', 'partial_remote': 'Hybride', 'no_remote': 'Présentiel',
};

const getCompanyInitial = (name?: string | null) => (!name ? '?' : name.trim().slice(0, 2).toUpperCase());

type EditForm = {
  title: string;
  company_name: string;
  contract_type: string;
  place: string;
  salary_min: string;
  salary_max: string;
  accept_remote: string;
  description_preview: string;
};

function ConfirmModal({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-red-500/30 bg-[#111217] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/60">{message}</p>
        </div>
        <div className="flex border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border-r border-white/10 px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/5 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ form, setForm, onSave, onClose, saving, error }: {
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm>>;
  onSave: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const field = (label: string, child: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{label}</label>
      <div className="mt-1">{child}</div>
      {hint && <p className="mt-1 text-[11px] text-white/30">{hint}</p>}
    </div>
  );

  const input = (key: keyof EditForm, type = 'text', placeholder = '') => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/20 transition focus:border-[#58A6FF] focus:outline-none"
    />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Administration</p>
            <h3 className="mt-0.5 text-lg font-semibold text-white">Modifier l'offre</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:border-white/20 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form id="edit-offer-form" onSubmit={onSave} className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            {/* Section — Identité */}
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">Identité</p>
            {field('Titre du poste', input('title', 'text', 'Ex: Développeur Full-Stack'))}
            {field('Entreprise', input('company_name', 'text', 'Nom de l\'entreprise'))}

            {/* Section — Conditions */}
            <div className="h-px bg-white/10" />
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">Conditions</p>

            <div className="grid grid-cols-2 gap-4">
              {field('Type de contrat',
                <select
                  value={form.contract_type}
                  onChange={(e) => setForm((f) => ({ ...f, contract_type: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                >
                  {Object.keys(DB_CONTRACT_OPTIONS).map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              )}
              {field('Télétravail',
                <select
                  value={form.accept_remote}
                  onChange={(e) => setForm((f) => ({ ...f, accept_remote: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white focus:border-[#58A6FF] focus:outline-none"
                >
                  {REMOTE_OPTIONS.map((v) => (
                    <option key={v} value={v}>{REMOTE_LABELS[v]}</option>
                  ))}
                </select>
              )}
            </div>

            {field('Localisation', input('place', 'text', 'Ex: Paris, France'))}

            {/* Salaire */}
            <div className="grid grid-cols-2 gap-4">
              {field('Salaire minimum (€)', input('salary_min', 'number', '35000'), 'Annuel brut')}
              {field('Salaire maximum (€)', input('salary_max', 'number', '55000'), 'Annuel brut')}
            </div>

            {/* Section — Description */}
            <div className="h-px bg-white/10" />
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">Description</p>
            {field('Résumé de l\'offre',
              <textarea
                value={form.description_preview}
                onChange={(e) => setForm((f) => ({ ...f, description_preview: e.target.value }))}
                rows={5}
                placeholder="Description courte affichée dans les résultats de recherche..."
                className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/20 transition focus:border-[#58A6FF] focus:outline-none"
              />,
              'Ce texte apparaît dans la prévisualisation de l\'offre.'
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-white/20 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-offer-form"
            disabled={saving}
            className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] transition hover:bg-[#ffe59d] disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CardOffer({
  id, title, small_company, contract_types, formatted_places,
  isSelected, onSelect, onDeleted, onUpdated,
}: CardOfferProps) {
  const { role, token } = useAuth();
  const [isSaved, setIsSaved] = useState(() => isOfferSaved(id));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title,
    company_name: small_company?.company_name ?? '',
    contract_type: formatContractType(contract_types?.[0]?.contract_type) || 'CDI',
    place: formatted_places?.[0]?.place ?? '',
    salary_min: '',
    salary_max: '',
    accept_remote: 'Non précisé',
    description_preview: '',
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsSaved(isOfferSaved(id));
    });
    if (token) {
      import('../utils/savedOffers').then((m) => m.loadSavedOffersAsync()).then((items) => {
        setIsSaved(items.some((item) => item.id === id));
      }).catch(() => {});
    }
    return () => cancelAnimationFrame(frame);
  }, [id, token]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (token) {
        if (isSaved) {
          const ok = await deleteSavedOfferAsync(id);
          if (ok) setIsSaved(false);
        } else {
          const ok = await createSavedOfferAsync(id);
          if (ok) setIsSaved(true);
        }
      } else {
        const { saved } = toggleSavedOffer({ id, title, company: small_company?.company_name ?? '', location: formatted_places?.[0]?.place ?? '', savedAt: new Date().toISOString() });
        setIsSaved(saved);
      }
    } catch {
      const { saved } = toggleSavedOffer({ id, title, company: small_company?.company_name ?? '', location: formatted_places?.[0]?.place ?? '', savedAt: new Date().toISOString() });
      setIsSaved(saved);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setConfirmOpen(false);
        onDeleted?.(id);
      }
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const handleEditOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({
      title,
      company_name: small_company?.company_name ?? '',
      contract_type: formatContractType(contract_types?.[0]?.contract_type) || 'CDI',
      place: formatted_places?.[0]?.place ?? '',
      salary_min: '',
      salary_max: '',
      accept_remote: 'Non précisé',
      description_preview: '',
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    try {
      const dbContractType = DB_CONTRACT_OPTIONS[editForm.contract_type] ?? editForm.contract_type;
      const body: Record<string, unknown> = {
        title: editForm.title,
        company_name: editForm.company_name,
        contract_type: dbContractType,
        place: editForm.place,
        accept_remote: editForm.accept_remote === 'Non précisé' ? null : editForm.accept_remote,
      };
      if (editForm.salary_min !== '') body.salary_min = Number(editForm.salary_min);
      if (editForm.salary_max !== '') body.salary_max = Number(editForm.salary_max);
      if (editForm.description_preview !== '') body.description_preview = editForm.description_preview;

      const res = await fetch(`${API}/api/offers/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Impossible de modifier l'offre");
      onUpdated?.(id, { title: editForm.title, company_name: editForm.company_name, contract_type: dbContractType, place: editForm.place });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setEditSaving(false);
    }
  };

  const companyName = small_company?.company_name;
  const canSelect = Boolean(onSelect);

  return (
    <>
      <article
        className={`group relative rounded-3xl border px-5 py-4 transition focus:outline-none ${
          isSelected
            ? 'border-[#f6d889]/80 bg-[#17151a] shadow-[0_0_50px_rgba(216,178,94,0.18)]'
            : 'border-white/10 bg-[#131417] hover:border-[#d8b25e]/60 hover:bg-[#141318]'
        } ${canSelect ? 'cursor-pointer' : ''}`}
        role={canSelect ? 'button' : undefined}
        tabIndex={canSelect ? 0 : undefined}
        onClick={canSelect ? () => onSelect?.(id) : undefined}
        onKeyDown={canSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(id); } } : undefined}
      >
        <div className="flex min-h-[80px] items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-xs font-semibold text-white">
              {small_company?.fallback_gallery_url ? (
                <img src={small_company.fallback_gallery_url} alt={companyName ?? 'company'} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span>{getCompanyInitial(companyName)}</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {contract_types?.[0]?.contract_type && (
                  <span className="rounded-full border border-[#d8b25e]/40 bg-[#1f1a12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f6d889]">
                    {formatContractType(contract_types[0].contract_type)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">{companyName ?? 'Entreprise inconnue'}</p>
              <p className="text-xs text-white/60">{formatted_places?.[0]?.place ?? 'Non précisé'}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={(e) => { void handleSave(e); }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isSaved ? 'border-[#58A6FF]/50 bg-[#151b2a] text-[#58A6FF]' : 'border-white/10 bg-[#15171b] text-white/60 hover:border-white/20 hover:text-white'}`}
            >
              <Bookmark size={12} className={isSaved ? 'fill-[#58A6FF]' : ''} />
              {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
            </button>

            {role === 'ADMIN' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Supprimer l'offre"
                  onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                  className="rounded-md border border-white/15 bg-[#191a20] p-1.5 text-white/70 transition hover:border-red-400/60 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  title="Modifier l'offre"
                  onClick={handleEditOpen}
                  className="rounded-md border border-white/15 bg-[#191a20] p-1.5 text-white/70 transition hover:border-[#58A6FF]/60 hover:text-[#58A6FF]"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {confirmOpen && (
        <ConfirmModal
          title="Supprimer cette offre ?"
          message={`"${title}" sera définitivement supprimée de la base de données. Cette action est irréversible.`}
          loading={deleting}
          onConfirm={() => { void handleDeleteConfirm(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {editOpen && (
        <EditModal
          form={editForm}
          setForm={setEditForm}
          onSave={handleEditSave}
          onClose={() => setEditOpen(false)}
          saving={editSaving}
          error={editError}
        />
      )}
    </>
  );
}

export default CardOffer;
