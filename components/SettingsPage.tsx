
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import FingerPrintIcon from './icons/FingerPrintIcon';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import KeyIcon from './icons/KeyIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import BellIcon from './icons/BellIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

const SettingsPage: React.FC = () => {
    const { 
        evolutionAPISettings, 
        setEvolutionAPISettings, 
        sendTestMessage,
        reminderSettings,
        setReminderSettings,
        transactions,
        categories,
        subcategories,
        accounts,
        resetTransactions
    } = useAppContext();
    const { currentUser } = useAuth();
    
    const [settings, setSettings] = useState(evolutionAPISettings);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [biometricSupport, setBiometricSupport] = useState<boolean | null>(null);

    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // State for reminder settings
    const [localReminderSettings, setLocalReminderSettings] = useState(reminderSettings);
    const [isSavingReminders, setIsSavingReminders] = useState(false);
    const [reminderSaveSuccess, setReminderSaveSuccess] = useState(false);

    // State for data management
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Sync local API settings state with context
    useEffect(() => {
        setSettings(evolutionAPISettings);
    }, [evolutionAPISettings]);
    
    // Sync local reminder settings state with context
    useEffect(() => {
        setLocalReminderSettings(reminderSettings);
    }, [reminderSettings]);

    // Check for biometric support on mount
    useEffect(() => {
        const checkSupport = async () => {
            try {
                // Verificamos se a API básica existe e se o autenticador de plataforma está disponível
                if (window.PublicKeyCredential && 
                    navigator.credentials && 
                    navigator.credentials.create &&
                    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
                    setBiometricSupport(true);
                } else {
                    setBiometricSupport(false);
                }
            } catch (e) {
                console.warn("Falha ao verificar suporte biométrico:", e);
                setBiometricSupport(false);
            }
        };
        checkSupport();
        setIsBiometricEnabled(localStorage.getItem('biometricUnlockEnabled') === 'true');
    }, []);
    
    // Autosave API settings with debounce
    useEffect(() => {
        // Prevent saving on initial render or if settings haven't changed
        if (JSON.stringify(settings) === JSON.stringify(evolutionAPISettings)) {
            return;
        }

        setSaveStatus('saving');
        const timer = setTimeout(() => {
            setEvolutionAPISettings(settings)
                .then(() => {
                    setSaveStatus('saved');
                })
                .catch(() => {
                    setSaveStatus('error');
                });
        }, 1500); // 1.5-second debounce

        return () => clearTimeout(timer);
    }, [settings, evolutionAPISettings, setEvolutionAPISettings]);

    const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleApiInputFocus = () => {
        if (saveStatus === 'saved' || saveStatus === 'error') {
            setSaveStatus('idle');
        }
    };

    const handleTest = async () => {
        if (!testPhoneNumber) {
            alert('Por favor, insira um número de telefone para o teste.');
            return;
        }
        setIsTesting(true);
        const result = await sendTestMessage(testPhoneNumber);
        alert(result.message);
        setIsTesting(false);
    }
    
    const handleBiometricToggle = () => {
        if (isBiometricEnabled) {
            // Disable
            localStorage.removeItem('biometricUnlockEnabled');
            setIsBiometricEnabled(false);
        } else {
            // Enable
            localStorage.setItem('biometricUnlockEnabled', 'true');
            setIsBiometricEnabled(true);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
    
        if (newPassword !== confirmPassword) {
            setPasswordError('As novas senhas não coincidem.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
    
        setIsPasswordChanging(true);
        try {
            if (!currentUser || !currentUser.email) {
                throw new Error("Usuário não encontrado ou sem e-mail associado.");
            }
            
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            
            await updatePassword(currentUser, newPassword);
            
            setPasswordSuccess('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
    
        } catch (error: any) {
            console.error("Error changing password:", error);
            if (error.code === 'auth/wrong-password') {
                setPasswordError('A senha atual está incorreta.');
            } else if (error.code === 'auth/too-many-requests') {
                setPasswordError('Muitas tentativas. Tente novamente mais tarde.');
            } else {
                setPasswordError('Ocorreu um erro ao alterar a senha.');
            }
        } finally {
            setIsPasswordChanging(false);
        }
    };

    const handleReminderSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setLocalReminderSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveReminders = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingReminders(true);
        try {
            await setReminderSettings(localReminderSettings);
            setReminderSaveSuccess(true);
            setTimeout(() => setReminderSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save reminder settings", error);
            alert("Erro ao salvar configurações de lembrete.");
        } finally {
            setIsSavingReminders(false);
        }
    };

    const handleExportCSV = () => {
        if (transactions.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const headers = ["ID", "Descrição", "Valor", "Data", "Vencimento", "Tipo", "Categoria", "Subcategoria", "Conta", "Pago", "Recorrente", "Parcelas"];
        const rows = transactions.map(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name || "";
            const sub = subcategories.find(s => s.id === t.subcategoryId)?.name || "";
            const acc = accounts.find(a => a.id === t.accountId)?.name || "";
            
            return [
                t.id,
                t.description.replace(/,/g, "."), // Avoid CSV delimiter issues
                t.amount.toString(),
                t.date,
                t.dueDate || "",
                t.type,
                cat,
                sub,
                acc,
                t.isPaid ? "Sim" : "Não",
                t.isRecurring ? "Sim" : "Não",
                t.installments?.toString() || ""
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `meu_saldo_backup_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetData = async () => {
        setIsResetting(true);
        try {
            await resetTransactions();
            alert("Todos os lançamentos foram removidos com sucesso.");
        } catch (error) {
            console.error("Failed to reset data", error);
            alert("Ocorreu um erro ao tentar limpar os dados.");
        } finally {
            setIsResetting(false);
            setIsResetModalOpen(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Configurações</h2>

            {/* Backup and Data Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-6 h-6" /> Backup e Dados
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Gerencie seus dados. Você pode exportar todas as suas transações para um arquivo CSV ou limpar todos os lançamentos do sistema.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-1">Exportar Backup</h4>
                        <p className="text-xs text-gray-500 mb-4">Gera um arquivo CSV com todos os seus débitos e créditos.</p>
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5" /> Exportar para CSV
                        </button>
                    </div>

                    <div className="p-4 border border-red-100 dark:border-red-900/20 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                        <h4 className="font-bold text-red-800 dark:text-red-400 mb-1">Limpar Lançamentos</h4>
                        <p className="text-xs text-red-600/70 dark:text-red-400/60 mb-4">Remove todas as receitas e despesas. Categorias e contas serão mantidas.</p>
                        <button 
                            onClick={() => setIsResetModalOpen(true)}
                            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                        >
                            <TrashIcon className="w-5 h-5" /> Resetar Sistema
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Configuração da Evolution API</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Insira os dados da sua instância da Evolution API para ativar notificações. As alterações são salvas automaticamente.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL do Servidor</label>
                        <input
                            type="url"
                            id="serverUrl"
                            name="serverUrl"
                            value={settings.serverUrl}
                            onChange={handleApiSettingsChange}
                            onFocus={handleApiInputFocus}
                            placeholder="https://example.com"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Instância</label>
                        <input
                            type="text"
                            id="instanceName"
                            name="instanceName"
                            value={settings.instanceName}
                            onChange={handleApiSettingsChange}
                            onFocus={handleApiInputFocus}
                            placeholder="my-instance"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                        <input
                            type="password"
                            id="apiKey"
                            name="apiKey"
                            value={settings.apiKey}
                            onChange={handleApiSettingsChange}
                            onFocus={handleApiInputFocus}
                            placeholder="Sua chave de API secreta"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="notificationPhoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº de Telefone para Notificações</label>
                        <input
                            type="text"
                            id="notificationPhoneNumber"
                            name="notificationPhoneNumber"
                            value={settings.notificationPhoneNumber || ''}
                            onChange={handleApiSettingsChange}
                            onFocus={handleApiInputFocus}
                            placeholder="Ex: 5511999998888 (com DDI)"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                        />
                         <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                           Este número será usado para receber lembretes de vencimento de suas despesas.
                        </p>
                    </div>
                     <div>
                        <label htmlFor="pixKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sua Chave PIX</label>
                        <input
                            type="text"
                            id="pixKey"
                            name="pixKey"
                            value={settings.pixKey || ''}
                            onChange={handleApiSettingsChange}
                            onFocus={handleApiInputFocus}
                            placeholder="Sua chave PIX (CPF, e-mail, etc.)"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                        />
                         <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                           Esta chave será incluída nas mensagens de cobrança automática.
                        </p>
                    </div>
                    <div className="text-right h-6 flex items-center justify-end">
                        {saveStatus === 'saving' && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Salvando...</p>}
                        {saveStatus === 'saved' && <p className="text-sm text-green-600 dark:text-green-400">Salvo.</p>}
                        {saveStatus === 'error' && <p className="text-sm text-red-600 dark:text-red-400">Erro ao salvar.</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <BellIcon className="w-6 h-6" /> Lembretes Automáticos de Cobrança
                </h3>
                <form onSubmit={handleSaveReminders} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Habilitar envio automático para créditos a receber
                        </label>
                        <button
                            type="button"
                            onClick={() => setLocalReminderSettings(p => ({ ...p, isEnabled: !p.isEnabled }))}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${localReminderSettings.isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${localReminderSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className={!localReminderSettings.isEnabled ? 'opacity-50' : ''}>
                        <div>
                            <label htmlFor="daysBefore" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Enviar lembrete quantos dias antes do vencimento?
                            </label>
                            <input
                                type="number"
                                id="daysBefore"
                                name="daysBefore"
                                value={localReminderSettings.daysBefore}
                                onChange={handleReminderSettingsChange}
                                className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 disabled:cursor-not-allowed"
                                min="1"
                                required
                                disabled={!localReminderSettings.isEnabled}
                            />
                        </div>

                        <div className="mt-4">
                            <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Modelo da Mensagem
                            </label>
                            <textarea
                                id="messageTemplate"
                                name="messageTemplate"
                                value={localReminderSettings.messageTemplate}
                                onChange={handleReminderSettingsChange}
                                rows={5}
                                className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 disabled:cursor-not-allowed"
                                required
                                disabled={!localReminderSettings.isEnabled}
                            />
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                Variáveis disponíveis: <code className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{nome}'}</code>, <code className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{valor}'}</code>, <code className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{pix}'}</code>.
                            </p>
                        </div>
                    </div>

                    <div className="text-right flex items-center justify-end gap-4 pt-2">
                        {reminderSaveSuccess && <p className="text-sm text-green-600 animate-fade-in-out">Configurações salvas com sucesso!</p>}
                        <button type="submit" disabled={isSavingReminders} className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
                            {isSavingReminders ? 'Salvando...' : 'Salvar Lembretes'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Testar Envio de Mensagem</h3>
                 <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-grow w-full">
                         <label htmlFor="testPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Telefone (com DDI)</label>
                         <input 
                             type="text"
                             id="testPhone"
                             value={testPhoneNumber}
                             onChange={e => setTestPhoneNumber(e.target.value)}
                             placeholder="Ex: 5511999998888"
                             className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                         />
                    </div>
                    <div>
                        <button onClick={handleTest} disabled={isTesting} className="w-full sm:w-auto bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isTesting ? 'Enviando...' : 'Testar'}
                        </button>
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <KeyIcon className="w-6 h-6" /> Alterar Senha
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
                    <div className="relative">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha Atual</label>
                        <input
                            type={isCurrentPasswordVisible ? 'text' : 'password'}
                            id="currentPassword"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10"
                            required
                        />
                        <button type="button" onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500 dark:text-gray-400">
                            {isCurrentPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                     <div className="relative">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
                        <input
                            type={isNewPasswordVisible ? 'text' : 'password'}
                            id="newPassword"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10"
                            required
                        />
                        <button type="button" onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500 dark:text-gray-400">
                            {isNewPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                     <div className="relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
                        <input
                            type={isConfirmPasswordVisible ? 'text' : 'password'}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10"
                            required
                        />
                         <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500 dark:text-gray-400">
                            {isConfirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isPasswordChanging} className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
                            {isPasswordChanging ? 'Salvando...' : 'Salvar Nova Senha'}
                        </button>
                    </div>
                </form>
            </div>
            
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <FingerPrintIcon className="w-6 h-6" /> Segurança
                </h3>
                {biometricSupport === null ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Verificando compatibilidade...</p>
                ) : biometricSupport ? (
                    <>
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex-grow">
                                <label htmlFor="biometricToggle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desbloqueio por Biometria</label>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Use a biometria ou o PIN do seu dispositivo para desbloquear o aplicativo rapidamente.
                                </p>
                            </div>
                            <button
                                id="biometricToggle"
                                onClick={handleBiometricToggle}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isBiometricEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                aria-pressed={isBiometricEnabled}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                         <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-2 rounded-md">
                           <strong>Nota:</strong> Este é um recurso de conveniência para bloquear a tela e não substitui sua senha principal. A sessão de login permanece ativa.
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Seu dispositivo ou navegador não é compatível com o desbloqueio por biometria ou o recurso está bloqueado pelas políticas deste ambiente (iframe).
                    </p>
                )}
            </div>

            {/* Confirmation Modal for Reset */}
            <ConfirmationModal 
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetData}
                title="Confirmar Limpeza Total"
                message="ATENÇÃO: Isso irá apagar permanentemente TODOS os débitos e créditos lançados no sistema. Suas contas cadastradas e categorias NÃO serão removidas. Esta ação não pode ser desfeita. Deseja continuar?"
            />
        </div>
    );
};

export default SettingsPage;
