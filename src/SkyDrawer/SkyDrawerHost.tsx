import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ChevronLeft, PanelRightClose, Pin, X } from "lucide-react";

import { Button } from "../Button/Button";
import { cx } from "../lib/cx";
import { OverlayPortal } from "../overlay/OverlayPortal";
import { useEscapeLayer } from "../overlay/useEscapeLayer";
import { useScrollLock } from "../overlay/useScrollLock";

import styles from "./SkyDrawer.module.css";
import { layoutStack, type SkyBox } from "./sky-layout";
import { useSkyPresence, type SkyLive } from "./useSkyPresence";
import { useSkyDrawer } from "./useSkyDrawer";

export function SkyDrawerHost() {
  const {
    stack,
    close,
    closeAll,
    focusLevel,
    frontId,
    pinnedIds,
    togglePin,
    hiddenPins,
    restorePin,
  } = useSkyDrawer();
  const live = useSkyPresence(stack);
  const targets = useRef(new Map<string, SkyBox>());
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );
  const active = live.filter((item) => item.phase !== "leave");
  const activeFrontIndex = frontId
    ? active.findIndex((item) => item.panel.id === frontId)
    : -1;
  const leavingSheet = live.some((item) => {
    if (item.phase !== "leave") return false;
    const frozen = targets.current.get(item.panel.id);
    return frozen ? !frozen.folded : true;
  });
  const modal = activeFrontIndex >= 0 || leavingSheet;

  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useScrollLock(modal);
  useEscapeLayer(live.length > 0, close);

  if (
    (live.length === 0 && hiddenPins.length === 0) ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const laid = layoutStack(
    active.map((item) => item.panel),
    viewport,
    activeFrontIndex,
  );
  active.forEach((item, index) => {
    const box = laid[index];
    if (box) targets.current.set(item.panel.id, box);
  });

  const compact = viewport < 768;
  const showCrumbs = compact && activeFrontIndex >= 0 && active.length > 1;
  const front = activeFrontIndex >= 0 ? active[activeFrontIndex] : undefined;
  const overlayLeave = activeFrontIndex < 0 && leavingSheet;

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeAll();
  };

  const tray = hiddenPins.length > 0 ? (
    <div className={styles.tray}>
      {hiddenPins.map((pin) => (
        <div key={pin.id} className={styles.trayItem}>
          <button
            type="button"
            className={styles.trayOpen}
            title={pin.titleText}
            aria-label={`Открыть «${pin.titleText}»`}
            onClick={() => restorePin(pin.id)}
          >
            <Pin size={14} fill="currentColor" />
            <span>{pin.titleText}</span>
          </button>
          <button
            type="button"
            className={styles.trayDismiss}
            aria-label={`Открепить «${pin.titleText}»`}
            onClick={() => togglePin(pin.id)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  ) : null;

  if (live.length === 0) {
    return <OverlayPortal>{tray}</OverlayPortal>;
  }

  return (
    <OverlayPortal>
    <>
      {modal ? (
        <div
          className={cx(
            styles.overlay,
            front?.panel.stage && styles.overlayStage,
            overlayLeave && styles.overlayLeave,
          )}
          role="presentation"
          onClick={handleOverlayClick}
        />
      ) : null}
      <div className={styles.layer} aria-live="polite">
        {showCrumbs ? (
          <div className={styles.rail}>
            {active.map((item, index) => {
              const isFront = index === activeFrontIndex;
              const pinned = pinnedIds.includes(item.panel.id);
              return (
                <span key={`crumb-${item.panel.id}`} className={styles.crumbGroup}>
                  <button
                    type="button"
                    className={cx(styles.crumb, isFront && styles.crumbActive)}
                    title={item.panel.titleText}
                    onClick={() => focusLevel(item.panel.id)}
                  >
                    {item.panel.titleText}
                  </button>
                  {isFront ? null : (
                    <button
                      type="button"
                      className={cx(styles.crumbPin, pinned && styles.spinePinActive)}
                      aria-pressed={pinned}
                      aria-label={
                        pinned
                          ? `Открепить «${item.panel.titleText}»`
                          : `Закрепить «${item.panel.titleText}»`
                      }
                      onClick={() => togglePin(item.panel.id)}
                    >
                      <Pin size={12} fill={pinned ? "currentColor" : "none"} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        ) : null}

        {live.map((item, index) => (
          <SkyPanel
            key={item.panel.id}
            item={item}
            box={boxFor(item, laid, active, targets.current)}
            parentTitle={parentTitle(item, active, activeFrontIndex)}
            showCrumbs={showCrumbs}
            stackIndex={stackIndex(item, active)}
            pinned={pinnedIds.includes(item.panel.id)}
            elevated={item.phase === "leave" ? 80 + index : 20 + index}
            onFocusLevel={() => focusLevel(item.panel.id)}
            onTogglePin={() => togglePin(item.panel.id)}
            onClose={() => close(item.panel.id)}
            onBack={() => close()}
          />
        ))}
      </div>
      {tray}
    </>
    </OverlayPortal>
  );
}

function boxFor(
  item: SkyLive,
  laid: SkyBox[],
  active: SkyLive[],
  targets: Map<string, SkyBox>,
) {
  if (item.phase === "leave") {
    return (
      targets.get(item.panel.id) ?? {
        width: item.panel.width,
        right: 12,
        rest: item.panel.width,
        folded: false,
        parked: false,
        stage: item.panel.stage,
        alignStage: item.panel.stage,
      }
    );
  }
  const index = active.findIndex((entry) => entry.panel.id === item.panel.id);
  return laid[index] ?? targets.get(item.panel.id)!;
}

function parentTitle(item: SkyLive, active: SkyLive[], frontIndex: number) {
  const index = active.findIndex((entry) => entry.panel.id === item.panel.id);
  if (index !== frontIndex || index <= 0) return null;
  return active[index - 1]?.panel.titleText ?? null;
}

function stackIndex(item: SkyLive, active: SkyLive[]) {
  const index = active.findIndex((entry) => entry.panel.id === item.panel.id);
  return index < 0 ? active.length : index;
}

function SkyPanel({
  item,
  box,
  parentTitle: parent,
  showCrumbs,
  stackIndex: level,
  pinned,
  elevated,
  onFocusLevel,
  onTogglePin,
  onClose,
  onBack,
}: {
  item: SkyLive;
  box: SkyBox;
  parentTitle: string | null;
  showCrumbs: boolean;
  stackIndex: number;
  pinned: boolean;
  elevated: number;
  onFocusLevel: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  onBack: () => void;
}) {
  const { panel, phase } = item;
  const leaving = phase === "leave";
  const folded = box.folded && !leaving;
  const spine = folded && !box.parked;
  const wideExit = box.width > 120;
  const isFront = !box.folded && !leaving;

  return (
    <aside
      className={cx(
        styles.panel,
        box.stage && styles.panelStage,
        box.alignStage && styles.alignStage,
        showCrumbs && styles.panelBelowRail,
        phase === "enter" && styles.panelEnter,
        leaving && (wideExit ? styles.panelLeave : styles.panelLeaveFolded),
        box.parked && !leaving && styles.compactParked,
        spine && styles.folded,
        isFront && styles.front,
        pinned && styles.pinned,
      )}
      style={{
        width: box.width,
        right: box.right,
        zIndex: elevated,
      }}
      role={isFront ? "dialog" : undefined}
      aria-modal={isFront || undefined}
      aria-hidden={box.parked || leaving ? true : undefined}
      aria-labelledby={isFront ? `sky-drawer-title-${panel.id}` : undefined}
    >
      <button
        type="button"
        className={styles.spine}
        tabIndex={spine ? 0 : -1}
        aria-hidden={!spine}
        title={panel.titleText}
        aria-label={`Вернуться к «${panel.titleText}»`}
        onClick={onFocusLevel}
      >
        {pinned ? null : <span className={styles.spineIndex}>{level + 1}</span>}
        <span className={styles.spineTitle}>{panel.titleText}</span>
      </button>
      <button
        type="button"
        className={cx(styles.spinePin, pinned && styles.spinePinActive)}
        tabIndex={spine ? 0 : -1}
        aria-hidden={!spine}
        aria-pressed={pinned}
        aria-label={
          pinned ? `Открепить «${panel.titleText}»` : `Закрепить «${panel.titleText}»`
        }
        title={pinned ? "Открепить" : "Закрепить"}
        onClick={(event) => {
          event.stopPropagation();
          onTogglePin();
        }}
      >
        <Pin size={14} fill={pinned ? "currentColor" : "none"} />
      </button>

      <div
        className={styles.sheet}
        style={{ width: box.rest, minWidth: box.rest }}
        inert={box.folded || leaving ? true : undefined}
        aria-hidden={box.folded || leaving ? true : undefined}
      >
        <div
          className={cx(
            styles.header,
            Boolean(panel.headerActions) && styles.headerWithActions,
          )}
        >
          <div className={styles.headerTop}>
            <div className={styles.heading}>
              {parent ? (
                <button type="button" className={styles.backLink} onClick={onBack}>
                  <ChevronLeft size={14} />
                  <span>{parent}</span>
                </button>
              ) : null}
              <h2 id={`sky-drawer-title-${panel.id}`} className={styles.title}>
                {panel.title}
              </h2>
              {panel.description ? (
                <p className={styles.description}>{panel.description}</p>
              ) : null}
            </div>
            <div className={styles.chrome}>
              {isFront ? (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  className={pinned ? styles.chromePinOn : undefined}
                  aria-pressed={pinned}
                  aria-label={
                    pinned
                      ? `Открепить «${panel.titleText}»`
                      : `Закрепить «${panel.titleText}»`
                  }
                  title={pinned ? "Открепить" : "Закрепить"}
                  onClick={onTogglePin}
                >
                  <Pin size={16} fill={pinned ? "currentColor" : "none"} />
                </Button>
              ) : null}
              {pinned && isFront ? (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Свернуть «${panel.titleText}»`}
                  title="Свернуть"
                  onClick={onBack}
                >
                  <PanelRightClose size={16} />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Закрыть"
                onClick={onClose}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          {panel.headerActions ? (
            <div className={styles.headerToolbar}>{panel.headerActions}</div>
          ) : null}
        </div>
        <div
          className={cx(styles.body, box.stage && isFront && styles.bodyStage)}
        >
          {panel.content}
        </div>
        {panel.footer ? <div className={styles.footer}>{panel.footer}</div> : null}
      </div>
    </aside>
  );
}
