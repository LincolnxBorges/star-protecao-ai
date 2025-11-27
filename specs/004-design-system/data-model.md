# Data Model: Design System Tokens

**Date**: 2025-11-27
**Feature**: 004-design-system

Este documento define a estrutura dos tokens de design que serao implementados em `app/globals.css`.

## Color Tokens

### Semantic Colors (shadcn pattern)

```css
/* Core semantic tokens - usado via Tailwind classes */
--background          /* bg-background */
--foreground          /* text-foreground */
--primary             /* bg-primary, text-primary */
--primary-foreground  /* text-primary-foreground */
--secondary           /* bg-secondary */
--secondary-foreground
--muted               /* bg-muted */
--muted-foreground    /* text-muted-foreground */
--accent              /* bg-accent */
--accent-foreground
--destructive         /* bg-destructive */
--border              /* border-border */
--input               /* border-input */
--ring                /* ring-ring */
```

### Brand Color Palettes

Cada paleta tem 10 tons (50, 100, 200, 300, 400, 500, 600, 700, 800, 900):

```css
/* Light Green - Primary brand color */
--light-green-50   /* Backgrounds claros */
--light-green-100
--light-green-200
--light-green-300
--light-green-400
--light-green-500  /* DEFAULT - #2EC27E */
--light-green-600
--light-green-700
--light-green-800
--light-green-900  /* Texto sobre fundo claro */

/* Dark Green - Sidebar/Headers */
--dark-green-50
--dark-green-500   /* DEFAULT */
--dark-green-900   /* Sidebar background - #1A3A2F */

/* Blue - Info/Links */
--blue-50 to --blue-900
--blue-500         /* DEFAULT - #0284C7 */

/* Red - Error/Destructive */
--red-50 to --red-900
--red-500          /* DEFAULT - #DC2626 */

/* Yellow - Warning */
--yellow-50 to --yellow-900
--yellow-500       /* DEFAULT - #CA8A04 */

/* Grey - Neutral/Muted */
--grey-50 to --grey-900
--grey-500         /* DEFAULT - #6B7280 */
```

### Mapping to Semantic Tokens

```css
:root {
  /* Light mode */
  --primary: var(--light-green-500);
  --primary-foreground: white;
  --destructive: var(--red-500);
  --muted: var(--grey-100);
  --muted-foreground: var(--grey-500);
  --accent: var(--light-green-100);
}

.dark {
  /* Dark mode */
  --primary: var(--light-green-400);
  --primary-foreground: var(--dark-green-900);
  --destructive: var(--red-400);
  --muted: var(--grey-800);
  --muted-foreground: var(--grey-400);
}
```

## Typography Tokens

### Font Family

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Font Sizes (Website Scale)

```css
--text-website-h1: 4rem;      /* 64px */
--text-website-h2: 3.5rem;    /* 56px */
--text-website-h3: 3rem;      /* 48px */
--text-website-h4: 2rem;      /* 32px */
--text-website-h5: 1.5rem;    /* 24px */
--text-website-h6: 1.125rem;  /* 18px */
```

### Font Sizes (Dashboard Scale)

```css
--text-dashboard-h1: 3rem;    /* 48px */
--text-dashboard-h2: 2.5rem;  /* 40px */
--text-dashboard-h3: 2rem;    /* 32px */
--text-dashboard-h4: 1.5rem;  /* 24px */
--text-dashboard-h5: 1.25rem; /* 20px */
--text-dashboard-h6: 1.125rem;/* 18px */
```

### Font Sizes (Body Scale)

```css
--text-body-xlarge: 1.5rem;   /* 24px */
--text-body-large: 1.125rem;  /* 18px */
--text-body-medium: 1rem;     /* 16px */
--text-body-small: 0.875rem;  /* 14px - default */
--text-body-xsmall: 0.75rem;  /* 12px */
```

## Spacing Tokens

Escala de 4px base:

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

## Border Radius Tokens

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.625rem;  /* 10px - default */
--radius-xl: 0.875rem;  /* 14px */
--radius-full: 9999px;  /* Pills/Circles */
```

## Shadow Tokens

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
```

## Component-Specific Tokens

### Sidebar

```css
--sidebar-width: 240px;
--sidebar-collapsed-width: 64px;
--sidebar-background: var(--dark-green-900);
--sidebar-foreground: white;
--sidebar-item-height: 40px;
--sidebar-item-padding: var(--spacing-3) var(--spacing-4);
```

### Metric Card

```css
--metric-card-padding: var(--spacing-4);
--metric-card-border-width: 4px;
--metric-card-border-radius: var(--radius-lg);
```

### Button Sizes

```css
--button-height-sm: 32px;
--button-height-md: 40px;  /* default */
--button-height-lg: 48px;
--button-padding-x: var(--spacing-4);
```

### Input Sizes

```css
--input-height: 40px;
--input-padding-x: var(--spacing-3);
--input-border-width: 1px;
```

## Breakpoints Reference

```css
/* Tailwind default - nao precisa definir, apenas referencia */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## State Colors

```css
/* Alert variants */
--alert-success-bg: var(--light-green-50);
--alert-success-border: var(--light-green-500);
--alert-success-text: var(--light-green-900);

--alert-warning-bg: var(--yellow-50);
--alert-warning-border: var(--yellow-500);
--alert-warning-text: var(--yellow-900);

--alert-error-bg: var(--red-50);
--alert-error-border: var(--red-500);
--alert-error-text: var(--red-900);

--alert-info-bg: var(--blue-50);
--alert-info-border: var(--blue-500);
--alert-info-text: var(--blue-900);
```
