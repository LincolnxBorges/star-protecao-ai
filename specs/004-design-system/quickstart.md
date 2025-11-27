# Quickstart: Design System Star Protecao IA

**Date**: 2025-11-27
**Feature**: 004-design-system

## Uso Rapido

### Cores

Sempre use tokens semanticos, nunca cores hardcoded:

```tsx
// Correto
<div className="bg-primary text-primary-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="border-border" />

// Incorreto - NUNCA faca isso
<div className="bg-[#2EC27E]" />
<div style={{ color: 'green' }} />
```

### Cores de Marca (quando precisar de tons especificos)

```tsx
// Light Green (primaria)
<div className="bg-light-green-500" />  // Default
<div className="bg-light-green-100" />  // Fundo sutil
<div className="bg-light-green-900" />  // Texto sobre claro

// Dark Green (sidebar/headers)
<div className="bg-dark-green-900" />   // Sidebar background

// Status colors
<div className="bg-red-500" />          // Error
<div className="bg-yellow-500" />       // Warning
<div className="bg-blue-500" />         // Info
```

### Tipografia

```tsx
// Headings de Dashboard
<h1 className="text-dashboard-h1 font-semibold">Titulo Principal</h1>
<h2 className="text-dashboard-h2 font-semibold">Subtitulo</h2>

// Body text
<p className="text-body-small">Texto padrao (14px)</p>
<p className="text-body-large">Texto grande (18px)</p>
<span className="text-body-xsmall text-muted-foreground">Caption</span>
```

### Espacamentos

Use a escala de espacamento padrao do Tailwind que segue multiplos de 4px:

```tsx
<div className="p-4" />   // 16px
<div className="p-6" />   // 24px
<div className="gap-2" /> // 8px
<div className="mt-8" />  // 32px
```

## Componentes

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variantes
<Button variant="default">Primary</Button>     // Verde preenchido
<Button variant="secondary">Secondary</Button> // Outline
<Button variant="ghost">Ghost</Button>         // Sem fundo
<Button variant="destructive">Delete</Button>  // Vermelho

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Com icone
<Button>
  <PlusIcon className="mr-2 h-4 w-4" />
  Adicionar
</Button>
```

### Input

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="email@exemplo.com"
  />
</div>

// Com icone
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Buscar..." />
</div>
```

### Toggle (Switch)

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Ativar notificacoes</Label>
</div>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

// Variantes básicas
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Outline</Badge>

// Status badges
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="info">Info</Badge>

// Outline status badges
<Badge variant="outline-success">Sucesso</Badge>
<Badge variant="outline-destructive">Erro</Badge>
<Badge variant="outline-warning">Aviso</Badge>
<Badge variant="outline-info">Info</Badge>
```

### Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

// Success
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Sucesso!</AlertTitle>
  <AlertDescription>Operacao realizada com sucesso.</AlertDescription>
</Alert>

// Warning
<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Atencao</AlertTitle>
  <AlertDescription>Verifique os dados.</AlertDescription>
</Alert>

// Error
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>Algo deu errado.</AlertDescription>
</Alert>
```

### Chip

```tsx
import { Chip } from "@/components/ui/chip"

// Variantes preenchidas
<Chip variant="filled">Primary</Chip>
<Chip variant="filled-secondary">Secondary</Chip>
<Chip variant="filled-success">Sucesso</Chip>
<Chip variant="filled-warning">Aviso</Chip>
<Chip variant="filled-error">Erro</Chip>
<Chip variant="filled-info">Info</Chip>

// Variantes outline
<Chip variant="outline">Primary</Chip>
<Chip variant="outline-secondary">Secondary</Chip>
<Chip variant="outline-success">Sucesso</Chip>

// Tamanhos
<Chip size="sm">Pequeno</Chip>
<Chip size="default">Padrão</Chip>
<Chip size="lg">Grande</Chip>

// Removível
<Chip removable onRemove={() => console.log("removed")}>
  Tag removível
</Chip>
```

## Layout Components

### Dashboard Sidebar

```tsx
import { DashboardSidebar } from "@/components/dashboard-sidebar"

// O componente usa navegação interna definida no arquivo
// Inclui suporte a mobile com Sheet
<DashboardSidebar />
```

### Metric Card

```tsx
import { DashboardMetricCard } from "@/components/dashboard-metric-card"

// Card com variação positiva
<DashboardMetricCard
  title="Total Vendas"
  value="R$ 36.000"
  change="+12%"
  changeType="positive"
  changeLabel="vs. mês anterior"
  borderColor="green"
/>

// Card com variação negativa
<DashboardMetricCard
  title="Cotações Pendentes"
  value="23"
  change="-5%"
  changeType="negative"
  borderColor="yellow"
/>

// Cores de borda disponíveis: green, blue, red, yellow, grey
```

### Page Header

```tsx
import { DashboardPageHeader } from "@/components/dashboard-page-header"

// Header simples
<DashboardPageHeader
  title="Dashboard"
  description="Visão geral das suas métricas"
/>

// Header com ações
<DashboardPageHeader
  title="Cotações"
  description="Gerencie suas cotações"
  actions={
    <Button>Nova Cotação</Button>
  }
/>
```

### Dashboard Navbar

```tsx
import { DashboardNavbar } from "@/components/dashboard-navbar"

// Navbar com links customizados
<DashboardNavbar
  logoText="Star Proteção"
  links={[
    { href: "/", label: "Home" },
    { href: "/sobre", label: "Sobre" },
    { href: "/planos", label: "Planos" },
  ]}
  showAuthButtons
/>
```

### Dashboard Footer

```tsx
import { DashboardFooter } from "@/components/dashboard-footer"

// Footer completo com newsletter e links
<DashboardFooter
  companyName="Star Proteção"
  description="Proteja seu veículo com a melhor cobertura."
  showNewsletter
  onNewsletterSubmit={(email) => console.log(email)}
/>
```

### Platform Card

```tsx
import { PlatformCard } from "@/components/platform-card"

// Plataforma conectada
<PlatformCard
  platform="shopify"
  status="connected"
  onConfigure={() => {}}
  onDisconnect={() => {}}
/>

// Plataforma desconectada
<PlatformCard
  platform="woocommerce"
  status="disconnected"
  onConnect={() => {}}
/>

// Plataformas disponíveis: shopify, woocommerce, wordpress, magento, wix, custom
```

### Wizard Step

```tsx
import { WizardSteps, WizardStep } from "@/components/wizard-step"

<WizardSteps>
  <WizardStep
    step={1}
    title="Dados Pessoais"
    description="Preencha seus dados"
    status="completed"
  />
  <WizardStep
    step={2}
    title="Veículo"
    description="Dados do veículo"
    status="active"
  >
    {/* Conteúdo do passo ativo */}
    <form>...</form>
  </WizardStep>
  <WizardStep
    step={3}
    title="Confirmação"
    description="Revise os dados"
    status="idle"
    isLast
  />
</WizardSteps>

// Estados disponíveis: idle, active, completed, error, loading
```

## Dark Mode

O sistema suporta dark mode automaticamente. Para toggle manual:

```tsx
import { useTheme } from "next-themes"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
```

## Acessibilidade

Todos os componentes seguem WCAG 2.1 AA:

- Use sempre `Label` com inputs
- Adicione `aria-label` em botoes apenas com icone
- Mantenha focus visible em elementos interativos
- Teste navegacao por teclado

```tsx
// Botao com apenas icone
<Button aria-label="Fechar" variant="ghost" size="icon">
  <XIcon className="h-4 w-4" />
</Button>
```

## Responsividade

Use breakpoints Tailwind padrao:

```tsx
<div className="
  grid
  grid-cols-1      // Mobile
  sm:grid-cols-2   // >= 640px
  lg:grid-cols-4   // >= 1024px
  gap-4
">
  {/* Cards */}
</div>
```
