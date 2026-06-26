import { Search } from "lucide-react";
import { Input } from "@/components/ui-v2/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function TranscriptSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search transcript..." className="pl-10" />
    </div>
  );
}
