'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  Scale,
  ShieldAlert,
  Lock,
  FileCheck,
  AlertTriangle,
  Users,
  CreditCard,
  EyeOff,
  Gavel,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';
import Link from 'next/link';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        {/* Cabeçalho Editorial */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[11px] font-sans uppercase tracking-[0.3em]">
            <Scale className="w-4 h-4 stroke-[1.5]" />
            <span>Documento Oficial & Regulação Contratual</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            Termos de Uso da Plataforma Lumiardi
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-ivory/60 tracking-wider">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              Versão: 24 de agosto de 2026
            </span>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-full uppercase">
              Classificação: 18+ Exclusivo
            </span>
            <span className="px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] rounded-full">
              LUMIARDI GESTÃO DE CONTEÚDO LTDA.
            </span>
          </div>
        </header>

        {/* Resumo de Destaque / Aviso de Maioridade */}
        <div className="p-6 md:p-8 bg-[#0D0D0D] border border-red-500/30 rounded-lg space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="flex items-center gap-3 text-red-400 font-semibold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Aviso Obrigatório de Maioridade Civil (18+)</span>
          </div>
          <p className="text-xs md:text-sm text-ivory/80 font-light leading-relaxed">
            A plataforma Lumiardi é destinada exclusivamente a maiores de 18 anos civis e capazes. O acesso e cadastro dependem obrigatoriamente de validação e verificação de idade e identidade por mecanismos confiáveis. É terminantemente proibida a participação ou veiculação de qualquer conteúdo envolvendo menores.
          </p>
        </div>

        {/* Navegação Rápida por Tópicos */}
        <nav className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C9A96B] font-semibold block">
            Índice Geral das Cláusulas:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-ivory/70">
            <a href="#sec-1" className="hover:text-[#C9A96B] transition-colors">1. Identificação e Aceite</a>
            <a href="#sec-2" className="hover:text-[#C9A96B] transition-colors">2. Definições</a>
            <a href="#sec-3" className="hover:text-[#C9A96B] transition-colors">3. Natureza da Lumiardi</a>
            <a href="#sec-4" className="hover:text-[#C9A96B] transition-colors">4. Destinação Exclusiva 18+</a>
            <a href="#sec-5" className="hover:text-[#C9A96B] transition-colors">5. Cadastro e Identidade</a>
            <a href="#sec-6" className="hover:text-[#C9A96B] transition-colors">6. Responsabilidade do Usuário</a>
            <a href="#sec-7" className="hover:text-[#C9A96B] transition-colors">7. Conteúdo de Terceiros</a>
            <a href="#sec-8" className="hover:text-[#C9A96B] transition-colors">8. Conteúdos Proibidos</a>
            <a href="#sec-9" className="hover:text-[#C9A96B] transition-colors">9. Licença de Uso do Conteúdo</a>
            <a href="#sec-10" className="hover:text-[#C9A96B] transition-colors">10. Relação Modelos e Agências</a>
            <a href="#sec-11" className="hover:text-[#C9A96B] transition-colors">11. Pagamentos</a>
            <a href="#sec-12" className="hover:text-[#C9A96B] transition-colors">12. Moderação</a>
            <a href="#sec-13" className="hover:text-[#C9A96B] transition-colors">13. Suspensão e Encerramento</a>
            <a href="#sec-14" className="hover:text-[#C9A96B] transition-colors">14. Denúncias</a>
            <a href="#sec-15" className="hover:text-[#C9A96B] transition-colors">15. Propriedade Intelectual</a>
            <a href="#sec-16" className="hover:text-[#C9A96B] transition-colors">16. Segurança</a>
            <a href="#sec-17" className="hover:text-[#C9A96B] transition-colors">17. Responsabilidade</a>
            <a href="#sec-18" className="hover:text-[#C9A96B] transition-colors">18. LGPD & Privacidade</a>
            <a href="#sec-19" className="hover:text-[#C9A96B] transition-colors">19. Alteração dos Termos</a>
            <a href="#sec-20" className="hover:text-[#C9A96B] transition-colors">20. Legislação e Foro</a>
          </div>
        </nav>

        {/* Corpo dos Termos de Uso */}
        <div className="space-y-12 text-sm md:text-[15px] text-ivory/85 font-light leading-relaxed font-sans">
          
          {/* Seção 1 */}
          <section id="sec-1" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal flex items-center gap-3">
              <span>1. Identificação e Aceite</span>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>1.1.</strong> Estes Termos de Uso regulam a utilização da plataforma digital Lumiardi, administrada por <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>, doravante denominada <strong>LUMIARDI</strong>.
              </p>
              <p>
                <strong>1.2.</strong> Ao criar uma conta, concluir a verificação de idade exigida ou utilizar qualquer funcionalidade da plataforma, o usuário declara que leu, compreendeu e concorda expressamente com estes Termos.
              </p>
              <p>
                <strong>1.3.</strong> Integram estes Termos, para todos os fins jurídicos e operacionais:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-ivory/75">
                <li><Link href="/politica-privacidade" className="text-[#C9A96B] hover:underline">Política de Privacidade e LGPD</Link>;</li>
                <li>Política de Conteúdo e Moderação;</li>
                <li>Política de Verificação de Idade e Identidade;</li>
                <li>Contrato de Adesão de Modelos/Criadoras, quando aplicável;</li>
                <li>Demais políticas, diretrizes e regras específicas publicadas pela Lumiardi.</li>
              </ul>
              <p>
                <strong>1.4.</strong> Caso o usuário não concorde com qualquer disposição destes Termos, deverá interromper imediatamente a utilização da plataforma.
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section id="sec-2" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              2. Definições
            </h2>
            <div className="space-y-2.5 pl-4 border-l-2 border-[#C9A96B]/30">
              <p><strong>2.1.</strong> Para fins de interpretação destes Termos:</p>
              <ul className="space-y-2 text-ivory/80">
                <li><strong className="text-ivory">Plataforma:</strong> ambiente digital, softwares, servidores e ecossistema Lumiardi.</li>
                <li><strong className="text-ivory">Usuário:</strong> qualquer pessoa física ou jurídica que acesse, navegue ou utilize a plataforma.</li>
                <li><strong className="text-ivory">Criadora/Modelo:</strong> pessoa física que disponibiliza conteúdo, portfólio ou perfil profissional no catálogo.</li>
                <li><strong className="text-ivory">Agência:</strong> empresa ou profissional de representação que utiliza a plataforma para localizar, avaliar ou se conectar com modelos e criadoras.</li>
                <li><strong className="text-ivory">Conteúdo:</strong> textos, fotografias, vídeos, áudios, portfolios, perfis, dados, informações e demais materiais inseridos no ambiente.</li>
                <li><strong className="text-ivory">Conta:</strong> credencial e cadastro individual utilizado para acesso autenticado.</li>
                <li><strong className="text-ivory">Conteúdo adulto:</strong> material visual ou interativo destinado exclusivamente a maiores de 18 anos.</li>
              </ul>
            </div>
          </section>

          {/* Seção 3 */}
          <section id="sec-3" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              3. Natureza da Lumiardi
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>3.1.</strong> A Lumiardi é uma provedora e administradora de plataforma digital de infraestrutura tecnológica, catálogo profissional e conexão comercial.
              </p>
              <p>
                <strong>3.2.</strong> A Lumiardi <strong>não atua</strong>, pelo simples fornecimento da plataforma, como:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm py-2">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Produtora de conteúdo</div>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Agência de modelos ou casting</div>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Representante artística ou empresária</div>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Empregadora de qualquer usuário</div>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Contratante direta das modelos</div>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded">✕ Produtora audiovisual ou mandatária</div>
              </div>
              <p>
                <strong>3.3.</strong> Os conteúdos são produzidos e disponibilizados sob inteira responsabilidade de seus respectivos usuários.
              </p>
              <p>
                <strong>3.4.</strong> A Lumiardi poderá exercer funções técnicas de hospedagem, organização, indexação, classificação, moderação, segurança, verificação de identidade/idade e disponibilização de ferramentas de contato.
              </p>
              <p>
                <strong>3.5.</strong> A adoção de mecanismos de moderação ou segurança não transforma a Lumiardi em autora, produtora ou coprodutora do conteúdo veiculado.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section id="sec-4" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <span>4. Destinação Exclusiva a Maiores de 18 Anos</span>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-red-500/40">
              <p>
                <strong>4.1.</strong> A plataforma é estrita e irrevogavelmente destinada a pessoas com <strong>18 anos completos ou mais</strong>.
              </p>
              <p>
                <strong>4.2.</strong> É expressamente proibida a criação, manutenção ou facilitação de conta por ou para menor de idade.
              </p>
              <p>
                <strong>4.3.</strong> Quando exigido, o acesso somente será liberado após a conclusão satisfatória do mecanismo de verificação de idade (Age Assurance / KYC) adotado pela Lumiardi.
              </p>
              <p>
                <strong>4.4.</strong> A mera autodeclaração do usuário não será utilizada como único mecanismo de comprovação de idade quando a legislação ou as melhores práticas exigirem verificação documental e biométrica confiável.
              </p>
              <p>
                <strong>4.5.</strong> A Lumiardi poderá impedir o acesso inclusive a elementos associados ao conteúdo adulto quando necessário para pleno cumprimento da legislação aplicável.
              </p>
            </div>
          </section>

          {/* Seção 5 */}
          <section id="sec-5" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              5. Cadastro e Identidade
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>5.1.</strong> O usuário deverá fornecer informações verdadeiras, exatas, atuais e completas em todos os formulários.
              </p>
              <p>
                <strong>5.2.</strong> É estritamente proibido:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                <li>Utilizar identidade falsa ou pseudônimo fraudulento;</li>
                <li>Utilizar documentos de terceiros (com ou sem autorização);</li>
                <li>Criar ou comercializar contas em nome de terceiros;</li>
                <li>Compartilhar credenciais de acesso ou chaves 2FA;</li>
                <li>Burlar ou tentar burlar os fluxos de verificação biométrica e documental;</li>
                <li>Manipular documentos digitais ou fotos de identificação;</li>
                <li>Utilizar emuladores, proxies maliciosos ou ferramentas de evasão de segurança.</li>
              </ul>
              <p>
                <strong>5.3.</strong> A Lumiardi poderá solicitar nova comprovação de identidade ou idade a qualquer momento em caso de inconsistência cadastral, suspeita de fraude ou alteração de dados.
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section id="sec-6" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              6. Responsabilidade do Usuário
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>6.1.</strong> O usuário é única e exclusivamente responsável pela veracidade das informações fornecidas e por todos os atos praticados mediante o uso de sua conta e credenciais.
              </p>
              <p>
                <strong>6.2.</strong> O usuário deverá manter suas credenciais confidenciais e notificar a Lumiardi imediatamente caso suspeite de extravio ou invasão.
              </p>
              <p>
                <strong>6.3.</strong> O usuário responderá civil e criminalmente por qualquer conteúdo que produzir, publicar, transmitir ou disponibilizar, sem prejuízo das providências legais cabíveis pela Lumiardi.
              </p>
            </div>
          </section>

          {/* Seção 7 */}
          <section id="sec-7" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              7. Conteúdo de Terceiros e Consentimento
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>7.1.</strong> O usuário declara e garante possuir todas as autorizações, cessões de direito de imagem, titularidade autoral ou fundamento jurídico válido para disponibilizar qualquer material na plataforma.
              </p>
              <p>
                <strong>7.2.</strong> A publicação de material retratando terceiros exige documentação formal de autorização e consentimento expresso de todas as pessoas envolvidas (+18).
              </p>
              <p>
                <strong>7.3.</strong> É terminantemente vedada a publicação de conteúdo obtido mediante violência, ameaça, coação, fraude, chantagem, invasão de privacidade ou ausência de consentimento livre e informado.
              </p>
            </div>
          </section>

          {/* Seção 8 - Proibições */}
          <section id="sec-8" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-red-400 font-normal flex items-center gap-2.5">
              <EyeOff className="w-6 h-6 shrink-0" />
              <span>8. Conteúdos e Condutas Terminantemente Proibidos</span>
            </h2>
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg space-y-3 text-ivory/90">
              <p className="font-medium text-red-300 text-xs uppercase tracking-wider">
                Tolerância Zero para as seguintes práticas:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Qualquer conteúdo sexual ou pornográfico envolvendo menor de 18 anos (CSAM);</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Material de exploração sexual de crianças ou adolescentes;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Conteúdo íntimo divulgado sem consentimento (NCII / Revenge Porn);</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Conteúdo obtido mediante coerção, violência sexual ou abuso;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Tráfico de pessoas, aliciamento ou trabalho forçado;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Impersonação fraudulenta ou uso indevido de identidade alheia;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Violação de direitos autorais ou direitos de imagem de terceiros;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Qualquer tentativa de utilizar a plataforma para atividades criminosas.</span>
                </li>
              </ul>
              <p className="text-xs text-red-300 pt-2 border-t border-red-500/20">
                Violações desta cláusula ensejam suspensão imediata da conta, preservação integral dos registros probatórios e denúncia formal perante as autoridades policiais competentes.
              </p>
            </div>
          </section>

          {/* Seção 9 */}
          <section id="sec-9" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              9. Licença de Uso do Conteúdo
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>9.1.</strong> O usuário permanece titular exclusivo dos direitos autorais e patrimoniais que legalmente lhe pertençam sobre o conteúdo que criar ou enviar.
              </p>
              <p>
                <strong>9.2.</strong> Ao disponibilizar conteúdo no ambiente Lumiardi, o usuário concede à Lumiardi licença limitada, não exclusiva e temporária, estritamente necessária à operação técnica da plataforma.
              </p>
              <p>
                <strong>9.3.</strong> A licença compreende exclusivamente as operações técnicas de: hospedagem, armazenamento criptografado, processamento, reprodução técnica, transmissão, indexação no catálogo autenticado, exibição restrita dentro da plataforma, backup e distribuição técnica segura.
              </p>
              <p>
                <strong>9.4.</strong> Esta licença não representa qualquer transferência ou cessão definitiva da titularidade dos direitos autorais.
              </p>
              <p>
                <strong>9.5.</strong> A Lumiardi somente poderá utilizar o conteúdo para finalidade promocional, publicitária ou comercial externa quando houver prévia base contratual ou consentimento específico e expresso da titular.
              </p>
            </div>
          </section>

          {/* Seção 10 */}
          <section id="sec-10" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              10. Relação Entre Modelos e Agências
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>10.1.</strong> A Lumiardi disponibiliza ferramentas tecnológicas para que agências credenciadas encontrem modelos e criadoras e para que modelos avaliem oportunidades de representação.
              </p>
              <p>
                <strong>10.2.</strong> A plataforma fornece canais e funcionalidades para comunicação, negociação e aproximação profissional.
              </p>
              <p>
                <strong>10.3.</strong> A eventual contratação de prestação de serviços ou assessoria é estabelecida diretamente entre as partes contratantes.
              </p>
              <p>
                <strong>10.4.</strong> A Lumiardi não garante: contratação efetiva, patamares mínimos de remuneração, volume de propostas, audiência ou resultados comerciais específicos.
              </p>
            </div>
          </section>

          {/* Seção 11 */}
          <section id="sec-11" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              11. Pagamentos e Assinaturas
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>11.1.</strong> A plataforma disponibiliza assinaturas, planos de acesso e funcionalidades corporativas cujos valores e condições são previamente discriminados.
              </p>
              <p>
                <strong>11.2.</strong> As condições comerciais, renovações e prazos de faturamento são apresentados de forma clara antes da confirmação da contratação.
              </p>
              <p>
                <strong>11.3.</strong> O processamento financeiro pode ser operacionalizado por gateways terceiros homologados e certificados internacionalmente.
              </p>
              <p>
                <strong>11.4.</strong> Transações com indícios de fraude, estorno indevido ou atividade suspeita poderão ser bloqueadas cautelarmente.
              </p>
            </div>
          </section>

          {/* Seção 12 */}
          <section id="sec-12" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              12. Moderação e Governança de Conteúdo
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>12.1.</strong> A Lumiardi utiliza ferramentas automatizadas e análise humana contínua para: detectar conteúdos proibidos, analisar denúncias formais, prevenir fraudes, cumprir determinações judiciais e zelar pela segurança jurídica e operacional da plataforma.
              </p>
              <p>
                <strong>12.2.</strong> Diante de suspeita fundada ou violação comprovada, conteúdos poderão ser imediatamente: sinalizados, restringidos, desindexados do catálogo, temporariamente retidos ou permanentemente removidos.
              </p>
            </div>
          </section>

          {/* Seção 13 */}
          <section id="sec-13" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              13. Suspensão e Encerramento de Contas
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                A Lumiardi poderá suspender cautelarmente ou rescindir de pleno direito a conta de qualquer usuário nos seguintes casos:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-ivory/80">
                <li>Violação de qualquer cláusula destes Termos ou das políticas anexas;</li>
                <li>Fraude documental, falsidade ideológica ou suspeita de menoridade;</li>
                <li>Inclusão de conteúdos ilícitos ou não autorizados;</li>
                <li>Violação de direitos autorais, marcas ou privacidade de terceiros;</li>
                <li>Tentativa de exploração de vulnerabilidades ou evasão de segurança;</li>
                <li>Determinação de autoridade policial, regulatória ou judicial competente;</li>
                <li>Geração de risco sistêmico, jurídico ou reputacional à comunidade de usuários.</li>
              </ul>
            </div>
          </section>

          {/* Seção 14 */}
          <section id="sec-14" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal flex items-center justify-between">
              <span>14. Canal de Denúncias e Notice-and-Action</span>
              <Link
                href="/portal"
                className="text-xs font-sans text-[#C9A96B] border border-[#C9A96B]/40 px-3 py-1 hover:bg-[#C9A96B] hover:text-[#0B0B0B] transition-all"
              >
                Acessar Portal de Denúncias →
              </Link>
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>14.1.</strong> A Lumiardi disponibiliza o <Link href="/portal" className="text-[#C9A96B] underline">Portal de Denúncias, Abuso e Direitos</Link> como canal formal de notice-and-action para acolhimento de solicitações de remoção, reporte de abusos e proteção de direitos.
              </p>
              <p>
                <strong>14.2.</strong> Denúncias envolvendo suspeita de menor de idade ou divulgação não autorizada de conteúdo íntimo (NCII) recebem tratamento prioritário e tramitação de emergência.
              </p>
              <p>
                <strong>14.3.</strong> A Lumiardi manterá os logs e evidências necessários para subsidiar eventuais investigações policiais e cumprimento de ordens judiciais.
              </p>
            </div>
          </section>

          {/* Seção 15 */}
          <section id="sec-15" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              15. Propriedade Intelectual da Lumiardi
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>15.1.</strong> A marca <strong>LUMIARDI</strong>, logotipos, layout, código-fonte, arquitetura de software, bancos de dados, interfaces, algoritmos e documentações técnicas são de propriedade exclusiva da <strong>LUMIARDI GESTÃO DE CONTEÚDO LTDA.</strong>
              </p>
              <p>
                <strong>15.2.</strong> É expressamente vedada qualquer engenharia reversa, cópia, scraping automatizado ou exploração comercial desautorizada dos ativos intelectuais da Lumiardi.
              </p>
            </div>
          </section>

          {/* Seção 16 */}
          <section id="sec-16" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              16. Segurança da Informação
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>16.1.</strong> A Lumiardi emprega padrões técnicos rígidos de proteção, incluindo: criptografia em trânsito e em repouso, controle de acesso baseado em privilégios mínimos (RBAC), autenticação multifator (2FA), monitoramento contínuo e proteção contra acessos não autorizados.
              </p>
            </div>
          </section>

          {/* Seção 17 */}
          <section id="sec-17" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              17. Limitação de Responsabilidade
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>17.1.</strong> Na extensão permitida pela legislação aplicável, a Lumiardi não responde por atos ilícitos praticados exclusivamente por terceiros fora de sua esfera direta de controle técnico.
              </p>
              <p>
                <strong>17.2.</strong> A presente cláusula não afasta nenhuma responsabilidade legal inderrogável imposta pelo Marco Civil da Internet (Lei nº 12.965/2014) ou pela LGPD.
              </p>
            </div>
          </section>

          {/* Seção 18 */}
          <section id="sec-18" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              18. Proteção de Dados Pessoais (LGPD)
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>18.1.</strong> Todas as operações de tratamento de dados pessoais no âmbito da plataforma são estritamente reguladas pela <Link href="/politica-privacidade" className="text-[#C9A96B] underline font-medium">Política de Privacidade e LGPD da Lumiardi</Link>, em integral conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
            </div>
          </section>

          {/* Seção 19 */}
          <section id="sec-19" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              19. Alterações dos Termos
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>19.1.</strong> A Lumiardi poderá revisar e atualizar estes Termos periodicamente para refletir evoluções legais, regulatórias, tecnológicas ou de segurança. Alterações relevantes serão comunicadas com transparência aos usuários.
              </p>
            </div>
          </section>

          {/* Seção 20 */}
          <section id="sec-20" className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-[#C9A96B] font-normal">
              20. Legislação Aplicável e Foro
            </h2>
            <div className="space-y-3 pl-4 border-l-2 border-[#C9A96B]/30">
              <p>
                <strong>20.1.</strong> Estes Termos de Uso são regidos e interpretados segundo as leis da República Federativa do Brasil.
              </p>
              <p>
                <strong>20.2.</strong> O foro competente será definido conforme a legislação aplicável, observadas as normas de competência territorial e defesa dos direitos do consumidor, quando incidentes.
              </p>
            </div>
          </section>

        </div>

        {/* Rodapé Interno com Dados Oficiais */}
        <div className="pt-12 border-t border-white/10 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-ivory/70">
            <div className="space-y-1">
              <p className="text-ivory font-medium">LUMIARDI GESTÃO DE CONTEÚDO LTDA.</p>
              <p>Av. Alm. Julio de Sá Bierrenbach, 65 – Bloco 2 – Sala 315 – Barra Olímpica/RJ</p>
              <p>Canal de Atendimento & Notificações: <a href="mailto:sac@lumiardi.com" className="text-[#C9A96B]">sac@lumiardi.com</a></p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/politica-privacidade"
                className="px-4 py-2 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 transition-all font-medium"
              >
                Política de Privacidade →
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
