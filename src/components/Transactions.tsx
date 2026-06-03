import React, { useState } from 'react';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { Transaction, Category } from '../types/finance';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  monthlyData: { month: string }[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  currency: string;
}

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  categories,
  monthlyData,
  selectedMonth,
  onMonthChange,
  onUpdateTransaction,
  onDeleteTransaction,
  currency,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredTransactions = (
    selectedMonth === 'all' ? transactions : transactions.filter((t) => t.month === selectedMonth)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm(transaction);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdateTransaction(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteTransaction(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name || 'Unknown';

  const getSubcategoryName = (categoryId: string, subcategoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.subcategories.find((sc) => sc.id === subcategoryId)?.name || 'Unknown';
  };

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Months</option>
          {monthlyData.map((d) => (
            <option key={d.month} value={d.month}>
              {d.month}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-600">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          {selectedMonth !== 'all' ? ` in ${selectedMonth}` : ''}
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  {editingId === t.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.subcategoryId || ''}
                          onChange={(e) => {
                            const subId = e.target.value;
                            const cat = categories.find((c) => c.subcategories.some((sc) => sc.id === subId));
                            setEditForm({ ...editForm, subcategoryId: subId, categoryId: cat?.id || '', type: cat?.type || 'expenditure' });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                        >
                          {categories.map((cat) => (
                            <optgroup key={cat.id} label={cat.name}>
                              {cat.subcategories.map((sc) => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <input
                          type="text"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editForm.amount || ''}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Save</button>
                          <button onClick={() => { setEditingId(null); setEditForm({}); }} className="text-gray-600 hover:text-gray-800 text-sm font-medium">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
                          <span>{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{getCategoryName(t.categoryId)}</div>
                          <div className="text-gray-500">{getSubcategoryName(t.categoryId, t.subcategoryId)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">{t.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <DollarSign className={`w-4 h-4 ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`} />
                          <span className={`font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className={deleteConfirmId === t.id ? 'text-white bg-red-600 px-2 py-1 rounded text-xs' : 'text-red-600 hover:text-red-800'}
                          >
                            {deleteConfirmId === t.id ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">
              {selectedMonth === 'all' ? 'Add your first transaction with the + button.' : `No transactions for ${selectedMonth}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
