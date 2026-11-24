import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { cacheName, exportName, isPdf } from '../utils/files';
import { downloadUrl } from './sdk/storage';

// Archivos bajados al celular:
//   - caché: lo que se fue viendo (el sistema la puede limpiar)
//   - guardados: lo que tiene que verse sin internet (ver DownloadContext)
// El link de descarga se pide en el momento (las reglas deciden si corresponde) y no se guarda.
const MAX_PARALLEL = 4;
const inProgress = new Map(); // ruta -> promesa, para no bajar dos veces lo mismo
const waiting = [];
let running = 0;

function folder(base) {
  const dir = new Directory(base, 'bitacora');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}
const cached = (path) => new File(folder(Paths.cache), cacheName(path));
const saved = (path) => new File(folder(Paths.document), cacheName(path));

async function limited(fn) {
  if (running >= MAX_PARALLEL) await new Promise((resolve) => waiting.push(resolve));
  running += 1;
  try {
    return await fn();
  } finally {
    running -= 1;
    const next = waiting.shift();
    if (next) next();
  }
}

async function download(path, target) {
  const url = await downloadUrl(path);
  // Baja con otro nombre y recién al terminar lo renombra: una descarga cortada no queda como válida.
  const partial = new File(folder(Paths.cache), `${cacheName(path)}.parcial`);
  await File.downloadFileAsync(url, partial, { idempotent: true });
  await partial.move(target, { overwrite: true });
}

// Devuelve la ruta local (file://) del archivo, bajándolo si hace falta.
export function getLocalUri(path) {
  const kept = saved(path);
  if (kept.exists) return Promise.resolve(kept.uri);
  const target = cached(path);
  if (target.exists) return Promise.resolve(target.uri);
  if (!inProgress.has(path)) {
    const promise = limited(() => download(path, target))
      .then(() => target.uri)
      .finally(() => inProgress.delete(path));
    inProgress.set(path, promise);
  }
  return inProgress.get(path);
}

// --- Guardar para ver sin internet --------------------------------------------

export const isSaved = (path) => saved(path).exists;

export async function saveLocal(path) {
  const target = saved(path);
  if (target.exists) return;
  const uri = await getLocalUri(path);
  if (target.exists) return;
  await new File(uri).copy(target, { overwrite: true });
}

function removeFile(file) {
  try {
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('No se pudo borrar una copia local:', e);
  }
}

export const unsaveLocal = (path) => removeFile(saved(path));

// Borra las copias locales (por ejemplo, al eliminar el archivo).
export function forgetLocal(path) {
  if (!path) return;
  removeFile(cached(path));
  removeFile(saved(path));
}

// Al cerrar sesión no quedan documentos de una cuenta en el celular.
export function clearLocalFiles() {
  [Paths.cache, Paths.document].forEach((base) => removeFile(new Directory(base, 'bitacora')));
}

// --- Abrir, compartir y exportar ----------------------------------------------

// Abre el archivo con el visor del celular (PDF) o, si no hay uno, ofrece compartirlo.
export async function openFile(file) {
  const local = new File(await getLocalUri(file.path));
  const options = { mimeType: file.contentType };
  if (isPdf(file) && (await local.canPreview(options))) {
    await local.preview({ ...options, title: file.name });
    return;
  }
  await shareFile(file);
}

// Comparte una copia con su nombre real.
export async function shareFile(file) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este celular no permite compartir archivos.');
  const local = new File(await getLocalUri(file.path));
  const copy = new File(folder(Paths.cache), exportName(file));
  await local.copy(copy, { overwrite: true });
  await Sharing.shareAsync(copy.uri, { mimeType: file.contentType, dialogTitle: file.name });
}

// Copia archivos a una carpeta que elige la persona. Devuelve null si canceló.
// onProgress(hechos, total)
export async function exportToFolder(files, onProgress) {
  let destination;
  try {
    destination = await Directory.pickDirectoryAsync();
  } catch (e) {
    return null; // el selector se cerró sin elegir
  }
  let copied = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i += 1) {
    try {
      // De a una, para no llenar la memoria.
      // eslint-disable-next-line no-await-in-loop
      const local = new File(await getLocalUri(files[i].path));
      const target = destination.createFile(exportName(files[i]), files[i].contentType);
      // eslint-disable-next-line no-await-in-loop
      await local.copy(target, { overwrite: true });
      copied += 1;
    } catch (e) {
      console.warn('No se pudo exportar', files[i].name, e);
      failed += 1;
    }
    if (onProgress) onProgress(i + 1, files.length);
  }
  return { copied, failed };
}
