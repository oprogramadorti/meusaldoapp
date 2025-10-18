import React, { useState } from 'react';
import WalletIcon from './icons/WalletIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import TagIcon from './icons/TagIcon';
import CogIcon from './icons/CogIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import PdfGuide from './PdfGuide';

const HelpPage: React.FC = () => {
  const [showPdfGuide, setShowPdfGuide] = useState(false);

  // Fix: Specified the props for the 'icon' element to resolve the cloneElement typing error.
  const FeatureCard: React.FC<{ icon: React.ReactElement<{ className?: string }>; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-1">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div>
        <h4 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h4>
        <p className="text-gray-600 dark:text-gray-300">{children}</p>
      </div>
    </div>
  );

  const ColorMeaning: React.FC<{ colorClass: string; title: string; children: React.ReactNode }> = ({ colorClass, title, children }) => (
     <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full flex-shrink-0 ${colorClass}`}></div>
        <div>
            <span className="font-semibold">{title}:</span> {children}
        </div>
     </div>
  );


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Ajuda</h2>
        <button
          onClick={() => setShowPdfGuide(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition shadow-md w-full sm:w-auto"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Baixar Guia de Deploy (PDF)</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
        <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Como Utilizar o App</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Bem-vindo ao seu app de Controle Financeiro! Aqui está um guia rápido sobre as principais funcionalidades para você começar a organizar suas finanças.
        </p>

        <div className="space-y-6">
            <FeatureCard icon={<WalletIcon />} title="Dashboard">
                É a sua tela inicial. Aqui você vê um resumo geral: o saldo total de todas as suas contas, o total de receitas e despesas do mês atual e uma lista das suas últimas transações.
            </FeatureCard>
            
            <FeatureCard icon={<DocumentTextIcon />} title="Transações">
                Gerencie todas as suas movimentações. Adicione novas despesas ou receitas, edite transações existentes ou exclua as que não são mais necessárias. A visualização é separada por mês para facilitar a organização.
            </FeatureCard>

            <FeatureCard icon={<ChartBarIcon />} title="Relatórios">
                Analise suas finanças com mais detalhes. Veja gráficos de despesas por categoria e um balanço mensal completo para entender para onde seu dinheiro está indo.
            </FeatureCard>

            <FeatureCard icon={<CreditCardIcon />} title="Contas">
                Cadastre todas as suas contas financeiras, como conta corrente, poupança, cartões de crédito e até mesmo sua carteira física. Isso ajuda a ter uma visão precisa do seu patrimônio.
            </FeatureCard>

            <FeatureCard icon={<TagIcon />} title="Categorias">
                Organize suas transações criando categorias (ex: Alimentação, Transporte) e subcategorias (ex: Supermercado, Restaurante). Isso é essencial para os relatórios.
            </FeatureCard>
            
            <FeatureCard icon={<CogIcon />} title="Configurações">
                Configure notificações via WhatsApp para ser lembrado de contas a vencer. Basta inserir os dados da sua Evolution API.
            </FeatureCard>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Significado das Cores</h3>
        <div className="space-y-3 text-gray-700 dark:text-gray-200">
            <ColorMeaning colorClass="bg-green-500" title="Verde">
                Representa entradas de dinheiro. Usado para receitas, créditos e saldos positivos.
            </ColorMeaning>
            <ColorMeaning colorClass="bg-red-500" title="Vermelho">
                Representa saídas de dinheiro ou alertas. Usado para despesas, débitos e saldos negativos.
            </ColorMeaning>
             <ColorMeaning colorClass="bg-blue-600" title="Azul">
                Indica ações principais, links e informações neutras ou positivas, como o saldo líquido do mês.
            </ColorMeaning>
             <ColorMeaning colorClass="bg-gray-500" title="Cinza">
                Usado para informações secundárias ou para indicar itens que já foram concluídos, como uma despesa que já foi paga.
            </ColorMeaning>
        </div>
      </div>

      {showPdfGuide && <PdfGuide onClose={() => setShowPdfGuide(false)} />}
    </div>
  );
};

export default HelpPage;