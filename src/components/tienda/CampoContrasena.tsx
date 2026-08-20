// =====================================================================
// CAMPO DE CONTRASEÑA (con mostrar/ocultar)
// ---------------------------------------------------------------------
// Input de contraseña con botón de ojo para alternar la visibilidad.
// =====================================================================

"use client";

import { useState } from "react";

function IconoOjo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.5 10.5 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.6 9.6 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 0 0 4.24 4.24" />
    </svg>
  );
}

export function CampoContrasena({
  value,
  onChange,
  placeholder = "••••••••",
  required,
  minLength,
  autoComplete,
}: {
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-marron-200 px-3 py-2 pr-10 outline-none focus:border-marron-500"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-marron-500 hover:text-marron-700"
      >
        {visible ? <IconoOjoTachado /> : <IconoOjo />}
      </button>
    </div>
  );
}
