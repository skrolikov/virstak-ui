# @virstak/ui

Дизайн-система VIRSTAK для React 19. Пакет содержит компоненты, токены и темы. Страницы, навигация и API приложения находятся в `virstak-edge`.

## Подключение

После публикации в npm установите пакет в своё React-приложение:

```sh
npm install @virstak/ui
```

```tsx
import { Button, OverlayProvider, ThemeProvider } from "@virstak/ui";
import "@virstak/ui/styles.css";

export function App() {
  return (
    <ThemeProvider defaultPreference="system">
      <OverlayProvider>
        <Button onClick={() => console.log("Saved")}>Сохранить</Button>
      </OverlayProvider>
    </ThemeProvider>
  );
}
```

React, React DOM, TanStack Table и TanStack Virtual объявлены как `peerDependencies`. npm использует совместимые экземпляры из приложения. `lucide-react` устанавливается как зависимость пакета.

Пакет предоставляет ESM и типы TypeScript. Сборщик с условием экспорта `browser` автоматически подключает CSS компонентов. В других сборщиках его можно подключить явно через `@virstak/ui/components.css`. Серверный ESM-вход подходит для `renderToString` и импортирует только JS.

`@virstak/ui/styles.css` подключает токены и темы. Для отдельного управления каскадом доступны `@virstak/ui/tokens.css` и `@virstak/ui/themes.css`. Глобальную типографику, фон и раскладку страницы задаёт приложение.

## Состав

- Базовые компоненты: Button, Badge, Input, InlineInput, Select, Checkbox, Avatar, Skeleton, EmptyState, PageLoader и ErrorScene.
- Интерактивные компоненты: Tabs, Tooltip, Dropdown, Dialog, Drawer, Toast и HybridInput.
- Работа с данными: DataTable, VirtualList, StatCard, Sparkline, AreaChart и BarChart. Для списков внутри колонок используйте `VirtualList` с `variant="plain"`.
- Провайдеры: ThemeProvider с режимами light/dark/system, OverlayProvider со стеком Escape и блокировкой прокрутки, ErrorBoundary с `fallback`.
- SkyDrawer управляет стеком панелей, закреплением, раскладкой и порталами. URL, история браузера и реестр сущностей подключаются через `SkyDrawerAdapter` приложения.

## Разработка и проверка релиза

Для сборки из исходников нужен Node 24.15+.

```sh
npm ci
npm run verify:release
```

Проверка запускает TypeScript и тесты, создаёт `artifacts/virstak-ui-1.0.0.tgz`, устанавливает этот архив в отдельное React-приложение и проверяет его сборку и серверный рендер. Состав архива ограничен собранным JS, CSS, типами и метаданными пакета.

```sh
npx --no-install playwright install chromium
npm run verify:browser:package
```

Для проверки в установленном браузере задайте `UI_BROWSER_CHANNEL=msedge` или путь в `UI_BROWSER_EXECUTABLE`. В `virstak-edge` до публикации используется `file:../virstak-ui`. Для локальной работы сначала выполните `npm run build` в `virstak-ui`, затем `npm install` в Edge. Docker-сборка Edge собирает пакет из исходников самостоятельно.

## Публикация

`UNLICENSED` сохраняет текущий статус пакета. Для первой закрытой публикации нужны права записи в npm scope `@virstak` и доступ к приватным пакетам. Из каталога `virstak-ui` загрузите архив, который прошёл проверку:

```sh
npm publish ./artifacts/virstak-ui-1.0.0.tgz --access restricted
```

Публичную видимость следует выбирать явно при публикации. Репозиторий исходников: [skrolikov/virstak-ui](https://github.com/skrolikov/virstak-ui).
