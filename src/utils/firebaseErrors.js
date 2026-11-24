const MESSAGES = {
  'auth/invalid-email': 'El email no es válido.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/user-not-found': 'No encontramos una cuenta con ese email.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en unos minutos.',
  'auth/api-key-not-valid': 'Falta configurar Firebase (revisá src/config/firebaseConfig.js).',
  'auth/invalid-api-key': 'Falta configurar Firebase (revisá src/config/firebaseConfig.js).',
  'permission-denied': 'No tenés permiso para hacer esto.',
  'storage/unauthorized': 'No tenés permiso para este archivo, o no es una foto o un PDF de hasta 10 MB.',
  'storage/unauthenticated': 'Iniciá sesión de nuevo para usar archivos.',
  'storage/object-not-found': 'El archivo ya no existe.',
  'storage/quota-exceeded': 'Se alcanzó el límite de almacenamiento del proyecto.',
  'storage/retry-limit-exceeded': 'La conexión es muy lenta. Probá de nuevo con mejor señal.',
  'storage/canceled': 'Se canceló la subida.',
  'storage/cancelled': 'Se canceló la subida.',
  'storage/file-not-found': 'No encontramos el archivo en el celular. Elegilo de nuevo.',
  'storage/unknown': 'No pudimos acceder a los archivos. Revisá tu internet.',
  'not-found': 'Esto ya no existe: puede que otra persona lo haya borrado.',
  'failed-precondition': 'No se pudo completar. Probá de nuevo.',
  unavailable: 'No pudimos conectar con el servidor. Revisá tu internet.',
};

export function friendlyError(error) {
  const code = error && error.code && String(error.code).replace(/^firestore\//, '');
  if (code && MESSAGES[code]) return MESSAGES[code];
  return (error && error.message) || 'Ocurrió un error inesperado.';
}
