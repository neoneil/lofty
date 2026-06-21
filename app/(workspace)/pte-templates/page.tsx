"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { templateGroups, type TemplateGroup } from "@/lib/pte-templates";

export default function PTETemplatesPage() {
  const [expandedTypes, setExpandedTypes] = useState<string[]>(["DI"]);

  function toggleType(type: string) {
    setExpandedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }

  return (
    <main className="container-main py-1 sm:py-1">
      <section className="mb-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <Badge className="mb-3 w-fit">PTE Templates</Badge>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          PTE 题型模板库
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
          根据 PTE Academic 需要模板的题型整理。当前内容为前端静态数据，后续可直接替换为正式模板文本。
        </p>
      </section>

      <Card>
        <CardHeader className="gap-3 border-b border-[var(--border)] pb-5 max-sm:flex-col max-sm:items-start">
          <div>
            <CardTitle>PTE 模板分类</CardTitle>
            <CardDescription>
              点击大题型展开，查看不同目标分数和小题型模板。
            </CardDescription>
          </div>
          <Badge variant="secondary">{templateGroups.length} 个模板题型</Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-soft)] text-left text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  <th className="px-5 py-4 font-semibold">题型</th>
                  <th className="px-5 py-4 font-semibold">英文名称</th>
                  <th className="px-5 py-4 font-semibold">模板状态</th>
                  <th className="px-5 py-4 font-semibold">分数档</th>
                  <th className="px-5 py-4 text-right font-semibold">模板内容</th>
                </tr>
              </thead>
              <tbody>
                {templateGroups.map((group, index) => {
                  const expanded = expandedTypes.includes(group.questionType);
                  const rowTone =
                    index % 2 === 0
                      ? "bg-[var(--card)]"
                      : "bg-[var(--bg-soft)]/70";

                  return (
                    <Fragment key={group.questionType}>
                      <tr
                        className={`border-b border-[var(--border)] ${rowTone} transition hover:bg-[var(--primary-soft)]/40`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center">
                            <div className="flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-2 text-sm font-black text-[var(--primary)]">
                              {group.questionType}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[var(--text)]">
                            {group.title}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={group.needTemplate ? "success" : "outline"}
                          >
                            {group.needTemplate ? "需要模板" : "无需模板"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {group.scores.map((score) => (
                              <Badge key={score.level} variant="secondary">
                                {score.label}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => toggleType(group.questionType)}
                          >
                            {expanded ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronRight size={15} />
                            )}
                            {expanded ? "收起" : "展开"}
                          </Button>
                        </td>
                      </tr>

                      {expanded ? (
                        <tr className="border-b border-[var(--border)] bg-[var(--primary-soft)]/20">
                          <td colSpan={5} className="px-5 py-5">
                            <TemplateGroupPanel group={group} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="mt-5 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[linear-gradient(135deg,var(--primary-soft),var(--card)_34%,var(--bg-soft))] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="mx-auto max-w-5xl">
          <Badge className="mb-3 w-fit" variant="secondary">
            模板使用提醒
          </Badge>
          <p className="text-sm font-medium leading-8 text-[var(--text)] sm:text-[15px]">
            <span className="text-[var(--primary)]">模板已备</span>
            ，便如江湖中的招式；然而招式虽利，终究还需
            <span className="text-[var(--success)]">内功支撑</span>
            。PTE 考场就像一场比武大会，既要有固定套路，也要有真实的听说读写能力。更重要的是，
            <span className="mx-1 inline-flex items-center rounded-[var(--radius-md)] border border-[color:var(--warning)]/35 bg-[var(--warning-soft)] px-3 py-1 text-sm font-black tracking-[0.08em] text-[var(--warning)] shadow-[0_0_18px_color-mix(in_srgb,var(--warning)_18%,transparent)]">
              天下武功，唯快不破
            </span>
            。模板必须背到滚瓜烂熟，出口成章，不能卡顿，不能迟疑。真正上场时，能
            <span className="text-[var(--primary)]">流利</span>
            、
            <span className="text-[var(--success)]">稳定</span>
            、
            <span className="text-[var(--warning)]">自然</span>
            地说出来，才算把招式练成了自己的功夫。
          </p>
        </div>
      </section>
    </main>
  );
}

function TemplateGroupPanel({ group }: { group: TemplateGroup }) {
  const [expandedTemplates, setExpandedTemplates] = useState<string[]>([
    `${group.questionType}-${group.scores[0]?.level}-${group.scores[0]?.categories[0]?.key}`,
  ]);

  function toggleTemplate(templateKey: string) {
    setExpandedTemplates((current) =>
      current.includes(templateKey)
        ? current.filter((item) => item !== templateKey)
        : [...current, templateKey],
    );
  }

  return (
    <div className="space-y-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers3 size={18} className="text-[var(--primary)]" />
            <h3 className="font-semibold text-[var(--text)]">
              {group.questionType} 模板组
            </h3>
          </div>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            按目标分数和小题型分类渲染，模板内容来自独立 JSON 数据文件。
          </p>
        </div>
        <Badge variant="default">{group.scores.length} 个分数档</Badge>
      </div>

      <div className="space-y-4">
        {group.scores.map((score) => (
          <div
            key={score.level}
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <div>
                <h4 className="font-semibold text-[var(--text)]">
                  {score.label}
                </h4>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  {score.categories.length} 个模板分类
                </p>
              </div>
              <Badge variant="secondary">雅思 Band {score.level} 水平</Badge>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {score.categories.map((category) => {
                const templateKey = `${group.questionType}-${score.level}-${category.key}`;
                const expanded = expandedTemplates.includes(templateKey);

                return (
                  <div key={templateKey} className="bg-[var(--card)]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[var(--primary-soft)]/35"
                      onClick={() => toggleTemplate(templateKey)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{category.label}</Badge>
                        <span className="text-xs font-medium text-[var(--text-soft)]">
                          {category.key}
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--primary)]">
                        {expanded ? "收起模板" : "查看模板"}
                        {expanded ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="border-t border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4">
                        <p className="whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                          {category.template}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
