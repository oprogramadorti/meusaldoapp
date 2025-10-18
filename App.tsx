import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import TransactionsPage from './components/TransactionsPage';
import ReportsPage from './components/ReportsPage';
import CategoriesPage from './components/CategoriesPage';
import AccountsPage from './components/AccountsPage';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import LoginPage from './components/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import BiometricLockScreen from './components/BiometricLockScreen';

const App: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        if (!loading) {
            const biometricEnabled = localStorage.getItem('biometricUnlockEnabled') === 'true';
            if (currentUser && biometricEnabled) {
                setIsLocked(true);
            } else {
                setIsLocked(false);
            }
        }
    }, [currentUser, loading]);

    // This is the crucial change. We wait for Firebase auth to be fully resolved
    // before rendering any routes. This prevents the race condition.
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
                <Route 
                    path="/*"
                    element={
                        <PrivateRoute>
                            {isLocked ? (
                                <BiometricLockScreen onUnlock={() => setIsLocked(false)} />
                            ) : (
                                <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                                    <Header />
                                    <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                                        <Routes>
                                            <Route path="/" element={<Navigate to="/dashboard" />} />
                                            <Route path="/dashboard" element={<DashboardPage />} />
                                            <Route path="/transactions" element={<TransactionsPage />} />
                                            <Route path="/reports" element={<ReportsPage />} />
                                            <Route path="/categories" element={<CategoriesPage />} />
                                            <Route path="/accounts" element={<AccountsPage />} />
                                            <Route path="/settings" element={<SettingsPage />} />
                                            <Route path="/help" element={<HelpPage />} />
                                            {/* Catch-all for any other authenticated routes */}
                                            <Route path="*" element={<Navigate to="/dashboard" />} />
                                        </Routes>
                                    </main>
                                    <AddToHomeScreenPrompt />
                                </div>
                            )}
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;