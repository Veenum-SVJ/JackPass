import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase-client';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  university: string;
  department: string;
  level: number;
  bio: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

// Register a new user
export async function registerUser(
  email: string, 
  password: string, 
  userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<UserProfile> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile
    const profile: UserProfile = {
      uid: user.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', user.uid), profile);

    // Update Firebase Auth display name
    await updateProfile(user, {
      displayName: userData.name,
      photoURL: userData.avatar
    });

    return profile;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

// Sign in existing user
export async function signInUser(email: string, password: string): Promise<UserProfile> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data() as UserProfile;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

// Sign out user
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

// Get current user profile
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as UserProfile;
  } catch (error: any) {
    console.error('Get profile error:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Update Firestore
    await updateDoc(doc(db, 'users', user.uid), updateData);

    // Update Firebase Auth display name and photo if provided
    if (updates.name || updates.avatar) {
      await updateProfile(user, {
        displayName: updates.name || user.displayName,
        photoURL: updates.avatar || user.photoURL
      });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
}

// Upload profile picture
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  try {
    const fileRef = ref(storage, `profile-pictures/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
