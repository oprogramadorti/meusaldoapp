import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType } from '../types';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

const CategoriesPage: React.FC = () => {
  const { categories, subcategories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useAppContext();
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState<TransactionType>(TransactionType.DEBIT);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'category' | 'subcategory' } | null>(null);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      addCategory(newCategory, categoryType);
      setNewCategory('');
    }
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentCategory) {
        alert('Por favor, selecione uma categoria pai.');
        return;
    }
    if (newSubcategory.trim()) {
      addSubcategory(newSubcategory, parentCategory);
      setNewSubcategory('');
      setParentCategory('');
    }
  };

  const handleDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'category') {
        deleteCategory(itemToDelete.id);
      } else {
        deleteSubcategory(itemToDelete.id);
      }
    }
    setItemToDelete(null);
  };
  
  const TypeBadge: React.FC<{type: TransactionType}> = ({type}) => {
      const isDebit = type === TransactionType.DEBIT;
      return (
          <span className={`px-2 py-1 text-xs font-semibold leading-none rounded-full ${isDebit ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
              {isDebit ? 'Débito' : 'Crédito'}
          </span>
      )
  }

  const filteredCategories = useMemo(() => {
    if (filterType === 'all') {
      return categories;
    }
    return categories.filter(category => category.type === filterType);
  }, [categories, filterType]);

  const FilterButton: React.FC<{ label: string; type: 'all' | TransactionType; }> = ({ label, type }) => {
    const isActive = filterType === type;
    return (
      <button
        onClick={() => setFilterType(type)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-600 text-white shadow'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciar Categorias</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Category */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Adicionar Categoria</h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                 <div className="mt-2 flex gap-4">
                    <label className="flex items-center">
                        <input type="radio" name="categoryType" value={TransactionType.DEBIT} checked={categoryType === TransactionType.DEBIT} onChange={() => setCategoryType(TransactionType.DEBIT)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                        <span className="ml-2">Débito</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="categoryType" value={TransactionType.CREDIT} checked={categoryType === TransactionType.CREDIT} onChange={() => setCategoryType(TransactionType.CREDIT)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                        <span className="ml-2">Crédito</span>
                    </label>
                 </div>
            </div>
            <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-grow min-w-0 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">Adicionar</button>
            </div>
          </form>
        </div>
        
        {/* Add Subcategory */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Adicionar Subcategoria</h3>
          <form onSubmit={handleAddSubcategory} className="space-y-4">
             <select 
                value={parentCategory} 
                onChange={e => setParentCategory(e.target.value)}
                className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                required
              >
              <option value="">Selecione a Categoria Pai</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newSubcategory} 
                    onChange={e => setNewSubcategory(e.target.value)}
                    placeholder="Nome da subcategoria"
                    className="flex-grow min-w-0 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">Adicionar</button>
            </div>
          </form>
        </div>
      </div>
      
      {/* List Categories and Subcategories */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Categorias Existentes</h3>
        
        <div className="flex items-center gap-2 mb-4">
            <FilterButton label="Todos" type="all" />
            <FilterButton label="Débito" type={TransactionType.DEBIT} />
            <FilterButton label="Crédito" type={TransactionType.CREDIT} />
        </div>

        <div className="space-y-4">
          {filteredCategories.length > 0 ? filteredCategories.map(category => (
            <div key={category.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{category.name}</h4>
                    <TypeBadge type={category.type} />
                </div>
                <button onClick={() => setItemToDelete({ id: category.id, type: 'category' })} className="text-red-600 hover:text-red-700"><TrashIcon/></button>
              </div>
              <ul className="mt-2 ml-4 space-y-1">
                {subcategories.filter(sc => sc.categoryId === category.id).map(subcategory => (
                  <li key={subcategory.id} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span>- {subcategory.name}</span>
                    <button onClick={() => setItemToDelete({ id: subcategory.id, type: 'subcategory' })} className="text-red-600 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )) : <p className="text-center text-gray-600 py-5">Nenhuma categoria encontrada para o filtro selecionado.</p>}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza de que deseja excluir esta ${itemToDelete?.type === 'category' ? 'categoria' : 'subcategoria'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default CategoriesPage;