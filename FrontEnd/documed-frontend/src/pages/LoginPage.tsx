import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessage } from "../components/Feedback";

export function LoginPage() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username.trim(), password);
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Accesso non riuscito");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="eyebrow">Piattaforma documentale</span>
        <h1>Ogni ricovero.<br />Ogni documento.<br /><em>Un solo percorso.</em></h1>
        <p>Gestione amministrativa protetta, archiviazione GridFS e riconoscimento OCR.</p>
        <div className="security-note">Accesso riservato agli amministratori autorizzati</div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="brand-mark large">D+</span>
          <h2>Accedi a DocuMed</h2>
          {error && <ErrorMessage message={error} />}
          <form onSubmit={handleSubmit}>
            <label>Username o email<input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="button primary full" disabled={submitting}>{submitting ? "Accesso…" : "Accedi"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
