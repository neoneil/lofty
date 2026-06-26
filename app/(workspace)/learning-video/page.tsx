import { requireUser } from "@/lib/auth/require-user";
import LearningVideoShell from "@/components/learning-video/LearningVideoShell";

const videoUrl = "PASTE_R2_VIDEO_URL_HERE";
const subtitleUrl = "PASTE_R2_SUBTITLE_VTT_URL_HERE";

export default async function LearningVideoPage() {
  await requireUser("/learning-video");

  return <LearningVideoShell videoUrl={videoUrl} subtitleUrl={subtitleUrl} title="Video Learning" />;
}
