"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import PdfPanel from "./pdf-panel";

type Props = {
  leftPdfUrl: string;
  rightPdfUrl: string;
};

export default function ReadingWorkspace({
  leftPdfUrl,
  rightPdfUrl,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col bg-(--bg)">
      <div className="flex-1 overflow-hidden px-4 pb-4 pt-4">
        <div className="h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full">
                <PdfPanel pdfUrl={leftPdfUrl} />
              </div>
            </Panel>

            <Separator className="w-1 bg-gray-200 hover:bg-gray-300" />

            <Panel defaultSize={50} minSize={30}>
              <div className="h-full">
                <PdfPanel pdfUrl={rightPdfUrl} />
              </div>
            </Panel>
          </Group>
        </div>
      </div>
    </div>
  );
}