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

export interface ChecklistItem {
  subcategoryId: string;
  categoryId: string;
  name: string;
  categoryName: string;
  completed: boolean;
}

export interface MonthlyChecklist {
  month: string;
  items: ChecklistItem[];
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  monthlyData: MonthlyData[];
  monthlyChecklists: MonthlyChecklist[];
  settings: {
    pin: string;
    currency: string;
    checklistSettings?: {
      enabledCategories: string[];
    };
  };
}

export interface Profile {
  id: string;
  name: string;
  pin: string;
  data: AppData;
}
