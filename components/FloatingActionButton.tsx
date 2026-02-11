import React from 'react';
import PlusIcon from './icons/PlusIcon';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Adicionar nova transação"
      title="Adicionar nova transação"
      className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-transform transform hover:scale-110"
    >
      <PlusIcon className="w-8 h-8" />
    </button>
  );
};

export default FloatingActionButton;