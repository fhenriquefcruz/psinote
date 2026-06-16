import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const register = async (name, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name, email, phone: '', photoURL: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return userCredential;
};
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
