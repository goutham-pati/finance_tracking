import React, { useState } from 'react';
import { Save, Key, Loader, Trash2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Category, ChecklistSettings, ChecklistItemConfig } from '../types/finance';

interface SettingsProps {
  pin: string;
  currency: string;
  categories: Category[];
  profileName: string;
  checklistSettings?: ChecklistSettings;
  onUpdateSettings: (settings: {
    pin?: string;
    currency?: string;
    checklistSettings?: ChecklistSettings;
  }) => Promise<void>;
  onDeleteProfile: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  pin,
  currency,
  categories,
  profileName,
  checklistSettings,
  onUpdateSettings,
  onDeleteProfile,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newCurrency, setNewCurrency] = useState(currency);

  // Build itemConfigs from saved settings, filling in any missing subcategories
  const buildItemConfigs = (): ChecklistItemConfig[] => {
    const saved = checklistSettings?.itemConfigs || [];
    const configs: ChecklistItemConfig[] = [];

    categories
      .filter((c) => c.type === 'expenditure')
      .forEach((cat) => {
        cat.subcategories.forEach((sc) => {
          const existing = saved.find((s) => s.subcategoryId === sc.id);
          if (existing) {
            configs.push(existing);
          } else {
            // Backward compat: if enabledCategories had this category, enable its subs
            const wasEnabled = checklistSettings?.enabledCategories?.includes(cat.id) || false;
            configs.push({
              subcategoryId: sc.id,
              categoryId: cat.id,
              enabled: wasEnabled,
              defaultDueDay: 1,
            });
          }
        });
      });
    return configs;
  };

  const [itemConfigs, setItemConfigs] = useState<ChecklistItemConfig[]>(buildItemConfigs);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deletePinInput, setDeletePinInput] = useState('');

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleItem = (subcategoryId: string) => {
    setItemConfigs((prev) =>
      prev.map((c) => (c.subcategoryId === subcategoryId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const setDueDay = (subcategoryId: string, day: number) => {
    setItemConfigs((prev) =>
      prev.map((c) => (c.subcategoryId === subcategoryId ? { ...c, defaultDueDay: day } : c))
    );
  };

  const toggleAllInCategory = (catId: string, enable: boolean) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const subIds = new Set(cat.subcategories.map((sc) => sc.id));
    setItemConfigs((prev) =>
      prev.map((c) => (subIds.has(c.subcategoryId) ? { ...c, enabled: enable } : c))
    );
  };

  const handleSaveChecklist = async () => {
    setSaving(true);
    try {
      const enabledCats = Array.from(
        new Set(itemConfigs.filter((c) => c.enabled).map((c) => c.categoryId))
      );
      await onUpdateSettings({
        checklistSettings: {
          enabledCategories: enabledCats,
          itemConfigs,
        },
      });
      showSuccess('Checklist settings saved.');
    } catch {
      setError('Failed to save checklist settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (currentPin !== pin) { setError('Current PIN is incorrect'); return; }
    if (newPin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setError('New PIN and confirmation do not match'); return; }
    setSaving(true);
    try {
      await onUpdateSettings({ pin: newPin });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      showSuccess('PIN updated successfully.');
    } catch {
      setError('Failed to update PIN.');
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async () => {
    setSaving(true);
    try {
      await onUpdateSettings({ currency: newCurrency });
      showSuccess('Currency updated.');
    } catch {
      setError('Failed to update currency.');
    } finally {
      setSaving(false);
    }
  };

  const expenditureCategories = categories.filter((c) => c.type === 'expenditure');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Change PIN */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Key className="w-5 h-5 mr-2" />
          Change PIN
        </h2>
        <form onSubmit={handlePinChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current PIN</label>
            <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter current PIN" autoComplete="current-password" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
            <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Minimum 4 digits" autoComplete="new-password" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New PIN</label>
            <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Confirm new PIN" autoComplete="new-password" required />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update PIN</span>
          </button>
        </form>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Currency Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
            <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="₹">₹ (Indian Rupee)</option>
              <option value="$">$ (US Dollar)</option>
              <option value="€">€ (Euro)</option>
              <option value="£">£ (British Pound)</option>
            </select>
          </div>
          <button onClick={handleCurrencyChange} disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Currency</span>
          </button>
        </div>
      </div>

      {/* Checklist Settings — Expanded Tree */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Monthly Payment Checklist</h2>
        <p className="text-sm text-gray-600 mb-4">
          Toggle individual items and set their default due date. Enabled items appear on the Dashboard each month.
        </p>

        <div className="space-y-3 mb-4">
          {expenditureCategories.map((cat) => {
            const isExpanded = expandedCategories.includes(cat.id);
            const catItems = itemConfigs.filter((c) => c.categoryId === cat.id);
            const enabledCount = catItems.filter((c) => c.enabled).length;
            const allEnabled = enabledCount === catItems.length && catItems.length > 0;

            return (
              <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleExpand(cat.id)}>
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <span className="font-medium text-gray-800">{cat.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {enabledCount}/{catItems.length} enabled
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAllInCategory(cat.id, !allEnabled); }}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      allEnabled
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {allEnabled ? 'Disable All' : 'Enable All'}
                  </button>
                </div>

                {/* Subcategory list */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {cat.subcategories.map((sc) => {
                      const config = itemConfigs.find((c) => c.subcategoryId === sc.id);
                      if (!config) return null;
                      return (
                        <div key={sc.id} className="flex items-center justify-between px-4 py-3 pl-10 hover:bg-gray-50">
                          <label className="flex items-center space-x-3 cursor-pointer flex-1">
                            <div
                              onClick={() => toggleItem(sc.id)}
                              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                config.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                config.enabled ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </div>
                            <span className={`text-sm ${config.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{sc.name}</span>
                          </label>
                          {config.enabled && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Due:</span>
                              <select
                                value={config.defaultDueDay}
                                onChange={(e) => setDueDay(sc.id, parseInt(e.target.value))}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 w-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                  <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {cat.subcategories.length === 0 && (
                      <p className="text-sm text-gray-400 italic px-4 py-3 pl-10">No subcategories</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={handleSaveChecklist} disabled={saving}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Checklist Settings</span>
        </button>
      </div>

      {/* Delete Profile */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-red-100">
        <h2 className="text-lg font-semibold text-red-700 mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete the profile <strong>{profileName}</strong> and all its data. This cannot be undone.
        </p>
        {deleteStep === 'idle' && (
          <button onClick={() => setDeleteStep('confirm')}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <Trash2 className="w-4 h-4" /><span>Delete Profile</span>
          </button>
        )}
        {deleteStep === 'confirm' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">Enter your PIN to confirm deletion.</p>
            <input type="password" value={deletePinInput} onChange={(e) => setDeletePinInput(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your PIN" autoComplete="off" />
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (deletePinInput !== pin) { setError('Incorrect PIN'); return; }
                  setSaving(true);
                  try { await onDeleteProfile(); } catch { setError('Failed to delete profile.'); setSaving(false); }
                }}
                disabled={saving || !deletePinInput}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm Delete</span>
              </button>
              <button onClick={() => { setDeleteStep('idle'); setDeletePinInput(''); setError(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
    </div>
  );
};
