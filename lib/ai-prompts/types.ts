export type AiPromptVariable = {
  name: string;
  description: string;
};

export type AiPromptDefinition = {
  id: string;
  title: string;
  category: string;
  scope: "system" | "user" | "input";
  description: string;
  usedBy: string[];
  variables: AiPromptVariable[];
  defaultContent: string;
};

export type AiPromptRecord = AiPromptDefinition & {
  content: string;
  source: "database" | "default";
  isActive: boolean;
  isCustom: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};
