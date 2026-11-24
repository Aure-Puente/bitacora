import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { auth } from '../services/firebase';
import {
  ensureUserDoc,
  loginWithEmail,
  loginWithGoogle,
  logout as logoutService,
  registerWithEmail,
  sendReset,
} from '../services/authService';
import { clearLocalFiles } from '../services/fileCache';
import { saveAvatar, saveName } from '../services/profileService';
import { onAuthStateChanged } from '../services/sdk/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [version, setVersion] = useState(0); // fuerza re-render cuando cambia el perfil

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setInitializing(false);
        if (u) ensureUserDoc(u).catch(() => {});
      },
      () => setInitializing(false)
    );
    return unsubscribe;
  }, []);

  const refreshUser = useCallback(() => {
    setUser(auth.currentUser);
    setVersion((v) => v + 1);
  }, []);

  // photoUri (opcional): foto de perfil elegida al registrarse.
  const register = useCallback(async (name, email, password, photoUri) => {
    const u = await registerWithEmail(name, email, password);
    setUser(auth.currentUser || u);
    setVersion((v) => v + 1);
    ensureUserDoc(auth.currentUser || u).catch(() => {});
    if (photoUri) {
      // La cuenta ya existe: si la foto falla, se avisa y se puede cargar después.
      saveAvatar(auth.currentUser || u, photoUri)
        .then(refreshUser)
        .catch((e) => {
          console.warn('No se pudo subir la foto de perfil:', e);
          Alert.alert('Tu cuenta está lista', 'No pudimos subir la foto. Podés cargarla en Ajustes → tu perfil.');
        });
    }
  }, [refreshUser]);

  const changeAvatar = useCallback(async (uri) => {
    await saveAvatar(auth.currentUser, uri);
    refreshUser();
  }, [refreshUser]);

  const changeName = useCallback(async (name) => {
    await saveName(auth.currentUser, name);
    refreshUser();
  }, [refreshUser]);

  // Al salir se borran los archivos bajados, para no dejar documentos en el celular.
  const logout = useCallback(async () => {
    await logoutService();
    clearLocalFiles();
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      displayName:
        (user && (user.displayName || (user.email ? user.email.split('@')[0] : ''))) || '',
      login: loginWithEmail,
      loginWithGoogle,
      register,
      resetPassword: sendReset,
      logout,
      changeAvatar,
      changeName,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, initializing, register, logout, changeAvatar, changeName, version]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
