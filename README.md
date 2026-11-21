# @virstak/ui

Дизайн-система VIRSTAK: React-компоненты и CSS foundation.

Исходники живут в Git: [github.com/skrolikov/virstak-ui](https://github.com/skrolikov/virstak-ui). Пакет **приватный**, в npm не публикуется. Версия `0.0.7-local`.

## Что внутри

Button, Badge, Input, InlineInput, Select, Checkbox, Avatar, Skeleton, EmptyState, PageLoader, Tabs, Tooltip, Dropdown, Dialog, Drawer, Toast, DataTable, VirtualList, HybridInput, ErrorScene, StatCard, Sparkline / AreaChart / BarChart, ThemeProvider, ErrorBoundary и токены темы.

**SkyDrawer** в пакете — стек, pin, геометрия, presence и portal. URL `?sky=`, Back и реестр сущностей — адаптер Edge (`SkyDrawerAdapter`).

`OverlayProvider` копирует `data-theme` / `data-design` / `data-product` на портал, складывает Escape и scroll-lock, ловит фокус в Dialog/Drawer. Без провайдера оверлеи читают атрибуты с `html` и `[data-product]`.

`ThemeProvider` пишет `data-theme` на `<html>`, light/dark/system. Ключи storage и имя атрибута настраиваются. Wallpaper, `data-design` и product presets остаются в приложении.

`ErrorBoundary` принимает `fallback` (узел или render-prop с `reset`).

## Подключение без npm registry

Локально рядом с Edge (как сейчас в рабочем каталоге):

```json
{
  "dependencies": {
    "@virstak/ui": "file:../virstak-ui"
  }
}
```

В Edge стоит `install-links=true`: npm копирует собранный пакет, без symlink и второй копии React. После изменения библиотеки: собрать её, затем `npm install` в потребителе.

Через Git, когда пакет нужен вне соседней папки:

```json
{
  "dependencies": {
    "@virstak/ui": "github:skrolikov/virstak-ui#main"
  }
}
```

Это установка из репозитория, не публикация в npm.

```tsx
import { Button, Badge } from "@virstak/ui";
import "@virstak/ui/styles.css";
```

CSS компонентов подключается вместе с JS. `styles.css` даёт tokens/themes. Пакет не задаёт `body`, wallpaper, шрифты Google и layout оболочки.

React, react-dom, `@tanstack/react-table` и `@tanstack/react-virtual` — peer dependencies (экземпляры хоста). `lucide-react` — зависимость пакета, но во внешнем бандле тоже берётся с хоста.

## Сборка

Нужен Node 24.15+.

```powershell
npm ci
npm run typecheck
npm run pack:local
```

`pack:local` пишет `artifacts/virstak-ui-0.0.7-local.tgz` только на диск. Smoke ставит этот tarball. В пакете есть `npm run test:run` (jsdom).

Edge: `file:../virstak-ui`. После смены библиотеки пересобрать UI и повторить установку в Edge и smoke.
