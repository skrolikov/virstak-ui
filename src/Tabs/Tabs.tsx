import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";

import { cx } from "../lib/cx";

import styles from "./Tabs.module.css";

export type TabsSwitcher = "block" | "pills" | "bar";

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
  switcher: TabsSwitcher;
  registerTab: (value: string, ref: RefObject<HTMLElement | null>) => void;
  unregisterTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs must be used within <Tabs>");
  return ctx;
}

/* ── Tabs (provider) ── */

export type TabsProps = {
  value: string;
  onChange: (value: string) => void;
  switcher?: TabsSwitcher;
  children: ReactNode;
  className?: string;
};

export function Tabs({ value, onChange, switcher = "block", children, className }: TabsProps) {
  const registeredTabs = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());

  const registerTab = useCallback(
    (tabValue: string, ref: RefObject<HTMLElement | null>) => {
      registeredTabs.current.set(tabValue, ref);
    },
    [],
  );

  const unregisterTab = useCallback((tabValue: string) => {
    registeredTabs.current.delete(tabValue);
  }, []);

  return (
    <TabsContext.Provider value={{ value, onChange, switcher, registerTab, unregisterTab }}>
      <div className={cx(styles.tabs, className)} role="tablist">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/* ── Tabs.List ── */

export type TabsListProps = {
  children: ReactNode;
  className?: string;
};

export function TabsList({ children, className }: TabsListProps) {
  const { switcher, value } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.dataset.activeTab = value;
    }
  }, [value]);

  // Determine indicator position
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      `[data-tab-value="${listRef.current.dataset.activeTab}"]`,
    );
    if (!active) return;
    active.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setIndicator({
      left: active.offsetLeft,
      width: active.offsetWidth,
    });
  }, [value]);

  if (switcher === "block") {
    return (
      <div ref={listRef} className={cx(styles.list, styles.listBlock, className)}>
        {children}
      </div>
    );
  }

  if (switcher === "pills") {
    return (
      <div ref={listRef} className={cx(styles.list, styles.listPills, className)}>
        <div
          className={styles.indicator}
          style={{ left: indicator.left, width: indicator.width }}
        />
        {children}
      </div>
    );
  }

  // bar
  return (
    <div ref={listRef} className={cx(styles.list, styles.listBar, className)}>
      <div
        className={styles.indicator}
        style={{ left: indicator.left, width: indicator.width }}
      />
      {children}
    </div>
  );
}

/* ── Tabs.Tab ── */

export type TabsTabProps = {
  value: string;
  label: string;
  children?: ReactNode;
  className?: string;
};

export function TabsTab({ value, label, children, className }: TabsTabProps) {
  const { value: activeValue, onChange, registerTab, unregisterTab } = useTabs();
  const ref = useRef<HTMLButtonElement>(null);
  const isActive = value === activeValue;

  useEffect(() => {
    if (ref.current) {
      registerTab(value, ref);
    }
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      data-tab-value={value}
      className={cx(styles.tab, isActive && styles.tabActive, className)}
      onClick={() => onChange(value)}
    >
      {label}
      {children}
    </button>
  );
}

/* ── Tabs.Panel ── */

export type TabsPanelProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: activeValue } = useTabs();
  const isVisible = value === activeValue;

  if (!isVisible) return null;

  return (
    <div
      className={cx(styles.panel, className)}
      role="tabpanel"
      data-panel-value={value}
    >
      {children}
    </div>
  );
}
