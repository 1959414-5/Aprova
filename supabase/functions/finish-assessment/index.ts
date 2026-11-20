import { withSupabase } from "npm:@supabase/server";

const SIMULATION_RUN_TYPE = "simulado_completo";

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
    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: "Sessão não identificada." }, { status: 401, headers: corsHeadersFor(req) });

    const body = await req.json();
    const runId = String(body.assessment_run_id ?? "");
    const allowPartial = body.allow_partial === true;
    if (!/^[0-9a-f-]{36}$/i.test(runId)) {
      return Response.json({ error: "Identificador de avaliação inválido." }, { status: 400, headers: corsHeadersFor(req) });
    }

    const { data: run, error: runError } = await ctx.supabaseAdmin
      .from("assessment_runs")
      .select("id, user_id, exam_id, run_type, title, question_count, finished_at, started_at, metadata")
      .eq("id", runId)
      .eq("user_id", userId)
      .maybeSingle();

    if (runError || !run) return Response.json({ error: "Avaliação não encontrada." }, { status: 404, headers: corsHeadersFor(req) });
    if (run.finished_at) return Response.json({ error: "Esta avaliação já foi finalizada." }, { status: 409, headers: corsHeadersFor(req) });

    const { data: attempts, error: attemptsError } = await ctx.supabaseAdmin
      .from("question_attempts")
      .select("id, question_id, selected_option, is_correct, time_spent_seconds, answered_at")
      .eq("assessment_run_id", runId)
      .eq("user_id", userId)
      .order("answered_at", { ascending: true });

    if (attemptsError) {
      console.error("Falha ao consultar respostas da avaliação:", attemptsError.message);
      return Response.json({ error: "Não foi possível apurar as respostas." }, { status: 500, headers: corsHeadersFor(req) });
    }

    const responseRows = attempts ?? [];
    const expected = Number(run.question_count ?? 0);
    const isComplete = responseRows.length === expected && expected > 0;

    if (run.run_type === "diagnostico") {
      const questionIds = Array.isArray(run.metadata?.question_ids) ? run.metadata.question_ids : [];
      if (
        expected !== 22 ||
        questionIds.length !== 22 ||
        new Set(questionIds).size !== 22 ||
        responseRows.some((attempt) => !questionIds.includes(attempt.question_id))
      ) {
        return Response.json({
          error: "A sequência salva deste diagnóstico está incompleta ou inconsistente. A tentativa foi preservada para análise.",
        }, { status: 409, headers: corsHeadersFor(req) });
      }
    }

    if (responseRows.length === 0 && body.abandon === true) {
      const abandonedAt = new Date().toISOString();
      const { error: abandonError } = await ctx.supabaseAdmin
        .from("assessment_runs")
        .update({
          finished_at: abandonedAt,
          duration_seconds: Math.max(0, Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000)),
          score: null,
          max_score: null,
          correct_count: 0,
          question_count: 0,
          metadata: { ...(run.metadata ?? {}), origin: run.run_type === SIMULATION_RUN_TYPE ? "banco_autoral_ia" : "banco_autoral_inicial", abandoned: true, partial: true },
        })
        .eq("id", runId)
        .eq("user_id", userId)
        .is("finished_at", null);
      if (abandonError) {
        return Response.json({ error: "Não foi possível descartar esta avaliação vazia." }, { status: 500, headers: corsHeadersFor(req) });
      }
      return Response.json({ finished: true, abandoned: true, total: 0 }, { headers: { ...corsHeadersFor(req), "Content-Type": "application/json" } });
    }
    if (!isComplete && !allowPartial) {
      return Response.json({
        error: `Ainda faltam respostas: ${responseRows.length} de ${expected}.`,
        answered: responseRows.length,
        expected,
      }, { status: 409, headers: corsHeadersFor(req) });
    }
    if (responseRows.length === 0) {
      return Response.json({ error: "Nenhuma resposta foi registrada nesta avaliação." }, { status: 400, headers: corsHeadersFor(req) });
    }

    const questionIds = responseRows.map((row) => row.question_id);
    const { data: questions, error: questionsError } = await ctx.supabaseAdmin
      .from("questions")
      .select("id, exam_subject_id, correct_option, explanation, points, topic_id, statement, options")
      .eq("exam_id", run.exam_id)
      .in("id", questionIds);

    if (questionsError || !questions || questions.length !== responseRows.length) {
      return Response.json({ error: "Não foi possível conferir todas as questões desta avaliação." }, { status: 500, headers: corsHeadersFor(req) });
    }

    const questionById = new Map(questions.map((question) => [question.id, question]));
    const subjectIds = [...new Set(questions.map((question) => question.exam_subject_id))];
    const { data: examSubjects, error: subjectError } = await ctx.supabaseAdmin
      .from("exam_subjects")
      .select("id, subject_id, subjects(slug, name)")
      .in("id", subjectIds);
    if (subjectError) {
      return Response.json({ error: "Não foi possível montar o resultado por disciplina." }, { status: 500, headers: corsHeadersFor(req) });
    }

    const subjectMap = new Map((examSubjects ?? []).map((row: any) => [row.id, row.subjects]));
    let rawPoints = 0;
    let maxPoints = 0;
    let correctCount = 0;
    const perSubject = new Map<string, any>();
    const review = responseRows.map((attempt) => {
      const question = questionById.get(attempt.question_id);
      if (!question) return null;
      const points = Number(question.points ?? 0);
      const correct = attempt.selected_option === question.correct_option;
      rawPoints += correct ? points : 0;
      maxPoints += points;
      if (correct) correctCount += 1;

      const subject = subjectMap.get(question.exam_subject_id) as any;
      const key = subject?.slug || question.exam_subject_id;
      const current = perSubject.get(key) ?? {
        slug: key,
        name: subject?.name || "Disciplina",
        answered: 0,
        correct: 0,
        raw_points: 0,
        max_points: 0,
      };
      current.answered += 1;
      current.correct += correct ? 1 : 0;
      current.raw_points += correct ? points : 0;
      current.max_points += points;
      perSubject.set(key, current);

      return {
        question_id: question.id,
        statement: question.statement,
        options: question.options,
        selected_option: attempt.selected_option,
        correct_option: question.correct_option,
        correct,
        explanation: question.explanation,
        points,
        topic_id: question.topic_id,
      };
    }).filter(Boolean);

    const score = maxPoints > 0 ? Number(((rawPoints / maxPoints) * 100).toFixed(2)) : 0;
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000));
    const finishedAt = new Date().toISOString();
    const resultMetadata = {
      ...(run.metadata ?? {}),
      origin: run.run_type === SIMULATION_RUN_TYPE ? "banco_autoral_ia" : "banco_autoral_inicial",
      partial: !isComplete,
      raw_points: rawPoints,
      raw_max_points: maxPoints,
      subject_breakdown: [...perSubject.values()],
    };

    const { error: updateError } = await ctx.supabaseAdmin
      .from("assessment_runs")
      .update({
        finished_at: finishedAt,
        duration_seconds: elapsed,
        score: !isComplete && allowPartial ? null : score,
        max_score: 100,
        correct_count: correctCount,
        question_count: responseRows.length,
        metadata: resultMetadata,
      })
      .eq("id", runId)
      .eq("user_id", userId)
      .is("finished_at", null);

    if (updateError) {
      console.error("Falha ao finalizar avaliação:", updateError.message);
      return Response.json({ error: "Não foi possível finalizar a avaliação." }, { status: 500, headers: corsHeadersFor(req) });
    }

    return Response.json({
      finished: true,
      partial: !isComplete,
      score: !isComplete && allowPartial ? null : score,
      correct: correctCount,
      total: responseRows.length,
      expected,
      raw_points: rawPoints,
      raw_max_points: maxPoints,
      minutes: Math.max(1, Math.round(elapsed / 60)),
      subjects: [...perSubject.values()].map((row) => ({
        ...row,
        percentage: row.max_points ? Number(((row.raw_points / row.max_points) * 100).toFixed(1)) : 0,
      })),
      review,
    }, { headers: { ...corsHeadersFor(req), "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Falha em finish-assessment:", error);
    return Response.json({ error: "Não foi possível apurar o resultado da avaliação." }, { status: 400, headers: corsHeadersFor(req) });
  }
});

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  return handler(req);
});
