import AudioCollectionClient, { type AudioCollectionGroup, type AudioCollectionType } from "@/components/audio-collection/audio-collection-client";
import { requireUser } from "@/lib/auth/require-user";
import { PTE_AUDIO_GROUPS } from "@/lib/audio-collection/pte-audio";

const IELTS_AUDIO_BOOKS = [21, 20, 19, 18, 17, 16] as const;

export default async function AudioCollectionPage() {
  await requireUser("/audio-collection");

  const pteGroups: AudioCollectionGroup[] = PTE_AUDIO_GROUPS.map((group) => ({
    ...group,
    items: [],
    error: null,
    totalCount: null,
    nextOffset: 0,
    hasMore: true,
    loaded: false,
    loadMode: "paged",
  }));
  const ieltsGroups: AudioCollectionGroup[] = IELTS_AUDIO_BOOKS.map((bookNumber) => ({
    id: `ielts-book-${bookNumber}` as AudioCollectionType,
    collection: "ielts",
    label: `剑桥 ${String(bookNumber).padStart(2, "0")}`,
    title: `Cambridge IELTS ${String(bookNumber).padStart(2, "0")} Listening`,
    href: "/ielts/cambridge-downloads",
    items: [],
    error: null,
    totalCount: null,
    nextOffset: 0,
    hasMore: true,
    loaded: false,
    loadMode: "paged",
  }));

  return <AudioCollectionClient groups={[...pteGroups, ...ieltsGroups]} />;
}
