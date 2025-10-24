import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import useLocalStorage from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { 
    Transaction, 
    Category, 
    Subcategory, 
    Account, 
    TransactionType, 
    AppContextType,
    EvolutionAPISettings,
    Theme
} from '../types';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Firestore-backed state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // LocalStorage-backed state for settings
  const [evolutionAPISettings, setEvolutionAPISettings] = useLocalStorage<EvolutionAPISettings>('evolutionAPISettings', {
    serverUrl: '',
    instanceName: '',
    apiKey: '',
    notificationPhoneNumber: '',
    pixKey: ''
  });
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');

  // Theme logic
  useEffect(() => {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Data fetching from Firestore based on current user
  useEffect(() => {
    if (!currentUser) {
        setTransactions([]);
        setCategories([]);
        setSubcategories([]);
        setAccounts([]);
        return;
    }

    const userRef = `users/${currentUser.uid}`;

    const unsubscribeTransactions = onSnapshot(query(collection(db, userRef, "transactions")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(data);
    });
    const unsubscribeCategories = onSnapshot(query(collection(db, userRef, "categories")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(data);
    });
     const unsubscribeSubcategories = onSnapshot(query(collection(db, userRef, "subcategories")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subcategory[];
      setSubcategories(data);
    });
    const unsubscribeAccounts = onSnapshot(query(collection(db, userRef, "accounts")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(data);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeSubcategories();
      unsubscribeAccounts();
    };
  }, [currentUser]);


  // Transactions
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>, installments = 1) => {
    if (!currentUser) return;

    if (installments > 1) {
        const recurrenceId = uuidv4();
        for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(transaction.date + 'T00:00:00Z');
            installmentDate.setUTCMonth(installmentDate.getUTCMonth() + i);

            let installmentDueDate: Date | null = null;
            if (transaction.dueDate) {
                installmentDueDate = new Date(transaction.dueDate + 'T00:00:00Z');
                installmentDueDate.setUTCMonth(installmentDueDate.getUTCMonth() + i);
            }
            
            const installmentTransaction: Omit<Transaction, 'id'> = {
                ...transaction,
                description: `${transaction.description} (${i + 1}/${installments})`,
                date: installmentDate.toISOString().split('T')[0],
                dueDate: installmentDueDate ? installmentDueDate.toISOString().split('T')[0] : undefined,
                recurrenceId: recurrenceId,
            };
            await addDoc(collection(db, `users/${currentUser.uid}/transactions`), installmentTransaction);
        }
    } else {
        await addDoc(collection(db, `users/${currentUser.uid}/transactions`), transaction);
    }
  }, [currentUser]);
  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    if (!currentUser) return;
    const { id, ...dataToUpdate } = updatedTransaction;
    await updateDoc(doc(db, `users/${currentUser.uid}/transactions`, id), dataToUpdate);
  }, [currentUser]);
  const deleteTransaction = useCallback(async (id: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, `users/${currentUser.uid}/transactions`, id));
  }, [currentUser]);

  // Categories
  const addCategory = useCallback(async (name: string, type: TransactionType) => {
    if (!currentUser) return;
    if (name.trim() === '' || categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) return;
    await addDoc(collection(db, `users/${currentUser.uid}/categories`), { name: name.trim(), type });
  }, [currentUser, categories]);
  const deleteCategory = useCallback(async (id: string) => {
    if (!currentUser) return;
    // TODO: Implement cascading delete for related subcategories and transactions
    await deleteDoc(doc(db, `users/${currentUser.uid}/categories`, id));
  }, [currentUser]);

  // Subcategories
  const addSubcategory = useCallback(async (name: string, categoryId: string) => {
    if (!currentUser) return;
    if (name.trim() === '' || !categoryId) return;
    await addDoc(collection(db, `users/${currentUser.uid}/subcategories`), { name: name.trim(), categoryId });
  }, [currentUser]);
  const deleteSubcategory = useCallback(async (id: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, `users/${currentUser.uid}/subcategories`, id));
  }, [currentUser]);

  // Accounts
  const addAccount = useCallback(async (account: Omit<Account, 'id'>) => {
    if (!currentUser) return;
    await addDoc(collection(db, `users/${currentUser.uid}/accounts`), account);
  }, [currentUser]);
  const updateAccount = useCallback(async (updatedAccount: Account) => {
    if (!currentUser) return;
    const { id, ...dataToUpdate } = updatedAccount;
    await updateDoc(doc(db, `users/${currentUser.uid}/accounts`, id), dataToUpdate);
  }, [currentUser]);
  const deleteAccount = useCallback(async (id: string) => {
    if (!currentUser) return;
    // TODO: Implement cascading delete for related transactions
    await deleteDoc(doc(db, `users/${currentUser.uid}/accounts`, id));
  }, [currentUser]);
  
  // Evolution API
  const sendTestMessage = useCallback(async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    const { serverUrl, instanceName, apiKey } = evolutionAPISettings;
    if (!serverUrl || !instanceName || !apiKey) {
      return { success: false, message: 'Por favor, configure a Evolution API primeiro.' };
    }
    
    const cleanUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    const url = `${cleanUrl}/message/sendText/${instanceName}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: 'Olá! Esta é uma mensagem de teste do seu App Financeiro.'
        })
      });
      
      if(response.ok) {
        return { success: true, message: 'Mensagem de teste enviada com sucesso!' };
      } else {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
          else if (errorData.response?.message) errorMessage = errorData.response.message;
          else errorMessage = JSON.stringify(errorData);
        } catch (jsonError) {
          // Response body is not JSON or is empty.
        }
        return { success: false, message: `Falha ao enviar mensagem: ${errorMessage}` };
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      return { success: false, message: 'Ocorreu um erro ao tentar enviar a mensagem. Verifique se a URL do servidor está correta e acessível. Problemas de CORS também podem causar falhas.' };
    }
  }, [evolutionAPISettings]);
  
  const sendReminderNotification = useCallback(async (transactionsToRemind: Transaction[]) => {
      const { serverUrl, instanceName, apiKey, notificationPhoneNumber } = evolutionAPISettings;
      if (!serverUrl || !instanceName || !apiKey || !notificationPhoneNumber) {
        console.log('Cannot send reminder, API settings incomplete.');
        return;
      }

      const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      let messageText = `*Lembrete de Vencimento!*\n\nVocê tem ${transactionsToRemind.length} débito(s) com vencimento amanhã:\n`;
      transactionsToRemind.forEach(t => {
        messageText += `\n- *${t.description}*`;
        messageText += `\n  Vencimento: amanhã`;
        messageText += `\n  Valor: ${formatCurrency(t.amount)}\n`;
      });

      const cleanUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
      const url = `${cleanUrl}/message/sendText/${instanceName}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
          body: JSON.stringify({ number: notificationPhoneNumber, text: messageText })
        });

        if(response.ok) {
          console.log('Reminder notification sent successfully!');
        } else {
          const errorData = await response.text();
          console.error('Failed to send reminder notification:', errorData);
        }
      } catch (error) {
        console.error('Error sending reminder notification:', error);
      }
  }, [evolutionAPISettings]);

  const sendPaymentReminder = useCallback(async (transaction: Transaction) => {
    const { serverUrl, instanceName, apiKey, pixKey } = evolutionAPISettings;
    if (!serverUrl || !instanceName || !apiKey || !pixKey || !transaction.creditorPhone || !transaction.creditorName) {
      console.log('Cannot send payment reminder, API settings or transaction data incomplete for:', transaction.description);
      return;
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const formattedAmount = formatCurrency(transaction.amount);
    let messageText = `Olá ${transaction.creditorName}! Seu débito vence amanhã no valor de ${formattedAmount}.\n\nSegue chave PIX para realizar o pagamento:\n*${pixKey}*`;

    const cleanUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    const url = `${cleanUrl}/message/sendText/${instanceName}`;

    try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
          body: JSON.stringify({ number: transaction.creditorPhone, text: messageText })
        });
        if(response.ok) {
            console.log(`Payment reminder sent successfully for: ${transaction.description}`);
        } else {
            const errorData = await response.text();
            console.error(`Failed to send payment reminder for ${transaction.description}:`, errorData);
        }
    } catch (error) {
        console.error(`Error sending payment reminder for ${transaction.description}:`, error);
    }
  }, [evolutionAPISettings]);


  // Due date reminders
  useEffect(() => {
    const checkDueDates = () => {
      // Helper to get YYYY-MM-DD string from a Date object based on local timezone
      const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const localToday = new Date();
      const localTodayStr = getLocalDateString(localToday);

      const lastCheck = localStorage.getItem('lastDueDateCheck');
      if (lastCheck === localTodayStr) {
        console.log("Due date check already performed today.");
        return;
      }
      console.log(`Performing daily due date check for ${localTodayStr}.`);

      const localTomorrow = new Date();
      localTomorrow.setDate(localToday.getDate() + 1);
      const tomorrowStr = getLocalDateString(localTomorrow);

      const upcomingTransactions = transactions.filter(t => {
          // Direct string comparison is safe and avoids all timezone issues.
          // We check for transactions where the dueDate string is exactly tomorrow's date string.
          return !t.isPaid && t.dueDate === tomorrowStr;
      });
      
      if (upcomingTransactions.length > 0) {
          console.log(`Found ${upcomingTransactions.length} transactions due tomorrow (${tomorrowStr}).`);
          const debitsToRemind = upcomingTransactions.filter(t => t.type === TransactionType.DEBIT);
          const creditsToCharge = upcomingTransactions.filter(t => t.type === TransactionType.CREDIT);

          if (debitsToRemind.length > 0 && evolutionAPISettings.notificationPhoneNumber) {
              console.log("Sending reminders for debits:", debitsToRemind);
              sendReminderNotification(debitsToRemind);
          }

          if (creditsToCharge.length > 0) {
              console.log("Sending payment reminders for credits:", creditsToCharge);
              creditsToCharge.forEach(sendPaymentReminder);
          }

          localStorage.setItem('lastDueDateCheck', localTodayStr);
      } else {
        console.log(`No transactions due tomorrow (${tomorrowStr}).`);
      }
    };
    
    // Check on load and then every hour. 12 hours is too long if the user only opens the app briefly.
    const timeoutId = setTimeout(checkDueDates, 5000); // Check 5s after app loads
    const interval = setInterval(checkDueDates, 1000 * 60 * 60 * 1); // Check every hour
    return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
    }
  }, [transactions, evolutionAPISettings, sendReminderNotification, sendPaymentReminder]);

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
    addCategory,
    deleteCategory,
    subcategories,
    addSubcategory,
    deleteSubcategory,
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    evolutionAPISettings,
    setEvolutionAPISettings,
    sendTestMessage,
    theme,
    setTheme,
  }), [
    transactions, addTransaction, updateTransaction, deleteTransaction,
    categories, addCategory, deleteCategory,
    subcategories, addSubcategory, deleteSubcategory,
    accounts, addAccount, updateAccount, deleteAccount,
    evolutionAPISettings, setEvolutionAPISettings,
    sendTestMessage,
    theme, setTheme,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};