"use client";

import { useSyncExternalStore } from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import { isUiSkinId, UI_SKIN_EVENT, UI_SKIN_STORAGE_KEY, UI_SKINS, type UiSkinId } from "@/lib/ui-skins";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(UI_SKIN_EVENT, onStoreChange);
  return () => window.removeEventListener(UI_SKIN_EVENT, onStoreChange);
}

function getSnapshot(): UiSkinId {
  const value = document.documentElement.dataset.uiSkin;
  return isUiSkinId(value) ? value : "default";
}

function getServerSnapshot(): UiSkinId {
  return "default";
}

export function applyUiSkin(skin: UiSkinId) {
  document.documentElement.dataset.uiSkin = skin;
  window.localStorage.setItem(UI_SKIN_STORAGE_KEY, skin);
  window.dispatchEvent(new Event(UI_SKIN_EVENT));
}

export function useUiSkin() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function UiSkinPicker({ showFooter = true }: { showFooter?: boolean }) {
  const activeSkin = useUiSkin();
  const activeMeta = UI_SKINS.find((skin) => skin.id === activeSkin) ?? UI_SKINS[0];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {UI_SKINS.map((skin) => {
          const active = skin.id === activeSkin;

          return (
            <button key={skin.id} type="button" onClick={() => applyUiSkin(skin.id)} aria-pressed={active} className={`rounded-[var(--radius-md)] border p-4 text-left transition-all ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-1.5">
                  {skin.colors.map((color) => <span key={color} className="h-7 w-7 rounded-[var(--radius-sm)] border border-black/5" style={{ backgroundColor: color }} />)}
                </div>
                {active ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white"><Check size={14} /></span> : null}
              </div>
              <div className="mt-3 text-sm font-semibold text-[var(--text)]">{skin.label}</div>
              <div className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{skin.description}</div>
            </button>
          );
        })}
      </div>

      {showFooter ? <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-[var(--text-faint)]">当前：{activeMeta.label}</span>
        <Button type="button" variant="secondary" onClick={() => applyUiSkin("default")} className="gap-2"><RotateCcw size={15} />恢复默认</Button>
      </div> : null}
    </div>
  );
}
