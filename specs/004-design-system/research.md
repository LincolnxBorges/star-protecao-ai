# Research: Design System Star Protecao IA

**Date**: 2025-11-27
**Feature**: 004-design-system

## Research Topics

### 1. Conversao de Cores Figma para OKLCH

**Decision**: Converter cores do Figma (HEX/RGB) para formato OKLCH usado no Tailwind CSS 4.

**Rationale**: OKLCH oferece melhor uniformidade perceptual de cores e e o formato nativo do Tailwind CSS 4. Permite manipulacao mais previsivel de luminosidade e saturacao.

**Alternatives Considered**:
- HSL: Descartado - menos uniforme perceptualmente
- RGB: Descartado - dificil manipular para dark mode
- HEX: Descartado - nao suporta transparencia nativamente

**Implementation Notes**:
- Usar ferramenta online ou script para converter cores do Figma
- Paletas identificadas no Figma:
  - Light Green: #2EC27E (base 500) - cor primaria
  - Dark Green: #1A3A2F (base 900) - sidebar/headers
  - Blue: #0284C7 (base 500) - informacao
  - Red: #DC2626 (base 500) - erro/destructive
  - Yellow: #CA8A04 (base 500) - warning
  - Grey: #6B7280 (base 500) - muted/neutral

### 2. Font Loading Strategy para Inter

**Decision**: Usar next/font com Inter do Google Fonts, font-display: swap.

**Rationale**: next/font otimiza automaticamente o carregamento de fontes, elimina layout shift e permite self-hosting automatico. Font-display: swap garante que texto seja visivel enquanto fonte carrega.

**Alternatives Considered**:
- CDN direto: Descartado - nao otimizado, pode causar FOUT
- Self-host manual: Descartado - mais complexo sem beneficio
- Variable font: Considerado - Inter Variable pode reduzir requests

**Implementation Notes**:
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})
```

### 3. Componentes shadcn Existentes vs Custom

**Decision**: Usar shadcn CLI para componentes disponiveis, criar custom apenas quando necessario.

**Rationale**: shadcn ja oferece Button, Input, Badge, RadioGroup, etc. Customizar via CSS e mais simples que reescrever. Componentes como Toggle (switch), Chip, Alert precisam ser criados ou adaptados.

**Alternatives Considered**:
- Criar todos do zero: Descartado - reinventa a roda
- Usar outra lib (Radix direto): Descartado - shadcn ja encapsula Radix

**Componentes shadcn a adicionar**:
- `npx shadcn@latest add switch` (para Toggle)
- `npx shadcn@latest add alert` (para Alert)

**Componentes custom necessarios**:
- `chip.tsx` - shadcn nao tem equivalente
- `dashboard-sidebar.tsx` - layout especifico do projeto
- `dashboard-metric-card.tsx` - card especifico com bordas coloridas
- `platform-card.tsx` - cards de integracao
- `wizard-step.tsx` - wizard multi-step

### 4. Dark Mode Implementation

**Decision**: Usar classe `.dark` no elemento raiz com CSS custom properties.

**Rationale**: Tailwind CSS 4 e shadcn ja usam este padrao. Permite toggle programatico e respeita preferencia do sistema via `prefers-color-scheme`.

**Alternatives Considered**:
- Data attribute: Descartado - menos compativel com shadcn
- Separate stylesheets: Descartado - duplica codigo

**Implementation Notes**:
- Ja configurado em globals.css com `@custom-variant dark (&:is(.dark *))`
- Usar `next-themes` para gerenciar toggle

### 5. Acessibilidade WCAG 2.1 AA

**Decision**: Garantir contraste 4.5:1, focus visible, labels ARIA em todos componentes.

**Rationale**: Requisito definido na clarificacao. WCAG 2.1 AA e o padrao de mercado para aplicacoes web.

**Implementation Checklist**:
- [ ] Verificar contraste de todas as combinacoes cor texto/fundo
- [ ] Adicionar focus-visible ring em todos componentes interativos
- [ ] Garantir navegacao por teclado (Tab, Enter, Space, Arrow keys)
- [ ] Adicionar aria-label em icones sem texto
- [ ] Testar com screen reader (VoiceOver/NVDA)

**Tools**:
- Chrome DevTools Accessibility
- Axe DevTools extension
- Contrast checker online

### 6. Tipografia Escala

**Decision**: Definir escalas separadas para Website, Dashboard e App conforme Figma.

**Rationale**: O Figma mostra 3 contextos tipograficos diferentes com tamanhos especificos. Manter consistencia com o design.

**Scale Mapping** (baseado no Figma Typography):
```
Website Heading:
- H1: 64px / Semibold
- H2: 56px / Semibold
- H3: 48px / Semibold
- H4: 32px / Semibold
- H5: 24px / Semibold
- H6: 18px / Semibold

Dashboard Heading:
- H1: 48px / Semibold
- H2: 40px / Semibold
- H3: 32px / Semibold
- H4: 24px / Semibold
- H5: 20px / Semibold
- H6: 18px / Semibold

Body:
- XLarge: 24px
- Large: 18px
- Medium: 16px
- Small: 14px (default)
- XSmall: 12px

Weights: Regular (400), Semibold (600), Medium (500), Bold (700)
```

## Resolved Clarifications

| Topic | Resolution |
|-------|------------|
| Breakpoints | Tailwind padrao: sm(640), md(768), lg(1024), xl(1280), 2xl(1536) |
| Acessibilidade | WCAG 2.1 AA |
| Customizacao | Via CSS custom properties em globals.css apenas |

## Next Steps

1. Criar data-model.md com estrutura de tokens
2. Criar quickstart.md com instrucoes de uso
3. Executar /speckit.tasks para gerar tarefas detalhadas
