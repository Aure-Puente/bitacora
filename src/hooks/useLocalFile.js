import { useEffect, useState } from 'react';

import { getLocalUri } from '../services/fileCache';

// Ruta local de un archivo de Storage (lo baja si hace falta).
export default function useLocalFile(path) {
  const [state, setState] = useState({ uri: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ uri: null, error: null });
    if (path) {
      getLocalUri(path)
        .then((uri) => {
          if (!cancelled) setState({ uri, error: null });
        })
        .catch((error) => {
          if (!cancelled) setState({ uri: null, error });
        });
    }
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
