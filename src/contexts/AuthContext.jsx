import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const AuthContext = createContext();

const SAFE_PROFILE_FIELDS = new Set(['name', 'phone', 'photoURL', 'crp', 'crpUf']);

const sanitizeProfileUpdate = (data) =>
  Object.fromEntries(
    Object.entries(data || {}).filter(([key]) => SAFE_PROFILE_FIELDS.has(key))
  );

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setUserRole('user');
        setLoading(false);
        return;
      }

      try {
        const [tokenResult, profileSnapshot] = await Promise.all([
          getIdTokenResult(firebaseUser),
          getDoc(doc(db, 'users', firebaseUser.uid))
        ]);

        // Authorization is derived from a signed Firebase ID token.
        // Profile fields stored in Firestore are presentation data only and
        // must never grant privileges.
        const role = tokenResult.claims.admin === true ? 'admin' : 'user';
        let profile;

        if (profileSnapshot.exists()) {
          profile = profileSnapshot.data();
        } else {
          profile = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            phone: '',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            blocked: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), profile);
        }

        if (profile.blocked === true) {
          await signOut(auth);
          return;
        }

        setUser(firebaseUser);
        setUserProfile({ ...profile, role });
        setUserRole(role);
      } catch (error) {
        console.error('Falha ao inicializar sessão autenticada');
        setUser(null);
        setUserProfile(null);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      name,
      email,
      phone: '',
      photoURL: '',
      role: 'user',
      blocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return userCredential;
  };

  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const updateUserProfile = async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    const safeData = sanitizeProfileUpdate(data);
    const userRef = doc(db, 'users', user.uid);

    await setDoc(
      userRef,
      { ...safeData, updatedAt: serverTimestamp() },
      { merge: true }
    );

    setUserProfile((previous) => ({ ...previous, ...safeData }));
  };

  const value = {
    user,
    userProfile,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    isAdmin: userRole === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
