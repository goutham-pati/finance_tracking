import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { Category, Transaction } from '../types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  monthlyData: { month: string }[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const monthFromDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddTransaction,
  monthlyData,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    month: '',
    categoryId: '',
    subcategoryId: '',
    amount: '',
    description: '',
    type: 'expenditure' as 'income' | 'expenditure',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.date) setFormData((prev) => ({ ...prev, month: monthFromDate(prev.date) }));
  }, [formData.date]);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        month: monthFromDate(today),
        categoryId: '',
        subcategoryId: '',
        amount: '',
        description: '',
        type: 'expenditure',
      });
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.categoryId || !formData.subcategoryId || !formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onAddTransaction({ ...formData, amount: parseFloat(formData.amount) });
      onClose();
    } catch {
      setError('Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setFormData({ ...formData, categoryId, subcategoryId: '', type: cat?.type || 'expenditure' });
    setError('');
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  const availableMonths = Array.from(new Set([...monthlyData.map((d) => d.month), formData.month]))
    .filter(Boolean)
    .sort((a, b) => new Date(b + ' 1').getTime() - new Date(a + ' 1').getTime());

  const isValid = formData.categoryId && formData.subcategoryId && formData.amount && parseFloat(formData.amount) > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add Transaction</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Auto-set from date</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <select
              value={formData.subcategoryId}
              onChange={(e) => { setFormData({ ...formData, subcategoryId: e.target.value }); setError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={!selectedCategory || isSubmitting}
              required
            >
              <option value="">Select Subcategory</option>
              {selectedCategory?.subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); setError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter description"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !isValid} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {isSubmitting ? <><Loader className="w-4 h-4 animate-spin mr-2" />Adding...</> : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
