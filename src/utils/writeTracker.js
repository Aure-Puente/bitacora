// Seguimiento de las escrituras pendientes de confirmar por el servidor.
//
// Sin conexión, Firestore guarda el cambio en el celular pero su promesa no termina hasta volver la
// señal. Para no dejar a la persona esperando, track() devuelve una promesa que termina cuando:
//   - el servidor confirma o rechaza, o
//   - pasó la espera (waitMs; nada si ya se sabe que no hay conexión): el cambio quedó en la cola.
// Si el servidor rechaza un cambio después de eso, avisa por onLateError.
export function createWriteTracker({ isOnline, onChange, onLateError, waitMs = 4000, offlineWaitMs = 50 }) {
  let pending = 0;

  const change = (delta) => {
    pending += delta;
    onChange(pending);
  };

  function track(promise) {
    change(1);
    return new Promise((resolve, reject) => {
      let released = false;
      const timer = setTimeout(
        () => {
          released = true;
          resolve({ queued: true });
        },
        isOnline() ? waitMs : offlineWaitMs
      );
      promise.then(
        () => {
          change(-1);
          clearTimeout(timer);
          if (!released) resolve({ queued: false });
        },
        (error) => {
          change(-1);
          clearTimeout(timer);
          if (released) onLateError(error);
          else reject(error);
        }
      );
    });
  }

  return { track, pending: () => pending };
}
