import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessage } from "../components/Feedback";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";

export function LoginPage() {
  const { authenticated, login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      await login(username.trim(), password);
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accesso non riuscito");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* ── Solo slim header DSI (area 1 + area 3), nessun header principale ── */}
      <div className="it-header-slim-wrapper">
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="it-header-slim-wrapper-content">
                {/* Area 1 — nome ente */}
                <span className="navbar-brand">
                  Ospedale Pubblico <span className="dm-brand-unit">· Ufficio Accettazione Ricoveri</span>
                </span>
                {/* Area 3 — accesso */}
                <div className="it-header-slim-right-zone">
                  <div className="it-access-top-wrapper">
                    <span className="dm-slim-user d-inline-flex align-items-center gap-1" aria-current="page">
                      <User size={16} aria-hidden="true" />
                      <span>Accedi</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto login */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light py-5">
        <motion.div
          className="card shadow-sm border-0"
          style={{ width: "min(440px, 96vw)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
        >
          <div className="card-body p-4 p-lg-5">
            {/* Intestazione card */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: 56, height: 56, background: "var(--bs-primary)", color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}
                aria-hidden="true"
              >
                D+
              </div>
              <h1 className="h4 fw-bold" style={{ color: "#17324d" }}>Accedi a DocuMed</h1>
              <p className="text-muted mb-0" style={{ fontSize: ".9rem" }}>
                Inserisci le credenziali amministratore
              </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <form className="dm-login-form" onSubmit={handleSubmit} noValidate>
              {/* Campo username — stile DSI */}
              <div className="form-group mb-3">
                <label htmlFor="login-username" className="form-label fw-semibold" style={{ fontSize: ".85rem" }}>
                  Username o email
                </label>
                <input
                  id="login-username"
                  className="form-control"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Campo password — stile DSI */}
              <div className="form-group mb-4">
                <label htmlFor="login-password" className="form-label fw-semibold" style={{ fontSize: ".85rem" }}>
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-100" disabled={submitting}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Accesso in corso…</>
                  : "Accedi"}
              </Button>
            </form>

            <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: ".78rem" }}>
              Accesso riservato agli amministratori autorizzati
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer istituzionale */}
      <footer className="py-3 text-center" style={{ background: "#17324d", color: "#b0bec5", fontSize: ".75rem" }}>
        DocuMed · Accettazione ricoveri e fascicolo documentale &nbsp;—&nbsp; Uso interno autorizzato
      </footer>
    </div>
  );
}
