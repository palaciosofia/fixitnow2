// src/Pages/Auth/AuthParts.jsx
// Piezas compartidas por las pantallas de inicio de sesión y registro.

export function Divider({ label = "o" }) {
  return (
    <div className="flex items-center gap-3 text-xs text-subtle">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function GoogleButton({ onClick, disabled, children = "Continuar con Google" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-field bg-white text-[15px] font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
        <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4" />
        <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
        <path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05" />
        <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" fill="#EA4335" />
      </svg>
      {children}
    </button>
  );
}
