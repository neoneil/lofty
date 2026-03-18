import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { DrawnTarotCard } from "@/types/tarot";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);

    const body = await req.json();
    const question: string = body.question ?? "";
    const cards: DrawnTarotCard[] = body.cards ?? [];

    if (!cards || cards.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 cards are required." },
        { status: 400 }
      );
    }

    const positionLabel: Record<string, string> = {
      past: "过去",
      present: "现在",
      future: "未来",
    };

    const cardsText = cards
      .map((card) => {
        const keywords = card.reversed ? card.meaningReversed : card.meaningUp;
        return `位置：${positionLabel[card.position]}
牌名：${card.nameCn} (${card.name})
方向：${card.reversed ? "逆位" : "正位"}
关键词：${keywords.join("、")}`;
      })
      .join("\n\n");

    const prompt = `
你是一位温和、清晰、有洞察力的塔罗解读师，请用自然中文解读三张塔罗牌。
不要夸张恐吓，不要故弄玄虚，不要制造宿命感。
语气要温柔、具体、可读性强，像真正给用户做咨询一样。

用户问题：
${question?.trim() || "用户没有输入具体问题，请做总体运势方向解读。"}

抽到的三张牌如下：
${cardsText}

请严格按以下格式输出，使用 markdown：

## 总览
先用 2-4 句话总结这组三张牌的整体能量。

## 单张解读
### 过去
解释过去位置这张牌代表什么

### 现在
解释现在位置这张牌代表什么

### 未来
解释未来位置这张牌代表什么

## 综合分析
把三张牌联系起来，说明事件的发展逻辑、情绪变化或关系变化。

## 建议
给出 3 条具体、温和、现实的建议。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: "You are a thoughtful tarot interpreter writing in Chinese.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reading =
      completion.choices[0]?.message?.content ?? "暂时没有生成解读。";

    return NextResponse.json({ reading });
  } catch (error: any) {
    console.error("tarot-reading full error:", error);
    console.error("message:", error?.message);
    console.error("status:", error?.status);
    console.error("code:", error?.code);
    console.error("type:", error?.type);
    console.error("response data:", error?.response?.data);

    return NextResponse.json(
      {
        error: error?.message || "Failed to generate tarot reading.",
      },
      { status: 500 }
    );
  }
}
