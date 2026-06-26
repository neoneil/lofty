import { formatTranscriptTime, type TranscriptCue } from "./vtt";

type Props = {
  cue: TranscriptCue;
  active: boolean;
  searchTerm: string;
  onSelect: (cue: TranscriptCue) => void;
};

function HighlightText({ text, searchTerm }: { text: string; searchTerm: string }) {
  const keyword = searchTerm.trim();

  if (!keyword) return <>{text}</>;

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedKeyword})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded-[var(--radius-xs)] bg-[var(--warning-soft)] px-1 font-semibold text-[var(--warning)]">{part}</mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export default function TranscriptItem({ cue, active, searchTerm, onSelect }: Props) {
  return (
    <button type="button" onClick={() => onSelect(cue)} className={`group grid w-full grid-cols-[64px_1fr] items-start gap-3 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 py-3 text-left transition sm:grid-cols-[72px_1fr] ${active ? "" : "hover:border-[var(--border)] hover:bg-[var(--bg-soft)]"}`} data-transcript-cue-id={cue.id}>
      <span className={`font-mono text-xs font-semibold leading-6 ${active ? "text-[var(--primary)]" : "text-[var(--text-faint)]"}`}>{formatTranscriptTime(cue.start)}</span>
      <span className={`text-sm font-medium leading-6 ${active ? "text-[var(--primary)]" : "text-[var(--text-soft)] group-hover:text-[var(--text)]"}`}><HighlightText text={cue.text} searchTerm={searchTerm} /></span>
    </button>
  );
}
