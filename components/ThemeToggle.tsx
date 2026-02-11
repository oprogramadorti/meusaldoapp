import React from 'react';
// Fix: Use correct relative path for context import
import { useAppContext } from '../context/AppContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import ComputerDesktopIcon from './icons/ComputerDesktopIcon';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useAppContext();

    const cycleTheme = () => {
        if (theme === 'system') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('dark');
        } else {
            setTheme('system');
        }
    };

    const themeIcon = {
        light: <SunIcon className="w-5 h-5" />,
        dark: <MoonIcon className="w-5 h-5" />,
        system: <ComputerDesktopIcon className="w-5 h-5" />,
    };

    const themeLabel = {
        light: 'Mudar para modo escuro',
        dark: 'Mudar para modo sistema',
        system: 'Mudar para modo claro'
    }

    return (
        <button
            onClick={cycleTheme}
            aria-label={themeLabel[theme]}
            title={themeLabel[theme]}
            className="flex items-center justify-center p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors duration-200"
        >
            {themeIcon[theme]}
        </button>
    );
};

export default ThemeToggle;
