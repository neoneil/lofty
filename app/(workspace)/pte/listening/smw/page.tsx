import PteStaticQuestionList from "@/components/pte/pte-static-question-list";
import { getPteStaticQuestionBank } from "@/lib/pte/static-sample-questions";

export default function PteListeningSmwPage() {
  return <PteStaticQuestionList questions={getPteStaticQuestionBank("smw")} />;
}
