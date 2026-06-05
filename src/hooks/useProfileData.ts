import { useState, useEffect } from 'react';
import { Profile, AppData, Transaction, Category, MonthlyData, ChecklistItem } from '../types/finance';
import { useFirebaseProfiles, CreateProfileResult } from './useFirebaseProfiles';

const CURRENT_PROFILE_KEY = 'financeApp_currentProfile';

export const useProfileData = () => {
  const {
    profiles: firebaseProfiles,
    loading: firebaseLoading,
    error: firebaseError,
    createProfile: createFirebaseProfile,
    updateProfileData: updateFirebaseProfileData,
    updateProfilePin,
    deleteProfile: deleteFirebaseProfile,
    refreshProfile,
  } = useFirebaseProfiles();

  const [currentProfileId, setCurrentProfileId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_PROFILE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentProfileId) {
        localStorage.setItem(CURRENT_PROFILE_KEY, currentProfileId);
      } else {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
      }
    } catch {}
  }, [currentProfileId]);

  const getCurrentProfile = (): Profile | null => {
    if (!currentProfileId) return null;
    return firebaseProfiles.find((p) => p.id === currentProfileId) || null;
  };

  const setCurrentProfile = async (profileId: string) => {
    await refreshProfile(profileId);
    setCurrentProfileId(profileId);
  };

  const createProfile = async (name: string, pin: string): Promise<CreateProfileResult> => {
    const result = await createFirebaseProfile(name, pin);
    if (result.success && result.profile) {
      setCurrentProfileId(result.profile.id);
    }
    return result;
  };

  const updateProfileData = async (profileId: string, newData: AppData) => {
    const success = await updateFirebaseProfileData(profileId, newData);
    if (!success) throw new Error('Failed to save data');
  };

  const calculateMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { income: number; expenditure: number }>();

    transactions.forEach((t) => {
      if (!monthlyMap.has(t.month)) {
        monthlyMap.set(t.month, { income: 0, expenditure: 0 });
      }
      const m = monthlyMap.get(t.month)!;
      if (t.type === 'income') m.income += t.amount;
      else m.expenditure += t.amount;
    });

    const sorted = Array.from(monthlyMap.keys()).sort((a, b) => {
      return new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime();
    });

    const result: MonthlyData[] = [];
    let cumulative = 0;

    sorted.forEach((month) => {
      const d = monthlyMap.get(month)!;
      const savings = d.income - d.expenditure;
      cumulative += savings;
      result.push({
        month,
        totalIncome: d.income,
        totalExpenditure: d.expenditure,
        savings,
        cumulativeSavings: cumulative,
      });
    });

    return result.reverse();
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const profile = getCurrentProfile();
    if (!profile) throw new Error('No profile selected');

    const newTxn: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    const updatedTransactions = [...profile.data.transactions, newTxn];
    const updatedData: AppData = {
      ...profile.data,
      transactions: updatedTransactions,
      monthlyData: calculateMonthlyData(updatedTransactions),
    };

    await updateProfileData(profile.id, updatedData);
    await autoMarkChecklistItem(profile, updatedData, transaction.month, transaction.subcategoryId);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const updatedTransactions = profile.data.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    await updateProfileData(profile.id, {
      ...profile.data,
      transactions: updatedTransactions,
      monthlyData: calculateMonthlyData(updatedTransactions),
    });
  };

  const deleteTransaction = async (id: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const filtered = profile.data.transactions.filter((t) => t.id !== id);
    await updateProfileData(profile.id, {
      ...profile.data,
      transactions: filtered,
      monthlyData: calculateMonthlyData(filtered),
    });
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    await updateProfileData(profile.id, {
      ...profile.data,
      categories: [...profile.data.categories, { ...category, id: Date.now().toString() }],
    });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    await updateProfileData(profile.id, {
      ...profile.data,
      categories: profile.data.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const deleteCategory = async (id: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const filteredTxns = profile.data.transactions.filter((t) => t.categoryId !== id);
    await updateProfileData(profile.id, {
      ...profile.data,
      categories: profile.data.categories.filter((c) => c.id !== id),
      transactions: filteredTxns,
      monthlyData: calculateMonthlyData(filteredTxns),
    });
  };

  const addSubcategory = async (categoryId: string, name: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const newSub = { id: Date.now().toString(), name, categoryId };
    await updateProfileData(profile.id, {
      ...profile.data,
      categories: profile.data.categories.map((c) =>
        c.id === categoryId ? { ...c, subcategories: [...c.subcategories, newSub] } : c
      ),
    });
  };

  const updateSubcategory = async (categoryId: string, subcategoryId: string, name: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    await updateProfileData(profile.id, {
      ...profile.data,
      categories: profile.data.categories.map((c) =>
        c.id === categoryId
          ? { ...c, subcategories: c.subcategories.map((sc) => (sc.id === subcategoryId ? { ...sc, name } : sc)) }
          : c
      ),
    });
  };

  const deleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const filteredTxns = profile.data.transactions.filter((t) => t.subcategoryId !== subcategoryId);
    await updateProfileData(profile.id, {
      ...profile.data,
      categories: profile.data.categories.map((c) =>
        c.id === categoryId ? { ...c, subcategories: c.subcategories.filter((sc) => sc.id !== subcategoryId) } : c
      ),
      transactions: filteredTxns,
      monthlyData: calculateMonthlyData(filteredTxns),
      monthlyChecklists: profile.data.monthlyChecklists.map((cl) => ({
        ...cl,
        items: cl.items.filter((item) => item.subcategoryId !== subcategoryId),
      })),
    });
  };

  const addMonth = async (month: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;
    if (profile.data.monthlyData.some((d) => d.month === month)) return;

    const newMonth: MonthlyData = {
      month,
      totalIncome: 0,
      totalExpenditure: 0,
      savings: 0,
      cumulativeSavings: profile.data.monthlyData[0]?.cumulativeSavings || 0,
    };

    const updated = [newMonth, ...profile.data.monthlyData].sort((a, b) => {
      return new Date(b.month + ' 1').getTime() - new Date(a.month + ' 1').getTime();
    });

    await updateProfileData(profile.id, { ...profile.data, monthlyData: updated });
  };

  const deleteMonth = async (month: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const filtered = profile.data.transactions.filter((t) => t.month !== month);
    await updateProfileData(profile.id, {
      ...profile.data,
      transactions: filtered,
      monthlyData: calculateMonthlyData(filtered),
      monthlyChecklists: profile.data.monthlyChecklists.filter((cl) => cl.month !== month),
    });
  };

  const getEnabledChecklistItems = (data: AppData) => {
    const itemConfigs = data.settings.checklistSettings?.itemConfigs || [];
    const enabledConfigs = itemConfigs.filter((c) => c.enabled);

    // Backward compat: if no itemConfigs, use enabledCategories
    if (enabledConfigs.length === 0) {
      const enabledCategories = data.settings.checklistSettings?.enabledCategories || [];
      const cats = enabledCategories.length > 0
        ? data.categories.filter((c) => enabledCategories.includes(c.id))
        : data.categories.filter((c) =>
            (c.name.toLowerCase().includes('loan') && c.name.toLowerCase().includes('emi')) ||
            c.name.toLowerCase().includes('compulsory')
          );
      return cats.flatMap((cat) =>
        cat.subcategories.map((sub) => ({ subcategoryId: sub.id, categoryId: cat.id, defaultDueDay: 1 }))
      );
    }
    return enabledConfigs;
  };

  const buildChecklistItem = (data: AppData, subcategoryId: string, completed: boolean, dueDay?: number): ChecklistItem | null => {
    const cat = data.categories.find((c) => c.subcategories.some((sc) => sc.id === subcategoryId));
    const sub = cat?.subcategories.find((sc) => sc.id === subcategoryId);
    if (!cat || !sub) return null;
    const config = data.settings.checklistSettings?.itemConfigs?.find((c) => c.subcategoryId === subcategoryId);
    return {
      subcategoryId: sub.id,
      categoryId: cat.id,
      name: sub.name,
      categoryName: cat.name,
      completed,
      dueDay: dueDay ?? config?.defaultDueDay ?? 1,
    };
  };

  const toggleChecklistItem = async (month: string, subcategoryId: string) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const checklists = [...profile.data.monthlyChecklists];
    const idx = checklists.findIndex((cl) => cl.month === month);
    const enabledItems = getEnabledChecklistItems(profile.data);

    if (idx === -1) {
      const items: ChecklistItem[] = enabledItems
        .map((ei) => buildChecklistItem(profile.data, ei.subcategoryId, ei.subcategoryId === subcategoryId, ei.defaultDueDay))
        .filter((i): i is ChecklistItem => i !== null);
      checklists.push({ month, items });
    } else {
      const existing = checklists[idx];
      const itemIdx = existing.items.findIndex((i) => i.subcategoryId === subcategoryId);

      if (itemIdx !== -1) {
        checklists[idx] = {
          ...existing,
          items: existing.items.map((i) =>
            i.subcategoryId === subcategoryId ? { ...i, completed: !i.completed } : i
          ),
        };
      } else {
        const newItem = buildChecklistItem(profile.data, subcategoryId, true);
        if (newItem) {
          checklists[idx] = { ...existing, items: [...existing.items, newItem] };
        }
      }
    }

    await updateProfileData(profile.id, { ...profile.data, monthlyChecklists: checklists });
  };

  const updateChecklistDueDay = async (month: string, subcategoryId: string, dueDay: number) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    const checklists = [...profile.data.monthlyChecklists];
    const idx = checklists.findIndex((cl) => cl.month === month);

    if (idx === -1) {
      // Create the checklist for this month with the updated due day
      const enabledItems = getEnabledChecklistItems(profile.data);
      const items: ChecklistItem[] = enabledItems
        .map((ei) => buildChecklistItem(profile.data, ei.subcategoryId, false,
          ei.subcategoryId === subcategoryId ? dueDay : ei.defaultDueDay))
        .filter((i): i is ChecklistItem => i !== null);
      checklists.push({ month, items });
    } else {
      checklists[idx] = {
        ...checklists[idx],
        items: checklists[idx].items.map((i) =>
          i.subcategoryId === subcategoryId ? { ...i, dueDay } : i
        ),
      };
    }

    await updateProfileData(profile.id, { ...profile.data, monthlyChecklists: checklists });
  };

  const autoMarkChecklistItem = async (
    profile: Profile,
    currentData: AppData,
    month: string,
    subcategoryId: string
  ) => {
    const enabledItems = getEnabledChecklistItems(currentData);
    const isInChecklist = enabledItems.some((ei) => ei.subcategoryId === subcategoryId);
    if (!isInChecklist) return;

    const checklists = [...currentData.monthlyChecklists];
    const idx = checklists.findIndex((cl) => cl.month === month);

    if (idx === -1) {
      const items: ChecklistItem[] = enabledItems
        .map((ei) => buildChecklistItem(currentData, ei.subcategoryId, ei.subcategoryId === subcategoryId, ei.defaultDueDay))
        .filter((i): i is ChecklistItem => i !== null);
      checklists.push({ month, items });
    } else {
      const existing = checklists[idx];
      const itemIdx = existing.items.findIndex((i) => i.subcategoryId === subcategoryId);
      if (itemIdx !== -1) {
        checklists[idx] = {
          ...existing,
          items: existing.items.map((i) =>
            i.subcategoryId === subcategoryId ? { ...i, completed: true } : i
          ),
        };
      } else {
        const newItem = buildChecklistItem(currentData, subcategoryId, true);
        if (newItem) {
          checklists[idx] = { ...existing, items: [...existing.items, newItem] };
        }
      }
    }

    await updateProfileData(profile.id, { ...currentData, monthlyChecklists: checklists });
  };

  const deleteProfile = async (profileId: string) => {
    const success = await deleteFirebaseProfile(profileId);
    if (!success) throw new Error('Failed to delete profile');
    if (currentProfileId === profileId) {
      setCurrentProfileId(null);
    }
  };

  const updateSettings = async (settings: Partial<AppData['settings']>) => {
    const profile = getCurrentProfile();
    if (!profile) return;

    if (settings.pin && settings.pin !== profile.pin) {
      const success = await updateProfilePin(profile.id, settings.pin);
      if (!success) return;
      await refreshProfile(profile.id);
    }

    await updateProfileData(profile.id, {
      ...profile.data,
      settings: { ...profile.data.settings, ...settings },
    });
  };

  return {
    profiles: firebaseProfiles,
    currentProfile: getCurrentProfile(),
    loading: firebaseLoading,
    error: firebaseError,
    setCurrentProfile,
    createProfile,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addMonth,
    deleteMonth,
    updateSettings,
    toggleChecklistItem,
    updateChecklistDueDay,
    deleteProfile,
    refreshProfile,
  };
};
