import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, User, ChevronDown, Plus, Loader } from 'lucide-react';
import { Profile } from '../types/finance';
import { CreateProfileModal } from './CreateProfileModal';
import { CreateProfileResult } from '../hooks/useFirebaseProfiles';

interface PinLoginProps {
  onLogin: () => void;
  profiles: Profile[];
  onProfileSelect: (profileId: string) => void;
  onCreateProfile: (name: string, pin: string) => Promise<CreateProfileResult>;
  loading?: boolean;
}

export const PinLogin: React.FC<PinLoginProps> = ({
  onLogin,
  profiles,
  onProfileSelect,
  onCreateProfile,
  loading = false,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
      onProfileSelect(profiles[0].id);
    }
  }, [profiles, selectedProfile, onProfileSelect]);

  const handleProfileSelect = async (profile: Profile) => {
    setSelectedProfile(profile);
    await onProfileSelect(profile.id);
    setShowProfileDropdown(false);
    setEnteredPin('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) {
      setError('Please select a profile');
      return;
    }

    if (enteredPin === selectedProfile.pin) {
      onLogin();
    } else {
      setError('Incorrect PIN');
      setEnteredPin('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Profiles</h2>
          <p className="text-gray-600">Connecting to cloud...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Personal Finance</h1>
          <p className="text-gray-600 mb-6">Create your first profile to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Profile
          </button>
          <CreateProfileModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateProfile={onCreateProfile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        {/* Profile Selector */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {selectedProfile?.name || 'Select'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-lg ${
                      selectedProfile?.id === profile.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{profile.name}</span>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors rounded-b-lg text-emerald-600 font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Create New Profile</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-8 mt-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Personal Finance</h1>
          <p className="text-gray-600 mt-2">
            Enter PIN for {selectedProfile?.name || 'selected profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                id="pin"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your PIN"
                maxLength={6}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Access App
          </button>
        </form>
      </div>

      <CreateProfileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProfile={onCreateProfile}
      />
    </div>
  );
};
