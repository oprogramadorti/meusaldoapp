import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import LogoIcon from './icons/LogoIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import TagIcon from './icons/TagIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import CogIcon from './icons/CogIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LogoIcon className="w-5 h-5" /> },
        { path: '/transactions', label: 'Transações', icon: <DocumentTextIcon className="w-5 h-5" /> },
        { path: '/reports', label: 'Relatórios', icon: <ChartBarIcon className="w-5 h-5" /> },
        { path: '/accounts', label: 'Contas', icon: <CreditCardIcon className="w-5 h-5" /> },
        { path: '/categories', label: 'Categorias', icon: <TagIcon className="w-5 h-5" /> },
        { path: '/settings', label: 'Configurações', icon: <CogIcon className="w-5 h-5" /> },
        { path: '/help', label: 'Ajuda', icon: <QuestionMarkCircleIcon className="w-5 h-5" /> },
    ];
    
    const NavLinkItem: React.FC<{path: string, label: string, icon: React.ReactNode, onClick?: () => void}> = ({ path, label, icon, onClick }) => (
        <NavLink
            to={path}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md gap-3 transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <LogoIcon className="h-8 w-8" />
                        <span className="ml-2 text-xl font-bold">Meu Saldo</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems.map(item => <NavLinkItem key={item.path} {...item} />)}
                        <ThemeToggle />
                        {currentUser && (
                            <div className="flex items-center ml-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2 hidden lg:block">{currentUser.email}</span>
                                <button onClick={handleLogout} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Sair</button>
                            </div>
                        )}
                    </nav>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <ThemeToggle />
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                            <span className="sr-only">Open main menu</span>
                            {/* Icon for menu */}
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map(item => <NavLinkItem key={item.path} {...item} onClick={() => setIsMenuOpen(false)}/>)}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                         {currentUser && (
                            <div className="px-3 py-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{currentUser.email}</p>
                                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;