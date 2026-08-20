// =====================================================================
// BOTÓN "CONTINUAR CON GOOGLE" (Google Identity Services)
// ---------------------------------------------------------------------
// Carga el script de Google, inicializa el cliente con el Client ID y,
// al hacer clic, abre el selector de cuenta. Devuelve el ID token al
// padre mediante onCredential.
// =====================================================================

"use client";

import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Tipado mínimo del objeto global de Google Identity Services.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Icono oficial de Google (multicolor).
function IconoGoogle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function BotonGoogle({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  // Mantiene siempre la última función de callback para evitar cierres viejos.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  // Carga e inicializa el script de Google una sola vez.
  useEffect(() => {
    if (!CLIENT_ID) return;

    const inicializar = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => {
          if (resp?.credential) onCredentialRef.current(resp.credential);
        },
      });
    };

    if (document.getElementById("gsi-script")) {
      inicializar();
      return;
    }

    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = inicializar;
    document.body.appendChild(script);
  }, []);

  // Abre el selector de cuenta de Google.
  function abrirGoogle() {
    if (!CLIENT_ID || !window.google) return;
    window.google.accounts.id.prompt();
  }

  return (
    <button
      type="button"
      onClick={abrirGoogle}
      disabled={!CLIENT_ID}
      title={!CLIENT_ID ? "Configura NEXT_PUBLIC_GOOGLE_CLIENT_ID" : undefined}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-marron-200 bg-white py-3 font-medium text-marron-800 transition hover:bg-marron-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <IconoGoogle />
      Continuar con Google
    </button>
  );
}
