import PteStaticQuestionList from "@/components/pte/pte-static-question-list";
import { getPteStaticQuestionBank } from "@/lib/pte/static-sample-questions";

export default function PteListeningMcsaPage() {
  return <PteStaticQuestionList questions={getPteStaticQuestionBank("mcsa")} />;
}
