
import React, { useEffect, useState } from 'react';
import FingerPrintIcon from './icons/FingerPrintIcon';
import LogoIcon from './icons/LogoIcon';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface BiometricLockScreenProps {
    onUnlock: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
    const [error, setError] = useState<string>('');
    const [isChecking, setIsChecking] = useState(false);
    const { currentUser } = useAuth();

    const handleUnlockAttempt = async () => {
        setIsChecking(true);
        setError('');

        if (!navigator.credentials || !navigator.credentials.create) {
            setError('Seu navegador não suporta autenticação biométrica.');
            setIsChecking(false);
            return;
        }

        try {
            // Nota: Estamos usando .create como um gatilho de hardware para verificar a identidade.
            // Em um sistema real, usaríamos .get() com um ID de credencial previamente registrado.
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32).map(() => Math.floor(Math.random() * 256)),
                    rp: { name: "Meu Saldo", id: window.location.hostname },
                    user: {
                        id: new TextEncoder().encode(currentUser?.uid || "user"),
                        name: currentUser?.email || "user@email.com",
                        displayName: currentUser?.displayName || "User",
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 /* ES256 */ }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                    },
                    timeout: 60000,
                }
            });

            if (credential) {
                onUnlock();
            } else {
                 setError('Falha na verificação. Tente novamente.');
            }
        } catch (err: any) {
            console.error('Biometric check error:', err);
            const errName = err?.name || '';
            const errMsg = err?.message || '';

            if (errName === 'NotAllowedError') {
                setError('Verificação cancelada ou não permitida pelo usuário.');
            } else if (errName === 'SecurityError' || errMsg.toLowerCase().includes('feature is not enabled')) {
                setError('A biometria está bloqueada pelas políticas de segurança deste ambiente (Sandbox/Iframe). Tente desativá-la nas configurações se o problema persistir.');
            } else {
                setError('Não foi possível verificar a biometria. Tente novamente.');
            }
        } finally {
            setIsChecking(false);
        }
    };

    const handleLogout = () => {
        // Se houver um erro persistente de ambiente, permitimos limpar o estado para não travar o usuário
        localStorage.removeItem('biometricUnlockEnabled');
        auth.signOut();
    };

    useEffect(() => {
        // Tentativa automática apenas se o navegador suportar
        if (navigator.credentials && navigator.credentials.create) {
            handleUnlockAttempt();
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
                 <LogoIcon className="w-16 h-16 mx-auto" />
                 <h2 className="mt-6 text-2xl font-bold">App Bloqueado</h2>
                 <p className="mt-2 text-gray-600 dark:text-gray-400">Autentique-se para continuar.</p>
                
                <div className="my-8">
                    <button 
                        onClick={handleUnlockAttempt}
                        disabled={isChecking}
                        className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Desbloquear com biometria"
                    >
                        <FingerPrintIcon className={`w-16 h-16 ${isChecking ? 'animate-pulse' : ''} text-blue-600 dark:text-blue-400`} />
                    </button>
                </div>

                {isChecking && <p className="text-blue-600 font-medium">Verificando...</p>}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-md">
                        {error}
                    </div>
                )}
                
                <div className="mt-6 border-t pt-4 dark:border-gray-700">
                    <button onClick={handleLogout} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Sair da conta e desativar biometria
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BiometricLockScreen;
