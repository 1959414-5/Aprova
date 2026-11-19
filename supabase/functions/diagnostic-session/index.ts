import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXAM_SLUG = "sbmg-2026-auxiliar-administrativo-financeiro";
const QUESTION_DISTRIBUTION: Record<string, number> = {
  "lingua-portuguesa": 3,
  "matematica-raciocinio-logico": 3,
  informatica: 3,
  "conhecimentos-gerais-atualidades": 3,
  "conhecimentos-especificos": 10,
};
const EXPECTED_QUESTIONS = 22;

type SubjectRow = {
  id: string;
  display_order: number;
  subjects: { slug: string; name: string } | null;
};

type QuestionRow = {
  id: string;
  exam_subject_id: string;
  topic_id: string | null;
  statement: string;
  options: unknown;
  difficulty: string;
  points: number | null;
  origin: string;
  correct_option?: string | null;
  explanation?: string | null;
};

type AttemptRow = {
  question_id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  answered_at: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function publicQuestion(question: QuestionRow) {
  return {
    id: question.id,
    exam_subject_id: question.exam_subject_id,
    topic_id: question.topic_id,
    statement: question.statement,
    options: question.options,
    difficulty: question.difficulty,
    points: question.points,
    origin: question.origin,
  };
}

function makeQuestionOrder(
  subjects: SubjectRow[],
  bank: QuestionRow[],
  attempts: AttemptRow[],
  subjectSlugById: Map<string, string>,
): string[] {
  const questionById = new Map(bank.map((question) => [question.id, question]));
  const attemptedIds = [...new Set(
    [...attempts]
      .sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime())
      .map((attempt) => attempt.question_id),
  )];

  if (attemptedIds.length > EXPECTED_QUESTIONS) {
    throw new Error("Esta tentativa tem mais respostas registradas do que o limite do diagnóstico.");
  }

  const used = new Set<string>();
  const countBySlug = new Map<string, number>();
  for (const id of attemptedIds) {
    const question = questionById.get(id);
    if (!question) {
      throw new Error("Uma resposta desta tentativa aponta para uma questão que não está mais publicada.");
    }
    const slug = subjectSlugById.get(question.exam_subject_id) || "";
    const target = QUESTION_DISTRIBUTION[slug] || 0;
    const nextCount = (countBySlug.get(slug) || 0) + 1;
    if (!target || nextCount > target) {
      throw new Error("As respostas registradas não correspondem à distribuição do diagnóstico. A tentativa foi preservada para análise.");
    }
    countBySlug.set(slug, nextCount);
    used.add(id);
  }

  const remainingIds: string[] = [];
  for (const subject of [...subjects].sort((a, b) => a.display_order - b.display_order)) {
    const slug = subject.subjects?.slug || "";
    const required = QUESTION_DISTRIBUTION[slug] || 0;
    if (!required) continue;

    const alreadyAnswered = countBySlug.get(slug) || 0;
    const toSelect = required - alreadyAnswered;
    const candidates = shuffle(bank.filter((question) =>
      question.exam_subject_id === subject.id && !used.has(question.id)
    ));

    if (candidates.length < toSelect) {
      throw new Error("O banco publicado não possui questões suficientes em " + (subject.subjects?.name || slug) + ".");
    }

    for (const question of candidates.slice(0, toSelect)) {
      used.add(question.id);
      remainingIds.push(question.id);
    }
  }

  const ordered = [...attemptedIds, ...remainingIds];
  if (ordered.length !== EXPECTED_QUESTIONS) {
    throw new Error("Não foi possível montar as 22 questões na distribuição prevista.");
  }
  return ordered;
}

function isValidStoredOrder(
  questionIds: unknown,
  bank: QuestionRow[],
  subjects: SubjectRow[],
  attempts: AttemptRow[],
): questionIds is string[] {
  if (!Array.isArray(questionIds) || questionIds.length !== EXPECTED_QUESTIONS) return false;
  if (questionIds.some((id) => typeof id !== "string")) return false;
  if (new Set(questionIds).size !== EXPECTED_QUESTIONS) return false;

  const questionById = new Map(bank.map((question) => [question.id, question]));
  if (!questionIds.every((id) => questionById.has(id))) return false;

  const subjectSlugById = new Map(subjects.map((subject) => [
    subject.id,
    subject.subjects?.slug || "",
  ]));
  const counts = new Map<string, number>();
  for (const id of questionIds) {
    const question = questionById.get(id)!;
    const slug = subjectSlugById.get(question.exam_subject_id) || "";
    counts.set(slug, (counts.get(slug) || 0) + 1);
  }

  for (const [slug, required] of Object.entries(QUESTION_DISTRIBUTION)) {
    if ((counts.get(slug) || 0) !== required) return false;
  }

  const answeredIds = [...new Set(
    [...attempts]
      .sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime())
      .map((attempt) => attempt.question_id),
  )];
  return answeredIds.every((id, index) => questionIds[index] === id);
}

const handler = withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: corsHeaders });
  }

  try {
    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: "Sessão não identificada." }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action !== "start") {
      return Response.json({ error: "Ação inválida." }, { status: 400, headers: corsHeaders });
    }

    const admin = ctx.supabaseAdmin;
    const { data: exam, error: examError } = await admin
      .from("exams")
      .select("id, slug")
      .eq("slug", EXAM_SLUG)
      .maybeSingle();
    if (examError || !exam) {
      return Response.json({ error: "Concurso não encontrado." }, { status: 404, headers: corsHeaders });
    }

    const { data: subjectRows, error: subjectsError } = await admin
      .from("exam_subjects")
      .select("id, display_order, subjects(slug, name)")
      .eq("exam_id", exam.id)
      .order("display_order");
    if (subjectsError || !subjectRows) {
      return Response.json({ error: "Não foi possível carregar as disciplinas do diagnóstico." }, { status: 500, headers: corsHeaders });
    }

    const subjects = subjectRows as SubjectRow[];
    const subjectSlugById = new Map(subjects.map((subject) => [
      subject.id,
      subject.subjects?.slug || "",
    ]));

    const { data: bankRows, error: bankError } = await admin
      .from("questions")
      .select("id, exam_subject_id, topic_id, statement, options, difficulty, points, origin, correct_option, explanation")
      .eq("exam_id", exam.id)
      .eq("is_published", true);
    if (bankError || !bankRows) {
      return Response.json({ error: "Não foi possível carregar o banco de questões." }, { status: 500, headers: corsHeaders });
    }
    const bank = bankRows as QuestionRow[];

    const { data: openRuns, error: openRunsError } = await admin
      .from("assessment_runs")
      .select("id, user_id, exam_id, run_type, started_at, question_count, metadata")
      .eq("user_id", userId)
      .eq("exam_id", exam.id)
      .eq("run_type", "diagnostico")
      .is("finished_at", null)
      .order("started_at", { ascending: false });
    if (openRunsError) {
      return Response.json({ error: "Não foi possível verificar uma tentativa em andamento." }, { status: 500, headers: corsHeaders });
    }

    let run = (openRuns || []).find((candidate) => Number(candidate.question_count) === EXPECTED_QUESTIONS) || null;
    let resumed = Boolean(run);
    let attempts: AttemptRow[] = [];

    if (run) {
      const { data: attemptRows, error: attemptsError } = await admin
        .from("question_attempts")
        .select("question_id, selected_option, is_correct, time_spent_seconds, answered_at")
        .eq("assessment_run_id", run.id)
        .eq("user_id", userId)
        .order("answered_at", { ascending: true });
      if (attemptsError || !attemptRows) {
        return Response.json({ error: "Não foi possível recuperar as respostas registradas." }, { status: 500, headers: corsHeaders });
      }
      attempts = attemptRows as AttemptRow[];

      const uniqueAttemptIds = new Set(attempts.map((attempt) => attempt.question_id));
      if (uniqueAttemptIds.size !== attempts.length) {
        return Response.json({ error: "Há respostas duplicadas nesta tentativa. Os dados foram preservados para análise." }, { status: 409, headers: corsHeaders });
      }

      const storedIds = run.metadata?.question_ids;
      const validStoredOrder = isValidStoredOrder(storedIds, bank, subjects, attempts);
      const questionIds = validStoredOrder
        ? storedIds
        : makeQuestionOrder(subjects, bank, attempts, subjectSlugById);

      if (!validStoredOrder) {
        const repairedAt = new Date().toISOString();
        const shouldResetStart = attempts.length === 0;
        const nextMetadata = {
          ...(run.metadata || {}),
          origin: "banco_autoral_ia",
          question_distribution: QUESTION_DISTRIBUTION,
          question_ids: questionIds,
          question_selection_version: 1,
          selection_repaired_at: repairedAt,
        };
        const { error: repairError } = await admin
          .from("assessment_runs")
          .update({
            metadata: nextMetadata,
            question_count: EXPECTED_QUESTIONS,
            ...(shouldResetStart ? { started_at: repairedAt } : {}),
          })
          .eq("id", run.id)
          .eq("user_id", userId)
          .is("finished_at", null);
        if (repairError) {
          return Response.json({ error: "Não foi possível preparar a retomada. Nenhuma resposta foi alterada." }, { status: 500, headers: corsHeaders });
        }
        run = {
          ...run,
          metadata: nextMetadata,
          question_count: EXPECTED_QUESTIONS,
          ...(shouldResetStart ? { started_at: repairedAt } : {}),
        };
      }

      for (const duplicate of (openRuns || []).filter((candidate) => candidate.id !== run!.id)) {
        const { count, error: countError } = await admin
          .from("question_attempts")
          .select("id", { count: "exact", head: true })
          .eq("assessment_run_id", duplicate.id)
          .eq("user_id", userId);
        if (countError || Number(count || 0) > 0) continue;

        const closedAt = new Date().toISOString();
        await admin
          .from("assessment_runs")
          .update({
            finished_at: closedAt,
            duration_seconds: Math.max(0, Math.floor((Date.now() - new Date(duplicate.started_at).getTime()) / 1000)),
            score: null,
            max_score: null,
            correct_count: 0,
            question_count: 0,
            metadata: {
              ...(duplicate.metadata || {}),
              abandoned: true,
              reason: "empty_duplicate_diagnostic_superseded",
              superseded_by: run.id,
              superseded_at: closedAt,
            },
          })
          .eq("id", duplicate.id)
          .eq("user_id", userId)
          .is("finished_at", null);
      }
    } else {
      for (const stale of (openRuns || [])) {
        const { count, error: countError } = await admin
          .from("question_attempts")
          .select("id", { count: "exact", head: true })
          .eq("assessment_run_id", stale.id)
          .eq("user_id", userId);
        if (countError || Number(count || 0) > 0) {
          return Response.json({ error: "Há uma tentativa anterior com respostas. Ela precisa ser recuperada antes de iniciar outra." }, { status: 409, headers: corsHeaders });
        }
        const closedAt = new Date().toISOString();
        const { error: closeError } = await admin
          .from("assessment_runs")
          .update({
            finished_at: closedAt,
            duration_seconds: Math.max(0, Math.floor((Date.now() - new Date(stale.started_at).getTime()) / 1000)),
            score: null,
            max_score: null,
            correct_count: 0,
            question_count: 0,
            metadata: { ...(stale.metadata || {}), abandoned: true, reason: "incompatible_empty_diagnostic", abandoned_at: closedAt },
          })
          .eq("id", stale.id)
          .eq("user_id", userId)
          .is("finished_at", null);
        if (closeError) {
          return Response.json({ error: "Não foi possível encerrar uma tentativa vazia antiga." }, { status: 500, headers: corsHeaders });
        }
      }

      let questionIds: string[];
      try {
        questionIds = makeQuestionOrder(subjects, bank, [], subjectSlugById);
      } catch (selectionError) {
        return Response.json({ error: selectionError instanceof Error ? selectionError.message : "Banco insuficiente para o diagnóstico." }, { status: 409, headers: corsHeaders });
      }

      const startedAt = new Date().toISOString();
      const { data: insertedRun, error: insertError } = await admin
        .from("assessment_runs")
        .insert({
          user_id: userId,
          exam_id: exam.id,
          run_type: "diagnostico",
          title: "Diagnóstico inicial — 22 questões",
          question_count: EXPECTED_QUESTIONS,
          metadata: {
            origin: "banco_autoral_ia",
            question_distribution: QUESTION_DISTRIBUTION,
            question_ids: questionIds,
            question_selection_version: 1,
          },
          started_at: startedAt,
        })
        .select("id, user_id, exam_id, run_type, started_at, question_count, metadata")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return Response.json({ error: "O diagnóstico já foi iniciado em outra aba. Clique novamente para retomá-lo." }, { status: 409, headers: corsHeaders });
        }
        console.error("Falha ao criar diagnóstico:", insertError.message);
        return Response.json({ error: "Não foi possível iniciar o diagnóstico." }, { status: 500, headers: corsHeaders });
      }
      run = insertedRun;
      attempts = [];
      resumed = false;
    }

    const finalQuestionIds = run.metadata?.question_ids as string[] | undefined;
    if (!Array.isArray(finalQuestionIds) || finalQuestionIds.length !== EXPECTED_QUESTIONS) {
      return Response.json({ error: "A sequência de questões não está íntegra. Tente novamente; suas respostas foram preservadas." }, { status: 409, headers: corsHeaders });
    }

    const questionById = new Map(bank.map((question) => [question.id, question]));
    const orderedQuestions = finalQuestionIds.map((id) => questionById.get(id));
    if (orderedQuestions.some((question) => !question)) {
      return Response.json({ error: "Uma questão da tentativa não está mais publicada. Nenhuma resposta foi apagada." }, { status: 409, headers: corsHeaders });
    }

    const safeAttempts = attempts.map((attempt) => {
      const question = questionById.get(attempt.question_id)!;
      return {
        question_id: attempt.question_id,
        selected_option: attempt.selected_option,
        is_correct: attempt.is_correct,
        time_spent_seconds: attempt.time_spent_seconds,
        answered_at: attempt.answered_at,
        points: question.points ?? 0,
        topic_id: question.topic_id,
      };
    });

    let lastAnswerFeedback = null;
    if (attempts.length === EXPECTED_QUESTIONS) {
      const lastAttempt = attempts[attempts.length - 1];
      const lastQuestion = questionById.get(lastAttempt.question_id);
      if (lastQuestion) {
        lastAnswerFeedback = {
          correct: Boolean(lastAttempt.is_correct),
          correct_option: lastQuestion.correct_option,
          explanation: lastQuestion.explanation,
        };
      }
    }

    return Response.json({
      run_id: run.id,
      started_at: run.started_at,
      question_count: EXPECTED_QUESTIONS,
      resumed,
      questions: (orderedQuestions as QuestionRow[]).map(publicQuestion),
      attempts: safeAttempts,
      completed_pending: attempts.length === EXPECTED_QUESTIONS,
      last_answer_feedback: lastAnswerFeedback,
    }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Falha em diagnostic-session:", error);
    return Response.json({
      error: error instanceof Error ? error.message : "Não foi possível preparar o diagnóstico.",
    }, { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return handler(req);
});
