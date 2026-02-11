
import React, { useMemo } from 'react';
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

  // Centralizando a data de hoje para consistência em todos os cálculos
  const today = useMemo(() => new Date(), []);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Cálculo do Saldo Real: Saldo Inicial + Créditos - Débitos Pagos (ou Débitos com data até hoje)
  const totalBalance = useMemo(() => {
    const initial = accounts.reduce((sum, account) => sum + account.initialBalance, 0);
    const balanceFromTransactions = transactions.reduce((sum, t) => {
      // Créditos sempre somam (pois geralmente são recebidos na data)
      if (t.type === TransactionType.CREDIT) return sum + t.amount;
      
      // Débitos só subtraem se estiverem marcados como pagos OU se a data já passou (vencidos)
      const tDate = new Date(t.dueDate || t.date);
      if (t.isPaid || tDate <= today) {
        return sum - t.amount;
      }
      return sum;
    }, 0);
    return initial + balanceFromTransactions;
  }, [accounts, transactions, today]);

  // Transações específicas deste mês
  const thisMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const effectiveDateStr = t.dueDate || t.date;
      const [year, month] = effectiveDateStr.split('-').map(Number);
      return (month - 1) === currentMonth && year === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const monthlyIncome = useMemo(() => 
    thisMonthTransactions
      .filter(t => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0),
    [thisMonthTransactions]
  );
    
  const monthlyExpenses = useMemo(() => 
    thisMonthTransactions
      .filter(t => t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + t.amount, 0),
    [thisMonthTransactions]
  );

  // Últimas Transações: Ordenadas por proximidade com HOJE (evitando que parcelas de anos futuros dominem a lista)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter(t => {
          const tDate = new Date(t.dueDate || t.date);
          // Mostra apenas transações passadas ou do mês atual para o dashboard ser "recente"
          return tDate <= new Date(currentYear, currentMonth + 1, 0); 
      })
      .sort((a, b) => (b.dueDate || b.date).localeCompare(a.dueDate || a.date))
      .slice(0, 5);
  }, [transactions, currentMonth, currentYear]);
    
  const getAmountClass = (transaction: Transaction) => {
    if (transaction.type === TransactionType.CREDIT) {
        return 'text-green-700 dark:text-green-400';
    }
    return transaction.isPaid ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border dark:border-gray-700">
            {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo Total Atual</h3>
          <p className={`text-3xl font-extrabold mt-1 ${totalBalance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-2 italic">* Considera saldo inicial e débitos pagos/vencidos.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receitas do Mês</h3>
          <p className="text-3xl font-extrabold mt-1 text-green-700 dark:text-green-400">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Despesas do Mês</h3>
          <p className="text-3xl font-extrabold mt-1 text-red-700 dark:text-red-400">{formatCurrency(monthlyExpenses)}</p>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Movimentações Recentes</h3>
            <button onClick={() => navigate('/transactions')} className="text-sm text-blue-600 hover:underline">Ver todas</button>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left table-fixed">
                 <thead>
                     <tr className="border-b dark:border-gray-700 text-gray-400 text-xs uppercase">
                         <th className="py-2 w-1/2 font-semibold">Descrição</th>
                         <th className="py-2 w-1/6 text-center font-semibold">Data</th>
                         <th className="py-2 w-1/3 text-right font-semibold">Valor</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-gray-700">
                     {recentTransactions.length > 0 ? recentTransactions.map(t => (
                         <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                             <td className="py-4 truncate pr-2 text-gray-800 dark:text-gray-200 font-medium">{t.description}</td>
                             <td className="py-4 text-center whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                                {new Date(t.dueDate || t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit' })}
                             </td>
                             <td className={`py-4 text-right font-bold whitespace-nowrap ${getAmountClass(t)}`}>
                                 {t.type === TransactionType.DEBIT && '- '}{formatCurrency(t.amount)}
                             </td>
                         </tr>
                     )) : (
                        <tr>
                            <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400 italic">Nenhuma transação recente encontrada.</td>
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
