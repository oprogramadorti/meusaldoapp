
import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, writeBatch, setDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    Transaction, 
    Category, 
    Subcategory, 
    Account, 
    TransactionType, 
    AppContextType,
    EvolutionAPISettings,
    ReminderSettings,
    Theme
} from '../types';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Firestore-backed state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reminderSettings, setReminderSettingsState] = useState<ReminderSettings>({
    isEnabled: false,
    daysBefore: 1,
    messageTemplate: 'Olá {nome}! Lembrete: seu débito no valor de {valor} vence em breve.\n\nSegue chave PIX para pagamento: {pix}',
  });
  const [evolutionAPISettings, setEvolutionAPISettingsState] = useState<EvolutionAPISettings>({
    serverUrl: '',
    instanceName: '',
    apiKey: '',
    notificationPhoneNumber: '',
    pixKey: ''
  });

  // LocalStorage-backed state for theme
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
        setReminderSettingsState({
            isEnabled: false,
            daysBefore: 1,
            messageTemplate: 'Olá {nome}! Lembrete: seu débito no valor de {valor} vence em breve.\n\nSegue chave PIX para pagamento: {pix}',
        });
        setEvolutionAPISettingsState({
            serverUrl: '',
            instanceName: '',
            apiKey: '',
            notificationPhoneNumber: '',
            pixKey: ''
        });
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
     const unsubscribeSettings = onSnapshot(doc(db, userRef, "settings", "reminders"), (doc) => {
        if (doc.exists()) {
            setReminderSettingsState(doc.data() as ReminderSettings);
        }
    });
    const unsubscribeEvoSettings = onSnapshot(doc(db, userRef, "settings", "evolutionAPI"), (doc) => {
        if (doc.exists()) {
            setEvolutionAPISettingsState(doc.data() as EvolutionAPISettings);
        }
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeSubcategories();
      unsubscribeAccounts();
      unsubscribeSettings();
      unsubscribeEvoSettings();
    };
  }, [currentUser]);


  // Transactions
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
  
    if (transaction.isRecurring && transaction.installments) {
      const batch = writeBatch(db);
      const recurrenceId = uuidv4();
  
      const startDate = new Date(`${transaction.date}T12:00:00Z`);
      const totalMonths = transaction.installments;
  
      let currentDate = new Date(startDate);
      const originalDay = startDate.getUTCDate();
      
      const hasDueDate = !!transaction.dueDate;
      let dueDay: number | undefined;
      let dueMonthOffset = 0;
  
      if (hasDueDate) {
        const tempDueDate = new Date(`${transaction.dueDate}T12:00:00Z`);
        dueDay = tempDueDate.getUTCDate();
        const startMonthTotal = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
        const dueMonthTotal = tempDueDate.getUTCFullYear() * 12 + tempDueDate.getUTCMonth();
        dueMonthOffset = dueMonthTotal - startMonthTotal;
      }
  
      for (let i = 0; i < totalMonths; i++) {
        const newTransactionDocRef = doc(collection(db, `users/${currentUser.uid}/transactions`));
  
        const newTransactionData: Omit<Transaction, 'id'> = {
          ...transaction,
          description: `${transaction.description} (${i + 1}/${totalMonths})`,
          date: currentDate.toISOString().split('T')[0],
          recurrenceId: recurrenceId,
          isRecurring: true, 
          installments: totalMonths,
        };
  
        if (hasDueDate && dueDay !== undefined) {
          let newDueDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + dueMonthOffset, 1));
          const lastDayOfDueMonth = new Date(Date.UTC(newDueDate.getUTCFullYear(), newDueDate.getUTCMonth() + 1, 0)).getUTCDate();
          newDueDate.setUTCDate(Math.min(dueDay, lastDayOfDueMonth));
          newTransactionData.dueDate = newDueDate.toISOString().split('T')[0];
        }
  
        batch.set(newTransactionDocRef, newTransactionData);
  
        // Move to the next month, preserving the day of the month correctly
        const nextMonthDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + i + 1, 1));
        const lastDayOfNextMonth = new Date(Date.UTC(nextMonthDate.getUTCFullYear(), nextMonthDate.getUTCMonth() + 1, 0)).getUTCDate();
        nextMonthDate.setUTCDate(Math.min(originalDay, lastDayOfNextMonth));
        currentDate = nextMonthDate;
      }
  
      await batch.commit();
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

    const transactionDocRef = doc(db, `users/${currentUser.uid}/transactions`, id);
    
    try {
        const transactionDoc = await getDoc(transactionDocRef);
        if (!transactionDoc.exists()) {
            console.log("Transaction not found, might be already deleted.");
            return;
        }

        const transactionData = transactionDoc.data();
        const recurrenceId = transactionData?.recurrenceId;

        if (recurrenceId) {
            // It's a recurring transaction, delete all in the series
            const batch = writeBatch(db);
            const transactionsCollectionRef = collection(db, `users/${currentUser.uid}/transactions`);
            const q = query(transactionsCollectionRef, where("recurrenceId", "==", recurrenceId));
            
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        } else {
            // It's a single transaction
            await deleteDoc(transactionDocRef);
        }
    } catch (error) {
        console.error("Error deleting transaction(s): ", error);
    }
  }, [currentUser]);

  const deleteTransactionsByMonth = useCallback(async (year: number, month: number) => {
    if (!currentUser) return;

    try {
        const batch = writeBatch(db);
        const transactionsToDelete = transactions.filter(t => {
            const effectiveDateStr = t.dueDate || t.date;
            const [tYear, tMonth] = effectiveDateStr.split('-').map(Number);
            return tYear === year && (tMonth - 1) === month;
        });

        if (transactionsToDelete.length === 0) return;

        transactionsToDelete.forEach(t => {
            const docRef = doc(db, `users/${currentUser.uid}/transactions`, t.id);
            batch.delete(docRef);
        });

        await batch.commit();
    } catch (error) {
        console.error("Error deleting monthly transactions: ", error);
    }
  }, [currentUser, transactions]);

  const resetTransactions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
        const userRef = `users/${currentUser.uid}`;
        const transactionsCollectionRef = collection(db, userRef, "transactions");
        const querySnapshot = await getDocs(transactionsCollectionRef);
        
        // Use batch to delete everything. 
        // Note: Firestore batches are limited to 500 operations.
        // For larger data sets, we would need a recursive or chunked approach.
        let batch = writeBatch(db);
        let count = 0;
        
        const deletePromises: Promise<void>[] = [];

        for (const docSnapshot of querySnapshot.docs) {
            batch.delete(docSnapshot.ref);
            count++;
            
            if (count === 500) {
                deletePromises.push(batch.commit());
                batch = writeBatch(db);
                count = 0;
            }
        }
        
        if (count > 0) {
            deletePromises.push(batch.commit());
        }

        await Promise.all(deletePromises);
        console.log("All transactions reset successfully.");
    } catch (error) {
        console.error("Error resetting transactions: ", error);
        throw error;
    }
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

   // Reminder Settings
  const setReminderSettings = useCallback(async (settings: ReminderSettings) => {
    if (!currentUser) return;
    const settingsRef = doc(db, `users/${currentUser.uid}/settings`, 'reminders');
    // Ensure daysBefore is stored as a number
    const settingsToSave = {
        ...settings,
        daysBefore: Number(settings.daysBefore)
    };
    await setDoc(settingsRef, settingsToSave, { merge: true });
  }, [currentUser]);
  
  // Evolution API Settings
  const setEvolutionAPISettings = useCallback(async (settings: EvolutionAPISettings) => {
      if (!currentUser) return;
      const settingsRef = doc(db, `users/${currentUser.uid}/settings`, 'evolutionAPI');
      await setDoc(settingsRef, settings, { merge: true });
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
    if (!serverUrl || !instanceName || !apiKey || !transaction.creditorPhone || !transaction.creditorName) {
      console.log('Cannot send payment reminder, API settings or transaction data incomplete for:', transaction.description);
      return;
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formattedAmount = formatCurrency(transaction.amount);

    const messageText = reminderSettings.messageTemplate
      .replace(/\{nome\}/g, transaction.creditorName)
      .replace(/\{valor\}/g, formattedAmount)
      .replace(/\{pix\}/g, pixKey || 'Não informada');

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
  }, [evolutionAPISettings, reminderSettings]);


  // Due date reminders
  useEffect(() => {
    const checkDueDates = () => {
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

      // Logic for User's Debit Reminders (sent to user) - Fixed to 1 day before
      const localTomorrow = new Date();
      localTomorrow.setDate(localToday.getDate() + 1);
      const tomorrowStr = getLocalDateString(localTomorrow);
      
      const debitsDueTomorrow = transactions.filter(t => 
        t.type === TransactionType.DEBIT && 
        !t.isPaid && 
        t.dueDate === tomorrowStr
      );

      if (debitsDueTomorrow.length > 0 && evolutionAPISettings.notificationPhoneNumber) {
        console.log(`Sending user reminder for ${debitsDueTomorrow.length} debits due tomorrow.`);
        sendReminderNotification(debitsDueTomorrow);
      }
      
      // Logic for Creditor Payment Reminders (sent to creditor) - Configurable
      if (reminderSettings.isEnabled) {
        const daysBefore = Number(reminderSettings.daysBefore) || 1;
        const reminderTriggerDate = new Date();
        reminderTriggerDate.setDate(localToday.getDate() + daysBefore);
        const reminderTriggerDateStr = getLocalDateString(reminderTriggerDate);

        const creditsToRemind = transactions.filter(t =>
            t.type === TransactionType.CREDIT &&
            !t.isPaid &&
            t.dueDate === reminderTriggerDateStr &&
            t.creditorPhone
        );
        
        if (creditsToRemind.length > 0) {
            console.log(`Found ${creditsToRemind.length} credits due in ${daysBefore} day(s). Sending payment reminders.`);
            creditsToRemind.forEach(sendPaymentReminder);
        }
      }

      localStorage.setItem('lastDueDateCheck', localTodayStr);
    };
    
    // Check on load and then every hour.
    const timeoutId = setTimeout(checkDueDates, 5000); // Check 5s after app loads
    const interval = setInterval(checkDueDates, 1000 * 60 * 60 * 1); // Check every hour
    return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
    }
  }, [transactions, evolutionAPISettings, reminderSettings, sendReminderNotification, sendPaymentReminder]);

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactionsByMonth,
    resetTransactions,
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
    reminderSettings,
    setReminderSettings,
    sendTestMessage,
    theme,
    setTheme,
  }), [
    transactions, addTransaction, updateTransaction, deleteTransaction, deleteTransactionsByMonth, resetTransactions,
    categories, addCategory, deleteCategory,
    subcategories, addSubcategory, deleteSubcategory,
    accounts, addAccount, updateAccount, deleteAccount,
    evolutionAPISettings, setEvolutionAPISettings,
    reminderSettings, setReminderSettings,
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
