export function Loading({ label = "Caricamento…" }: { label?: string }) {
  return <div className="loading" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <div className="alert alert-error" role="alert">{message}</div>;
}

export function EmptyState({ children }: { children: string }) {
  return <div className="empty-state">{children}</div>;
}
