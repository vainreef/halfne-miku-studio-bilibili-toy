import React, { memo, useRef, useState, useCallback } from 'react';
import { EYE_TYPES, MOUTH_SHAPES, MOOD_TYPES, PRESET_COMBOS } from '../../constants/emotions';
import './QuickPad.less';

const tabs = ['表情', '眼神', '口型', '嘴巴'];
const pages = [PRESET_COMBOS.map((p, i) => ({ ...p, id: 'preset' + i })), EYE_TYPES, MOUTH_SHAPES, MOOD_TYPES];

export default memo(function QuickPad({ skin = 'whale', activeKeys = [], eyeClosed = false, onToggleEye, onTriggerKey, onApplyPreset }) {
  const [tab, setTab] = useState(0);
  const viewport = useRef(null);
  const tablist = useRef(null);
  const isProgrammatic = useRef(false);

  // Click tab: instant switch below. Swipe pager: natural scroll animation
  const select = useCallback((index) => {
    setTab(index);
    if (viewport.current) {
      isProgrammatic.current = true;
      viewport.current.scrollTo({
        left: index * viewport.current.clientWidth,
        behavior: 'instant'
      });
      requestAnimationFrame(() => {
        isProgrammatic.current = false;
      });
    }
  }, []);

  const onScroll = useCallback((e) => {
    if (isProgrammatic.current) return;
    const width = e.currentTarget.clientWidth;
    if (!width) return;
    const page = Math.round(e.currentTarget.scrollLeft / width);
    if (page >= 0 && page < 4 && page !== tab) {
      setTab(page);
    }
  }, [tab]);

  // Dual-hand support: Tab & Eye buttons respond immediately on pointerdown without waiting for synthetic click
  const lastImmediateTrigger = useRef(0);
  const makeImmediateProps = useCallback((action) => ({
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      lastImmediateTrigger.current = performance.now();
      action(e);
    },
    onClick: (e) => {
      if (performance.now() - lastImmediateTrigger.current < 300) return;
      action(e);
    }
  }), []);

  // Dual-hand support for items in scrollable pager:
  // pointerdown + pointerup detects tap quickly without blocking horizontal swipe scrolling
  const pointerStart = useRef(new Map());
  const lastItemTrigger = useRef(0);

  const handleItemPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerStart.current.set(e.pointerId, { x: e.clientX, y: e.clientY, time: performance.now() });
  }, []);

  const handleItemPointerUp = useCallback((e, action) => {
    const start = pointerStart.current.get(e.pointerId);
    pointerStart.current.delete(e.pointerId);
    if (!start) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    const dt = performance.now() - start.time;
    if (dx < 12 && dy < 12 && dt < 450) {
      lastItemTrigger.current = performance.now();
      action();
    }
  }, []);

  const handleItemPointerCancel = useCallback((e) => {
    pointerStart.current.delete(e.pointerId);
  }, []);

  const handleItemClick = useCallback((action) => {
    if (performance.now() - lastItemTrigger.current < 300) return;
    action();
  }, []);

  const selected = (entry, page) =>
    page === 0
      ? entry.keys.length === activeKeys.length && entry.keys.every((k) => activeKeys.includes(k))
      : entry.id === 'MouthMM'
      ? !MOUTH_SHAPES.some((s) => activeKeys.includes(s.id))
      : activeKeys.includes(entry.id);

  return (
    <div className="quick-pad-shell">
      <section className="quick-pad" aria-label="角色表情">
        <div className="pad-category-header">
          <div ref={tablist} className="quick-pad-tabs" role="tablist" aria-label="表情分类">
            {tabs.map((name, i) => (
              <button
                role="tab"
                id={'face-tab-' + i}
                aria-selected={tab === i}
                aria-controls={'face-options-' + i}
                tabIndex={tab === i ? 0 : -1}
                className={'tab-button' + (tab === i ? ' active' : '')}
                key={name}
                {...makeImmediateProps(() => select(i))}
                onKeyDown={(e) => {
                  let next;
                  if (e.key === 'ArrowRight') next = (i + 1) % 4;
                  if (e.key === 'ArrowLeft') next = (i + 3) % 4;
                  if (e.key === 'Home') next = 0;
                  if (e.key === 'End') next = 3;
                  if (next !== undefined) {
                    e.preventDefault();
                    select(next);
                    tablist.current.children[next].focus();
                  }
                }}
              >
                {name}
              </button>
            ))}
            <div className="tab-indicator-track" style={{ transform: `translateX(${tab * 100}%)` }}>
              <span className="tab-indicator-line" />
            </div>
          </div>
        </div>

        <div className="face-pager" ref={viewport} onScroll={onScroll}>
          {pages.map((entries, page) => (
            <div
              className="face-options"
              key={page}
              id={'face-options-' + page}
              role="tabpanel"
              aria-hidden={tab !== page}
              aria-labelledby={'face-tab-' + page}
              inert={tab !== page ? '' : undefined}
            >
              {entries.map((e) => {
                const triggerAction = () => {
                  if (page === 0) onApplyPreset(e.keys);
                  else onTriggerKey(e.id, page === 1 ? 'eye' : page === 2 ? 'mouthShape' : 'mood');
                };
                return (
                  <button
                    key={e.id}
                    className={'face-button' + (selected(e, page) ? ' active' : '')}
                    aria-label={e.name}
                    aria-pressed={selected(e, page)}
                    onPointerDown={handleItemPointerDown}
                    onPointerUp={(ev) => handleItemPointerUp(ev, triggerAction)}
                    onPointerCancel={handleItemPointerCancel}
                    onClick={() => handleItemClick(triggerAction)}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}assets/ui/${skin}-${e.id}.png?v=07`}
                      alt=""
                      draggable={false}
                      width="64"
                      height="64"
                    />
                    <span>{e.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <button
        className={'pad-eye-toggle' + (eyeClosed ? ' active' : '')}
        aria-label={eyeClosed ? '睁眼' : '闭眼'}
        aria-pressed={eyeClosed}
        title={eyeClosed ? '睁眼' : '闭眼'}
        {...makeImmediateProps(onToggleEye)}
      >
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {eyeClosed ? (
            <path d="M3 10q9 10 18 0M6 13l-2 3m8-1v4m6-6 2 3" />
          ) : (
            <>
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
});
