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
        } catch (err) {
            console.error('Biometric check error:', err);
            const errName = (err as Error).name;
            if (errName === 'NotAllowedError') {
                setError('Verificação cancelada pelo usuário.');
            } else {
                setError('Não foi possível verificar. Tente novamente.');
            }
        } finally {
            setIsChecking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('biometricUnlockEnabled');
        auth.signOut();
    };

    useEffect(() => {
        handleUnlockAttempt();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                 <LogoIcon className="w-16 h-16 mx-auto" />
                 <h2 className="mt-6 text-2xl font-bold">App Bloqueado</h2>
                 <p className="mt-2 text-gray-600 dark:text-gray-400">Autentique-se para continuar.</p>
                
                <div className="my-8">
                    <button 
                        onClick={handleUnlockAttempt}
                        disabled={isChecking}
                        className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:cursor-wait"
                        aria-label="Desbloquear com biometria"
                    >
                        <FingerPrintIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                    </button>
                </div>

                {isChecking && <p className="text-blue-600">Verificando...</p>}
                {error && <p className="text-red-600 mt-4">{error}</p>}
                
                <div className="mt-6 border-t pt-4 dark:border-gray-700">
                    <button onClick={handleLogout} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                        Não consegue desbloquear? Sair
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BiometricLockScreen;