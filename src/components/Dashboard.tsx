import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, CheckSquare, Square, FolderOpen, Calendar } from 'lucide-react';
import { MonthlyData, Category, MonthlyChecklist, Transaction, ChecklistSettings } from '../types/finance';

interface DashboardProps {
  monthlyData: MonthlyData[];
  categories: Category[];
  monthlyChecklists: MonthlyChecklist[];
  transactions: Transaction[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onChecklistToggle: (month: string, subcategoryId: string) => void;
  onChecklistDueDayChange?: (month: string, subcategoryId: string, dueDay: number) => void;
  currency: string;
  checklistSettings?: ChecklistSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({
  monthlyData,
  categories,
  monthlyChecklists,
  transactions,
  selectedMonth,
  onMonthChange,
  onChecklistToggle,
  onChecklistDueDayChange,
  currency,
  checklistSettings,
}) => {
  const currentData =
    selectedMonth === 'all'
      ? monthlyData.reduce(
          (acc, data) => ({
            totalIncome: acc.totalIncome + data.totalIncome,
            totalExpenditure: acc.totalExpenditure + data.totalExpenditure,
            savings: acc.savings + data.savings,
            cumulativeSavings: monthlyData[0]?.cumulativeSavings || 0,
          }),
          { totalIncome: 0, totalExpenditure: 0, savings: 0, cumulativeSavings: 0 }
        )
      : monthlyData.find((d) => d.month === selectedMonth) || {
          totalIncome: 0,
          totalExpenditure: 0,
          savings: 0,
          cumulativeSavings: 0,
        };

  const formatCurrency = (amount: number) => `${currency}${Math.abs(amount).toLocaleString()}`;

  const savingsPercentage =
    currentData.totalIncome > 0 ? ((currentData.savings / currentData.totalIncome) * 100).toFixed(1) : '0';

  const getSectionWiseAmounts = () => {
    const filtered = selectedMonth === 'all' ? transactions : transactions.filter((t) => t.month === selectedMonth);
    const sectionAmounts = new Map<string, number>();
    filtered.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      if (!cat) return;
      sectionAmounts.set(cat.name, (sectionAmounts.get(cat.name) || 0) + t.amount);
    });
    return Array.from(sectionAmounts.entries())
      .map(([name, amount]) => ({ categoryName: name, amount, category: categories.find((c) => c.name === name) }))
      .sort((a, b) => b.amount - a.amount);
  };

  const sectionWiseAmounts = getSectionWiseAmounts();

  const getColorForSection = (index: number, type: 'income' | 'expenditure') => {
    const colors =
      type === 'income'
        ? ['#10b981', '#059669', '#047857', '#065f46', '#064e3b']
        : ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];
    return colors[index % colors.length];
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getCurrentMonthChecklist = () => {
    if (selectedMonth === 'all') return null;

    const itemConfigs = checklistSettings?.itemConfigs || [];
    const enabledConfigs = itemConfigs.filter((c) => c.enabled);

    // If no itemConfigs, fall back to enabledCategories (backward compat)
    if (enabledConfigs.length === 0 && checklistSettings?.enabledCategories?.length) {
      const enabledCategories = checklistSettings.enabledCategories;
      const categoriesToInclude = categories.filter((c) => enabledCategories.includes(c.id));
      const existingChecklist = monthlyChecklists.find((cl) => cl.month === selectedMonth);

      const items = categoriesToInclude.flatMap((cat) =>
        cat.subcategories.map((sub) => {
          const existingItem = existingChecklist?.items.find((i) => i.subcategoryId === sub.id);
          const hasTransaction = transactions.some((t) => t.month === selectedMonth && t.subcategoryId === sub.id);
          return {
            subcategoryId: sub.id,
            categoryId: cat.id,
            name: sub.name,
            categoryName: cat.name,
            completed: existingItem?.completed || hasTransaction,
            dueDay: existingItem?.dueDay || 1,
          };
        })
      );
      return items.length > 0 ? { month: selectedMonth, items } : null;
    }

    if (enabledConfigs.length === 0) return null;

    const existingChecklist = monthlyChecklists.find((cl) => cl.month === selectedMonth);

    const items = enabledConfigs.map((config) => {
      const cat = categories.find((c) => c.id === config.categoryId);
      const sub = cat?.subcategories.find((sc) => sc.id === config.subcategoryId);
      const existingItem = existingChecklist?.items.find((i) => i.subcategoryId === config.subcategoryId);
      const hasTransaction = transactions.some(
        (t) => t.month === selectedMonth && t.subcategoryId === config.subcategoryId
      );

      return {
        subcategoryId: config.subcategoryId,
        categoryId: config.categoryId,
        name: sub?.name || 'Unknown',
        categoryName: cat?.name || 'Unknown',
        completed: existingItem?.completed || hasTransaction,
        dueDay: existingItem?.dueDay || config.defaultDueDay,
      };
    }).filter((item) => item.name !== 'Unknown');

    return items.length > 0 ? { month: selectedMonth, items } : null;
  };

  const currentChecklist = getCurrentMonthChecklist();

  const getGroupedChecklistItems = () => {
    if (!currentChecklist) return [];
    const grouped = new Map<string, typeof currentChecklist.items>();
    currentChecklist.items.forEach((item) => {
      if (!grouped.has(item.categoryName)) grouped.set(item.categoryName, []);
      grouped.get(item.categoryName)!.push(item);
    });
    return Array.from(grouped.entries()).map(([name, items]) => ({
      categoryName: name,
      items: items.sort((a, b) => a.dueDay - b.dueDay),
      completedCount: items.filter((i) => i.completed).length,
    }));
  };

  const groupedChecklistItems = getGroupedChecklistItems();
  const totalChecklistItems = currentChecklist?.items.length || 0;
  const totalCompletedItems = currentChecklist?.items.filter((i) => i.completed).length || 0;

  // Check if there are any enabled checklist items (for hint message on "All Months")
  const hasChecklistItems = (() => {
    const itemConfigs = checklistSettings?.itemConfigs || [];
    if (itemConfigs.some((c) => c.enabled)) return true;
    if (checklistSettings?.enabledCategories?.length) return true;
    return false;
  })();

  const isOverdue = (dueDay: number) => {
    if (selectedMonth === 'all') return false;
    const now = new Date();
    const [monthName, yearStr] = selectedMonth.split(' ');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthIdx = monthNames.indexOf(monthName);
    const year = parseInt(yearStr);
    if (monthIdx === -1 || isNaN(year)) return false;
    if (year < now.getFullYear() || (year === now.getFullYear() && monthIdx < now.getMonth())) return true;
    if (year === now.getFullYear() && monthIdx === now.getMonth() && now.getDate() > dueDay) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Months (Total)</option>
          {monthlyData.map((d) => (
            <option key={d.month} value={d.month}>{d.month}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">{formatCurrency(currentData.totalIncome)}</p>
            </div>
            <div className="bg-emerald-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Total Expenditure</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatCurrency(currentData.totalExpenditure)}</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Savings</p>
              <p className={`text-lg sm:text-2xl font-bold truncate ${currentData.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {currentData.savings >= 0 ? formatCurrency(currentData.savings) : `-${formatCurrency(currentData.savings)}`}
              </p>
              <p className="text-xs text-gray-500">{savingsPercentage}% of income</p>
            </div>
            <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${currentData.savings >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${currentData.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Cumulative Savings</p>
              <p className={`text-lg sm:text-2xl font-bold truncate ${currentData.cumulativeSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {currentData.cumulativeSavings >= 0 ? formatCurrency(currentData.cumulativeSavings) : `-${formatCurrency(currentData.cumulativeSavings)}`}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${currentData.cumulativeSavings >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <PieChart className={`w-5 h-5 sm:w-6 sm:h-6 ${currentData.cumulativeSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Section-wise Amounts */}
      {sectionWiseAmounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
            Section-wise Breakdown {selectedMonth !== 'all' ? `- ${selectedMonth}` : ''}
          </h2>
          <div className="space-y-6">
            <div className="flex h-8 bg-gray-200 rounded-lg overflow-hidden">
              {sectionWiseAmounts.map((section, i) => {
                const total = sectionWiseAmounts.reduce((s, x) => s + x.amount, 0);
                const pct = (section.amount / total) * 100;
                return (
                  <div key={section.categoryName}
                    className="flex items-center justify-center text-white text-xs font-medium hover:opacity-80"
                    style={{ width: `${pct}%`, backgroundColor: getColorForSection(i, section.category?.type || 'expenditure') }}
                    title={`${section.categoryName}: ${formatCurrency(section.amount)} (${pct.toFixed(1)}%)`}>
                    {pct > 8 && <span className="truncate px-1">{section.categoryName.length > 10 ? section.categoryName.slice(0, 8) + '...' : section.categoryName}</span>}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionWiseAmounts.map((section, i) => {
                const color = getColorForSection(i, section.category?.type || 'expenditure');
                const total = sectionWiseAmounts.reduce((s, x) => s + x.amount, 0);
                const pct = (section.amount / total) * 100;
                return (
                  <div key={section.categoryName} className="bg-gray-50 rounded-lg p-4 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: color }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 text-sm truncate">{section.categoryName}</h3>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">{pct.toFixed(1)}%</span>
                      <span className="font-bold text-gray-800 text-sm">{formatCurrency(section.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Payment Checklist */}
      {selectedMonth === 'all' && hasChecklistItems && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 text-gray-500">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            <p className="text-sm">Select a specific month to view your payment checklist.</p>
          </div>
        </div>
      )}
      {currentChecklist && groupedChecklistItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-emerald-600" />
              Payment Checklist - {selectedMonth}
            </h2>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              totalCompletedItems === totalChecklistItems
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {totalCompletedItems}/{totalChecklistItems} Paid
            </span>
          </div>

          {/* Overall progress */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all"
                style={{ width: `${totalChecklistItems > 0 ? (totalCompletedItems / totalChecklistItems) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            {currentChecklist.items
              .sort((a, b) => a.dueDay - b.dueDay)
              .map((item) => {
                const overdue = !item.completed && isOverdue(item.dueDay);
                return (
                  <div key={item.subcategoryId}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      item.completed
                        ? 'bg-emerald-50 border border-emerald-200'
                        : overdue
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => onChecklistToggle(selectedMonth, item.subcategoryId)}>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className={`flex-shrink-0 ${item.completed ? 'text-emerald-600' : overdue ? 'text-red-400' : 'text-gray-400'}`}>
                        {item.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </span>
                      <span className={`text-sm font-medium truncate ${
                        item.completed ? 'text-emerald-700 line-through' : overdue ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {/* Due date */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500"
                        onClick={(e) => e.stopPropagation()}>
                        <Calendar className="w-3 h-3" />
                        {onChecklistDueDayChange ? (
                          <select
                            value={item.dueDay}
                            onChange={(e) => {
                              e.stopPropagation();
                              onChecklistDueDayChange(selectedMonth, item.subcategoryId, parseInt(e.target.value));
                            }}
                            className="text-xs border border-gray-200 rounded px-1 py-0.5 w-16 focus:ring-1 focus:ring-emerald-500"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d}{getDaySuffix(d)}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{item.dueDay}{getDaySuffix(item.dueDay)}</span>
                        )}
                      </div>
                      {/* Status tag */}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.completed
                          ? 'bg-emerald-100 text-emerald-700'
                          : overdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.completed ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Monthly Savings Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Savings Trend</h2>
        <div className="space-y-3">
          {monthlyData.slice(0, 6).map((d) => (
            <div key={d.month} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">{d.month}</span>
              <div className="flex items-center space-x-4">
                <span className={`font-semibold ${d.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {d.savings >= 0 ? formatCurrency(d.savings) : `-${formatCurrency(d.savings)}`}
                </span>
                <div className={`w-2 h-2 rounded-full ${d.savings >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income vs Expenditure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenditure</h2>
        <div className="space-y-4">
          {monthlyData.slice(0, 3).map((d) => {
            const max = Math.max(d.totalIncome, d.totalExpenditure) || 1;
            return (
              <div key={d.month} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{d.month}</span>
                  <span>{formatCurrency(max)}</span>
                </div>
                <div className="flex space-x-1 h-4 bg-gray-100 rounded">
                  <div className="bg-emerald-500 rounded-l" style={{ width: `${(d.totalIncome / max) * 100}%` }} />
                  <div className="bg-red-500 rounded-r" style={{ width: `${(d.totalExpenditure / max) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Income: {formatCurrency(d.totalIncome)}</span>
                  <span>Expenditure: {formatCurrency(d.totalExpenditure)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-emerald-500 rounded" /><span>Income</span></div>
          <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-red-500 rounded" /><span>Expenditure</span></div>
        </div>
      </div>
    </div>
  );
};
