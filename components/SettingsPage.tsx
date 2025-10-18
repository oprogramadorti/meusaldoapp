import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import FingerPrintIcon from './icons/FingerPrintIcon';

const SettingsPage: React.FC = () => {
    const { evolutionAPISettings, setEvolutionAPISettings, sendTestMessage } = useAppContext();
    
    const [settings, setSettings] = useState(evolutionAPISettings);
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [biometricSupport, setBiometricSupport] = useState<boolean | null>(null);

    useEffect(() => {
        setSettings(evolutionAPISettings);
    }, [evolutionAPISettings]);
    
    useEffect(() => {
        const checkSupport = async () => {
            if (window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
                setBiometricSupport(true);
            } else {
                setBiometricSupport(false);
            }
        };
        checkSupport();
        setIsBiometricEnabled(localStorage.getItem('biometricUnlockEnabled') === 'true');
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setEvolutionAPISettings(settings);
        alert('Configurações salvas com sucesso!');
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

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Configurações</h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Configuração da Evolution API</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Insira os dados da sua instância da Evolution API para ativar notificações.
                </p>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL do Servidor</label>
                        <input
                            type="url"
                            id="serverUrl"
                            value={settings.serverUrl}
                            onChange={e => setSettings(s => ({ ...s, serverUrl: e.target.value }))}
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
                            value={settings.instanceName}
                            onChange={e => setSettings(s => ({ ...s, instanceName: e.target.value }))}
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
                            value={settings.apiKey}
                            onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
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
                            value={settings.notificationPhoneNumber || ''}
                            onChange={e => setSettings(s => ({ ...s, notificationPhoneNumber: e.target.value }))}
                            placeholder="Ex: 5511999998888 (com DDI)"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                        />
                         <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                           Este número será usado para receber lembretes de vencimento.
                        </p>
                    </div>
                     <div>
                        <label htmlFor="pixKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sua Chave PIX</label>
                        <input
                            type="text"
                            id="pixKey"
                            value={settings.pixKey || ''}
                            onChange={e => setSettings(s => ({ ...s, pixKey: e.target.value }))}
                            placeholder="Sua chave PIX (CPF, e-mail, etc.)"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3"
                        />
                         <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                           Esta chave será incluída nas mensagens de cobrança automática.
                        </p>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-300">Salvar</button>
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
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isBiometricEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                aria-pressed={isBiometricEnabled}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                         <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-2 rounded-md">
                           <strong>Nota:</strong> Este é um recurso de conveniência para bloquear a tela e não substitui sua senha principal. A sessão de login permanece ativa.
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Seu dispositivo ou navegador não é compatível com o desbloqueio por biometria.
                    </p>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;