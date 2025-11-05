REGRAS CRÍTICAS PARA CLAUDE/CURSOR

ORGANIZAÇÃO DE ARQUIVOS

Raiz do projeto é PROIBIDA para novos arquivos.
Único .md permitido na raiz: README.md

Onde colocar arquivos:
- Documentação: docs/[categoria]/ (integration, fixes, changelog, reports, checklists, guides, testing, troubleshooting)
- Código: src/[categoria]/ (components, screens, services, hooks, context, types, theme, utils, navigation)
- Testes: __tests__/ ou e2e/
- Scripts: scripts/
- Config na raiz: package.json, tsconfig.json, app.json, babel.config.js, eas.json

DOCUMENTAÇÃO

Evitar criar .md sem necessidade real.
Quando criar .md: texto puro, direto, sem floreios.
Proibido: símbolos ## e ** (sem markdown headers e bold).
Usar texto simples e objetivo.

RESUMO

1. Não colocar nada na raiz
2. Organizar em pastas apropriadas
3. .md apenas quando essencial
4. Documentação sem formatação fancy
