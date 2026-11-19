import { withSupabase } from "npm:@supabase/server";

const ALLOWED_ORIGINS = new Set([
  "https://1959414-5.github.io",
  "http://localhost:5173",
]);
const MAX_ESSAY_CHARS = 12000;
const DAILY_LIMIT = 35;
const MODEL_DEFAULT = "gpt-6.2-sol";

function corsFor(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://1959414-5.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

const rubricSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    adequacy_score: { type: "integer", minimum: 0, maximum: 25 },
    content_score: { type: "integer", minimum: 0, maximum: 25 },
    coherence_score: { type: "integer", minimum: 0, maximum: 25 },
    language_score: { type: "integer", minimum: 0, maximum: 25 },
    criterion_feedback: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterion: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 25 },
          comments: { type: "string" },
          improvement: { type: "string" },
        },
        required: ["criterion", "score", "comments", "improvement"],
      },
    },
    strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    improvements: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    general_feedback: { type: "string" },
    line_count_comment: { type: "string" },
    rubric_notice: { type: "string" },
  },
  required: [
    "adequacy_score", "content_score", "coherence_score", "language_score",
    "criterion_feedback", "strengths", "improvements", "general_feedback",
    "line_count_comment", "rubric_notice",
  ],
};

const handler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const headers = corsFor(req);
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405, headers);
  }

  try {
    const userId = ctx.userClaims?.sub;
    if (!userId) return json({ error: "Sessão não identificada." }, 401, headers);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({
        error: "A redação foi salva, mas a correção por IA ainda não está ativada. Falta configurar OPENAI_API_KEY nos Secrets do Supabase.",
        code: "ESSAY_AI_NOT_CONFIGURED",
      }, 503, headers);
    }

    const body = await req.json();
    const submissionId = String(body.submission_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
      return json({ error: "Identificador de redação inválido." }, 400, headers);
    }

    const { data: essay, error: essayError } = await ctx.supabase
      .from("essay_submissions")
      .select("id, exam_id, prompt, text_content, line_count, status")
      .eq("id", submissionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (essayError || !essay) return json({ error: "Redação não encontrada nesta conta." }, 404, headers);
    if (essay.status !== "rascunho") {
      return json({ error: "Esta redação já foi corrigida. Crie um novo rascunho para outra tentativa." }, 409, headers);
    }
    const textContent = String(essay.text_content || "").trim();
    if (!textContent || textContent.length > MAX_ESSAY_CHARS) {
      return json({ error: "O texto está vazio ou excede o limite permitido." }, 400, headers);
    }

    const physicalLines = textContent.split(/\r?\n/).length;
    if (physicalLines < 20 || physicalLines > 30) {
      return json({
        error: `A redação tem ${physicalLines} linhas digitadas. O edital prevê de 20 a 30 linhas; ajuste o texto antes de solicitar a correção.`,
        line_count: physicalLines,
      }, 422, headers);
    }

    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const { count: usedToday, error: usageError } = await ctx.supabaseAdmin
      .from("ai_tutor_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dayStart)
      .eq("request_type", "essay");

    if (usageError) return json({ error: "Não foi possível validar o limite diário de IA." }, 500, headers);
    if ((usedToday ?? 0) >= DAILY_LIMIT) {
      return json({ error: "O limite diário de interações com IA foi atingido. Tente novamente amanhã." }, 429, headers);
    }

    const model = Deno.env.get("OPENAI_MODEL") || MODEL_DEFAULT;
    const instructions = [
      "Você é um corretor formativo de redações para preparação de concurso público no Brasil.",
      "Avalie um texto dissertativo-argumentativo de acordo com quatro critérios, cada um valendo até 25 pontos, totalizando 100:",
      "1. Adequação ao tema e à proposta: atendimento ao tema, ao comando e ao gênero dissertativo-argumentativo.",
      "2. Conteúdo: desenvolvimento, consistência dos argumentos, repertório e pertinência das informações.",
      "3. Coerência: organização das ideias, progressão, estrutura de introdução/desenvolvimento/conclusão e articulação lógica.",
      "4. Linguagem: domínio da modalidade escrita formal, coesão, clareza, vocabulário, concordância, regência, pontuação e ortografia.",
      "Não invente critérios além desses quatro. Não penalize uma opinião apenas por discordar dela; avalie a qualidade argumentativa e a relação com a proposta.",
      "Considere a faixa de 20 a 30 linhas do edital. O contador fornecido usa quebras de linha digitadas; avise que a prova oficial é manuscrita e que a contagem visual pode diferir.",
      "Dê uma pontuação criteriosa e proporcional ao texto. Não dê 25 pontos automaticamente. Justifique cada nota com evidências observáveis no texto.",
      "A correção é apenas formativa e não oficial. Não prometa nota de aprovação nem afirme que substitui a banca.",
      "Responda em português brasileiro, com linguagem didática e orientações acionáveis.",
    ].join("\n");

    const prompt = [
      "Tema/proposta apresentada ao candidato:",
      essay.prompt,
      "",
      "Quantidade de linhas digitadas (quebras explícitas): " + physicalLines,
      "",
      "Texto integral da redação:",
      textContent,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions,
        input: prompt,
        store: false,
        max_output_tokens: 1800,
        text: {
          format: {
            type: "json_schema",
            name: "sbmg_essay_evaluation",
            strict: true,
            schema: rubricSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      await response.text();
      console.error("OpenAI essay feedback status:", response.status);
      await ctx.supabaseAdmin.from("ai_tutor_usage").insert({
        user_id: userId, input_chars: textContent.length, model, response_status: "failed", request_type: "essay",
      });
      return json({ error: "Não foi possível corrigir a redação agora. Tente novamente." }, 502, headers);
    }

    const result = await response.json();
    const outputText = (result.output || [])
      .filter((item: any) => item.type === "message")
      .flatMap((item: any) => item.content || [])
      .filter((item: any) => item.type === "output_text" && typeof item.text === "string")
      .map((item: any) => item.text)
      .join("\n")
      .trim();

    let evaluation: any;
    try {
      evaluation = JSON.parse(outputText);
    } catch {
      return json({ error: "A resposta da correção veio em formato inválido. Tente novamente." }, 502, headers);
    }

    const scores = [
      evaluation.adequacy_score,
      evaluation.content_score,
      evaluation.coherence_score,
      evaluation.language_score,
    ];
    if (scores.some((score: any) => !Number.isInteger(score) || score < 0 || score > 25)) {
      return json({ error: "A correção retornou pontuações fora da rubrica." }, 502, headers);
    }

    const total = scores.reduce((sum: number, score: number) => sum + score, 0);
    const aiFeedback = {
      criterion_feedback: evaluation.criterion_feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      general_feedback: evaluation.general_feedback,
      line_count_comment: evaluation.line_count_comment,
      rubric_notice: "Correção formativa por IA. Não é nota oficial da banca.",
      line_count: physicalLines,
    };

    const { error: updateError } = await ctx.supabaseAdmin
      .from("essay_submissions")
      .update({
        line_count: physicalLines,
        score_adequacy: evaluation.adequacy_score,
        score_content: evaluation.content_score,
        score_coherence: evaluation.coherence_score,
        score_language: evaluation.language_score,
        score_total: total,
        ai_feedback: aiFeedback,
        ai_model: model,
        status: "corrigida",
      })
      .eq("id", submissionId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to save essay evaluation:", updateError.message);
      return json({ error: "A correção foi gerada, mas não foi possível salvá-la." }, 500, headers);
    }

    await ctx.supabaseAdmin.from("ai_tutor_usage").insert({
      user_id: userId, input_chars: textContent.length, model, response_status: "completed", request_type: "essay",
    });

    return json({ evaluation: { ...evaluation, total_score: total, line_count: physicalLines }, status: "corrigida" }, 200, headers);
  } catch (error) {
    console.error("Essay feedback failure:", error);
    return json({ error: "Não foi possível processar a redação. Tente novamente." }, 400, headers);
  }
});

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(req) });
  return handler(req);
});
