import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          const newProfile = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            phone: '',
            photoURL: firebaseUser.photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      name, email, phone: '', photoURL: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    return userCredential;
  };
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const updateUserProfile = async (data) => {
    if (!user) throw new Error('Usuário não autenticado');
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  const value = { user, userProfile, loading, login, register, logout, resetPassword, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
