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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          setUserRole(data.role || 'user');
        } else {
          // Verifica se o e-mail é o administrador
          const isAdmin = firebaseUser.email === 'fhenriquefcruz@gmail.com';
          const newProfile = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            phone: '',
            photoURL: firebaseUser.photoURL || '',
            role: isAdmin ? 'admin' : 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
          setUserRole(newProfile.role);
        }
      } else {
        setUserProfile(null);
        setUserRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    const isAdmin = email === 'fhenriquefcruz@gmail.com';
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      name,
      email,
      phone: '',
      photoURL: '',
      role: isAdmin ? 'admin' : 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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

  const updateUserRole = async (uid, role) => {
    if (userRole !== 'admin') throw new Error('Apenas administradores podem alterar papéis');
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { role, updatedAt: serverTimestamp() }, { merge: true });
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
    updateUserRole,
    isAdmin: userRole === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
