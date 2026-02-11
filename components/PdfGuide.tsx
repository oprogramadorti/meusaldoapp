import React from 'react';
import XIcon from './icons/XIcon';
import LogoIcon from './icons/LogoIcon';

interface PdfGuideProps {
    onClose: () => void;
}

const PdfGuide: React.FC<PdfGuideProps> = ({ onClose }) => {

    const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm my-2">
            <code>{children}</code>
        </pre>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 space-y-6">
                    <header className="flex justify-between items-start pb-4 border-b dark:border-gray-700">
                        <div>
                            <div className="flex items-center gap-3">
                                <LogoIcon className="w-10 h-10" />
                                <h2 className="text-2xl font-bold">Guia de Deploy: GitHub + Netlify</h2>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Um passo a passo para publicar seu aplicativo "Meu Saldo" na web.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    
                    <section>
                        <h3 className="text-xl font-semibold mb-2">Parte 1: Preparando e Enviando para o GitHub</h3>
                        <p>Antes de publicar, seu código precisa estar em um repositório Git. Isso permite que a Netlify acesse e construa seu site automaticamente.</p>
                        <ol className="list-decimal list-inside space-y-3 mt-4">
                            <li>
                                <strong>Crie um arquivo `.gitignore`</strong>: Na raiz do seu projeto, crie um arquivo chamado `.gitignore` para evitar enviar arquivos desnecessários (como a pasta `node_modules`). Cole o seguinte conteúdo nele:
                                <CodeBlock>{`# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
/node_modules
/.pnp
.pnp.js

# Build output
/dist

# Env files
.env
.env.local
.env.*.local
`}</CodeBlock>
                            </li>
                            <li><strong>Crie um repositório no GitHub</strong>: Acesse sua conta no GitHub e crie um novo repositório (pode ser público ou privado).</li>
                            <li>
                                <strong>Inicie o Git e envie seus arquivos</strong>: No terminal, dentro da pasta do seu projeto, execute os seguintes comandos em ordem:
                                <CodeBlock>{`git init
git add .
git commit -m "Commit inicial do projeto Meu Saldo"
git branch -M main
git remote add origin [URL_DO_SEU_REPOSITORIO]
git push -u origin main`}</CodeBlock>
                                <p className="text-xs text-gray-500">Lembre-se de substituir `[URL_DO_SEU_REPOSITORIO]` pela URL que o GitHub forneceu.</p>
                            </li>
                        </ol>
                    </section>
                    
                    <section>
                        <h3 className="text-xl font-semibold mb-2">Parte 2: Deploy no Netlify</h3>
                        <p>Com seu código no GitHub, o processo no Netlify é muito simples.</p>
                        <ol className="list-decimal list-inside space-y-3 mt-4">
                            <li><strong>Crie uma conta na Netlify</strong>: Acesse <a href="https://netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">netlify.com</a> e crie uma conta (recomendo usar a opção "Sign up with GitHub").</li>
                            <li><strong>Importe seu projeto</strong>: No dashboard da Netlify, clique em "Add new site" &rarr; "Import an existing project". Conecte com o GitHub e selecione o repositório que você acabou de criar.</li>
                            <li>
                                <strong>Configure o Build</strong>: A Netlify vai perguntar como construir seu site. Use estas configurações:
                                <ul className="list-disc list-inside ml-4 my-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                                    <li><strong>Build command</strong>: `npm run build`</li>
                                    <li><strong>Publish directory</strong>: `dist`</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Adicione as Variáveis de Ambiente (MUITO IMPORTANTE)</strong>: Antes de fazer o deploy, clique em "Show advanced" e depois em "New variable". Você precisa adicionar suas chaves do Firebase aqui para que o app possa se conectar ao banco de dados. Adicione uma por uma:
                                <CodeBlock>{`VITE_FIREBASE_API_KEY = "AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN = "meufinanceiro-6aa43..."
VITE_FIREBASE_PROJECT_ID = "meufinanceiro-6aa43"
VITE_FIREBASE_STORAGE_BUCKET = "meufinanceiro-6aa43..."
VITE_FIREBASE_MESSAGING_SENDER_ID = "1040..."
VITE_FIREBASE_APP_ID = "1:1040..."`}</CodeBlock>
                                <p className="text-xs text-gray-500"><strong>Atenção:</strong> Se suas chaves do Firebase ainda estão diretamente no código (`firebase.ts`), você deve substituí-las por `import.meta.env.NOME_DA_VARIAVEL` para que isso funcione.</p>
                            </li>
                             <li><strong>Faça o Deploy</strong>: Clique em "Deploy site". A Netlify vai construir e publicar seu site. Em alguns minutos, ele estará no ar!</li>
                        </ol>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-2">Parte 3: Configuração de Rotas (Evitando Erro 404)</h3>
                        <p>Para que as rotas do seu app (ex: `/dashboard`) funcionem quando acessadas diretamente, você precisa de uma última configuração.</p>
                         <ol className="list-decimal list-inside space-y-3 mt-4">
                            <li>
                                <strong>Crie um arquivo `_redirects`</strong>: Dentro da pasta `public` do seu projeto, crie um arquivo chamado `_redirects` (sem extensão).
                            </li>
                            <li>
                                <strong>Adicione a regra de redirecionamento</strong>: Coloque o seguinte conteúdo nesse arquivo:
                                 <CodeBlock>{`/*    /index.html    200`}</CodeBlock>
                            </li>
                            <li><strong>Envie a alteração</strong>: Faça um novo commit e push para o GitHub. A Netlify fará o deploy da nova versão automaticamente.
                                 <CodeBlock>{`git add .
git commit -m "Adiciona regra de redirect para SPA"
git push`}</CodeBlock>
                            </li>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PdfGuide;
