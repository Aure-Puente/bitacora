// Lógica pura de los archivos guardados para ver sin internet.
// index: { [ruta en Storage]: { tripId, fileId, size } }

// Rutas de un archivo: el original y, si tiene, la miniatura.
export const pathsOf = (file) => [file.path, file.thumbPath].filter(Boolean);

export const isDownloaded = (index, file) => pathsOf(file).every((p) => !!index[p]);

// Se descargan solos los documentos (incluye los adjuntos de reservas). El álbum y los tickets, a mano.
export const isAutomatic = (file) => file.kind === 'documento';

// Qué bajar y qué borrar. `synced` = la lista de archivos vino del servidor: sin eso no se borra nada.
export function planDownloads({ files, index, tripId, auto, synced }) {
  const download = auto ? files.filter((f) => isAutomatic(f) && !isDownloaded(index, f)) : [];
  const alive = new Set(files.map((f) => f.id));
  const remove = synced
    ? Object.keys(index).filter((p) => index[p].tripId === tripId && !alive.has(index[p].fileId))
    : [];
  return { download, remove };
}

export function addToIndex(index, file, tripId) {
  const next = { ...index };
  pathsOf(file).forEach((p) => {
    next[p] = { tripId, fileId: file.id, size: p === file.path ? file.size || 0 : 0 };
  });
  return next;
}

export function removeFromIndex(index, paths) {
  const next = { ...index };
  paths.forEach((p) => delete next[p]);
  return next;
}

export function indexSummary(index) {
  const entries = Object.values(index);
  return {
    files: new Set(entries.map((e) => e.fileId)).size,
    bytes: entries.reduce((sum, e) => sum + (e.size || 0), 0),
  };
}
