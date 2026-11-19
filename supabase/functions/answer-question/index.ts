import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const handler = withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const questionId = String(body.question_id ?? "");
    const selectedOption = String(body.selected_option ?? "").toUpperCase();
    const runId = body.assessment_run_id ? String(body.assessment_run_id) : null;
    const spent = Number(body.time_spent_seconds ?? 0);

    if (!/^[0-9a-f-]{36}$/i.test(questionId) || !["A", "B", "C", "D", "E"].includes(selectedOption)) {
      return Response.json({ error: "Questão ou alternativa inválida." }, { status: 400, headers: corsHeaders });
    }

    const userId = ctx.userClaims?.sub;
    if (!userId) return Response.json({ error: "Sessão não identificada." }, { status: 401, headers: corsHeaders });

    if (runId) {
      const { data: run } = await ctx.supabase.from("assessment_runs").select("id").eq("id", runId).eq("user_id", userId).maybeSingle();
      if (!run) return Response.json({ error: "Simulado não pertence a esta conta." }, { status: 403, headers: corsHeaders });
    }

    // O gabarito é consultado somente no servidor, após a validação da sessão.
    const { data: question, error: questionError } = await ctx.supabaseAdmin
      .from("questions")
      .select("id, correct_option, explanation, topic_id, points")
      .eq("id", questionId)
      .eq("is_published", true)
      .maybeSingle();

    if (questionError || !question || !question.correct_option) {
      return Response.json({ error: "Questão indisponível para correção." }, { status: 404, headers: corsHeaders });
    }

    const isCorrect = selectedOption === question.correct_option;
    const safeSpent = Number.isFinite(spent) ? Math.max(0, Math.min(3600, Math.round(spent))) : 0;
    const { error: insertError } = await ctx.supabase.from("question_attempts").insert({
      user_id: userId,
      question_id: question.id,
      assessment_run_id: runId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      time_spent_seconds: safeSpent,
      ai_feedback: isCorrect ? "Resposta correta." : "Resposta incorreta. Revise a explicação e o tópico relacionado.",
    });

    if (insertError) {
      console.error("Erro ao registrar tentativa:", insertError.message);
      return Response.json({ error: "Não foi possível salvar sua resposta." }, { status: 500, headers: corsHeaders });
    }

    return Response.json({
      correct: isCorrect,
      correct_option: question.correct_option,
      explanation: question.explanation,
      topic_id: question.topic_id,
      points: question.points ?? 0,
    }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Falha em answer-question:", error);
    return Response.json({ error: "Não foi possível corrigir esta resposta." }, { status: 400, headers: corsHeaders });
  }
});

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return handler(req);
});
