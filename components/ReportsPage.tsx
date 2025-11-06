import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction, TransactionType, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ReportsPage: React.FC = () => {
  const { transactions, categories, accounts } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, []);


  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const effectiveDateStr = t.dueDate || t.date;
      const [year, month] = effectiveDateStr.split('-').map(Number);
      return (month - 1) === currentDate.getMonth() && year === currentDate.getFullYear();
    }).sort((a, b) => (b.dueDate || b.date).localeCompare(a.dueDate || a.date));
  }, [transactions, currentDate]);

  const monthlyIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );
  
  const monthlyExpenses = useMemo(() =>
    filteredTransactions
      .filter(t => t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const netBalance = monthlyIncome - monthlyExpenses;

  const expenseByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === TransactionType.DEBIT);
    const data = expenses.reduce((acc, transaction) => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Sem Categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += transaction.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, categories]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D1FF'];

  const getAmountClass = (transaction: Transaction) => {
    if (transaction.type === TransactionType.CREDIT) {
        return 'text-green-700';
    }
    return transaction.isPaid ? 'text-gray-600 dark:text-gray-400' : 'text-red-600';
  };
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Do not render label for very small slices to avoid clutter
    if (percent * 100 < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Relatório Mensal</h2>
        <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow">
          <button onClick={handlePreviousMonth} className="px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">&lt;</button>
          <span className="font-semibold w-32 text-center capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={handleNextMonth} className="px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">&gt;</button>
        </div>
      </div>
      
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Receita Total</h3>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Despesa Total</h3>
                <p className="text-3xl font-bold text-red-700">{formatCurrency(monthlyExpenses)}</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Saldo Líquido</h3>
                <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(netBalance)}</p>
            </div>
        </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Análise do Mês</h3>
        {filteredTransactions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Chart */}
            <div className="h-80">
              <h4 className="text-lg font-semibold text-center mb-2">Despesas por Categoria</h4>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={isMobile ? renderCustomizedLabel : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-gray-600">Nenhuma despesa no mês.</div>
              )}
            </div>

            {/* Transactions List */}
            <div className="max-h-96 overflow-y-auto">
              <h4 className="text-lg font-semibold mb-2">Transações do Mês</h4>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="py-2">Descrição</th>
                    <th className="py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="border-b dark:border-gray-700">
                      <td className="py-2">
                        <div>{t.description}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                           {t.dueDate
                                ? `Venc: ${new Date(t.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`
                                : new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
                            }
                        </div>
                      </td>
                      <td className={`py-2 text-right font-medium ${getAmountClass(t)}`}>
                        {t.type === TransactionType.DEBIT && '- '}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">Nenhuma transação encontrada para este mês.</p>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;