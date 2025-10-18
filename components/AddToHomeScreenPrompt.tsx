import React, { useState, useEffect } from 'react';
import LogoIcon from './icons/LogoIcon';
import ShareIcon from './icons/ShareIcon';
import XIcon from './icons/XIcon';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const AddToHomeScreenPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem('pwaInstallDismissed')) {
         setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIOSDevice && isSafari && !isInStandaloneMode && !localStorage.getItem('pwaInstallDismissed')) {
        setIsIos(true);
        setIsVisible(true);
    }


    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
      setIsVisible(false);
    });
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setIsVisible(false);
  };
  
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 flex items-center gap-4">
             <LogoIcon className="w-10 h-10 flex-shrink-0" />
             <div className="flex-grow">
                 <h4 className="font-bold">Instale o Meu Saldo</h4>
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                     {isIos 
                        ? <>Toque em <ShareIcon className="w-4 h-4 inline-block -mt-1" /> e depois em "Adicionar à Tela de Início".</>
                        : "Adicione à sua tela inicial para acesso rápido."
                     }
                 </p>
             </div>
             <div className="flex items-center gap-2">
                 {!isIos && (
                    <button onClick={handleInstallClick} className="bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition">
                        Instalar
                    </button>
                 )}
                <button onClick={handleDismiss} className="text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2">
                    <XIcon className="w-5 h-5" />
                </button>
             </div>
        </div>
    </div>
  );
};

export default AddToHomeScreenPrompt;