# Issue 023: Deepractice Design Tokens

## Overview

Deepractice Design Token 体系是 Deepractice 所有产品的统一设计语言。基于"成长、开源社区"的品牌定位，采用绿色为主色调，营造专业、可信赖、清新的视觉体验。

## Design Philosophy

- **清新专业** - 浅色背景 + 绿色主调，传达开源社区的活力与专业
- **友好易用** - 适中的对比度、圆角设计，适合普通用户
- **一致性** - 统一的设计语言，跨产品保持视觉一致
- **可访问性** - 符合 WCAG 2.1 AA 标准的对比度要求

---

## Color System

### Background Colors

| Token                    | Value     | Description                         |
| ------------------------ | --------- | ----------------------------------- |
| `--background`           | `#ffffff` | 主背景色，用于页面和卡片            |
| `--background-secondary` | `#f5f5f3` | 次要背景色，用于页面底层、分区      |
| `--background-tertiary`  | `#ebebeb` | 第三层背景，用于 hover 状态、输入框 |

### Foreground / Text Colors

| Token                    | Value     | Description                |
| ------------------------ | --------- | -------------------------- |
| `--foreground`           | `#1a1a1a` | 主文字色，标题、重要内容   |
| `--foreground-secondary` | `#666666` | 次要文字，正文、描述       |
| `--foreground-muted`     | `#999999` | 弱化文字，占位符、辅助信息 |
| `--foreground-disabled`  | `#c0c0c0` | 禁用状态文字               |

### Border Colors

| Token             | Value     | Description            |
| ----------------- | --------- | ---------------------- |
| `--border`        | `#e5e5e5` | 默认边框色             |
| `--border-strong` | `#d0d0d0` | 强调边框，输入框 focus |
| `--border-subtle` | `#f0f0f0` | 弱化边框，分割线       |

### Primary Colors (Green - 开源社区)

| Token                  | Value     | Description                |
| ---------------------- | --------- | -------------------------- |
| `--primary`            | `#22c55e` | 主色，CTA 按钮、链接、强调 |
| `--primary-hover`      | `#16a34a` | 主色 hover 状态            |
| `--primary-active`     | `#15803d` | 主色 active 状态           |
| `--primary-light`      | `#f0fdf4` | 主色浅色背景，badges、tags |
| `--primary-foreground` | `#ffffff` | 主色上的文字               |

### Secondary Colors

| Token                    | Value     | Description    |
| ------------------------ | --------- | -------------- |
| `--secondary`            | `#f5f5f3` | 次要按钮背景   |
| `--secondary-hover`      | `#ebebeb` | 次要按钮 hover |
| `--secondary-foreground` | `#1a1a1a` | 次要按钮文字   |

### Semantic Colors

#### Success

| Token                  | Value     | Description            |
| ---------------------- | --------- | ---------------------- |
| `--success`            | `#22c55e` | 成功状态（同 primary） |
| `--success-light`      | `#f0fdf4` | 成功浅色背景           |
| `--success-foreground` | `#15803d` | 成功状态文字           |

#### Warning

| Token                  | Value     | Description  |
| ---------------------- | --------- | ------------ |
| `--warning`            | `#f59e0b` | 警告状态     |
| `--warning-light`      | `#fffbeb` | 警告浅色背景 |
| `--warning-foreground` | `#b45309` | 警告状态文字 |

#### Error / Destructive

| Token                | Value     | Description  |
| -------------------- | --------- | ------------ |
| `--error`            | `#ef4444` | 错误状态     |
| `--error-light`      | `#fef2f2` | 错误浅色背景 |
| `--error-foreground` | `#dc2626` | 错误状态文字 |

#### Info

| Token               | Value     | Description  |
| ------------------- | --------- | ------------ |
| `--info`            | `#3b82f6` | 信息状态     |
| `--info-light`      | `#eff6ff` | 信息浅色背景 |
| `--info-foreground` | `#2563eb` | 信息状态文字 |

### Accent Colors (可选强调色)

| Token                   | Value     | Description              |
| ----------------------- | --------- | ------------------------ |
| `--accent-purple`       | `#8b5cf6` | 紫色强调，创意、高级功能 |
| `--accent-purple-light` | `#f5f3ff` | 紫色浅色背景             |
| `--accent-cyan`         | `#06b6d4` | 青色强调，新功能、beta   |
| `--accent-cyan-light`   | `#ecfeff` | 青色浅色背景             |

---

## Typography

### Font Family

| Token         | Value                                                                | Description              |
| ------------- | -------------------------------------------------------------------- | ------------------------ |
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 主字体，UI 和正文        |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', Consolas, monospace`                 | 等宽字体，代码和技术内容 |

### Font Size

| Token         | Value  | Description              |
| ------------- | ------ | ------------------------ |
| `--text-xs`   | `11px` | 极小文字，badge、caption |
| `--text-sm`   | `12px` | 小文字，辅助信息         |
| `--text-base` | `14px` | 基础文字，正文           |
| `--text-md`   | `15px` | 中等文字，列表项         |
| `--text-lg`   | `16px` | 大文字，小标题           |
| `--text-xl`   | `18px` | 特大文字，区块标题       |
| `--text-2xl`  | `24px` | 页面副标题               |
| `--text-3xl`  | `28px` | 页面标题                 |
| `--text-4xl`  | `32px` | 大标题、Hero             |

### Font Weight

| Token             | Value | Description          |
| ----------------- | ----- | -------------------- |
| `--font-normal`   | `400` | 正常，正文           |
| `--font-medium`   | `500` | 中等，强调正文、按钮 |
| `--font-semibold` | `600` | 半粗，小标题         |
| `--font-bold`     | `700` | 粗体，大标题         |

### Line Height

| Token               | Value   | Description      |
| ------------------- | ------- | ---------------- |
| `--leading-none`    | `1`     | 无行高，单行标题 |
| `--leading-tight`   | `1.25`  | 紧凑，标题       |
| `--leading-normal`  | `1.5`   | 正常，正文       |
| `--leading-relaxed` | `1.625` | 宽松，长段落     |
| `--leading-loose`   | `2`     | 松散，特殊排版   |

---

## Spacing

基于 4px 基础单位的间距系统。

| Token        | Value  | Description        |
| ------------ | ------ | ------------------ |
| `--space-0`  | `0`    | 无间距             |
| `--space-1`  | `4px`  | 极小间距           |
| `--space-2`  | `8px`  | 小间距，元素内部   |
| `--space-3`  | `12px` | 常规间距           |
| `--space-4`  | `16px` | 标准间距，元素之间 |
| `--space-5`  | `20px` | 中等间距           |
| `--space-6`  | `24px` | 大间距，区块内部   |
| `--space-8`  | `32px` | 特大间距，区块之间 |
| `--space-10` | `40px` | 页面边距           |
| `--space-12` | `48px` | 大区块间距         |
| `--space-16` | `64px` | Hero 区块          |

---

## Border Radius

| Token           | Value    | Description            |
| --------------- | -------- | ---------------------- |
| `--radius-none` | `0`      | 无圆角                 |
| `--radius-sm`   | `4px`    | 小圆角，badge、tag     |
| `--radius-md`   | `8px`    | 中等圆角，按钮、输入框 |
| `--radius-lg`   | `12px`   | 大圆角，卡片           |
| `--radius-xl`   | `16px`   | 特大圆角，模态框       |
| `--radius-2xl`  | `24px`   | 超大圆角，大卡片       |
| `--radius-full` | `9999px` | 完全圆角，pill、avatar |

---

## Shadow

| Token           | Value                                                     | Description        |
| --------------- | --------------------------------------------------------- | ------------------ |
| `--shadow-none` | `none`                                                    | 无阴影             |
| `--shadow-sm`   | `0 1px 2px rgba(0,0,0,0.05)`                              | 小阴影，hover 状态 |
| `--shadow-md`   | `0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`  | 中等阴影，卡片     |
| `--shadow-lg`   | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | 大阴影，弹出层     |
| `--shadow-xl`   | `0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)` | 特大阴影，模态框   |

---

## Animation / Transition

| Token               | Value                          | Description        |
| ------------------- | ------------------------------ | ------------------ |
| `--duration-fast`   | `100ms`                        | 快速，hover 状态   |
| `--duration-normal` | `200ms`                        | 正常，大部分交互   |
| `--duration-slow`   | `300ms`                        | 慢速，模态框、抽屉 |
| `--duration-slower` | `500ms`                        | 更慢，页面过渡     |
| `--easing-default`  | `cubic-bezier(0.4, 0, 0.2, 1)` | 默认缓动           |
| `--easing-in`       | `cubic-bezier(0.4, 0, 1, 1)`   | 进入缓动           |
| `--easing-out`      | `cubic-bezier(0, 0, 0.2, 1)`   | 退出缓动           |

---

## Z-Index

| Token                | Value  | Description |
| -------------------- | ------ | ----------- |
| `--z-dropdown`       | `1000` | 下拉菜单    |
| `--z-sticky`         | `1020` | 固定元素    |
| `--z-fixed`          | `1030` | 固定导航    |
| `--z-modal-backdrop` | `1040` | 模态框遮罩  |
| `--z-modal`          | `1050` | 模态框      |
| `--z-popover`        | `1060` | 弹出层      |
| `--z-tooltip`        | `1070` | 工具提示    |
| `--z-toast`          | `1080` | Toast 通知  |

---

## Implementation

### CSS Variables

```css
:root {
  /* Background */
  --background: #ffffff;
  --background-secondary: #f5f5f3;
  --background-tertiary: #ebebeb;

  /* Foreground */
  --foreground: #1a1a1a;
  --foreground-secondary: #666666;
  --foreground-muted: #999999;
  --foreground-disabled: #c0c0c0;

  /* Border */
  --border: #e5e5e5;
  --border-strong: #d0d0d0;
  --border-subtle: #f0f0f0;

  /* Primary (Green) */
  --primary: #22c55e;
  --primary-hover: #16a34a;
  --primary-active: #15803d;
  --primary-light: #f0fdf4;
  --primary-foreground: #ffffff;

  /* Secondary */
  --secondary: #f5f5f3;
  --secondary-hover: #ebebeb;
  --secondary-foreground: #1a1a1a;

  /* Success */
  --success: #22c55e;
  --success-light: #f0fdf4;
  --success-foreground: #15803d;

  /* Warning */
  --warning: #f59e0b;
  --warning-light: #fffbeb;
  --warning-foreground: #b45309;

  /* Error */
  --error: #ef4444;
  --error-light: #fef2f2;
  --error-foreground: #dc2626;

  /* Info */
  --info: #3b82f6;
  --info-light: #eff6ff;
  --info-foreground: #2563eb;

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);

  /* Transition */
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Tailwind CSS Config

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#ffffff",
          secondary: "#f5f5f3",
          tertiary: "#ebebeb",
        },
        foreground: {
          DEFAULT: "#1a1a1a",
          secondary: "#666666",
          muted: "#999999",
        },
        border: {
          DEFAULT: "#e5e5e5",
          strong: "#d0d0d0",
        },
        primary: {
          DEFAULT: "#22c55e",
          hover: "#16a34a",
          active: "#15803d",
          light: "#f0fdf4",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5f5f3",
          hover: "#ebebeb",
          foreground: "#1a1a1a",
        },
        success: {
          DEFAULT: "#22c55e",
          light: "#f0fdf4",
          foreground: "#15803d",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fffbeb",
          foreground: "#b45309",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#fef2f2",
          foreground: "#dc2626",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#eff6ff",
          foreground: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
};
```

---

## Usage Guidelines

### Buttons

| Type        | Background    | Text                     | Border     |
| ----------- | ------------- | ------------------------ | ---------- |
| Primary     | `--primary`   | `--primary-foreground`   | none       |
| Secondary   | `--secondary` | `--secondary-foreground` | `--border` |
| Ghost       | transparent   | `--foreground`           | none       |
| Destructive | `--error`     | `#ffffff`                | none       |

### Cards

- Background: `--background`
- Border: `1px solid var(--border)`
- Border Radius: `--radius-lg` (12px)
- Shadow: `--shadow-md` (optional)

### Inputs

- Background: `--background`
- Border: `1px solid var(--border)`
- Border (focus): `--border-strong` or `--primary`
- Border Radius: `--radius-md` (8px)
- Placeholder: `--foreground-muted`

### Badges / Tags

- Background: `--primary-light` or semantic light colors
- Text: `--primary` or semantic colors
- Border Radius: `--radius-sm` (4px)
- Font Size: `--text-xs` (11px)

---

## Products Using This Design System

| Product            | Description                  |
| ------------------ | ---------------------------- |
| ResourceX Registry | Resource management registry |
| AgentVM            | AI Agent virtual machine     |
| (Future)           | Other Deepractice products   |

---

## Version History

| Version | Date    | Changes                                  |
| ------- | ------- | ---------------------------------------- |
| 1.0.0   | 2024-01 | Initial release with green primary color |
