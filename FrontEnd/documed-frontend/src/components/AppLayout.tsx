import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand" aria-label="DocuMed dashboard">
          <span className="brand-mark">D+</span>
          <span><strong>DocuMed</strong><small>Archivio sanitario</small></span>
        </NavLink>
        <nav aria-label="Menu principale">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/patients">Pazienti</NavLink>
          <NavLink to="/documents">Documenti</NavLink>
        </nav>
        <button
          className="logout-button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Esci
        </button>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
