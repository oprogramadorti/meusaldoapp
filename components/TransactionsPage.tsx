
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Transaction, TransactionType, Category, Subcategory } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import EllipsisVerticalIcon from './icons/EllipsisVerticalIcon';
import CalendarXMarkIcon from './icons/CalendarXMarkIcon'; // Assuming this is the calendar icon from the image
import FloatingActionButton from './FloatingActionButton';

const TransactionsPage: React.FC = () => {
    const { 
        transactions, 
        categories, 
        subcategories, 
        accounts, 
        addTransaction, 
        updateTransaction, 
        deleteTransaction,
        deleteTransactionsByMonth
    } = useAppContext();

    const location = useLocation();
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [enableBilling, setEnableBilling] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
    
    const initialFormData = {
        description: '',
        amount: '' as (number | ''),
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        type: TransactionType.DEBIT,
        categoryId: '',
        subcategoryId: '',
        accountId: '',
        isPaid: false,
        creditorName: '',
        creditorPhone: '',
        isRecurring: false,
        installments: '' as (number | ''),
    };
    const [formData, setFormData] = useState(initialFormData);

    const availableCategories = useMemo(() => categories.filter(c => c.type === formData.type), [formData.type, categories]);
    const availableSubcategories = useMemo(() => formData.categoryId ? subcategories.filter(sc => sc.categoryId === formData.categoryId) : [], [formData.categoryId, subcategories]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ 
                ...prev, 
                [name]: checked,
                // Reset installments if recurrence is disabled
                ...(!checked && name === 'isRecurring' && { installments: '' })
            }));
        } else if (name === 'type') {
            setFormData(prev => ({ ...prev, type: value as TransactionType, categoryId: '', subcategoryId: '' }));
            if(value !== TransactionType.CREDIT) setEnableBilling(false);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    useEffect(() => {
        if (formData.categoryId && !subcategories.some(sc => sc.id === formData.subcategoryId && sc.categoryId === formData.categoryId)) {
            setFormData(prev => ({ ...prev, subcategoryId: '' }));
        }
    }, [formData.categoryId, formData.subcategoryId, subcategories]);

    const handlePreviousMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const filteredTransactions = useMemo(() => 
        transactions.filter(t => {
            // Filter by Date
            const effectiveDateStr = t.dueDate || t.date;
            const [year, month] = effectiveDateStr.split('-').map(Number);
            const isSameMonth = (month - 1) === currentDate.getMonth() && year === currentDate.getFullYear();
            
            // Filter by Type (Credit/Debit)
            const isSameType = filterType === 'all' || t.type === filterType;

            return isSameMonth && isSameType;
        }).sort((a, b) => (b.dueDate || b.date).localeCompare(a.dueDate || a.date)),
        [transactions, currentDate, filterType]
    );

    const openModalForNew = () => {
        setEditingTransaction(null);
        setFormData(initialFormData);
        setEnableBilling(false);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    useEffect(() => {
        if (location.state?.openNewTransactionModal) {
            openModalForNew();
            // Clear the state so the modal doesn't reopen on refresh or back navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    const openModalForEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            ...initialFormData, // Start with defaults to ensure all fields are present
            ...transaction,
            date: new Date(transaction.date).toISOString().split('T')[0],
            dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : '',
            installments: transaction.installments || '',
        });
        setEnableBilling(!!(transaction.type === TransactionType.CREDIT && transaction.creditorName && transaction.creditorPhone));
        setIsModalOpen(true);
        setActiveMenu(null);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload: Omit<Transaction, 'id'> = {
            description: formData.description,
            amount: parseFloat(String(formData.amount)) || 0,
            date: formData.date,
            type: formData.type,
            categoryId: formData.categoryId,
            accountId: formData.accountId,
            isPaid: formData.isPaid,
            isRecurring: formData.isRecurring,
            // Optional fields are only included if they have a value
            ...(formData.dueDate && { dueDate: formData.dueDate }),
            ...(formData.subcategoryId && { subcategoryId: formData.subcategoryId }),
            ...(formData.isRecurring && { installments: Number(formData.installments) }),
            ...(formData.type === TransactionType.CREDIT && enableBilling && formData.creditorName && { creditorName: formData.creditorName }),
            ...(formData.type === TransactionType.CREDIT && enableBilling && formData.creditorPhone && { creditorPhone: formData.creditorPhone }),
        };

        if (editingTransaction) {
            updateTransaction({ ...payload, id: editingTransaction.id });
        } else {
            addTransaction(payload);
        }
        setIsModalOpen(false);
    };
    
    const handleDelete = () => {
        if (transactionToDelete) deleteTransaction(transactionToDelete);
        setTransactionToDelete(null);
        setActiveMenu(null);
    };

    const handleDeleteAllMonthly = () => {
        deleteTransactionsByMonth(currentDate.getFullYear(), currentDate.getMonth());
        setIsDeleteAllModalOpen(false);
    };

    const getAmountClass = (transaction: Transaction) => {
        if (transaction.type === TransactionType.CREDIT) return 'text-green-600 dark:text-green-400';
        return transaction.isPaid ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400';
    };

    const tagColors = [
        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    ];
    const getTagColor = (name: string = '') => tagColors[name.length % tagColors.length];

    const FilterButton = ({ label, type }: { label: string; type: 'all' | TransactionType }) => (
        <button
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border whitespace-nowrap ${
                filterType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
        const account = accounts.find(a => a.id === transaction.accountId);
        const category = categories.find(c => c.id === transaction.categoryId);
        const subcategory = subcategories.find(sc => sc.id === transaction.subcategoryId);
        const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        return (
            <li className="py-4 px-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
                    <CalendarXMarkIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{account?.name || 'Conta desconhecida'}</p>
                    <p className="text-md font-semibold text-gray-800 dark:text-white truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {category && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTagColor(category.name)}`}>{category.name}</span>}
                        {subcategory && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTagColor(subcategory.name)}`}>{subcategory.name}</span>}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                    {transaction.dueDate && (
                        <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                           Venc. {formatDate(transaction.dueDate)}
                        </p>
                    )}
                    <p className={`text-md font-bold ${getAmountClass(transaction)}`}>{formatCurrency(transaction.amount)}</p>
                </div>
                <div className="relative flex-shrink-0">
                    <button onClick={() => setActiveMenu(prev => prev === transaction.id ? null : transaction.id)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full">
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {activeMenu === transaction.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border dark:border-gray-600">
                            <ul className="py-1">
                                <li>
                                    <button onClick={() => openModalForEdit(transaction)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <PencilIcon className="w-4 h-4" /> Editar
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setTransactionToDelete(transaction.id)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <TrashIcon className="w-4 h-4"/> Excluir
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </li>
        );
    };

    const currentMonthLabel = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Transações</h2>
            </div>

            <div className="bg-red-600 text-white flex items-center justify-between p-2 rounded-lg shadow-lg">
                <button onClick={handlePreviousMonth} className="p-2 rounded-full hover:bg-red-700 transition-colors"><ChevronLeftIcon className="w-6 h-6"/></button>
                <span className="font-bold text-lg capitalize">{currentMonthLabel}</span>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-red-700 transition-colors"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <FilterButton label="Todos" type="all" />
                    <FilterButton label="Débitos" type={TransactionType.DEBIT} />
                    <FilterButton label="Créditos" type={TransactionType.CREDIT} />
                </div>
                {filteredTransactions.length > 0 && (
                    <button
                        onClick={() => setIsDeleteAllModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Excluir Todos</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                {filteredTransactions.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTransactions.map(t => <TransactionItem key={t.id} transaction={t} />)}
                    </ul>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-16">Nenhuma transação encontrada para este mês.</p>
                )}
            </div>
            
            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <h3 className="text-xl font-bold mb-4">{editingTransaction ? 'Editar' : 'Adicionar'} Transação</h3>
                            
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <label className={`w-full text-center py-2 px-4 rounded-md transition font-medium text-sm ${formData.type === TransactionType.DEBIT ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-400'} ${editingTransaction ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <input type="radio" name="type" value={TransactionType.DEBIT} checked={formData.type === TransactionType.DEBIT} onChange={handleFormChange} className="sr-only" disabled={!!editingTransaction} />
                                    Débito
                                </label>
                                <label className={`w-full text-center py-2 px-4 rounded-md transition font-medium text-sm ${formData.type === TransactionType.CREDIT ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-400'} ${editingTransaction ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <input type="radio" name="type" value={TransactionType.CREDIT} checked={formData.type === TransactionType.CREDIT} onChange={handleFormChange} className="sr-only" disabled={!!editingTransaction} />
                                    Crédito
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                                    <input type="text" name="description" value={formData.description} onChange={handleFormChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
                                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleFormChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conta</label>
                                    <select name="accountId" value={formData.accountId} onChange={handleFormChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Selecione...</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data da Transação</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleFormChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Vencimento</label>
                                    <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleFormChange} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                                    <select name="categoryId" value={formData.categoryId} onChange={handleFormChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Selecione...</option>
                                        {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subcategoria</label>
                                    <select name="subcategoryId" value={formData.subcategoryId || ''} onChange={handleFormChange} disabled={!formData.categoryId || availableSubcategories.length === 0} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                        <option value="">Nenhuma</option>
                                        {availableSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 pt-2">
                                        <input type="checkbox" id="isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleFormChange} disabled={!!editingTransaction} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                                        <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">Lançamento Recorrente (Parcelado)</label>
                                    </div>
                                </div>

                                {formData.isRecurring && (
                                    <div className="md:col-span-2 animate-fade-in-up">
                                        <label htmlFor="installments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Parcelas</label>
                                        <select
                                            id="installments"
                                            name="installments"
                                            value={formData.installments || ''}
                                            onChange={handleFormChange}
                                            required={formData.isRecurring}
                                            disabled={!!editingTransaction}
                                            className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num}x</option>
                                            ))}
                                        </select>
                                        {!!editingTransaction && <p className="text-xs text-gray-500 mt-1">A recorrência não pode ser alterada na edição de uma única parcela.</p>}
                                    </div>
                                )}
                            </div>

                             {formData.type === TransactionType.DEBIT && (
                                <div className="flex items-center gap-2 pt-2">
                                     <input type="checkbox" id="isPaid" name="isPaid" checked={formData.isPaid} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"/>
                                     <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 dark:text-gray-300">Marcar como pago</label>
                                </div>
                             )}
                             
                             {formData.type === TransactionType.CREDIT && (
                                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="enableBillingToggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar cobrança automática?</label>
                                        <button type="button" id="enableBillingToggle" onClick={() => setEnableBilling(!enableBilling)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enableBilling ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`} aria-pressed={enableBilling}>
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enableBilling ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    {enableBilling && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                                             <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Credor</label>
                                                <input type="text" name="creditorName" value={formData.creditorName || ''} onChange={handleFormChange} required={enableBilling} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone do Credor</label>
                                                <input type="text" name="creditorPhone" value={formData.creditorPhone || ''} onChange={handleFormChange} placeholder="Ex: 5511999998888" required={enableBilling} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                isOpen={!!transactionToDelete} 
                onClose={() => setTransactionToDelete(null)} 
                onConfirm={handleDelete} 
                title="Confirmar Exclusão" 
                message="Tem certeza de que deseja excluir esta transação? Se for um lançamento recorrente, todas as parcelas associadas também serão removidas."
            />

            <ConfirmationModal 
                isOpen={isDeleteAllModalOpen} 
                onClose={() => setIsDeleteAllModalOpen(false)} 
                onConfirm={handleDeleteAllMonthly} 
                title="Excluir TODOS os lançamentos?" 
                message={`ATENÇÃO: Você está prestes a excluir todos os lançamentos de ${currentMonthLabel}. Esta ação é irreversível e afetará débitos e créditos deste período.`}
            />
        
            <FloatingActionButton onClick={openModalForNew} />
        </div>
    );
};

export default TransactionsPage;
