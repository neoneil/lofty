import PronunciationClient from "@/components/pronunciation/pronunciation-client";
import { pronunciationAssets } from "@/lib/pronunciation/assets";

export default function PronunciationPage() {
  return <PronunciationClient assets={pronunciationAssets} />;
}
