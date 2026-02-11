
// Fix: Import React to resolve 'React' namespace errors (FC, FormEvent)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import LogoIcon from './icons/LogoIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // State for forgot password modal
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState({ type: '', text: '' });
    const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isLogin && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err: any) {
            console.error("Auth error:", err);
            switch(err.code) {
                case 'auth/user-not-found':
                    setError('Usuário não encontrado.');
                    break;
                case 'auth/wrong-password':
                    setError('Senha incorreta.');
                    break;
                case 'auth/invalid-credential':
                    setError('Credenciais inválidas. Verifique seu e-mail e senha.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este e-mail já está em uso.');
                    break;
                case 'auth/weak-password':
                    setError('A senha deve ter pelo menos 6 caracteres.');
                    break;
                case 'auth/invalid-api-key':
                     setError('Erro de configuração: A chave da API do Firebase é inválida.');
                     break;
                case 'auth/popup-blocked':
                    setError('O popup de login foi bloqueado pelo seu navegador.');
                    break;
                case 'auth/popup-closed-by-user':
                    setError('O login foi cancelado.');
                    break;
                default:
                    setError('Ocorreu um erro ao autenticar. Tente novamente mais tarde.');
                    break;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setError('');
        setIsLoading(true);
        try {
            // Usando Popup em vez de Redirect para melhor suporte em ambientes de iframe/sandbox
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login com Google cancelado.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Erro de credencial no Google. Tente novamente ou use e-mail/senha.');
            } else {
                setError('Falha ao iniciar o login com o Google. Verifique se o domínio está autorizado no Firebase.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openForgotPasswordModal = () => {
        setForgotPasswordEmail('');
        setForgotPasswordMessage({ type: '', text: '' });
        setError('');
        setIsForgotPasswordModalOpen(true);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingResetEmail(true);
        setForgotPasswordMessage({ type: '', text: '' });
        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            setForgotPasswordMessage({ type: 'success', text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
        } catch (error: any) {
            console.error("Password reset error:", error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setForgotPasswordMessage({ type: 'error', text: 'Nenhum usuário encontrado com este e-mail.' });
                    break;
                case 'auth/invalid-email':
                    setForgotPasswordMessage({ type: 'error', text: 'O formato do e-mail é inválido.' });
                    break;
                default:
                    setForgotPasswordMessage({ type: 'error', text: 'Erro ao enviar e-mail. Tente novamente.' });
                    break;
            }
        } finally {
            setIsSendingResetEmail(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-center">
                    <LogoIcon className="w-12 h-12 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                         {isLogin ? 'Faça login para acessar suas finanças.' : 'Comece a organizar suas finanças hoje.'}
                    </p>
                </div>
                
                {error && <div className="p-3 text-center text-sm text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-md">{error}</div>}

                <form className="space-y-4" onSubmit={handleAuthAction}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-mail"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div className="relative">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha"
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400">
                            {isPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="relative">
                            <input
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmar Senha"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                             <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400">
                                {isConfirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2">Lembrar-me</span>
                            </label>
                            <button
                                type="button"
                                onClick={openForgotPasswordModal}
                                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                    </button>
                </form>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative px-2 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">Ou</div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C42.21 39.2 46.98 32.66 46.98 24.55z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>Entrar com Google</span>
                </button>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="ml-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                        {isLogin ? 'Crie uma agora' : 'Faça login'}
                    </button>
                </p>
            </div>

            {isForgotPasswordModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setIsForgotPasswordModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleForgotPassword} className="p-8 space-y-4">
                            <h3 className="text-xl font-bold text-center">Recuperar Senha</h3>
                            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                                Insira seu e-mail e enviaremos um link para você voltar a acessar sua conta.
                            </p>
                            {forgotPasswordMessage.text && (
                                <div className={`p-3 text-center text-sm rounded-md ${
                                    forgotPasswordMessage.type === 'success' 
                                    ? 'text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50' 
                                    : 'text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50'
                                }`}>
                                    {forgotPasswordMessage.text}
                                </div>
                            )}
                            <input
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                placeholder="Seu e-mail cadastrado"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-end gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPasswordModalOpen(false)}
                                    className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingResetEmail}
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    {isSendingResetEmail ? 'Enviando...' : 'Enviar E-mail'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
