import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/useAuth';
import { getSkillDescription } from '../utils/skills';

type ProfileUser = {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  professional_status: string;
  avatar_url: string | null;
  banner_url: string | null;
  phone: string | null;
  language: string | null;
  bio: string | null;
  interests?: string[] | null;
  formations?: Array<{ diplome?: string | null; ecole?: string | null; dates?: string | null }> | null;
  website: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  contract_preferences?: Array<{ contract_type: string }>;
  location_preferences?: Array<{ location: string }>;
};

type Skill = {
  id: number;
  name: string;
  type: 'hardskill' | 'softskill';
};

type UserSkill = {
  id: number;
  user_id: number;
  skill_id: number;
  skill: Skill;
};

type MediaField = 'avatar_url' | 'banner_url';

type Experience = {
  id: string;
  company: string;
  title: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate?: string | null; // ISO or null
  description?: string;
};

type UserFormation = {
  diplome?: string | null;
  ecole?: string | null;
  dates?: string | null;
};

type CareerPreferences = {
  status: 'looking_for_work' | 'employed';
  contractTypes: string[];
  locations: string[];
};

type PreferencesField = 'status' | 'contractType' | 'location';
type CropState = {
  field: MediaField;
  sourceUrl: string;
  mimeType: string;
  crop: Crop;
  aspect?: number;
  cropPixels: PixelCrop | null;
};

const API_URL = 'http://localhost:3000';
const MAX_FILE_SIZE = 1_500_000; // 1.5 MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80';
const defaultBanner =
  'linear-gradient(135deg, rgba(246,216,137,0.18) 0%, rgba(88,166,255,0.16) 40%, rgba(17,18,23,0.92) 100%)';

const BANNER_CROP_ASPECT = 4 / 1;
const AVATAR_OUTPUT_WIDTH = 512;
const BANNER_OUTPUT_WIDTH = 1400;

const defaultCareerPreferences: CareerPreferences = {
  status: 'looking_for_work',
  contractTypes: [],
  locations: [],
};

const CAREER_STATUS_OPTIONS: Array<{ value: CareerPreferences['status']; label: string }> = [
  { value: 'looking_for_work', label: 'À l\'écoute' },
  { value: 'employed', label: 'En poste' },
];

const CAREER_CONTRACT_OPTIONS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Intérim', 'Freelance'];

const getCropAspect = (field: MediaField) => (field === 'avatar_url' ? 1 : BANNER_CROP_ASPECT);

const getInitialCrop = (imageWidth: number, imageHeight: number, aspect?: number) => {
  if (aspect) {
    const crop = makeAspectCrop({ unit: '%', width: aspect === 1 ? 88 : 96 }, aspect, imageWidth, imageHeight);
    return centerCrop(crop, imageWidth, imageHeight);
  }

  const width = 86;
  const height = Math.min(70, Math.max(28, Math.round((width * imageHeight) / imageWidth)));

  return centerCrop(
    {
      unit: '%',
      width,
      height,
    },
    imageWidth,
    imageHeight,
  );
};

const getCroppedMedia = async (
  image: HTMLImageElement,
  cropPixels: PixelCrop,
  outputWidth: number,
) => {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const canvas = document.createElement('canvas');
  const targetWidth = outputWidth;
  const targetHeight = Math.round((cropPixels.height * scaleY * targetWidth) / (cropPixels.width * scaleX));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Impossible de préparer le recadrage.');
  }

  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    cropPixels.x * scaleX,
    cropPixels.y * scaleY,
    cropPixels.width * scaleX,
    cropPixels.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas.toDataURL('image/webp', 0.86);
};

function Profil() {
  const { role, token } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const skillsSearchRef = useRef<HTMLDivElement | null>(null);
  
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const resetFileInputs = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }

    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<MediaField | null>(null);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [localPreview, setLocalPreview] = useState<Record<MediaField, string | null>>({
    avatar_url: null,
    banner_url: null,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', professional_status: '' });
  const [editErrors, setEditErrors] = useState<{ username?: string; email?: string }>({});
  const [editSaving, setEditSaving] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutForm, setAboutForm] = useState({ bio: '', website: '', location: '', interests: '', formations: '' });
  const [aboutSaving, setAboutSaving] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [experiencesModalOpen, setExperiencesModalOpen] = useState(false);
  const [experienceForm, setExperienceForm] = useState<Experience | null>(null);
  const [careerPreferences, setCareerPreferences] = useState<CareerPreferences>(defaultCareerPreferences);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [preferencesField, setPreferencesField] = useState<PreferencesField>('status');
  
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('');
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const [focusedSkillIndex, setFocusedSkillIndex] = useState(-1);
  const [activeSkillInfoId, setActiveSkillInfoId] = useState<number | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const mapProfileToCareerPreferences = (user: ProfileUser | null): CareerPreferences => {
    if (!user) {
      return defaultCareerPreferences;
    }

    const contractTypes = Array.isArray(user.contract_preferences)
      ? user.contract_preferences.map((pref) => pref.contract_type)
      : [];
    const locations = Array.isArray(user.location_preferences)
      ? user.location_preferences.map((pref) => pref.location)
      : [];

    return {
      status: (user.professional_status as CareerPreferences['status']) ?? defaultCareerPreferences.status,
      contractTypes,
      locations,
    };
  };

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Impossible de charger le profil');
        }

        setProfile(data);
        setCareerPreferences(mapProfileToCareerPreferences(data));

        try {
          const userSkillsRes = await fetch(`${API_URL}/api/skills/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userSkillsRes.ok) {
            const userSkillsList = await userSkillsRes.json();
            setUserSkills(userSkillsList);
          }
        } catch {
          console.warn('Impossible de charger les compétences');
        }

        try {
          const experiencesRes = await fetch(`${API_URL}/api/experiences/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (experiencesRes.ok) {
            const experiencesList = await experiencesRes.json();
            setExperiences(experiencesList);
          }
        } catch {
          console.warn('Impossible de charger les expériences');
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, token]);


  const bannerStyle = useMemo(() => {
    const bannerValue = localPreview.banner_url ?? profile?.banner_url;

    if (!bannerValue) {
      return { backgroundImage: defaultBanner };
    }

    return { backgroundImage: `url(${bannerValue})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }, [localPreview.banner_url, profile?.banner_url]);

  const avatarSrc = localPreview.avatar_url ?? profile?.avatar_url ?? defaultAvatar;
  
  const getProfessionalStatusLabel = (status?: string): string => {
    switch (status) {
      case 'looking_for_work':
        return 'En recherche d\'emploi';
      case 'employed':
        return 'En poste';
      default:
        return 'En recherche d\'emploi';
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatDateForInput = (iso?: string | null) => {
    const formatted = formatDate(iso);
    return formatted === iso ? '' : formatted;
  };

  const formatFrenchDateTyping = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    const normalizedDay = day.length === 2 ? String(Math.min(Number(day), 31)).padStart(2, '0') : day;
    const normalizedMonth = month.length === 2 ? String(Math.min(Number(month), 12)).padStart(2, '0') : month;

    if (digits.length <= 2) {
      return normalizedDay;
    }

    if (digits.length <= 4) {
      return `${normalizedDay}/${normalizedMonth}`;
    }

    return `${normalizedDay}/${normalizedMonth}/${year}`;
  };

  const parseFrenchDateInput = (value: string) => {
    if (!value) return null;
    const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12) return null;
    if (day < 1) return null;

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseInterestsInput = (value: string) =>
    value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

  const formatInterestsInput = (interests?: string[] | null) =>
    Array.isArray(interests) ? interests.filter(Boolean).join(', ') : '';

  const parseFormationsInput = (value: string): UserFormation[] =>
    value
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((line) => {
        const [diplome, ecole, dates] = line.split('|').map((part) => part.trim());
        return {
          diplome: diplome || null,
          ecole: ecole || null,
          dates: dates || null,
        };
      })
      .filter((item) => item.diplome || item.ecole || item.dates);

  const formatFormationsInput = (formations?: UserFormation[] | null) =>
    Array.isArray(formations)
      ? formations
          .map((formation) => [formation.diplome, formation.ecole, formation.dates].filter(Boolean).join(' | '))
          .filter(Boolean)
          .join('\n')
      : '';


  const profileStatusLabel = loading
    ? 'Chargement...'
    : profile
      ? getProfessionalStatusLabel(profile.professional_status)
      : 'Profil indisponible';

  useEffect(() => {
    return () => {
      if (cropState?.sourceUrl) {
        URL.revokeObjectURL(cropState.sourceUrl);
      }
    };
  }, [cropState?.sourceUrl]);

  useEffect(() => {
    cropImageRef.current = null;
  }, [cropState?.sourceUrl]);

  const openExperiencesModal = () => {
    setExperienceForm(null);
    setExperiencesModalOpen(true);
  };

  const closeExperiencesModal = () => {
    setExperienceForm(null);
    setExperiencesModalOpen(false);
  };

  const fetchAvailableCities = async () => {
    setCitiesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/offers/cities`);
      const data = await res.json();
      setAvailableCities(data.cities ?? []);
    } catch {
      setAvailableCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  const openPreferencesModal = (field: PreferencesField) => {
    setPreferencesField(field);
    setPreferencesModalOpen(true);
    if (field === 'location') {
      void fetchAvailableCities();
    }
  };

  const closePreferencesModal = () => {
    setPreferencesModalOpen(false);
  };

  const saveCareerPreferences = (next: CareerPreferences) => {
    const persist = async () => {
      try {
        setPreferencesModalOpen(false);
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_status: next.status,
            contractTypes: next.contractTypes ?? [],
            locations: next.locations ?? [],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Impossible de sauvegarder les préférences');
        }
        const updated = await res.json();
        setProfile(updated);
        setCareerPreferences(mapProfileToCareerPreferences(updated));
        window.dispatchEvent(new Event('career-preferences-updated'));
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      }
    };
    void persist();
  };

  const handleSkillsModalPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target;

    if (activeSkillInfoId) {
      const activeChip = document.querySelector<HTMLElement>(`[data-skill-chip-id="${activeSkillInfoId}"]`);
      if (activeChip && target instanceof Node && !activeChip.contains(target)) {
        setActiveSkillInfoId(null);
      }
    }

    if (skillsDropdownOpen && skillsSearchRef.current && target instanceof Node && !skillsSearchRef.current.contains(target)) {
      setSkillsDropdownOpen(false);
      setFocusedSkillIndex(-1);
    }
  };

  const saveProfileMedia = async (field: MediaField, imageDataUrl: string) => {
    if (!token || !profile) {
      return;
    }

    setSavingField(field);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/me/media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(field === 'avatar_url' ? { avatar_url: imageDataUrl } : { banner_url: imageDataUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Impossible d’enregistrer l’image');
      }

      setProfile(data);
      setCareerPreferences(mapProfileToCareerPreferences(data));
      setLocalPreview((current) => ({ ...current, [field]: null }));
      setMessage(field === 'avatar_url' ? 'Photo de profil enregistrée.' : 'Bannière enregistrée.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer l’image');
      throw error;
    } finally {
      setSavingField(null);
    }
  };

  const finalizeCrop = async () => {
    if (!cropState) return;

    if (!cropState.cropPixels) {
      setMessage('Place et recadre l’image avant de valider.');
      return;
    }

    const image = cropImageRef.current;

    if (!image) {
      setMessage('L’image n’est pas encore prête.');
      return;
    }

    try {
      const outputWidth = cropState.field === 'avatar_url' ? AVATAR_OUTPUT_WIDTH : BANNER_OUTPUT_WIDTH;
      const croppedDataUrl = await getCroppedMedia(image, cropState.cropPixels, outputWidth);

      URL.revokeObjectURL(cropState.sourceUrl);
      setCropState(null);
      resetFileInputs();

      await saveProfileMedia(cropState.field, croppedDataUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de rogner l’image');
    }
  };

  const handleFileChange = (field: MediaField) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setMessage('Format d’image non autorisé. Utilise PNG, JPEG, WEBP ou GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('Image trop lourde. Taille maximale: 1,5 Mo.');
      event.target.value = '';
      return;
    }

    if (cropState) {
      URL.revokeObjectURL(cropState.sourceUrl);
      setCropState(null);
    }

    setCropState({
      field,
      sourceUrl: URL.createObjectURL(file),
      mimeType: file.type,
      crop: { unit: '%', x: 10, y: 10, width: 80, height: 80 },
      aspect: getCropAspect(field),
      cropPixels: null,
    });
    event.target.value = '';
  };

  const openEditModal = () => {
    if (profile) {
      setEditFormData({ username: profile.username, email: profile.email, professional_status: profile.professional_status });
      setEditErrors({});
      setEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditErrors({});
  };

  const openAboutModal = () => {
    if (!profile) return;
    setAboutForm({
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      location: profile.location ?? '',
      interests: formatInterestsInput(profile.interests ?? null),
      formations: formatFormationsInput(profile.formations ?? null),
    });
    setMessage(null);
    setAboutModalOpen(true);
  };

  const closeAboutModal = () => setAboutModalOpen(false);

  const handleSaveAbout = async () => {
    if (!token || !profile) {
      setMessage('Authentification requise');
      return;
    }

    setAboutSaving(true);
    setMessage(null);

    try {
      const interestsPayload = parseInterestsInput(aboutForm.interests);
      const formationsPayload = parseFormationsInput(aboutForm.formations);
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: aboutForm.bio.trim() ? aboutForm.bio.trim() : null,
          website: aboutForm.website.trim() ? aboutForm.website.trim() : null,
          location: aboutForm.location.trim() ? aboutForm.location.trim() : null,
          interests: interestsPayload.length > 0 ? interestsPayload : null,
          formations: formationsPayload.length > 0 ? formationsPayload : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour impossible');
      }

      setProfile(data);
      setCareerPreferences(mapProfileToCareerPreferences(data));
      setMessage('Profil mis à jour.');
      setAboutModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mise à jour impossible');
    } finally {
      setAboutSaving(false);
    }
  };

  const openSkillsModal = async () => {
    setSkillsLoading(true);
    setSkillsSearchQuery('');
    try {
      const skillsRes = await fetch(`${API_URL}/api/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!skillsRes.ok) throw new Error('Impossible de charger les compétences');
      const skills = await skillsRes.json();
      setAllSkills(skills);

      const userSkillsRes = await fetch(`${API_URL}/api/skills/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userSkillsRes.ok) throw new Error('Impossible de charger vos compétences');
      const userSkillsList = await userSkillsRes.json();
      setUserSkills(userSkillsList);
      setSelectedSkillIds(userSkillsList.map((us: UserSkill) => us.skill_id));
      setSkillsModalOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors du chargement des compétences');
    } finally {
      setSkillsLoading(false);
    }
  };

  const closeSkillsModal = () => {
    setSkillsModalOpen(false);
    setSkillsSearchQuery('');
    setSkillsDropdownOpen(false);
    setFocusedSkillIndex(-1);
    setActiveSkillInfoId(null);
  };

  const handleSaveSkills = async () => {
    if (!token) {
      setMessage('Authentification requise');
      return;
    }

    const skillIdsToSave = [...selectedSkillIds];
    setSkillsSaving(true);
    setMessage(null);
    closeSkillsModal();

    try {
      const response = await fetch(`${API_URL}/api/skills/user`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillIds: skillIdsToSave }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour impossible');
      }

      setUserSkills(data);
      setSelectedSkillIds(data.map((us: UserSkill) => us.skill_id));
      setMessage('Compétences mises à jour avec succès.');
    } catch (error) {
      setSkillsModalOpen(true);
      setSkillsSearchQuery('');
      setSkillsDropdownOpen(false);
      setFocusedSkillIndex(-1);
      setActiveSkillInfoId(null);
      setMessage(error instanceof Error ? error.message : 'Mise à jour impossible');
    } finally {
      setSkillsSaving(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );

    setActiveSkillInfoId((current) => (current === skillId ? null : current));
  };

  const handleSaveExperience = async (form: Experience) => {
    const id = form.id || String(Date.now());
    const startDate = parseFrenchDateInput(form.startDate);
    const endDate = form.endDate ? parseFrenchDateInput(form.endDate) : null;

    if (!startDate) {
      setMessage('La date de début doit être au format jj/mm/aaaa.');
      return;
    }

    if (form.endDate && !endDate) {
      setMessage('La date de fin doit être au format jj/mm/aaaa.');
      return;
    }

    const isEditing = experiences.some((existing) => existing.id === id);
    const endpoint = isEditing ? `${API_URL}/api/experiences/${id}` : `${API_URL}/api/experiences/me`;
    const method = isEditing ? 'PATCH' : 'POST';

    setMessage(null);
    setExperiencesModalOpen(false);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: form.company,
          title: form.title,
          startDate,
          endDate,
          description: form.description ?? '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour impossible');
      }

      setExperiences((prev) => {
        const next = isEditing ? prev.map((item) => (item.id === id ? data : item)) : [data, ...prev];
        return next;
      });
      setExperienceForm(null);
    } catch (error) {
      setExperiencesModalOpen(true);
      setMessage(error instanceof Error ? error.message : 'Mise à jour impossible');
    }
  };

  const handleEditExperience = (id: string) => {
    const ex = experiences.find((x) => x.id === id);
    if (ex) {
      setExperienceForm({
        ...ex,
        startDate: formatDateForInput(ex.startDate),
        endDate: ex.endDate ? formatDateForInput(ex.endDate) : null,
      });
      setExperiencesModalOpen(true);
    }
  };

  const handleDeleteExperience = (id: string) => {
    void (async () => {
      try {
        setMessage(null);
        const response = await fetch(`${API_URL}/api/experiences/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok && response.status !== 204) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || 'Impossible de supprimer l’expérience');
        }

        setExperiences((prev) => prev.filter((x) => x.id !== id));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de supprimer l’expérience');
      }
    })();
  };

  const getFilteredSkills = (): Skill[] => {
    const query = skillsSearchQuery.toLowerCase().trim();
    if (!query) {
      return allSkills.sort((a, b) => a.name.localeCompare(b.name));
    }

    const filtered = allSkills.filter((skill) =>
      skill.name.toLowerCase().includes(query)
    );

    return filtered.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      if (aLower === query) return -1;
      if (bLower === query) return 1;

      if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
      if (!aLower.startsWith(query) && bLower.startsWith(query)) return 1;

      return aLower.localeCompare(bLower);
    });
  };

  const filteredSkillsForDropdown = getFilteredSkills();

  const handleSkillSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const visibleSkills = filteredSkillsForDropdown;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSkillIndex((prev) =>
        prev < visibleSkills.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSkillIndex((prev) =>
        prev > 0 ? prev - 1 : visibleSkills.length - 1
      );
    } else if (e.key === 'Enter' && focusedSkillIndex >= 0 && visibleSkills[focusedSkillIndex]) {
      e.preventDefault();
      toggleSkill(visibleSkills[focusedSkillIndex].id);
      setFocusedSkillIndex(-1);
    }
  };

  const handleSkillSearchChange = (value: string) => {
    setSkillsSearchQuery(value);
    setSkillsDropdownOpen(true);
    setFocusedSkillIndex(-1);
  };

  const validateEditForm = (): boolean => {
    const errors: { username?: string; email?: string } = {};

    if (!editFormData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    } else if (editFormData.username.trim().length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    } else if (editFormData.username.trim().length > 30) {
      errors.username = 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(editFormData.username.trim())) {
      errors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores';
    }

    if (!editFormData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email.trim().toLowerCase())) {
      errors.email = 'Email invalide';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditForm()) {
      return;
    }

    if (!token || !profile) {
      setMessage('Authentification requise');
      return;
    }

    setEditSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editFormData.username,
          email: editFormData.email,
          professional_status: editFormData.professional_status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour impossible');
      }

      setProfile(data);
      setCareerPreferences(mapProfileToCareerPreferences(data));
      setMessage('Profil mis à jour avec succès.');
      closeEditModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mise à jour impossible');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <PageShell
      title="Profil"
      subtitle="Identité"
      description="Complète ton profil pour booster ta visibilité et recevoir des recommandations plus précises."
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="flex justify-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#111217]/80 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
            <div className="relative h-48 border-b border-white/10" style={bannerStyle}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#111217] via-[#111217]/20 to-transparent" />
              <div className="absolute left-6 top-6 flex gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/55">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 backdrop-blur-sm">{profile?.role ?? 'user'}</span>
                <span className="rounded-full border border-[#f6d889]/30 bg-[#f6d889]/10 px-3 py-1 text-[#f6d889] backdrop-blur-sm">
                  {profileStatusLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute right-6 top-6 rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-sm transition hover:border-[#58A6FF]/60 hover:text-white"
              >
                {savingField === 'banner_url' ? 'Enregistrement...' : 'Changer la bannière'}
              </button>
              <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange('banner_url')} />
              <div className="absolute -bottom-12 left-8">
                <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0d10] shadow-[0_0_25px_rgba(0,0,0,0.35)]">
                  <img src={avatarSrc} alt="Photo de profil" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:bg-black/75"
                  >
                    {savingField === 'avatar_url' ? '...' : 'Changer'}
                  </button>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange('avatar_url')} />
              </div>
            </div>

            <div className="px-6 pb-6 pt-16">
              <div className="flex flex-col gap-2 text-left sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Avancement</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{profile?.username ?? 'Profil utilisateur'}</h3>
                  <p className="mt-2 text-sm text-white/60">{profile?.email ?? 'Chargement du profil...'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-right text-xs text-white/60">
                  <p className="uppercase tracking-[0.24em] text-white/35">Dernière mise à jour</p>
                  <p className="mt-1 text-white/80">{profile ? new Date(profile.updatedAt).toLocaleString('fr-FR') : '—'}</p>
                </div>
              </div>

              {(() => {
                const completion = {
                  photo: Boolean(profile?.avatar_url),
                  banner: Boolean(profile?.banner_url),
                  security: Boolean(profile),
                  access: Boolean(token),
                  experiences: experiences.length > 0,
                  skills: userSkills.length > 0,
                  location: careerPreferences.locations.length > 0,
                  availability: careerPreferences.contractTypes.length > 0,
                  bio: Boolean(profile?.bio),
                  interests: Boolean(profile?.interests && profile.interests.length > 0),
                  formations: Boolean(profile?.formations && profile.formations.length > 0),
                  website: Boolean(profile?.website),
                  residence: Boolean(profile?.location),
                };
                const totalItems = Object.keys(completion).length;
                const completedCount = Object.values(completion).filter(Boolean).length;
                const pct = Math.round((completedCount / totalItems) * 100);
                const tag = (label: string, done: boolean) => (
                  <span
                    key={label}
                    className={`rounded-full border px-3 py-1 transition-colors ${
                      done
                        ? 'border-[#f6d889]/40 bg-[#f6d889]/10 text-[#f6d889]'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {done ? '✓ ' : '✗ '}{label}
                  </span>
                );
                return (
                  <>
                    <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f6d889] to-[#58A6FF] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right text-[0.65rem] font-semibold text-white/30">{pct}%</p>

                    <div className="mt-3 flex flex-wrap gap-3 text-[0.7rem] text-white/55">
                      {tag('Photo synchronisée', completion.photo)}
                      {tag('Bannière synchronisée', completion.banner)}
                      {tag('Validation sécurité', completion.security)}
                      {tag('Accès instantané', completion.access)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-[0.7rem] text-white/55">
                      {tag('Expériences', completion.experiences)}
                      {tag('Compétences', completion.skills)}
                      {tag('Localisation', completion.location)}
                      {tag('Disponibilités', completion.availability)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-[0.7rem] text-white/55">
                      {tag('Description', completion.bio)}
                      {tag('Centres d\'intérêt', completion.interests)}
                      {tag('Formation', completion.formations)}
                      {tag('Lien', completion.website)}
                      {tag('Lieu de résidence', completion.residence)}
                    </div>

                    {message ? <p className="mt-4 text-sm text-[#f6d889]">{message}</p> : null}
                  </>
                );
              })()}

              {role === 'ADMIN' ? (
                <button
                  type="button"
                  onClick={() => navigate('/analytics')}
                  className="mt-5 rounded-xl border border-[#58A6FF]/50 bg-[#151b2a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#58A6FF] transition hover:bg-[#58A6FF] hover:text-[#0b0d10]"
                >
                  Accéder aux Analytics
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Identité</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Profil visible</h3>
              <div className="mt-3 space-y-2 text-sm text-white/60">
                <div className="flex items-center justify-between gap-4">
                  <span>Nom d’utilisateur</span>
                  <span className="text-white/40">{profile?.username ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Email</span>
                  <span className="text-white/40">{profile?.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Statut professionnel</span>
                  <span className="text-white/40">{profile ? getProfessionalStatusLabel(profile.professional_status) : 'Indisponible'}</span>
                </div>
              </div>
              <button type="button" onClick={openEditModal} className="mt-5 w-full rounded-xl border border-[#d8b25e]/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d889] transition hover:bg-[#f6d889] hover:text-[#141518]">
                Modifier les informations publiques
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">À propos</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Présentation</h3>
              <div className="mt-3 space-y-3 text-sm text-white/60">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/35">Description</p>
                  {profile?.bio ? (
                    <p className="mt-1 whitespace-pre-wrap text-white/75">{profile.bio}</p>
                  ) : (
                    <p className="mt-1 text-white/40">Aucune description ajoutée</p>
                  )}
                </div>
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/35">Centres d'intérêt</p>
                  {profile?.interests && profile.interests.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span key={interest} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-white/40">Aucun centre d'intérêt renseigné</p>
                  )}
                </div>
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/35">Formation</p>
                  {profile?.formations && profile.formations.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {profile.formations.map((formation, index) => (
                        <li key={`${formation.diplome ?? 'formation'}-${index}`} className="text-white/70">
                          <span className="font-semibold text-white">{formation.diplome || 'Formation'}</span>
                          {formation.ecole ? ` · ${formation.ecole}` : ''}
                          {formation.dates ? ` · ${formation.dates}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-white/40">Aucune formation renseignée</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Lien</span>
                  {profile?.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="truncate text-[#f6d889] hover:underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Lieu de résidence</span>
                  <span className="text-white/75">{profile?.location ?? '—'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={openAboutModal}
                className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white"
              >
                Modifier la présentation
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Compétences</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Stack principale</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                {userSkills.length > 0 ? (
                  userSkills.map((userSkill) => (
                    <span key={userSkill.skill_id} className="rounded-full border border-white/10 px-3 py-1">
                      {userSkill.skill.name}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40">Aucune compétence sélectionnée</span>
                )}
              </div>
              <button
                type="button"
                onClick={openSkillsModal}
                className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white"
              >
                Modifier les compétences
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Expériences</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Parcours récent</h3>
              <div className="mt-3 space-y-3 text-sm text-white/60">
                {experiences.length > 0 ? (
                  experiences.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{ex.title} · {ex.company}</div>
                        <div className="text-xs text-white/50">{formatDate(ex.startDate)}{ex.endDate ? ` — ${formatDate(ex.endDate)}` : ' — Aujourd’hui'}</div>
                        {ex.description ? <div className="mt-1 text-sm text-white/60">{ex.description}</div> : null}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => handleEditExperience(ex.id)} className="text-sm text-white/70 hover:underline">Modifier</button>
                        <button onClick={() => handleDeleteExperience(ex.id)} className="text-sm text-white/50 hover:underline">Supprimer</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/50">Aucune expérience ajoutée</div>
                )}
              </div>
              <button onClick={openExperiencesModal} className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white">
                Gérer les expériences
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111217]/80 p-6 shadow-[0_0_30px_rgba(216,178,94,0.08)]">
            <div className="space-y-6">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Statut</p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {careerPreferences.status === 'looking_for_work' ? 'À l\'écoute' : 'En poste'}
                </h3>
                <p className="mt-2 text-sm text-white/60">Indique aux recruteurs que tu es ouvert aux opportunités.</p>
                <button type="button" onClick={() => openPreferencesModal('status')} className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white">
                  Mettre à jour le statut
                </button>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Disponibilités</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Types de contrat</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {careerPreferences.contractTypes.length > 0
                    ? careerPreferences.contractTypes.map((ct) => (
                        <span key={ct} className="rounded-full border border-[#f6d889]/30 bg-[#f6d889]/10 px-3 py-1 text-xs font-semibold text-[#f6d889]">{ct}</span>
                      ))
                    : <span className="text-sm text-white/40">Aucun filtre sélectionné</span>
                  }
                </div>
                <button type="button" onClick={() => openPreferencesModal('contractType')} className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white">
                  Ajuster les contrats
                </button>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Localisation</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Zones recherchées</h3>
                {careerPreferences.locations.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-white/60">
                    {careerPreferences.locations.map((location) => (
                      <li key={location}>• {location}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-white/40">Aucune zone sélectionnée</p>
                )}
                <button type="button" onClick={() => openPreferencesModal('location')} className="mt-5 w-full rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-[#58A6FF]/60 hover:text-white">
                  Modifier les lieux
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {cropState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Rogner l'image</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Ajuste le cadrage avant validation</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(cropState.sourceUrl);
                  setCropState(null);
                  resetFileInputs();
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Annuler
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10] p-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/40">Prévisualisation</p>
                      <p className="mt-1 text-sm text-white/70">Glisse l’image et tire sur les coins pour définir la zone exacte.</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-white/50">
                      {cropState.field === 'avatar_url' ? 'Avatar' : 'Bannière'}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-center overflow-hidden rounded-2xl bg-black/30 p-2">
                    <ReactCrop
                      crop={cropState.crop}
                      aspect={cropState.aspect}
                      minWidth={cropState.field === 'avatar_url' ? 120 : 420}
                      keepSelection
                      onChange={(_, percentCrop) => setCropState((current) => (current ? { ...current, crop: percentCrop } : current))}
                      onComplete={(croppedAreaPixels) =>
                        setCropState((current) => (current ? { ...current, cropPixels: croppedAreaPixels } : current))
                      }
                      className={cropState.field === 'avatar_url' ? 'profile-avatar-crop' : 'profile-banner-crop'}
                    >
                      <img
                        ref={cropImageRef}
                        src={cropState.sourceUrl}
                        alt="Prévisualisation du recadrage"
                        className="max-h-[560px] w-full select-none object-contain"
                        onLoad={(event) => {
                          const { naturalWidth, naturalHeight } = event.currentTarget;

                          if (!cropState.cropPixels) {
                            setCropState((current) =>
                              current
                                ? {
                                    ...current,
                                    crop: getInitialCrop(naturalWidth, naturalHeight, current.aspect),
                                  }
                                : current,
                            );
                          }
                        }}
                        draggable={false}
                      />
                    </ReactCrop>
                  </div>
                </div>
                <p className="text-xs text-white/45">
                  Le cadre se redimensionne avec les poignées et suit un vrai comportement de sélection.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-xs text-white/55">
                  <p className="font-semibold uppercase tracking-[0.24em] text-white/40">Sécurité</p>
                  <p className="mt-2">Le fichier est contrôlé avant envoi: format autorisé, taille limitée, puis recadré côté client.</p>
                </div>

                <button
                  type="button"
                  onClick={() => void finalizeCrop()}
                  disabled={savingField !== null}
                  className="w-full rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] transition hover:bg-[#ffe59d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingField ? 'Enregistrement...' : 'Valider le cadrage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {experiencesModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Expérience</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Ajouter / Modifier une expérience</h3>
              </div>
              <button type="button" onClick={closeExperiencesModal} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Fermer</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (experienceForm) {
                  void handleSaveExperience(experienceForm);
                }
              }}
              className="space-y-4 px-6 py-6 max-h-[60vh] overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-semibold text-white/70">Intitulé du poste</label>
                <input value={experienceForm?.title ?? ''} onChange={(e) => setExperienceForm((f) => ({ ...(f ?? { id: String(Date.now()), company: '', title: '', startDate: '', endDate: null, description: '' }), title: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Entreprise</label>
                <input value={experienceForm?.company ?? ''} onChange={(e) => setExperienceForm((f) => ({ ...(f ?? { id: String(Date.now()), company: '', title: '', startDate: '', endDate: null, description: '' }), company: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white/70">Date de début</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="jj/mm/aaaa"
                    value={experienceForm?.startDate ?? ''}
                    onChange={(e) => setExperienceForm((f) => ({ ...(f ?? { id: String(Date.now()), company: '', title: '', startDate: '', endDate: null, description: '' }), startDate: formatFrenchDateTyping(e.target.value) }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70">Date de fin (optionnel)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="jj/mm/aaaa"
                    value={experienceForm?.endDate ?? ''}
                    onChange={(e) => setExperienceForm((f) => ({ ...(f ?? { id: String(Date.now()), company: '', title: '', startDate: '', endDate: null, description: '' }), endDate: e.target.value ? formatFrenchDateTyping(e.target.value) : null }))}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70">Description</label>
                <textarea value={experienceForm?.description ?? ''} onChange={(e) => setExperienceForm((f) => ({ ...(f ?? { id: String(Date.now()), company: '', title: '', startDate: '', endDate: null, description: '' }), description: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white h-28" />
              </div>

              <div className="flex gap-3 border-t border-white/10 px-6 py-4">
                <button type="button" onClick={closeExperiencesModal} className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Annuler</button>
                <button type="submit" className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518]">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Édition du profil</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Modifie tes informations publiques</h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-white/70">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  id="username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  placeholder="Entrez votre nom d'utilisateur"
                  disabled={editSaving}
                />
                {editErrors.username && <p className="text-xs text-red-400">{editErrors.username}</p>}
                <p className="text-xs text-white/40">Min 3, max 30 caractères. Lettres, chiffres, tirets et underscores uniquement.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white/70">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  placeholder="Entrez votre email"
                  disabled={editSaving}
                />
                {editErrors.email && <p className="text-xs text-red-400">{editErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="professional_status" className="block text-sm font-semibold text-white/70">
                  Statut professionnel
                </label>
                <select
                  id="professional_status"
                  value={editFormData.professional_status}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, professional_status: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={editSaving}
                >
                  <option value="looking_for_work">En recherche d'emploi</option>
                  <option value="employed">En poste</option>
                </select>
                <p className="text-xs text-white/40">Indique ton statut actuel aux recruteurs.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55">
                <p className="font-semibold uppercase tracking-[0.24em] text-white/40">Sécurité</p>
                <p className="mt-2">Tes données sont validées côté serveur et sécurisées. Ne partage jamais ton token d'authentification.</p>
              </div>

              {message && message.toLowerCase().includes('succès') ? (
                <p className="rounded-lg bg-[#f6d889]/10 px-4 py-2 text-sm text-[#f6d889]">{message}</p>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={editSaving}
                className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] transition hover:bg-[#ffe59d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {editSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {aboutModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Présentation</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Description, lien et lieu</h3>
              </div>
              <button
                type="button"
                onClick={closeAboutModal}
                disabled={aboutSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-semibold text-white/70">
                  Description
                </label>
                <textarea
                  id="bio"
                  value={aboutForm.bio}
                  onChange={(e) => setAboutForm((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  maxLength={1000}
                  placeholder="Quelques lignes pour te présenter..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={aboutSaving}
                />
                <p className="text-xs text-white/40">{aboutForm.bio.length}/1000</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="interests" className="block text-sm font-semibold text-white/70">
                  Centres d'intérêt
                </label>
                <textarea
                  id="interests"
                  value={aboutForm.interests}
                  onChange={(e) => setAboutForm((prev) => ({ ...prev, interests: e.target.value }))}
                  rows={2}
                  placeholder="Design, IA, Jeux vidéo, Bénévolat..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={aboutSaving}
                />
                <p className="text-xs text-white/40">Sépare par virgule ou saut de ligne.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="formations" className="block text-sm font-semibold text-white/70">
                  Formation
                </label>
                <textarea
                  id="formations"
                  value={aboutForm.formations}
                  onChange={(e) => setAboutForm((prev) => ({ ...prev, formations: e.target.value }))}
                  rows={3}
                  placeholder="Ex: Master Informatique | Université X | 2022-2024"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={aboutSaving}
                />
                <p className="text-xs text-white/40">Une ligne par diplôme, format: Diplôme | École | Dates.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="block text-sm font-semibold text-white/70">
                  Lien (portfolio, GitHub, LinkedIn...)
                </label>
                <input
                  type="url"
                  id="website"
                  value={aboutForm.website}
                  onChange={(e) => setAboutForm((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://exemple.com"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={aboutSaving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="residence" className="block text-sm font-semibold text-white/70">
                  Lieu de résidence
                </label>
                <input
                  type="text"
                  id="residence"
                  value={aboutForm.location}
                  onChange={(e) => setAboutForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Paris, France"
                  maxLength={255}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                  disabled={aboutSaving}
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={closeAboutModal}
                disabled={aboutSaving}
                className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAbout()}
                disabled={aboutSaving}
                className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] transition hover:bg-[#ffe59d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {aboutSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {skillsModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          onPointerDownCapture={handleSkillsModalPointerDown}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Compétences</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Sélectionne tes compétences</h3>
              </div>
              <button
                type="button"
                onClick={closeSkillsModal}
                disabled={skillsSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 max-h-[60vh] overflow-y-auto">
              <div ref={skillsSearchRef} className="space-y-2 sticky top-0 bg-[#111217] pb-4 z-10">
                <label htmlFor="skills-search" className="block text-sm font-semibold text-white/70">
                  Chercher une compétence
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="skills-search"
                    value={skillsSearchQuery}
                    onChange={(e) => handleSkillSearchChange(e.target.value)}
                    onKeyDown={handleSkillSearchKeyDown}
                    onFocus={() => setSkillsDropdownOpen(true)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30"
                    placeholder="React, Python, Leadership, etc."
                    disabled={skillsSaving}
                  />

                  {skillsDropdownOpen && !skillsSaving && (
                    <div className="absolute top-full mt-2 w-full rounded-xl border border-white/10 bg-[#0b0d10] shadow-lg max-h-64 overflow-y-auto z-50">
                      {skillsLoading ? (
                        <div className="px-4 py-3 text-sm text-white/50">Chargement...</div>
                      ) : filteredSkillsForDropdown.length > 0 ? (
                        filteredSkillsForDropdown.map((skill, index) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              toggleSkill(skill.id);
                              setFocusedSkillIndex(-1);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition ${
                              index === focusedSkillIndex
                                ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                                : selectedSkillIds.includes(skill.id)
                                  ? 'bg-transparent text-white'
                                  : 'hover:bg-white/5 text-white/70'
                            }`}
                          >
                            <span className="mr-2">{selectedSkillIds.includes(skill.id) ? '✓' : '◦'}</span>
                            {skill.name}
                            <span className="ml-2 text-xs text-white/40">
                              {skill.type === 'hardskill' ? 'Hard' : 'Soft'}
                            </span>
                          </button>
                        ))
                      ) : skillsSearchQuery.trim() ? (
                        <div className="px-4 py-3 text-sm text-white/50">Aucune compétence trouvée</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55">
                <p className="font-semibold uppercase tracking-[0.24em] text-white/40">Sélectionnées</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSkillIds.length > 0 ? (
                    selectedSkillIds.map((skillId) => {
                      const skill = allSkills.find((s) => s.id === skillId);
                      return skill ? (
                        <div key={skillId} data-skill-chip-id={skillId} className="relative inline-flex">
                          <span
                            onClick={() =>
                              setActiveSkillInfoId((current) => (current === skillId ? null : skillId))
                            }
                            className={`inline-flex cursor-help items-center rounded-full border px-3 py-1 text-xs font-semibold gap-2 ${
                              skill.type === 'hardskill'
                                ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                                : 'border-[#f6d889] bg-[#f6d889]/10 text-[#f6d889]'
                            }`}
                          >
                            {skill.name}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleSkill(skillId);
                              }}
                              className="hover:opacity-70"
                              disabled={skillsSaving}
                              aria-label={`Retirer ${skill.name}`}
                            >
                              ✕
                            </button>
                          </span>
                          {activeSkillInfoId === skillId ? (
                            <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#181a20] px-3 py-2 text-[11px] leading-snug text-white/70 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                              {getSkillDescription(skill)}
                            </span>
                          ) : null}
                        </div>
                      ) : null;
                    })
                  ) : (
                    <span className="text-white/40">Aucune compétence sélectionnée</span>
                  )}
                </div>
                <p className="mt-3 text-white/60">{selectedSkillIds.length} compétence(s) sélectionnée(s)</p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={closeSkillsModal}
                disabled={skillsSaving}
                className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSaveSkills()}
                disabled={skillsSaving}
                className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518] transition hover:bg-[#ffe59d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {skillsSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {preferencesModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#111217] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40">Préférences</p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {preferencesField === 'status'
                    ? 'Mettre à jour le statut'
                    : preferencesField === 'contractType'
                      ? 'Types de contrat recherchés'
                      : 'Zones géographiques'}
                </h3>
              </div>
              <button type="button" onClick={closePreferencesModal} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Fermer</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCareerPreferences(careerPreferences);
              }}
              className="space-y-5 px-6 py-6"
            >
              {preferencesField === 'status' ? (
                <div className="space-y-3">
                  {CAREER_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCareerPreferences((current) => ({ ...current, status: option.value }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${careerPreferences.status === option.value ? 'border-[#f6d889]/50 bg-[#f6d889]/10 text-white' : 'border-white/10 bg-[#0b0d10] text-white/70 hover:border-white/20'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {preferencesField === 'contractType' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CAREER_CONTRACT_OPTIONS.map((ct) => {
                    const active = careerPreferences.contractTypes.includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setCareerPreferences((current) => ({
                          ...current,
                          contractTypes: active
                            ? current.contractTypes.filter((item) => item !== ct)
                            : [...current.contractTypes, ct],
                        }))}
                        className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${active ? 'border-[#f6d889]/50 bg-[#f6d889]/10 text-white' : 'border-white/10 bg-[#0b0d10] text-white/70 hover:border-white/20'}`}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {preferencesField === 'location' ? (
                <div className="max-h-72 overflow-y-auto">
                  {citiesLoading ? (
                    <p className="py-6 text-center text-sm text-white/40">Chargement des villes...</p>
                  ) : availableCities.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/40">Aucune ville disponible</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {availableCities.map((city) => {
                        const active = careerPreferences.locations.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setCareerPreferences((current) => ({
                              ...current,
                              locations: active
                                ? current.locations.filter((item) => item !== city)
                                : [...current.locations, city],
                            }))}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? 'border-[#f6d889]/50 bg-[#f6d889]/10 text-white' : 'border-white/10 bg-[#0b0d10] text-white/70 hover:border-white/20'}`}
                          >
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={closePreferencesModal} className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1f] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Annuler</button>
                <button type="submit" className="flex-1 rounded-xl border border-[#d8b25e]/40 bg-[#f6d889] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#141518]">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export default Profil;
