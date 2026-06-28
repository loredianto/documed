import { FormEvent, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { PageTransition } from "@/lib/motion";

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Utente del prototipo: operatrice dello sportello accettazione ricoveri.
  const userName = "Valentina Marchetti";
  const userRole = "Assistente amministrativa · Accettazione ricoveri";
  const initial = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  function handleLogout() {
    setUserOpen(false);
    logout();
    navigate("/login");
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    if (q) {
      navigate(`/patients?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  }

  // chiude il dropdown cliccando fuori
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // focus all'apertura della ricerca; chiusura con Esc o click fuori
  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  return (
    <>
      <div className="it-header-wrapper">

        {/* ── Slim header ── */}
        <div className="it-header-slim-wrapper">
          <div className="container-xxl">
            <div className="row">
              <div className="col-12">
                <div className="it-header-slim-wrapper-content">
                  <a className="navbar-brand" href="/dashboard">
                    Azienda Ospedaliera <span className="dm-brand-unit">· Pronto Soccorso</span>
                  </a>

                  <div className="it-header-slim-right-zone">
                    <div className="it-access-top-wrapper">
                      {/* Dropdown DSI — struttura Bootstrap Italia */}
                      <div
                        ref={userDropdownRef}
                        className={`dropdown${userOpen ? " show" : ""}`}
                      >
                        <button
                          className="btn btn-dropdown dropdown-toggle dm-user-trigger"
                          type="button"
                          aria-haspopup="true"
                          aria-expanded={userOpen}
                          onClick={() => setUserOpen((v) => !v)}
                        >
                          <span className="dm-user-avatar" aria-hidden="true">{initial}</span>
                          <span className="dm-user-name">{userName}</span>
                          <span className="dm-chevron" aria-hidden="true" />
                        </button>

                        <div className={`dropdown-menu${userOpen ? " show" : ""}`} role="menu">
                          {/* Intestazione con avatar + nome */}
                          <div className="dm-dropdown-header">
                            <span className="dm-dropdown-avatar" aria-hidden="true">{initial}</span>
                            <span className="dm-dropdown-text">
                              <span className="dm-dropdown-username">{userName}</span>
                              <span className="dm-dropdown-role">{userRole}</span>
                            </span>
                          </div>
                          <div className="link-list-wrapper">
                            <ul className="link-list">
                              <li>
                                <button
                                  className="dropdown-item list-item dm-logout-item"
                                  role="menuitem"
                                  onClick={handleLogout}
                                >
                                  <LogOut size={18} aria-hidden="true" />
                                  <span>Esci</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Header centrale ── */}
        <div className="it-header-center-wrapper">
          <div className="container-xxl">
            <div className="row">
              <div className="col-12">
                <div className="it-header-center-content-wrapper">
                  <div className="it-brand-wrapper">
                    <NavLink to="/dashboard" className="it-brand-wrapper-link">
                      <div className="dm-logo-circle" aria-hidden="true">D+</div>
                      <div className="it-brand-text">
                        <div className="it-brand-title">DocuMed</div>
                        <div className="it-brand-tagline">Archivio Sanitario</div>
                      </div>
                    </NavLink>
                  </div>

                  <div className="it-right-zone">
                    <form
                      className={`dm-search${searchOpen ? " is-open" : ""}`}
                      role="search"
                      onSubmit={handleSearch}
                      ref={searchRef}
                    >
                      <input
                        ref={searchInputRef}
                        type="search"
                        name="q"
                        className="dm-search-input"
                        placeholder="Cerca un paziente per nome, cognome o codice fiscale"
                        aria-label="Cerca un paziente per nome, cognome o codice fiscale"
                        autoComplete="off"
                        tabIndex={searchOpen ? 0 : -1}
                      />
                      <button
                        type="submit"
                        className="dm-search-toggle"
                        aria-label={searchOpen ? "Cerca" : "Apri ricerca"}
                        aria-expanded={searchOpen}
                        onClick={(e) => {
                          const input = searchInputRef.current;
                          if (!searchOpen) {
                            e.preventDefault();
                            setSearchOpen(true);
                          } else if (!input?.value.trim()) {
                            e.preventDefault();
                            setSearchOpen(false);
                          }
                          // aperta + testo presente → invia (handleSearch)
                        }}
                      >
                        <Search size={20} aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Header nav — pinnata (sticky) sotto slim + brand ── */}
      <div className="it-header-navbar-wrapper">
          <div className="container-xxl">
            <div className="row">
              <div className="col-12">
                <nav className="navbar navbar-expand-lg" aria-label="Menu principale">
                  <button
                    className="custom-navbar-toggler"
                    type="button"
                    aria-expanded={menuOpen}
                    aria-label="Apri/chiudi menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <Menu aria-hidden="true" />
                  </button>

                  <div className={`navbar-collapsable${menuOpen ? " expanded" : ""}`}>
                    <div className="overlay" onClick={() => setMenuOpen(false)} />
                    <div className="close-div">
                      <button
                        className="btn close-menu"
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Chiudi menu"
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                    <div className="menu-wrapper">
                      <ul className="navbar-nav">
                        <li className="nav-item">
                          <NavLink
                            to="/dashboard"
                            end
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>Dashboard</span>
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/ricoveri"
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>Ricoveri</span>
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/patients"
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>Pazienti</span>
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>

      <main className="container-xxl dm-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </>
  );
}
