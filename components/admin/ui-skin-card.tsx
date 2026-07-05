"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Palette, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
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

function applySkin(skin: UiSkinId) {
  document.documentElement.dataset.uiSkin = skin;
  window.localStorage.setItem(UI_SKIN_STORAGE_KEY, skin);
  window.dispatchEvent(new Event(UI_SKIN_EVENT));
}

export function UiSkinCard() {
  const activeSkin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const activeMeta = UI_SKINS.find((skin) => skin.id === activeSkin) ?? UI_SKINS[0];

  return (
    <>
      <Card className="group overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)]">
        <button type="button" onClick={() => setOpen(true)} className="w-full p-6 text-left">
          <div className="mb-6 flex items-center justify-between"><Badge variant="secondary">Appearance</Badge><span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:translate-x-1"><Palette size={17} /></span></div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--text)]">一键换肤</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">切换全站 Card、Button、背景、边框与主题色。</p>
          <div className="mt-5 flex items-center justify-between gap-3"><div className="flex -space-x-1">{activeMeta.colors.map((color) => <span key={color} className="h-5 w-5 rounded-full border-2 border-[var(--card)]" style={{ backgroundColor: color }} />)}</div><span className="text-xs font-semibold text-[var(--primary)]">{activeMeta.label}</span></div>
        </button>
      </Card>

      {open ? <div role="dialog" aria-modal="true" aria-labelledby="ui-skin-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"><Card className="my-auto w-full max-w-2xl rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"><CardContent className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><Badge>Site Appearance</Badge><h2 id="ui-skin-title" className="mt-3 text-2xl font-semibold text-[var(--text)]">一键换肤</h2><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">选择后立即应用到全站，并保存在当前浏览器。</p></div><button type="button" onClick={() => setOpen(false)} aria-label="关闭换肤面板" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button></div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">{UI_SKINS.map((skin) => { const active = skin.id === activeSkin; return <button key={skin.id} type="button" onClick={() => applySkin(skin.id)} className={`rounded-[var(--radius-md)] border p-4 text-left transition-all ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)]"}`}><div className="flex items-start justify-between gap-3"><div className="flex gap-1.5">{skin.colors.map((color) => <span key={color} className="h-7 w-7 rounded-[var(--radius-sm)] border border-black/5" style={{ backgroundColor: color }} />)}</div>{active ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white"><Check size={14} /></span> : null}</div><div className="mt-3 text-sm font-semibold text-[var(--text)]">{skin.label}</div><div className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{skin.description}</div></button>; })}</div>
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[var(--text-faint)]">当前：{activeMeta.label}</span><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => applySkin("default")} className="gap-2"><RotateCcw size={15} />恢复默认</Button><Button type="button" onClick={() => setOpen(false)}>完成</Button></div></div></CardContent></Card></div> : null}
    </>
  );
}
