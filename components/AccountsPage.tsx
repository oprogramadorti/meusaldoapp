import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account } from '../types';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

const accountTypeNames: { [key in Account['type']]: string } = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de Crédito',
  wallet: 'Carteira'
};

const AccountsPage: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Account, 'id'>>({
    name: '',
    initialBalance: 0,
    type: 'checking'
  });
  
  const openModalForNew = () => {
    setEditingAccount(null);
    setFormData({ name: '', initialBalance: 0, type: 'checking' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData(account);
    setIsModalOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: name === 'initialBalance' ? (parseFloat(value) || 0) : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
        updateAccount({ ...formData, id: editingAccount.id });
    } else {
        addAccount(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (accountToDelete) {
        deleteAccount(accountToDelete);
    }
    setAccountToDelete(null);
  }
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Contas</h2>
        <button onClick={openModalForNew} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            <PlusIcon className="w-5 h-5" />
            <span>Adicionar Conta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">{account.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{accountTypeNames[account.type]}</p>
              <p className="text-2xl font-semibold mt-4">{formatCurrency(account.initialBalance)}</p>
              <p className="text-sm text-gray-600">Saldo inicial</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => openModalForEdit(account)} className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700"><PencilIcon /></button>
              <button onClick={() => setAccountToDelete(account.id)} className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><TrashIcon /></button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-center text-gray-600 py-5 md:col-span-2 lg:col-span-3">Nenhuma conta criada ainda.</p>}
      </div>

      {/* Edit/Add Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <h3 className="text-xl font-bold mb-4">{editingAccount ? 'Editar' : 'Adicionar'} Conta</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Nome da Conta (ex: Banco do Brasil)" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2" />
                <input type="number" step="0.01" name="initialBalance" value={formData.initialBalance} onChange={handleFormChange} placeholder="Saldo Inicial" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2" />
                <select name="type" value={formData.type} onChange={handleFormChange} required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2">
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="wallet">Carteira</option>
                </select>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir esta conta? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default AccountsPage;