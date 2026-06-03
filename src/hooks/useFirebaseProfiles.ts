import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Profile, AppData } from '../types/finance';

export interface CreateProfileResult {
  success: boolean;
  message?: string;
  profile?: Profile;
}

const getDefaultProfileData = (): AppData => ({
  categories: [
    {
      id: 'income',
      name: 'Income',
      type: 'income',
      subcategories: [
        { id: 'salary', name: 'Salary', categoryId: 'income' },
      ],
    },
    {
      id: 'loan-emis',
      name: 'Loan EMIs',
      type: 'expenditure',
      subcategories: [
        { id: 'housing', name: 'Housing', categoryId: 'loan-emis' },
      ],
    },
    {
      id: 'compulsory',
      name: 'Compulsory Expenditure',
      type: 'expenditure',
      subcategories: [
        { id: 'rent', name: 'Rent', categoryId: 'compulsory' },
        { id: 'electricity', name: 'Electricity', categoryId: 'compulsory' },
      ],
    },
    {
      id: 'expenses',
      name: 'Daily Expenses',
      type: 'expenditure',
      subcategories: [
        { id: 'food', name: 'Food', categoryId: 'expenses' },
        { id: 'transport', name: 'Transport', categoryId: 'expenses' },
      ],
    },
  ],
  transactions: [],
  monthlyData: [],
  monthlyChecklists: [],
  settings: {
    pin: '0000',
    currency: '₹',
    checklistSettings: {
      enabledCategories: ['loan-emis', 'compulsory'],
    },
  },
});

export const useFirebaseProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(collection(db, 'profiles'), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);

      const loaded: Profile[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          pin: d.pin,
          data: d.data || getDefaultProfileData(),
        };
      });

      setProfiles(loaded);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (profileId: string): Promise<Profile | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', profileId));
      if (!docSnap.exists()) return null;

      const d = docSnap.data();
      const refreshed: Profile = {
        id: docSnap.id,
        name: d.name,
        pin: d.pin,
        data: d.data || getDefaultProfileData(),
      };

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? refreshed : p))
      );
      return refreshed;
    } catch (err) {
      console.error('Error refreshing profile:', err);
      return null;
    }
  };

  const createProfile = async (
    name: string,
    pin: string
  ): Promise<CreateProfileResult> => {
    try {
      setError(null);

      const existing = profiles.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return {
          success: false,
          message: 'A profile with this name already exists.',
        };
      }

      const initialData = getDefaultProfileData();
      initialData.settings.pin = pin;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const profileDoc = {
        name,
        pin,
        data: initialData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'profiles', id), profileDoc);

      const newProfile: Profile = { id, name, pin, data: initialData };
      setProfiles((prev) => [...prev, newProfile]);

      return { success: true, profile: newProfile };
    } catch (err) {
      console.error('Error creating profile:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const updateProfileData = async (
    profileId: string,
    newData: AppData
  ): Promise<boolean> => {
    try {
      setError(null);

      await updateDoc(doc(db, 'profiles', profileId), {
        data: newData,
        updatedAt: new Date().toISOString(),
      });

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, data: newData } : p))
      );
      return true;
    } catch (err) {
      console.error('Error updating profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    }
  };

  const updateProfilePin = async (
    profileId: string,
    newPin: string
  ): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'profiles', profileId), {
        pin: newPin,
        updatedAt: new Date().toISOString(),
      });

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, pin: newPin } : p))
      );
      return true;
    } catch (err) {
      console.error('Error updating PIN:', err);
      return false;
    }
  };

  const deleteProfile = async (profileId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'profiles', profileId));
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      return true;
    } catch (err) {
      console.error('Error deleting profile:', err);
      return false;
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfileData,
    updateProfilePin,
    deleteProfile,
    refreshProfile,
    refreshProfiles: loadProfiles,
  };
};
