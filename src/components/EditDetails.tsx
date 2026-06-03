import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderPlus, Tag, Calendar, Loader } from 'lucide-react';
import { Category, MonthlyData } from '../types/finance';

interface EditDetailsProps {
  categories: Category[];
  monthlyData: MonthlyData[];
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddSubcategory: (categoryId: string, name: string) => Promise<void>;
  onUpdateSubcategory: (categoryId: string, subcategoryId: string, name: string) => Promise<void>;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => Promise<void>;
  onAddMonth: (month: string) => Promise<void>;
  onDeleteMonth: (month: string) => Promise<void>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const EditDetails: React.FC<EditDetailsProps> = ({
  categories,
  monthlyData,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onAddMonth,
  onDeleteMonth,
}) => {
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expenditure' as 'income' | 'expenditure' });
  const [newSubcategory, setNewSubcategory] = useState({ categoryId: '', name: '' });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategoryId: string } | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: '', type: 'expenditure' as 'income' | 'expenditure' });
  const [editSubcategoryForm, setEditSubcategoryForm] = useState('');
  const [newMonthName, setNewMonthName] = useState('');
  const [newMonthYear, setNewMonthYear] = useState(new Date().getFullYear().toString());
  const [deleteMonthConfirm, setDeleteMonthConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);
  const [deleteSubConfirm, setDeleteSubConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const withSaving = async (fn: () => Promise<void>) => {
    setSaving(true);
    try { await fn(); } finally { setSaving(false); }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    withSaving(() => onAddCategory({ name: newCategory.name.trim(), type: newCategory.type, subcategories: [] }));
    setNewCategory({ name: '', type: 'expenditure' });
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategory.name.trim() || !newSubcategory.categoryId) return;
    withSaving(() => onAddSubcategory(newSubcategory.categoryId, newSubcategory.name.trim()));
    setNewSubcategory({ categoryId: '', name: '' });
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editCategoryForm.name.trim()) return;
    withSaving(() => onUpdateCategory(editingCategory!, editCategoryForm));
    setEditingCategory(null);
  };

  const handleSaveSubcategory = () => {
    if (!editingSubcategory || !editSubcategoryForm.trim()) return;
    withSaving(() => onUpdateSubcategory(editingSubcategory!.categoryId, editingSubcategory!.subcategoryId, editSubcategoryForm.trim()));
    setEditingSubcategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (deleteCatConfirm === id) {
      withSaving(() => onDeleteCategory(id));
      setDeleteCatConfirm(null);
    } else {
      setDeleteCatConfirm(id);
      setTimeout(() => setDeleteCatConfirm(null), 3000);
    }
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    const key = `${categoryId}-${subcategoryId}`;
    if (deleteSubConfirm === key) {
      withSaving(() => onDeleteSubcategory(categoryId, subcategoryId));
      setDeleteSubConfirm(null);
    } else {
      setDeleteSubConfirm(key);
      setTimeout(() => setDeleteSubConfirm(null), 3000);
    }
  };

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName || !newMonthYear) return;
    const month = `${newMonthName} ${newMonthYear}`;
    withSaving(() => onAddMonth(month));
    setNewMonthName('');
  };

  const handleDeleteMonth = (month: string) => {
    if (deleteMonthConfirm === month) {
      withSaving(() => onDeleteMonth(month));
      setDeleteMonthConfirm(null);
    } else {
      setDeleteMonthConfirm(month);
      setTimeout(() => setDeleteMonthConfirm(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {saving && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
          <Loader className="w-4 h-4 animate-spin mr-2" />Saving...
        </div>
      )}

      {/* Month Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Manage Months
        </h2>
        <form onSubmit={handleAddMonth} className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={newMonthName}
              onChange={(e) => setNewMonthName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="">Select Month</option>
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={newMonthYear}
              onChange={(e) => setNewMonthYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="2020"
              max="2030"
              required
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Month
            </button>
          </div>
        </form>

        {monthlyData.length > 0 && (
          <div className="space-y-2">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-800">{d.month}</span>
                <button
                  onClick={() => handleDeleteMonth(d.month)}
                  className={
                    deleteMonthConfirm === d.month
                      ? 'text-white bg-red-600 px-3 py-1 rounded text-xs font-medium'
                      : 'text-red-600 hover:text-red-800'
                  }
                >
                  {deleteMonthConfirm === d.month ? 'Confirm Delete?' : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FolderPlus className="w-5 h-5 mr-2" />
          Add New Category
        </h2>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <select
              value={newCategory.type}
              onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expenditure' })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="income">Income</option>
              <option value="expenditure">Expenditure</option>
            </select>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        </form>
      </div>

      {/* Add New Subcategory */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Tag className="w-5 h-5 mr-2" />
          Add New Subcategory
        </h2>
        <form onSubmit={handleAddSubcategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={newSubcategory.categoryId}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subcategory name"
              value={newSubcategory.name}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </button>
          </div>
        </form>
      </div>

      {/* Existing Categories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Manage Categories</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              {editingCategory === category.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={editCategoryForm.name}
                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                  <select
                    value={editCategoryForm.type}
                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, type: e.target.value as 'income' | 'expenditure' })}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="income">Income</option>
                    <option value="expenditure">Expenditure</option>
                  </select>
                  <div className="flex space-x-2">
                    <button onClick={handleSaveCategory} className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 text-sm">Save</button>
                    <button onClick={() => setEditingCategory(null)} className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-600">Type: {category.type} | Subcategories: {category.subcategories.length}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setEditingCategory(category.id); setEditCategoryForm({ name: category.name, type: category.type }); }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className={deleteCatConfirm === category.id ? 'text-white bg-red-600 px-2 py-1 rounded text-xs' : 'text-red-600 hover:text-red-800'}
                    >
                      {deleteCatConfirm === category.id ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pl-4 border-l-2 border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Subcategories:</h4>
                <div className="space-y-2">
                  {category.subcategories.map((sc) => {
                    const subKey = `${category.id}-${sc.id}`;
                    return (
                      <div key={sc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        {editingSubcategory?.categoryId === category.id && editingSubcategory?.subcategoryId === sc.id ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={editSubcategoryForm}
                              onChange={(e) => setEditSubcategoryForm(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                            />
                            <button onClick={handleSaveSubcategory} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Save</button>
                            <button onClick={() => setEditingSubcategory(null)} className="text-gray-600 hover:text-gray-800 text-sm font-medium">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-800">{sc.name}</span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => { setEditingSubcategory({ categoryId: category.id, subcategoryId: sc.id }); setEditSubcategoryForm(sc.name); }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(category.id, sc.id)}
                                className={deleteSubConfirm === subKey ? 'text-white bg-red-600 px-2 py-1 rounded text-xs' : 'text-red-600 hover:text-red-800'}
                              >
                                {deleteSubConfirm === subKey ? 'Confirm?' : <Trash2 className="w-3 h-3" />}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {category.subcategories.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No subcategories yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
