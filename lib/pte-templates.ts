import pteTemplatesJson from "@/lib/data/pte-templates.json";

export type TemplateCategory = {
  key: string;
  label: string;
  template: string;
};

export type TemplateScore = {
  level: number;
  label: string;
  categories: TemplateCategory[];
};

export type TemplateGroup = {
  questionType: string;
  title: string;
  needTemplate: boolean;
  scores: TemplateScore[];
};

export type PTETemplateData = {
  version: string;
  exam: string;
  placeholderStyle?: string;
  templateGroups: TemplateGroup[];
};

export const pteTemplateData = pteTemplatesJson as PTETemplateData;

export const templateGroups = pteTemplateData.templateGroups;
