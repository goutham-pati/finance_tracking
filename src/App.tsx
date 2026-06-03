import React, { useState } from 'react';
import { BarChart3, DollarSign, Settings as SettingsIcon, Plus, LogOut, Edit3, User } from 'lucide-react';
import { PinLogin } from './components/PinLogin';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { EditDetails } from './components/EditDetails';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Settings } from './components/Settings';
import { useProfileData } from './hooks/useProfileData';

type Tab = 'dashboard' | 'transactions' | 'edit' | 'settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    profiles,
    currentProfile,
    loading,
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
    deleteProfile,
  } = useProfileData();

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setSelectedMonth('all');
  };

  if (!isAuthenticated) {
    return (
      <PinLogin
        onLogin={handleLogin}
        profiles={profiles}
        onProfileSelect={setCurrentProfile}
        onCreateProfile={createProfile}
        loading={loading}
      />
    );
  }

  const data = currentProfile?.data;
  if (!data) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'edit', label: 'Edit Details', icon: <Edit3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            monthlyData={data.monthlyData}
            categories={data.categories}
            monthlyChecklists={data.monthlyChecklists}
            transactions={data.transactions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onChecklistToggle={toggleChecklistItem}
            currency={data.settings.currency}
            checklistSettings={data.settings.checklistSettings}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={data.transactions}
            categories={data.categories}
            monthlyData={data.monthlyData}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            currency={data.settings.currency}
          />
        );
      case 'edit':
        return (
          <EditDetails
            categories={data.categories}
            monthlyData={data.monthlyData}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onAddSubcategory={addSubcategory}
            onUpdateSubcategory={updateSubcategory}
            onDeleteSubcategory={deleteSubcategory}
            onAddMonth={addMonth}
            onDeleteMonth={deleteMonth}
          />
        );
      case 'settings':
        return (
          <Settings
            pin={currentProfile!.pin}
            currency={data.settings.currency}
            categories={data.categories}
            profileName={currentProfile!.name}
            checklistSettings={data.settings.checklistSettings}
            onUpdateSettings={updateSettings}
            onDeleteProfile={async () => {
              await deleteProfile(currentProfile!.id);
              setIsAuthenticated(false);
              setActiveTab('dashboard');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Personal Finance</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{currentProfile?.name}</span>
              </div>
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800 p-2" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={data.categories}
        onAddTransaction={addTransaction}
        monthlyData={data.monthlyData}
      />
    </div>
  );
}

export default App;
