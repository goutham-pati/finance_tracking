import React, { useState } from 'react';
import { Save, Key, Loader, Trash2, AlertTriangle } from 'lucide-react';
import { Category } from '../types/finance';

interface SettingsProps {
  pin: string;
  currency: string;
  categories: Category[];
  profileName: string;
  checklistSettings?: { enabledCategories: string[] };
  onUpdateSettings: (settings: {
    pin?: string;
    currency?: string;
    checklistSettings?: { enabledCategories: string[] };
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
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    checklistSettings?.enabledCategories || []
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'pin'>('idle');
  const [deletePinInput, setDeletePinInput] = useState('');

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
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

  const toggleChecklistCategory = (categoryId: string) => {
    setEnabledCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleSaveChecklist = async () => {
    setSaving(true);
    try {
      await onUpdateSettings({ checklistSettings: { enabledCategories } });
      showSuccess('Checklist settings saved.');
    } catch {
      setError('Failed to save checklist settings.');
    } finally {
      setSaving(false);
    }
  };

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
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter current PIN"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Minimum 4 digits"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Confirm new PIN"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
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
            <select
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="₹">₹ (Indian Rupee)</option>
              <option value="$">$ (US Dollar)</option>
              <option value="€">€ (Euro)</option>
              <option value="£">£ (British Pound)</option>
            </select>
          </div>
          <button
            onClick={handleCurrencyChange}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Currency</span>
          </button>
        </div>
      </div>

      {/* Checklist Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Checklist Categories</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select which expenditure categories appear in the monthly payment checklist.
        </p>
        <div className="space-y-2 mb-4">
          {categories
            .filter((c) => c.type === 'expenditure')
            .map((c) => (
              <label key={c.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledCategories.includes(c.id)}
                  onChange={() => toggleChecklistCategory(c.id)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-500">({c.subcategories.length} items)</span>
              </label>
            ))}
        </div>
        <button
          onClick={handleSaveChecklist}
          disabled={saving}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
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
          Permanently delete the profile <strong>{profileName}</strong> and all its transactions, categories, and checklists. This cannot be undone.
        </p>

        {deleteStep === 'idle' && (
          <button
            onClick={() => setDeleteStep('confirm')}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Profile</span>
          </button>
        )}

        {deleteStep === 'confirm' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">Are you sure? Enter your PIN to confirm deletion.</p>
            <input
              type="password"
              value={deletePinInput}
              onChange={(e) => setDeletePinInput(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your PIN"
              autoComplete="off"
            />
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (deletePinInput !== pin) {
                    setError('Incorrect PIN');
                    return;
                  }
                  setSaving(true);
                  try {
                    await onDeleteProfile();
                  } catch {
                    setError('Failed to delete profile.');
                    setSaving(false);
                  }
                }}
                disabled={saving || !deletePinInput}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm Delete</span>
              </button>
              <button
                onClick={() => { setDeleteStep('idle'); setDeletePinInput(''); setError(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
      )}
    </div>
  );
};
