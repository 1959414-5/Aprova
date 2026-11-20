import { withSupabase } from "npm:@supabase/server";

const ALLOWED_ORIGINS = new Set([
  "https://1959414-5.github.io",
  "http://localhost:5173",
]);

function corsHeadersFor(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const handler = withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: corsHeadersFor(req) });
  }

  try {
    const body = await req.json();
    const questionId = String(body.question_id ?? "");
    const selectedOption = String(body.selected_option ?? "").toUpperCase();
    const runId = body.assessment_run_id ? String(body.assessment_run_id) : null;
    const spent = Number(body.time_spent_seconds ?? 0);

    if (!/^[0-9a-f-]{36}$/i.test(questionId) || !["A", "B", "C", "D", "E"].includes(selectedOption)) {
      return Response.json({ error: "Questão ou alternativa inválida." }, { status: 400, headers: corsHeadersFor(req) });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: "Sessão não identificada." }, { status: 401, headers: corsHeadersFor(req) });

    let runType: string | null = null;
    if (runId) {
      const { data: run, error: runError } = await ctx.supabase
        .from("assessment_runs")
        .select("id, run_type, finished_at, exam_id")
        .eq("id", runId)
        .eq("user_id", userId)
        .maybeSingle();
      if (runError || !run) {
        return Response.json({ error: "Avaliação não pertence a esta conta." }, { status: 403, headers: corsHeadersFor(req) });
      }
      if (run.finished_at) {
        return Response.json({ error: "Esta avaliação já foi finalizada." }, { status: 409, headers: corsHeadersFor(req) });
      }
      runType = run.run_type;
    }

    const { data: question, error: questionError } = await ctx.supabaseAdmin
      .from("questions")
      .select("id, correct_option, explanation, topic_id, points, exam_id")
      .eq("id", questionId)
      .eq("is_published", true)
      .maybeSingle();

    if (questionError || !question || !question.correct_option) {
      return Response.json({ error: "Questão indisponível para correção." }, { status: 404, headers: corsHeadersFor(req) });
    }

    if (runId) {
      const { data: run, error: runCheckError } = await ctx.supabaseAdmin
        .from("assessment_runs")
        .select("exam_id, metadata")
        .eq("id", runId)
        .eq("user_id", userId)
        .maybeSingle();
      if (runCheckError || !run || run.exam_id !== question.exam_id) {
        return Response.json({ error: "A questão não pertence ao concurso desta avaliação." }, { status: 400, headers: corsHeadersFor(req) });
      }
      if (runType === "diagnostico") {
        const allowedQuestionIds = Array.isArray(run.metadata?.question_ids)
          ? run.metadata.question_ids
          : [];
        if (!allowedQuestionIds.includes(question.id)) {
          return Response.json({ error: "Esta questão não faz parte da sequência salva deste diagnóstico." }, { status: 400, headers: corsHeadersFor(req) });
        }
      }
    }

    const isCorrect = selectedOption === question.correct_option;
    const safeSpent = Number.isFinite(spent) ? Math.max(0, Math.min(3600, Math.round(spent))) : 0;

    // Gravação privilegiada é feita apenas depois de validar sessão, avaliação e questão.
    // O cliente não tem INSERT/UPDATE/DELETE direto em question_attempts.
    const { error: insertError } = await ctx.supabaseAdmin
      .from("question_attempts")
      .insert({
        user_id: userId,
        question_id: question.id,
        assessment_run_id: runId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        time_spent_seconds: safeSpent,
        ai_feedback: runType === "simulado"
          ? null
          : (isCorrect ? "Resposta correta." : "Resposta incorreta. Revise a explicação e o tópico relacionado."),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return Response.json({ error: "Esta questão já foi respondida nesta avaliação." }, { status: 409, headers: corsHeadersFor(req) });
      }
      console.error("Erro ao registrar tentativa:", insertError.message);
      return Response.json({ error: "Não foi possível salvar sua resposta." }, { status: 500, headers: corsHeadersFor(req) });
    }

    // Simulado: não informa acerto/gabarito até a finalização pelo servidor.
    if (runType === "simulado") {
      return Response.json({ recorded: true, feedback_hidden: true }, {
        headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
      });
    }

    return Response.json({
      recorded: true,
      correct: isCorrect,
      correct_option: question.correct_option,
      explanation: question.explanation,
      topic_id: question.topic_id,
      points: question.points ?? 0,
    }, { headers: { ...corsHeadersFor(req), "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Falha em answer-question:", error);
    return Response.json({ error: "Não foi possível corrigir esta resposta." }, { status: 400, headers: corsHeadersFor(req) });
  }
});

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  return handler(req);
});
