// Lógica pura de los archivos adjuntos (documentos, tickets y álbum).

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // el mismo límite está en storage.rules
export const JPEG = 'image/jpeg';
export const PDF = 'application/pdf';

// Cómo se prepara cada tipo de imagen. Las calidades se prueban en orden hasta entrar en el límite.
export const IMAGE_PRESETS = {
  album: { maxSide: 4096, qualities: [0.92, 0.85, 0.75, 0.6] },
  documento: { maxSide: 3000, qualities: [0.9, 0.8, 0.7, 0.5] },
  ticket: { maxSide: 2400, qualities: [0.85, 0.75, 0.6] },
};
export const THUMB = { maxSide: 600, quality: 0.75 };
export const AVATAR = { side: 512, quality: 0.85 };

export const isImage = (file) => file.contentType === JPEG;
export const isPdf = (file) => file.contentType === PDF;

// 1536000 -> "1,5 MB"
export function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',').replace(',0', '')} MB`;
}

// Rutas en Storage. La privacidad depende de la carpeta (group o private), no de un dato editable.
export function storagePaths({ tripId, visibility, uid, fileId, contentType, withThumb }) {
  const base = `trips/${tripId}/${visibility}/${uid}/${fileId}`;
  return {
    path: `${base}${contentType === PDF ? '.pdf' : '.jpg'}`,
    thumbPath: withThumb ? `${base}_mini.jpg` : null,
  };
}

// Nombre local de un archivo bajado. Incluye toda la ruta para que no se pisen entre viajes.
export function cacheName(path) {
  return path.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// "IMG_2031.HEIC" -> "IMG_2031"
export function baseName(name) {
  const clean = String(name || '').trim().split(/[\\/]/).pop();
  return clean.replace(/\.[a-z0-9]{1,5}$/i, '');
}

// Nombre para exportar: sin caracteres que los sistemas de archivos rechazan.
export function exportName(file) {
  const base =
    String(file.name || '')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
      .trim() || 'archivo';
  return `${base.slice(0, 60)}-${String(file.id).slice(0, 6)}${isPdf(file) ? '.pdf' : '.jpg'}`;
}

// Junta los del grupo con los míos (los míos del grupo vienen en las dos consultas).
export function mergeFiles(group, mine) {
  const byId = new Map();
  [...group, ...mine].forEach((f) => byId.set(f.id, f));
  return [...byId.values()];
}

export const documentsOf = (files) => files.filter((f) => f.kind !== 'album');
export const albumOf = (files) => files.filter((f) => f.kind === 'album');
export const filesOfBooking = (files, bookingId) =>
  files.filter((f) => f.kind === 'documento' && f.bookingId === bookingId);

// Parte una lista en filas de `size` para la grilla del álbum.
export function chunk(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}
