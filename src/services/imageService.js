import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { AVATAR, IMAGE_PRESETS, JPEG, MAX_FILE_BYTES, PDF, THUMB } from '../utils/files';

// --- Elegir -------------------------------------------------------------------
// Todas devuelven una lista de { uri, name, contentType } (vacía si la persona canceló).

const fromAssets = (result) =>
  result.canceled
    ? []
    : result.assets.map((a) => ({ uri: a.uri, name: a.fileName || 'Foto', contentType: JPEG }));

export async function takePhoto(options) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Para sacar fotos, dale permiso de cámara a la app en los ajustes del celular.');
  }
  return fromAssets(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, ...options }));
}

export async function pickImages({ multiple = false, ...options } = {}) {
  return fromAssets(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: multiple,
      orderedSelection: multiple,
      ...options,
    })
  );
}

export async function pickPdf() {
  const result = await DocumentPicker.getDocumentAsync({ type: PDF, copyToCacheDirectory: true });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, name: a.name || 'Documento', contentType: PDF }));
}

const SQUARE = { allowsEditing: true, aspect: [1, 1] };
export const pickAvatar = (source) => (source === 'camara' ? takePhoto(SQUARE) : pickImages(SQUARE));

// --- Preparar -----------------------------------------------------------------

// Achica (solo si hace falta) y guarda como JPEG. De paso corrige la rotación, convierte HEIC
// y descarta los datos ocultos de la foto, como la ubicación.
async function toJpeg(uri, { maxSide, quality }) {
  const rendered = await ImageManipulator.manipulate(uri, {
    maxWidth: maxSide,
    maxHeight: maxSide,
  }).renderAsync();
  return rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
}

const sizeOf = (uri) => new File(uri).size || 0;

const tooBig = () => new Error('El archivo pesa más de 10 MB. Probá con uno más liviano.');

// Deja el archivo listo para subir: { uri, size, contentType, width, height, thumbUri }
export async function prepareFile(picked, kind) {
  if (picked.contentType === PDF) {
    const size = sizeOf(picked.uri);
    if (size > MAX_FILE_BYTES) throw tooBig();
    return { uri: picked.uri, size, contentType: PDF, width: null, height: null, thumbUri: null };
  }

  const { maxSide, qualities } = IMAGE_PRESETS[kind];
  const rendered = await ImageManipulator.manipulate(picked.uri, {
    maxWidth: maxSide,
    maxHeight: maxSide,
  }).renderAsync();

  for (let i = 0; i < qualities.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: qualities[i] });
    const size = sizeOf(image.uri);
    if (size <= MAX_FILE_BYTES) {
      // eslint-disable-next-line no-await-in-loop
      const thumb = await toJpeg(picked.uri, THUMB);
      return {
        uri: image.uri,
        size,
        contentType: JPEG,
        width: image.width,
        height: image.height,
        thumbUri: thumb.uri,
      };
    }
  }
  throw tooBig();
}

export async function prepareAvatar(uri) {
  const image = await toJpeg(uri, { maxSide: AVATAR.side, quality: AVATAR.quality });
  return image.uri;
}
