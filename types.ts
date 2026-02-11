
import { User } from 'firebase/auth';

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  type: TransactionType;
  categoryId: string;
  subcategoryId?: string;
  accountId: string;
  isRecurring?: boolean;
  recurrenceEndDate?: string;
  installments?: number;
  recurrenceId?: string;
  isPaid?: boolean;
  creditorName?: string;
  creditorPhone?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  type: 'checking' | 'savings' | 'credit_card' | 'wallet';
}

export interface EvolutionAPISettings {
    serverUrl: string;
    instanceName: string;
    apiKey: string;
    notificationPhoneNumber?: string;
    pixKey?: string;
}

export interface ReminderSettings {
  isEnabled: boolean;
  daysBefore: number;
  messageTemplate: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionsByMonth: (year: number, month: number) => Promise<void>;
  resetTransactions: () => Promise<void>;
  categories: Category[];
  addCategory: (name: string, type: TransactionType) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  subcategories: Subcategory[];
  addSubcategory: (name: string, categoryId: string) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  evolutionAPISettings: EvolutionAPISettings;
  setEvolutionAPISettings: (settings: EvolutionAPISettings) => Promise<void>;
  reminderSettings: ReminderSettings;
  setReminderSettings: (settings: ReminderSettings) => Promise<void>;
  sendTestMessage: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
}
