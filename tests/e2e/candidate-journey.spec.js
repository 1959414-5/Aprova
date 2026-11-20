import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.E2E_BASE_URL || "https://1959414-5.github.io/Aprova/";
const EXAM_SLUG = "sbmg-2026-auxiliar-administrativo-financeiro";
const SIMULATION_CYCLE = ["A", "B", "C"];

function makeSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("As variáveis públicas do Supabase não foram configuradas no job.");
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

test("sessão real do candidato: login, ciclo A-B-C, resultado e rascunho de redação", async ({ page }) => {
  test.setTimeout(60 * 60 * 1000);

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Configure E2E_TEST_EMAIL e E2E_TEST_PASSWORD nos Secrets do repositório.");
  }

  const supabase = makeSupabaseClient();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error("A autenticação da conta de teste no Supabase falhou: " + authError.message);
  const userId = authData.user.id;

  try {
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("id")
      .eq("slug", EXAM_SLUG)
      .single();
    if (examError) throw new Error("Não foi possível localizar o concurso: " + examError.message);

    const { count: initialCompletedCount, error: countError } = await supabase
      .from("assessment_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("exam_id", exam.id)
      .eq("run_type", "simulado")
      .eq("question_count", 70)
      .not("finished_at", "is", null);
    if (countError) throw new Error("Não foi possível consultar o histórico de simulados: " + countError.message);

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Continue sua preparação" })).toBeVisible({ timeout: 90000 });
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    const simulationsNav = page.locator(".side-nav").getByRole("button", { name: "Simulados" });
    await expect(simulationsNav).toBeVisible({ timeout: 90000 });

    const versionsRun = [];
    for (let runIndex = 0; runIndex < 3; runIndex += 1) {
      const expectedVersion = SIMULATION_CYCLE[((initialCompletedCount || 0) + runIndex) % 3];
      await simulationsNav.click();

      // O menu é exibido antes de loadDashboard terminar. Só iniciar depois de
      // confirmar que o concurso e as cinco disciplinas foram carregados.
      await expect(page.locator(".simulation-distribution .simulation-subject-row"))
        .toHaveCount(5, { timeout: 90000 });
      const startButton = page.locator(".simulation-hero")
        .getByRole("button", { name: /Iniciar simulado completo/ });
      await expect(startButton).toBeEnabled({ timeout: 90000 });
      const runStartedAfter = new Date(Date.now() - 1500).toISOString();
      await startButton.click();

      // Espera o registro persistido, ou retorna imediatamente o aviso da tela
      // em vez de ficar aguardando cegamente pelo seletor da questão.
      let startOutcome = "pending";
      await expect.poll(async () => {
        const { data, error } = await supabase.from("assessment_runs")
          .select("id, question_count, finished_at, started_at")
          .eq("user_id", userId)
          .eq("exam_id", exam.id)
          .eq("run_type", "simulado")
          .is("finished_at", null)
          .gte("started_at", runStartedAfter)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          startOutcome = "created";
          return startOutcome;
        }
        const notice = await page.locator(".global-notice").textContent().catch(() => "");
        if (notice?.trim()) {
          startOutcome = "notice: " + notice.trim();
          return startOutcome;
        }
        return "pending";
      }, { timeout: 60000, intervals: [500, 1000, 2000] }).not.toBe("pending");

      if (startOutcome !== "created") {
        throw new Error("Não foi possível iniciar o simulado: " + startOutcome
          + (browserErrors.length ? " | Erros do navegador: " + browserErrors.join(" || ") : ""));
      }

      await expect(page.locator(".quiz-card h1")).toBeVisible({ timeout: 45000 });
      await expect(page.locator(".quiz-timer-strip")).toContainText("70 QUESTÕES");

      const { data: activeRun, error: activeRunError } = await supabase
        .from("assessment_runs")
        .select("id, question_count, finished_at, started_at")
        .eq("user_id", userId)
        .eq("exam_id", exam.id)
        .eq("run_type", "simulado")
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeRunError || !activeRun) {
        throw new Error("O simulado não criou um registro ativo: " + (activeRunError?.message || "registro ausente"));
      }
      expect(activeRun.question_count).toBe(70);

      for (let questionIndex = 0; questionIndex < 70; questionIndex += 1) {
        const options = page.locator(".option-list .option");
        await expect(options).toHaveCount(5);
        await options.first().click();
        await page.getByRole("button", { name: "Confirmar resposta", exact: true }).click();
        await expect(page.getByText("Resposta registrada.", { exact: true })).toBeVisible({ timeout: 45000 });

        if (questionIndex === 69) {
          await page.getByRole("button", { name: /^Ver resultado/ }).click();
        } else {
          await page.getByRole("button", { name: /^Próxima questão/ }).click();
        }
      }

      await expect(page.getByRole("heading", { name: "Resultado do simulado completo." })).toBeVisible({ timeout: 90000 });
      await expect(page.locator(".result-stats")).toContainText("/70");

      const { data: completedRun, error: completedRunError } = await supabase
        .from("assessment_runs")
        .select("id, question_count, finished_at")
        .eq("id", activeRun.id)
        .single();
      if (completedRunError) throw new Error("Não foi possível confirmar a finalização: " + completedRunError.message);
      expect(completedRun.question_count).toBe(70);
      expect(completedRun.finished_at).toBeTruthy();

      const { data: attempts, error: attemptsError } = await supabase
        .from("question_attempts")
        .select("question_id")
        .eq("assessment_run_id", activeRun.id);
      if (attemptsError) throw new Error("Não foi possível consultar as respostas do simulado: " + attemptsError.message);
      expect(attempts).toHaveLength(70);

      const questionIds = [...new Set(attempts.map((item) => item.question_id))];
      expect(questionIds).toHaveLength(70);
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, simulation_version")
        .in("id", questionIds);
      if (questionsError) throw new Error("Não foi possível validar a versão do banco: " + questionsError.message);
      expect(questions).toHaveLength(70);
      const usedVersions = [...new Set(questions.map((item) => item.simulation_version))];
      expect(usedVersions).toEqual([expectedVersion]);
      versionsRun.push(expectedVersion);
    }

    expect(versionsRun).toEqual(SIMULATION_CYCLE.map((_, index) =>
      SIMULATION_CYCLE[((initialCompletedCount || 0) + index) % 3]
    ));

    await page.locator(".side-nav").getByRole("button", { name: "Redação" }).click();
    await page.getByRole("button", { name: "Escrever", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tema da rodada" })).toBeVisible();
    await expect(page.locator(".essay-prompt-rotation")).toContainText(/Proposta automática · \d+ de 12/);

    const draftText = "RASCUNHO DE TESTE APROVA E2E - NAO CONSIDERAR COMO REDACAO REAL";
    await page.locator("#essay-text").fill(draftText);
    await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
    await expect(page.getByText("Rascunho salvo.", { exact: true })).toBeVisible({ timeout: 60000 });

    const { data: savedDraft, error: savedDraftError } = await supabase
      .from("essay_submissions")
      .select("id, text_content, status, line_count")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (savedDraftError) throw new Error("Não foi possível conferir o rascunho salvo: " + savedDraftError.message);
    expect(savedDraft?.text_content).toBe(draftText);
    expect(savedDraft?.status).toBe("rascunho");
    expect(savedDraft?.line_count).toBe(1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".side-nav").getByRole("button", { name: "Redação" })).toBeVisible({ timeout: 90000 });
    await page.locator(".side-nav").getByRole("button", { name: "Redação" }).click();
    await page.getByRole("button", { name: "Escrever", exact: true }).click();
    const latestDraftInHistory = page.locator(".essay-history-item").first();
    await expect(latestDraftInHistory).toBeVisible({ timeout: 60000 });
    await latestDraftInHistory.click();
    await expect(page.locator("#essay-text")).toHaveValue(draftText);

    console.log("E2E concluído. Versões verificadas:", versionsRun.join(" -> "));
    console.log("Simulados completos adicionados ao histórico:", versionsRun.length);
    console.log("Rascunho de teste salvo e recuperado do histórico.");
    if (browserErrors.length) console.log("Avisos/erros do navegador observados:", browserErrors.join(" || "));
  } finally {
    await supabase.auth.signOut();
  }
});
