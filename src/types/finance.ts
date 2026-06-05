export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expenditure';
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Transaction {
  id: string;
  date: string;
  month: string;
  categoryId: string;
  subcategoryId: string;
  amount: number;
  description: string;
  type: 'income' | 'expenditure';
}

export interface MonthlyData {
  month: string;
  totalIncome: number;
  totalExpenditure: number;
  savings: number;
  cumulativeSavings: number;
}

export interface ChecklistItemConfig {
  subcategoryId: string;
  categoryId: string;
  enabled: boolean;
  defaultDueDay: number; // day of month (1-31)
}

export interface ChecklistItem {
  subcategoryId: string;
  categoryId: string;
  name: string;
  categoryName: string;
  completed: boolean;
  dueDay: number; // day of month, can be overridden per month
}

export interface MonthlyChecklist {
  month: string;
  items: ChecklistItem[];
}

export interface ChecklistSettings {
  enabledCategories: string[]; // kept for backward compat
  itemConfigs: ChecklistItemConfig[];
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  monthlyData: MonthlyData[];
  monthlyChecklists: MonthlyChecklist[];
  settings: {
    pin: string;
    currency: string;
    checklistSettings?: ChecklistSettings;
  };
}

export interface Profile {
  id: string;
  name: string;
  pin: string;
  data: AppData;
}
