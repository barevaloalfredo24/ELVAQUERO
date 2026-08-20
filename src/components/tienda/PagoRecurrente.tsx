// =====================================================================
// PAGO CON RECURRENTE (embebido)
// ---------------------------------------------------------------------
// Monta el checkout de Recurrente dentro de la página (iframe) usando la
// librería oficial. Sin salir a ventanas externas.
// =====================================================================

"use client";

import { useEffect, useRef } from "react";
import RecurrenteCheckout from "recurrente-checkout";

export function PagoRecurrente({
  url,
  onExito,
  onFallo,
}: {
  url: string;
  onExito: () => void;
  onFallo: () => void;
}) {
  // Mantiene la referencia más reciente de los callbacks.
  const callbacksRef = useRef({ onExito, onFallo });
  useEffect(() => {
    callbacksRef.current = { onExito, onFallo };
  });

  // Carga el checkout embebido una vez que hay URL.
  useEffect(() => {
    if (!url) return;
    RecurrenteCheckout.load({
      url,
      onSuccess: () => callbacksRef.current.onExito(),
      onFailure: () => callbacksRef.current.onFallo(),
    });
  }, [url]);

  // Contenedor donde la librería inyecta el iframe.
  return (
    <div className="rounded-xl border border-marron-100 bg-white p-2">
      <p className="mb-2 px-2 text-sm font-medium text-marron-700">
        💳 Pago seguro con Recurrente
      </p>
      <div id="recurrente-checkout-container" className="min-h-[600px]" />
    </div>
  );
}
