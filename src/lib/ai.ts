// src/lib/ai.ts

interface GenerateQuoteInput {
  source: string;
}

export interface GeneratedQuote {
  quote_zh: string;
  pinyin: string;
  quote_en: string;
  source: string;
  author: string;
  explanation_zh: string;
  explanation_en: string;
  scenario_zh: string;
  scenario_en: string;
  theme_keywords: string[];
}

interface ValidationResult {
  pass: boolean;
  issues: string[];
  fixes?: Partial<GeneratedQuote>;
}

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const SYSTEM_PROMPT = `你是一位精通中国古典文学的学者，擅长将古代智慧与现代生活联系起来。
你生成的每一条古文引用都必须是原文，不能编造或改写。
拼音必须使用带声调标记的标准拼音。
英文翻译追求"信达雅"——准确、流畅、优美。`;

export async function generateQuote(
  input: GenerateQuoteInput
): Promise<GeneratedQuote> {
  const response = await fetch(
    `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `请从《${input.source}》中选取一句经典的古文名句，生成以下JSON格式的完整内容：

{
  "quote_zh": "古文原文（必须是真实存在的原文，不能编造）",
  "pinyin": "带声调的拼音",
  "quote_en": "英文翻译（追求信达雅）",
  "source": "出处，如《${input.source}·篇名》",
  "author": "作者或学派",
  "explanation_zh": "现代汉语释义（100-150字）",
  "explanation_en": "English explanation (80-120 words)",
  "scenario_zh": "现代使用场景描述（80-120字）",
  "scenario_en": "Modern usage scenario (60-100 words)",
  "theme_keywords": ["关键词1", "关键词2", "关键词3"]
}

要求：
1. quote_zh 必须是《${input.source}》中真实存在的原文
2. source 要具体到篇名
3. theme_keywords 提供3-5个主题关键词
4. 所有文本都要高质量、有深度`,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from DeepSeek");

  return JSON.parse(content) as GeneratedQuote;
}

export async function validateQuote(
  quote: GeneratedQuote,
  recentKeywords: string[][]
): Promise<ValidationResult> {
  const response = await fetch(
    `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是一位严谨的中国古典文学审核专家。你的职责是审核AI生成的古文内容是否准确、高质量。",
          },
          {
            role: "user",
            content: `请审核以下古文内容，逐项检查：

1. quote_zh 是否真实存在于所注明的 source 中？是否准确无误？
2. pinyin 是否正确？
3. explanation_zh 和 explanation_en 是否准确？
4. quote_en 翻译是否优雅（信达雅）？
5. scenario 是否实用且真实？
6. 内容是否与近期主题过于相似？

近期主题关键词：
${recentKeywords.map((kws) => kws.join(", ")).join("\n")}

待审核内容：
${JSON.stringify(quote, null, 2)}

请返回JSON：
{
  "pass": true/false,
  "issues": ["具体问题描述1", "问题描述2"],
  "fixes": { "field_name": "corrected_value" }
}

如果只是小问题（如错别字、翻译润色），请给出fixes并设pass为true。
如果是根本性问题（如原文不存在、严重语义重复），设pass为false。`,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    return { pass: true, issues: ["Validation API failed, passing by default"] };
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) return { pass: true, issues: [] };

  return JSON.parse(content) as ValidationResult;
}

export async function fixQuote(
  quote: GeneratedQuote,
  fixes: Partial<GeneratedQuote>
): Promise<GeneratedQuote> {
  const response = await fetch(
    `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `请修复以下古文内容中的问题，返回完整修复后的JSON：

原文：
${JSON.stringify(quote, null, 2)}

需要修复的问题：
${JSON.stringify(fixes, null, 2)}

请返回与输入格式相同的完整JSON。`,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    return quote;
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) return quote;

  return JSON.parse(content) as GeneratedQuote;
}
