# Diretrizes de Desenvolvimento de Produto — ConektaFinance

1. **Mentalidade de Produto Real (SaaS Fintech)**:
   - Este projeto deve ser tratado, desenvolvido e mantido como um **produto real de mercado** (uma plataforma SaaS corporativa e pessoal de gestão financeira inteligente desenvolvida pela *Conekta Tech Solutions*).
   - O padrão visual, de experiência do usuário (UX) e de código deve seguir o nível de excelência de empresas referências (Vercel, Linear, Stripe, Nubank).

2. **Proibição Estrita de Termos Acadêmicos nas Interfaces do Usuário**:
   - **NUNCA** inclua termos como `"PIM"`, `"PIM IV"`, `"PIM III"`, `"UNIP"`, `"Universidade Paulista"`, `"trabalho acadêmico"`, `"semestre"`, `"disciplina"`, `"avaliação"`, ou qualquer referência a faculdade/projeto acadêmico em:
     - Telas, páginas, modais, headers, footers ou menus laterais.
     - Botões, badges, alertas, banners, tooltips ou formulários.
     - Respostas, prompts ou saídas do assistente de IA (Copilot).
     - Massa de dados fictícia, transações ou categorias.
     - Metadados públicos do sistema (`<title>`, `manifest.json`, descrições PWA).

3. **Papel dos Documentos Acadêmicos no Repositório**:
   - Arquivos como manuais acadêmicos (`docs/00-manual-pim-iv/`), roadmaps e relatórios existem no repositório **estritamente como referência interna de critérios e boas práticas técnicas** (banco de dados, PWA, arquitetura, etc.) para guiar as entregas do projeto.
   - O software e todo o seu código de produção devem permanecer 100% agnósticos a essas menções.

4. **Consistência de Design System e Usabilidade**:
   - Seguir rigorosamente os tokens e paletas do `design-system.html` (cores, bordas sutis com alpha, superfícies dark/light e tipografia Inter / IBM Plex Mono).
   - Garantir suporte nativo a safe areas de smartphones (iOS Notch / Dynamic Island e Home Indicator).
