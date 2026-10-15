import { Bookmark, Compass, Bot, Moon, Settings, User, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const items = [
  { label: "Découvrir", icon: Compass, route: "/" },
  { label: "Mes emplois", icon: Bookmark, route: "/mes-emplois", requiresAuth: true },
  { label: "IA", icon: Bot, route: "/ia" },
  { label: "Profil", icon: User, route: "/profil", requiresAuth: true },
  { label: "Paramètres", icon: Settings, route: "/parametres", requiresAuth: true },
  { label: "Analytics", icon: BarChart3, route: "/analytics", requiresAuth: true, requiresAdmin: true },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, role } = useAuth();
  const visibleItems = items.filter((item) => {
    if (!isAuthenticated && item.requiresAuth) return false;
    if (!isAdmin && item.requiresAdmin) return false;
    return true;
  });

  return (
    <aside className="group fixed left-0 top-0 z-50 flex h-screen w-[88px] flex-col items-center gap-6 border-r border-white/5 bg-[#0b0c0f]/95 px-4 py-6 text-white transition-all duration-300 ease-out hover:w-56">
      <div className="w-full text-center text-lg font-semibold tracking-tight text-white/90 transition-all duration-300 group-hover:text-left">indeed</div>

      <div className="flex flex-1 flex-col items-center gap-4 w-full">
        {visibleItems.map(({ label, icon: Icon, route }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className={`gold-particle-hover group/item flex h-11 w-full items-center justify-center gap-0 rounded-2xl border px-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] group-hover:justify-start group-hover:gap-3 group-hover:px-4 ${
              (route === '/' ? location.pathname === '/' : location.pathname === route)
                ? "border-[#d8b25e]/40 bg-[#1a1a1a] text-[#f6d889] shadow-[0_0_18px_rgba(216,178,94,0.25)]"
                : "border-white/5 bg-[#141518] text-white/70 hover:border-[#d8b25e]/40 hover:bg-[#1d1f24] hover:text-white hover:shadow-[0_0_24px_rgba(216,178,94,0.3)]"
            }`}
            aria-label={label}
          >
            <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
            <span className="w-0 overflow-hidden text-left text-sm font-medium opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
              {label}
            </span>
          </button>
        ))}
      </div>

      {!isAuthenticated ? (
        <button
          onClick={() => navigate('/login')}
          className="gold-particle-hover flex h-11 w-full items-center justify-center gap-0 rounded-2xl border border-[#d8b25e]/40 bg-[#1a1a1a] px-2 text-[#f6d889] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(216,178,94,0.3)] group-hover:justify-start group-hover:gap-3 group-hover:px-4"
        >
          <User size={18} className="shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
          <span className="w-0 overflow-hidden text-left text-sm font-medium opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
            Se connecter
          </span>
        </button>
      ) : null}

      {isAuthenticated ? (
        <div className="w-full rounded-2xl border border-white/5 bg-[#141518] px-3 py-2 text-center text-[0.62rem] uppercase tracking-[0.24em] text-white/50 group-hover:text-left">
          {role}
        </div>
      ) : null}

      <button className="gold-particle-hover flex h-11 w-full items-center justify-center gap-0 rounded-2xl border border-white/5 bg-[#141518] px-2 text-white/70 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-[#d8b25e]/40 hover:bg-[#1d1f24] hover:text-white hover:shadow-[0_0_24px_rgba(216,178,94,0.3)] group-hover:justify-start group-hover:gap-3 group-hover:px-4">
        <Moon size={18} className="shrink-0 transition-transform duration-200 hover:scale-110" />
        <span className="w-0 overflow-hidden text-left text-sm font-medium opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
          Theme
        </span>
      </button>
    </aside>
  );
}

export default Sidebar;
