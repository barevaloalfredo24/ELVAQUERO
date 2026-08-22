// =====================================================================
// RESEÑAS DE PRODUCTO (cliente)
// ---------------------------------------------------------------------
// Muestra las reseñas aprobadas y permite a los clientes autenticados
// calificar el producto con 5 estrellas y dejar un comentario.
// =====================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { obtenerResenas, enviarResena } from "@/lib/servicios/resenas";
import { formatearFecha } from "@/lib/util";
import type { Resena } from "@/lib/tipos";

// Estrella individual (sólida o vacía).
function Estrella({ llena }: { llena: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={llena ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

export function ResenasProducto({ productoId }: { productoId: string }) {
  const { autenticado, esStaff, usuario, token } = useAuth();

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [calificacion, setCalificacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Carga las reseñas al montar.
  useEffect(() => {
    void obtenerResenas(productoId).then(setResenas);
  }, [productoId]);

  const yaCalifico = autenticado && resenas.some((r) => r.usuarioId === usuario?.id);

  async function enviar() {
    if (!token || calificacion < 1 || calificacion > 5) {
      setError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    setError("");
    setMensaje("");
    setCargando(true);
    const resultado = await enviarResena(productoId, calificacion, comentario, token);
    setCargando(false);

    if (resultado.ok) {
      setMensaje(yaCalifico ? "Tu reseña fue actualizada." : "Gracias por tu reseña.");
      setComentario("");
      setCalificacion(0);
      const actualizadas = await obtenerResenas(productoId);
      setResenas(actualizadas);
    } else {
      setError(resultado.mensaje ?? "No se pudo enviar la reseña.");
    }
  }

  return (
    <section className="mt-14">
      <h2 className="mb-6 font-display text-2xl font-bold text-marron-900">
        Reseñas de clientes
      </h2>

      {/* Formulario de reseña (solo clientes autenticados). */}
      {autenticado && !esStaff ? (
        <div className="mb-6 rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <p className="mb-2 font-medium text-marron-800">
            {yaCalifico ? "Actualiza tu calificación" : "Califica este producto"}
          </p>
          <div className="mb-3 flex items-center gap-1 text-dorado">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setCalificacion(n)}
                aria-label={`${n} estrellas`}
                className="transition hover:scale-110"
              >
                <Estrella llena={n <= (hover || calificacion)} />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder="Cuéntanos tu experiencia (opcional)…"
            className="mb-3 w-full rounded-lg border border-marron-200 px-3 py-2 text-sm outline-none focus:border-marron-500"
          />
          {mensaje && (
            <p className="mb-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
              {mensaje}
            </p>
          )}
          {error && (
            <p className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={enviar}
            disabled={cargando}
            className="rounded-full bg-marron-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
          >
            {cargando ? "Enviando…" : "Enviar reseña"}
          </button>
        </div>
      ) : (
        !autenticado && (
          <p className="mb-6 text-sm text-marron-500">
            <Link href={`/login?redirigir=/producto/${productoId}`} className="font-medium text-marron-700 hover:underline">
              Inicia sesión
            </Link>{" "}
            para calificar este producto.
          </p>
        )
      )}

      {/* Lista de reseñas. */}
      {resenas.length === 0 ? (
        <p className="text-sm text-marron-500">Este producto aún no tiene reseñas.</p>
      ) : (
        <ul className="space-y-4">
          {resenas.map((r) => (
            <li key={r.id} className="rounded-xl border border-marron-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-marron-900">{r.nombreUsuario}</span>
                <span className="text-xs text-marron-400">{formatearFecha(r.fechaCreacion)}</span>
              </div>
              <div className="mt-1 flex items-center gap-0.5 text-dorado">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Estrella key={n} llena={n <= r.calificacion} />
                ))}
              </div>
              {r.comentario && (
                <p className="mt-2 text-sm leading-relaxed text-marron-700">{r.comentario}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
