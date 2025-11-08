import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Transaction, TransactionType } from '../types';
import FloatingActionButton from './FloatingActionButton';

const DashboardPage: React.FC = () => {
  const { transactions, accounts } = useAppContext();
  const navigate = useNavigate();

  const handleAddNewTransaction = () => {
    navigate('/transactions', { state: { openNewTransactionModal: true } });
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.initialBalance, 0) +
                       transactions.reduce((sum, t) => t.type === TransactionType.CREDIT ? sum + t.amount : sum - t.amount, 0);

  const thisMonthTransactions = transactions.filter(t => {
      const effectiveDateStr = t.dueDate || t.date;
      const today = new Date();
      const [year, month] = effectiveDateStr.split('-').map(Number);
      return (month - 1) === today.getMonth() && year === today.getFullYear();
  });
  
  const monthlyIncome = thisMonthTransactions
    .filter(t => t.type === TransactionType.CREDIT)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpenses = thisMonthTransactions
    .filter(t => t.type === TransactionType.DEBIT)
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => (b.dueDate || b.date).localeCompare(a.dueDate || a.date))
    .slice(0, 5);
    
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const getAmountClass = (transaction: Transaction) => {
    if (transaction.type === TransactionType.CREDIT) {
        return 'text-green-700'; // Credit
    }
    // It's a Debit
    return transaction.isPaid ? 'text-gray-600 dark:text-gray-400' : 'text-red-600'; // Paid vs Unpaid
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Saldo Total</h3>
          <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Receitas do Mês</h3>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Despesas do Mês</h3>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(monthlyExpenses)}</p>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <h3 className="text-xl font-bold mb-4">Últimas Transações</h3>
         <div className="overflow-x-auto">
             <table className="w-full text-left table-fixed">
                 <thead>
                     <tr className="border-b dark:border-gray-700">
                         <th className="py-2 w-1/2">Descrição</th>
                         <th className="py-2 w-1/4">Data</th>
                         <th className="py-2 w-1/4 text-right">Valor</th>
                     </tr>
                 </thead>
                 <tbody>
                     {recentTransactions.length > 0 ? recentTransactions.map(t => (
                         <tr key={t.id} className="border-b dark:border-gray-700">
                             <td className="py-3 truncate">{t.description}</td>
                             <td className="py-3">{new Date(t.dueDate || t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                             <td className={`py-3 text-right font-medium ${getAmountClass(t)}`}>
                                 {t.type === TransactionType.DEBIT && '- '}{formatCurrency(t.amount)}
                             </td>
                         </tr>
                     )) : (
                        <tr>
                            <td colSpan={3} className="text-center py-5 text-gray-600">Nenhuma transação registrada.</td>
                        </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </div>
      <FloatingActionButton onClick={handleAddNewTransaction} />
    </div>
  );
};

export default DashboardPage;