"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";

import { UiSkinPicker, useUiSkin } from "@/components/settings/ui-skin-picker";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { UI_SKINS } from "@/lib/ui-skins";

export function UiSkinCard({ variant = "grid" }: { variant?: "grid" | "list" }) {
  const activeSkin = useUiSkin();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const activeMeta = UI_SKINS.find((skin) => skin.id === activeSkin) ?? UI_SKINS[0];
  const isList = variant === "list";

  return (
    <>
      <Card className={`group overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)] ${isList ? "" : "hover:-translate-y-0.5"}`}>
        <button type="button" onClick={() => setOpen(true)} className={`w-full text-left ${isList ? "flex flex-col gap-3 p-4 sm:flex-row sm:items-center" : "p-4"}`}>
          <div className={isList ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]" : "mb-4 flex items-center justify-between"}>{isList ? <Palette size={17} /> : <><Badge variant="secondary">Appearance</Badge><span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:translate-x-0.5"><Palette size={16} /></span></>}</div>
          <div className={isList ? "min-w-0 flex-1" : ""}>
            <div className={isList ? "flex flex-wrap items-center gap-2" : ""}><h3 className="text-base font-bold tracking-tight text-[var(--text)]">一键换肤</h3>{isList ? <Badge variant="secondary">Appearance</Badge> : null}</div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">切换全站 Card、Button、背景、边框与主题色。</p>
          </div>
          <div className={isList ? "flex items-center gap-3 sm:w-44 sm:justify-end" : "mt-4 flex items-center justify-between gap-3"}><div className="flex -space-x-1">{activeMeta.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full border-2 border-[var(--card)]" style={{ backgroundColor: color }} />)}</div><span className="text-xs font-semibold text-[var(--primary)]">{activeMeta.label}</span></div>
        </button>
      </Card>

      {open ? <div role="dialog" aria-modal="true" aria-labelledby="ui-skin-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"><Card className="my-auto w-full max-w-2xl rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"><CardContent className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><Badge>Site Appearance</Badge><h2 id="ui-skin-title" className="mt-3 text-2xl font-semibold text-[var(--text)]">一键换肤</h2><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">选择后立即应用到全站，并保存在当前浏览器。</p></div><button type="button" onClick={() => setOpen(false)} aria-label="关闭换肤面板" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button></div>
                <div className="mt-6"><UiSkinPicker /></div>
                <div className="mt-5 flex justify-end"><Button type="button" onClick={() => setOpen(false)}>完成</Button></div></CardContent></Card></div> : null}
    </>
  );
}
