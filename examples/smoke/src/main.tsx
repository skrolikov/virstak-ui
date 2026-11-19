import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  Input,
  Select,
  Checkbox,
  Avatar,
  Skeleton,
  EmptyState,
  InlineInput,
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  Tooltip,
  Dropdown,
  Dialog,
  OverlayProvider,
  SkyDrawerProvider,
  useSkyDrawer,
  type BadgeTone,
  type ButtonSize,
  type ButtonVariant,
} from "@virstak/ui";
import "@virstak/ui/styles.css";
import "./page.css";

function SkySmoke() {
  const sky = useSkyDrawer();
  return (
    <Button
      onClick={() =>
        sky.open({
          title: "Smoke Sky",
          content: <p>Панель без URL Edge.</p>,
        })
      }
    >
      SkyDrawer
    </Button>
  );
}

function App() {
  const [clicks, setClicks] = useState(0);
  const [name, setName] = useState("");
  const [choice, setChoice] = useState("a");
  const [consent, setConsent] = useState(false);
  const [tab, setTab] = useState("one");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inlineValue, setInlineValue] = useState("12");
  const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
  const sizes: ButtonSize[] = ["sm", "md", "lg"];
  const tones: BadgeTone[] = [
    "neutral",
    "brand",
    "success",
    "warning",
    "danger",
    "info",
  ];
  return (
    <main>
      <h1>VIRSTAK UI</h1>
      <p>Отдельное приложение: только установленный пакет и React.</p>
      <Button onClick={() => setClicks(clicks + 1)}>Нажатия: {clicks}</Button>
      <section aria-label="Кнопки">
        {variants.flatMap((variant) =>
          sizes.map((size) => (
            <Button key={`${variant}-${size}`} variant={variant} size={size}>
              {variant} {size}
            </Button>
          )),
        )}
      </section>
      <section aria-label="Состояния">
        <Button disabled>Недоступно</Button>
        <Button iconOnly aria-label="Добавить">
          +
        </Button>
        <Button leftIcon="←" rightIcon="→">
          Иконки
        </Button>
      </section>
      <section aria-label="Метки">
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </section>
      <section data-theme="light" aria-label="Светлая тема">
        <Button>Светлая</Button>
        <Badge tone="brand">brand</Badge>
      </section>
      <section aria-label="Form controls">
        <Input
          label="Smoke name"
          hint="Hint"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Invalid input"
          error="Invalid value"
          disabled
          defaultValue="Locked"
        />
        <Select
          label="Smoke choice"
          options={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Beta" },
            { value: "locked", label: "Locked", disabled: true },
          ]}
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
        />
        <Checkbox
          label="Smoke consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <Avatar name="Ada Lovelace" />
        <Avatar name="Broken avatar" src="data:image/png;base64,AAAA" />
        <Skeleton width={120} height={24} />
        <EmptyState
          title="Nothing yet"
          description="Add a record to continue."
          actions={
            <Button onClick={() => setClicks(clicks + 1)}>Smoke action</Button>
          }
        />
        <InlineInput
          prefix="₽"
          value={inlineValue}
          onChange={(event) => setInlineValue(event.target.value)}
        />
      </section>
      <section aria-label="Overlays">
        <Tabs value={tab} onChange={setTab}>
          <TabsList>
            <TabsTab value="one" label="One" />
            <TabsTab value="two" label="Two" />
          </TabsList>
          <TabsPanel value="one">Первая панель</TabsPanel>
          <TabsPanel value="two">Вторая панель</TabsPanel>
        </Tabs>
        <Tooltip content="Подсказка">
          <Button>Tooltip</Button>
        </Tooltip>
        <Dropdown
          trigger={<Button variant="secondary">Меню</Button>}
          items={[{ id: "a", label: "Пункт", onSelect: () => setClicks(clicks + 1) }]}
        />
        <SkySmoke />
        <Button onClick={() => setDialogOpen(true)}>Диалог</Button>
        <div data-product="crm">
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Smoke dialog"
            description="Портал наследует акцент продукта."
          >
            Независимое приложение. Escape закрывает диалог.
          </Dialog>
        </div>
      </section>
      <p className="scroll-end">Прокрутка страницы работает.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <OverlayProvider>
    <SkyDrawerProvider>
      <App />
    </SkyDrawerProvider>
  </OverlayProvider>,
);
