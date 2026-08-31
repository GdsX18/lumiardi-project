'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  Lock,
  ShieldCheck,
  Database,
  Key,
  Server,
  Users,
  FileCheck,
  AlertCircle,
  Mail,
  Building,
  CheckCircle2,
  Cpu,
  Globe,
  Cookie,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        {/* Cabeçalho Editorial */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[11px] font-sans uppercase tracking-[0.3em]">
            <Lock className="w-4 h-4 stroke-[1.5]" />
            <span>Privacidade & Proteção de Dados (LGPD)</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            Política de Privacidade e LGPD
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-ivory/60 tracking-wider">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              Versão: 24 de agosto de 2026
            </span>
            <span className="px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] rounded-full">
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              Resolução CD/ANPD nº 15/2024
            </span>
          </div>
        </header>

        {/* Quadro Institucional do Controlador */}
        <div className="p-6 md:p-8 bg-[#0D0D0D] border border-[#C9A96B]/30 rounded-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A96B]" />
          <div className="flex items-center gap-3 text-[#C9A96B] font-semibold text-sm uppercase tracking-wider">
            <Building className="w-5 h-5 shrink-0" />
            <span>Identificação do Controlador de Dados Pessoais</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-ivory/80">
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">Razão Social</p>
              <p className="font-medium text-ivory">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">Sede Administrativa</p>
              <p className="text-ivory/90">Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">Canal Oficial de Privacidade & DPO</p>
              <p><a href="mailto:sac@lumiardi.com" className="text-[#C9A96B] hover:underline font-mono">sac@lumiardi.com</a></p>
            </div>
            <div>
              <p className="text-ivory/50 uppercase tracking-widest text-[10px]">Público Alvo</p>
              <p className="text-ivory/90 font-medium">Exclusivamente Maiores de 18 Anos</p>
            </div>
          </div>
        </div>

        {/* Índice Geral */}
        <nav className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C9A96B] font-semibold block">
            Índice das Seções:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-ivory/70">
            <a href="#sec-1" className="hover:text-[#C9A96B] transition-colors">1. Controlador</a>
            <a href="#sec-2" className="hover:text-[#C9A96B] transition-colors">2. Dados Pessoais Tratados</a>
            <a href="#sec-3" className="hover:text-[#C9A96B] transition-colors">3. Finalidades do Tratamento</a>
            <a href="#sec-4" className="hover:text-[#C9A96B] transition-colors">4. Bases Legais</a>
            <a href="#sec-5" className="hover:text-[#C9A96B] transition-colors">5. Dados Sensíveis & Biometria</a>
            <a href="#sec-6" className="hover:text-[#C9A96B] transition-colors">6. Verificação de Idade (Age Assurance)</a>
            <a href="#sec-7" className="hover:text-[#C9A96B] transition-colors">7. Compartilhamento de Dados</a>
            <a href="#sec-8" className="hover:text-[#C9A96B] transition-colors">8. Operadores e Suboperadores</a>
            <a href="#sec-9" className="hover:text-[#C9A96B] transition-colors">9. Transferência Internacional</a>
            <a href="#sec-10" className="hover:text-[#C9A96B] transition-colors">10. Retenção e Guarda</a>
            <a href="#sec-11" className="hover:text-[#C9A96B] transition-colors">11. Segurança da Informação</a>
            <a href="#sec-12" className="hover:text-[#C9A96B] transition-colors">12. Procedimentos de Incidentes</a>
            <a href="#sec-13" className="hover:text-[#C9A96B] transition-colors">13. Direitos dos Titulares</a>
            <a href="#sec-14" className="hover:text-[#C9A96B] transition-colors">14. Política de Cookies</a>
            <a href="#sec-15" className="hover:text-[#C9A96B] transition-colors">15. Crianças e Adolescentes (18+)</a>
            <a href="#sec-16" className="hover:text-[#C9A96B] transition-colors">16. Canal de Atendimento ao Titular</a>
            <a href="#sec-17" className="hover:text-[#C9A96B] transition-colors">17. Encarregado de Dados (DPO)</a>
            <a href="#sec-18" className="hover:text-[#C9A96B] transition-colors">18. Alterações e Atualizações</a>
          </div>
        </nav>

        {/* Corpo da Política */}
        <div className="space-y-12 text-sm md:text-[15px] text-ivory/85 font-light leading-relaxed font-sans">
          
          {/* Seção 1 */}
          <section id="sec-1" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              1. Controlador
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                O tratamento de dados pessoais no âmbito da plataforma Lumiardi é realizado por <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>, com sede na Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica, Rio de Janeiro/RJ, na qualidade de Controladora nos termos do art. 5º, VI, da Lei nº 13.709/2018 (LGPD).
              </p>
              <p>
                Canal direto de privacidade e comunicação do titular: <a href="mailto:sac@lumiardi.com" className="text-[#C9A96B] underline">sac@lumiardi.com</a>.
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section id="sec-2" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              2. Quais Dados Podem Ser Tratados
            </h2>
            <div className="space-y-4 pl-4 border-l-2 border-[#C9A96B]/30">
              <p><strong>2.1.</strong> Dependendo da natureza do relacionamento do usuário com a plataforma, poderão ser tratados:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.1. Dados de Cadastro</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    <li>Nome civil e nome artístico;</li>
                    <li>CPF / Documento fiscal;</li>
                    <li>Data de nascimento;</li>
                    <li>Telefone de contato / WhatsApp;</li>
                    <li>E-mail cadastral;</li>
                    <li>Localização declarada (país, estado e cidade).</li>
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.2. Dados de Identificação & KYC</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    <li>Documento oficial com foto (RG, CNH, Passaporte);</li>
                    <li>Dados extraídos e OCR do documento;</li>
                    <li>Resultado de validação biométrica facial (liveness check);</li>
                    <li>Confirmação inequívoca de maioridade (18+).</li>
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.3. Dados Técnicos de Plataforma</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    <li>Endereço IP e porta lógica de conexão;</li>
                    <li>Identificadores de dispositivo e sistema operacional;</li>
                    <li>Navegador, resolução e parâmetros de sessão;</li>
                    <li>Logs de acesso e registro de timestamps;</li>
                    <li>Interações, buscas e navegação dentro do ecossistema.</li>
                  </ul>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <h3 className="text-xs uppercase tracking-wider text-[#C9A96B] font-bold mb-2">2.1.4. Dados Financeiros e Faturamento</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-ivory/80">
                    <li>Informações de tokenização de pagamento;</li>
                    <li>Histórico de transações e assinaturas;</li>
                    <li>Dados de análise antifraude e risco;</li>
                    <li>Informações de faturamento e notas fiscais.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section id="sec-3" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              3. Finalidades do Tratamento
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>3.1.</strong> Os dados pessoais coletados são tratados com estrita observância ao princípio da necessidade para as seguintes finalidades:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Cadastro e onboarding</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Autenticação e 2FA</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Segurança sistêmica</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Verificação de idade (18+)</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Verificação de identidade</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Prevenção a fraudes</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Processamento de pagamentos</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Moderação de conteúdo</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Atendimento a denúncias</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Cumprimento legal/regulatório</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Exercício regular de direitos</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Administração do ecossistema</span>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section id="sec-4" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              4. Bases Legais Aplicáveis
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>4.1.</strong> Todo e qualquer tratamento de dados na Lumiardi está devidamente ancorado nas hipóteses legais autorizadoras da LGPD:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-ivory/80">
                <li><strong className="text-ivory">Execução de contrato:</strong> para prestação dos serviços contratados (art. 7º, V);</li>
                <li><strong className="text-ivory">Cumprimento de obrigação legal ou regulatória:</strong> cumprimento de deveres fiscais, manutenção de logs do Marco Civil da Internet (art. 7º, II);</li>
                <li><strong className="text-ivory">Exercício regular de direitos:</strong> em processos administrativos, arbitrais ou judiciais (art. 7º, VI);</li>
                <li><strong className="text-ivory">Prevenção à fraude e segurança do titular:</strong> em processos de identificação e autenticação de cadastro (art. 11, II, 'g');</li>
                <li><strong className="text-ivory">Legítimo interesse:</strong> para aprimoramento de funcionalidades e segurança (art. 7º, IX);</li>
                <li><strong className="text-ivory">Consentimento:</strong> quando expressamente exigido para finalidades específicas (art. 7º, I).</li>
              </ul>
            </div>
          </section>

          {/* Seção 5 */}
          <section id="sec-5" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              5. Tratamento de Dados Sensíveis e Biometria
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>5.1.</strong> Quando houver processamento de dados biométricos (como prova de vida facial para credenciamento) ou outros dados sensíveis, a Lumiardi aplicará base legal específica (prevenção à fraude e segurança nos termos do art. 11, II, 'g' da LGPD), controles reforçados de criptografia e avaliação contínua de necessidade e proporcionalidade.
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section id="sec-6" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              6. Verificação de Idade (Age Assurance)
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>6.1.</strong> A Lumiardi poderá utilizar fornecedores especializados em verificação documental e checagem de idade com certificações internacionais de segurança.
              </p>
              <p>
                <strong>6.2.</strong> Sempre que tecnicamente possível e viável, será priorizada a obtenção estrita do resultado necessário à decisão etária (ex: maior de 18 anos: aprovado/reprovado), minimizando a retenção de arquivos brutos.
              </p>
            </div>
          </section>

          {/* Seção 7 */}
          <section id="sec-7" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              7. Compartilhamento de Dados com Terceiros
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>7.1.</strong> Os dados poderão ser compartilhados de forma estrita e segura com parceiros indispensáveis à prestação dos serviços:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Infraestrutura de hospedagem</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Provedores de Cloud e Storage</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Provedores de Age Assurance</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Motores de KYC e biometria</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Soluções Antifraude</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Gateways de Pagamento</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Sistemas de Segurança da Info</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Ferramentas de Moderação</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Assessoria jurídica</span>
                <span className="p-2 bg-white/5 border border-white/10 rounded">• Autoridades públicas e judiciais</span>
              </div>
            </div>
          </section>

          {/* Seção 8 */}
          <section id="sec-8" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              8. Operadores e Suboperadores
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>8.1.</strong> A Lumiardi celebra contratos formais com todos os seus operadores e suboperadores de dados, estabelecendo obrigações rígidas de segurança da informação, confidencialidade, estrita observância de finalidade, prazos de retenção, notificação de incidentes e restrições de subcontratação.
              </p>
            </div>
          </section>

          {/* Seção 9 */}
          <section id="sec-9" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              9. Transferência Internacional de Dados
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>9.1.</strong> Transferências internacionais de dados (como para servidores em nuvem AWS/Cloudflare localizados no exterior) serão realizadas mediante mecanismos legítimos previstos na LGPD e na regulamentação expedida pela ANPD.
              </p>
              <p>
                <strong>9.2.</strong> A ANPD possui regulamentação específica sobre transferência internacional e cláusulas-padrão contratuais que são rigorosamente observadas pela Lumiardi.
              </p>
            </div>
          </section>

          {/* Seção 10 */}
          <section id="sec-10" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              10. Retenção e Guarda dos Dados
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>10.1.</strong> Os dados pessoais serão mantidos apenas pelo período estritamente necessário para:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                <li>Atingir as finalidades para as quais foram coletados;</li>
                <li>Cumprir obrigações legais ou regulatórias de guarda;</li>
                <li>Garantir o exercício regular de direitos em eventuais demandas;</li>
                <li>Prevenir fraudes e manter a segurança sistêmica;</li>
                <li>Preservação legítima de evidências de auditoria.</li>
              </ul>
            </div>
          </section>

          {/* Seção 11 */}
          <section id="sec-11" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              11. Medidas de Segurança da Informação
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>11.1.</strong> A Lumiardi adota medidas técnicas e administrativas robustas para proteger os dados pessoais contra acessos não autorizados, vazamentos ou incidentes:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Controle de Acesso Rígido</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Criptografia AES-256 / TLS</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Segregação de Ambientes</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Autenticação Multifator (2FA)</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Auditoria de Logs</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Backups Criptografados</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Monitoramento 24/7</span>
                <span className="p-2.5 bg-white/5 border border-white/10 rounded font-medium text-center">Plano de Resposta a Incidentes</span>
              </div>
            </div>
          </section>

          {/* Seção 12 */}
          <section id="sec-12" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              12. Procedimento e Gestão de Incidentes de Segurança
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>12.1.</strong> A Lumiardi mantém procedimento formal de resposta e remediação a incidentes de segurança da informação.
              </p>
              <p>
                <strong>12.2.</strong> Quando um incidente de segurança puder acarretar risco ou dano relevante aos titulares de dados, serão rigorosamente observados os procedimentos e prazos de comunicação à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados, nos termos da <strong>Resolução CD/ANPD nº 15/2024</strong>.
              </p>
            </div>
          </section>

          {/* Seção 13 */}
          <section id="sec-13" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              13. Direitos dos Titulares de Dados
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>13.1.</strong> Em conformidade com o art. 18 da LGPD, o titular poderá, mediante requerimento formal via canal de privacidade, solicitar:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Confirmação da existência de tratamento;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Acesso integral aos dados pessoais tratados;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Correção de dados incompletos, inexatos ou desatualizados;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Anonimização, bloqueio ou eliminação de dados desnecessários;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Portabilidade dos dados a outro fornecedor;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Eliminação dos dados tratados com consentimento;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Informação sobre entidades com as quais os dados foram compartilhados;</div>
                <div className="p-3 bg-white/5 border border-white/10 rounded">✓ Revisão de decisões automatizadas, quando aplicável.</div>
              </div>
            </div>
          </section>

          {/* Seção 14 */}
          <section id="sec-14" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              14. Política de Cookies e Rastreamento
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>14.1.</strong> A plataforma utiliza cookies estritamente necessários e analíticos para:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                <li>Autenticação e manutenção de sessão segura;</li>
                <li>Prevenção a fraudes e mitigação de ataques cibernéticos;</li>
                <li>Funcionamento operacional e estabilidade dos sistemas;</li>
                <li>Análise de métricas de desempenho e telemetria;</li>
                <li>Preservação das preferências de idioma e navegação do usuário.</li>
              </ul>
            </div>
          </section>

          {/* Seção 15 */}
          <section id="sec-15" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal">
              15. Proteção de Crianças e Adolescentes
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-red-500/40">
              <p>
                <strong>15.1.</strong> A plataforma Lumiardi é exclusiva e estritamente destinada a <strong>maiores de 18 anos</strong>.
              </p>
              <p>
                <strong>15.2.</strong> Caso sejam identificados cadastros ou dados de menores em desconformidade com essa destinação, serão adotadas medidas imediatas de bloqueio, expurgo seguro e comunicação às autoridades competentes quando legalmente aplicável.
              </p>
            </div>
          </section>

          {/* Seção 16 & 17 */}
          <section id="sec-16" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              16. Canal de Atendimento ao Titular & 17. Encarregado (DPO)
            </h2>
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-3">
              <p>
                Para exercer seus direitos como titular de dados pessoais ou enviar dúvidas relativas ao tratamento de dados, entre em contato diretamente com o nosso <strong>Encarregado pelo Tratamento de Dados Pessoais (DPO)</strong>:
              </p>
              <div className="space-y-1 text-xs md:text-sm text-ivory/80 pt-2 font-mono">
                <p><strong>Encarregado (DPO):</strong> Núcleo de Privacidade e Proteção de Dados Lumiardi</p>
                <p><strong>E-mail Oficial:</strong> <a href="mailto:sac@lumiardi.com" className="text-[#C9A96B] underline">sac@lumiardi.com</a></p>
                <p><strong>Endereço:</strong> Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
              </div>
            </div>
          </section>

          {/* Seção 18 */}
          <section id="sec-18" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              18. Alterações desta Política de Privacidade
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>18.1.</strong> Esta Política de Privacidade poderá ser atualizada periodicamente para refletir evoluções legislativas, regulatórias da ANPD, tecnológicas ou operacionais da plataforma. As versões anteriores poderão ser disponibilizadas mediante solicitação ao canal do titular.
              </p>
            </div>
          </section>

        </div>

        {/* Rodapé Interno */}
        <div className="pt-12 border-t border-white/10 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-ivory/70">
            <div className="space-y-1">
              <p className="text-ivory font-medium">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
              <p>Canal DPO: <a href="mailto:sac@lumiardi.com" className="text-[#C9A96B]">sac@lumiardi.com</a></p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/termos-de-uso"
                className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-medium"
              >
                Termos de Uso →
              </Link>
              <Link
                href="/portal"
                className="px-4 py-2 bg-[#C9A96B]/20 hover:bg-[#C9A96B] text-[#C9A96B] hover:text-[#0B0B0B] border border-[#C9A96B]/40 transition-all font-medium"
              >
                Portal de Denúncias →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
