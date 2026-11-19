import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const EXAM_SLUG = "sbmg-2026-auxiliar-administrativo-financeiro";
const EXAM_DAY = "2027-01-24";
const NAV_ITEMS = [
  { id: "dashboard", icon: "⌂", label: "Visão geral" },
  { id: "study", icon: "▤", label: "Sala de estudos" },
  { id: "tutor", icon: "✦", label: "Professor IA" },
  { id: "diagnostic", icon: "✓", label: "Diagnóstico" },
  { id: "performance", icon: "↗", label: "Desempenho" },
];
const SUBJECT_ICONS = {
  "lingua-portuguesa": "Aa",
  "matematica-raciocinio-logico": "∑",
  informatica: "⌘",
  "conhecimentos-gerais-atualidades": "◎",
  "conhecimentos-especificos": "▦",
};
const PRIORITY_LABELS = {
  critical: "Prioridade máxima",
  high: "Prioridade alta",
  normal: "Importante",
  complementary: "Complementar",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(value);
}
function daysUntilExam() {
  const today = new Date();
  const target = new Date(EXAM_DAY + "T12:00:00");
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}
function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function AuthScreen({ theme, setTheme }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + window.location.pathname },
        });
        if (authError) throw authError;
        if (data.session) setMessage("Conta criada. Seu ambiente de estudos está sendo preparado.");
        else setMessage("Cadastro enviado. Confira seu e-mail para confirmar a conta e depois entre no sistema.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || "Não foi possível concluir a autenticação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="brand-lockup"><span className="brand-mark">A</span><span>APROVA</span></div>
        <div className="auth-visual-copy">
          <span className="eyebrow eyebrow-light">PREPARAÇÃO INTELIGENTE</span>
          <h1>Uma rotina possível.<br /><em>Uma preparação forte.</em></h1>
          <p>Uma trilha de estudos criada para o concurso da SBMG, com conteúdos do edital, exercícios e acompanhamento de evolução.</p>
          <div className="exam-chip"><span className="chip-dot" /> SBMG · Auxiliar Administrativo/Financeiro</div>
        </div>
        <div className="auth-visual-foot">Foco no edital de 2026 · Prova prevista para 24/01/2027</div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-form-head">
            <div className="mobile-brand"><span className="brand-mark">A</span><strong>APROVA</strong></div>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
              <span>{theme === "dark" ? "☼" : "◐"}</span><small>{theme === "dark" ? "Claro" : "Escuro"}</small>
            </button>
          </div>
          <span className="eyebrow">ÁREA DO CANDIDATO</span>
          <h2>{mode === "login" ? "Continue sua preparação" : "Crie sua conta"}</h2>
          <p className="muted">{mode === "login" ? "Entre para acessar seu progresso e seu plano de estudos." : "Seu histórico de estudos ficará salvo nesta conta."}</p>
          <form onSubmit={handleSubmit} className="auth-fields">
            <label>E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" autoComplete="email" required />
            </label>
            <label>Senha
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required />
            </label>
            {error && <div className="notice notice-error">{error}</div>}
            {message && <div className="notice notice-success">{message}</div>}
            <button className="button button-primary button-wide" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}
            <button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
              {mode === "login" ? "Criar acesso" : "Entrar"}
            </button>
          </div>
          <div className="auth-security"><span>▣</span> Acesso individual com dados de estudo protegidos.</div>
        </div>
      </div>
    </div>
  );
}

function TopicLessonPanel({ topic, lesson, progress, plannedMinutes, activeSession, elapsedSeconds, busy, onStart, onFinish, onCancel, onAskTutor, onClose }) {
  const content = lesson?.content || {};
  const hasActiveSession = activeSession?.topicId === topic.id;
  const anotherSessionActive = Boolean(activeSession) && !hasActiveSession;
  return (
    <section className="lesson-panel" id="topic-lesson">
      <div className="lesson-panel-head">
        <div>
          <span className="eyebrow">AULA DO EDITAL · {lesson?.source_basis || "Anexo III"}</span>
          <h2>{topic.title}</h2>
          <p className="muted">{content.introduction || "O conteúdo desta aula está sendo preparado."}</p>
        </div>
        <button className="icon-button lesson-close" onClick={onClose} title="Fechar aula">×</button>
      </div>
      {!lesson && <div className="notice notice-success">Esta aula ainda está em preparação. O tópico do edital já está cadastrado.</div>}
      {lesson && <>
        <div className="lesson-section"><span className="eyebrow">O QUE VOCÊ VAI APRENDER</span><ul className="lesson-objectives">{(content.objectives || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        <div className="lesson-section"><span className="eyebrow">EXPLICAÇÃO</span><div className="lesson-article">{(content.sections || []).map((section, index) => <article key={index}><h3>{section.heading}</h3><p>{section.text}</p></article>)}</div></div>
        {content.worked_example && <div className="lesson-example"><span className="eyebrow">EXEMPLO RESOLVIDO</span><h3>{content.worked_example.prompt}</h3><ol>{(content.worked_example.steps || []).map((step, index) => <li key={index}>{step}</li>)}</ol><p className="lesson-result"><strong>Conclusão:</strong> {content.worked_example.result}</p></div>}
        <div className="lesson-two-column">
          <div className="lesson-section lesson-summary"><span className="eyebrow">RESUMO PARA REVISÃO</span><ul>{(content.summary || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
          <div className="lesson-section lesson-mistakes"><span className="eyebrow">ERROS COMUNS</span><ul>{(content.common_mistakes || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        </div>
        {content.practice && <div className="lesson-practice"><span className="eyebrow">ATIVIDADE DE FIXAÇÃO</span><h3>{content.practice}</h3><p className="muted">Resolva no caderno ou explique a resposta com suas palavras. Depois, pratique questões do banco.</p></div>}
      </>}
      <div className="lesson-session-footer">
        <div className="lesson-progress-copy"><span className="eyebrow">SEU PROGRESSO</span><strong>{progress?.status === "concluido" ? "Tópico concluído" : progress?.status === "em_andamento" ? "Em andamento" : "Ainda não iniciado"}</strong><small>Bloco planejado: {plannedMinutes} min</small></div>
        <div className="lesson-tutor-action"><button className="button button-secondary" onClick={onAskTutor}>Tirar dúvida com o Professor IA</button></div>
        {hasActiveSession ? <div className="lesson-timer-controls">
          <div className="lesson-timer"><span className="session-live-dot" />{formatElapsed(elapsedSeconds)}</div>
          <button className="button button-secondary" onClick={() => onFinish(false)} disabled={busy}>Salvar sessão</button>
          <button className="button button-primary" onClick={() => onFinish(true)} disabled={busy}>Salvar e concluir tópico</button>
          <button className="text-button" onClick={onCancel}>Cancelar sem salvar</button>
        </div> : <div className="lesson-timer-controls">
          <button className="button button-primary" onClick={onStart} disabled={busy || anotherSessionActive || !lesson}>{anotherSessionActive ? "Finalize a sessão atual" : "Iniciar sessão cronometrada"}</button>
          <small className="muted">O cronômetro começa ao clicar. O tempo só entra no painel quando você salvar a sessão.</small>
        </div>}
      </div>
    </section>
  );
}

function StatCard({ label, value, helper, icon }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{helper}</small></div>;
}
function SubjectRow({ row, completedTopicIds, onOpen }) {
  const subject = row.subjects || {};
  const topics = row.topics || [];
  const count = topics.filter((topic) => completedTopicIds.has(topic.id)).length;
  const pct = topics.length ? Math.round(count / topics.length * 100) : 0;
  return (
    <button className="subject-row" onClick={onOpen}>
      <span className="subject-icon">{SUBJECT_ICONS[subject.slug] || "•"}</span>
      <span className="subject-row-main">
        <strong>{subject.name}</strong>
        <small>{row.question_count} questões · {count}/{topics.length} tópicos estudados</small>
        <span className="subject-progress-track"><i style={{ width: pct + "%" }} /></span>
      </span>
      <b>{row.total_points ?? row.question_count} <small>pts</small></b>
      <span className="arrow">→</span>
    </button>
  );
}
function getSubjectName(rows, examSubjectId) {
  const row = rows.find((item) => item.id === examSubjectId);
  return row?.subjects?.name || "Conhecimentos específicos";
}

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("aprova-theme") || "light"; }
    catch { return "light"; }
  });
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("dashboard");
  const [exam, setExam] = useState(null);
  const [subjectRows, setSubjectRows] = useState([]);
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [topicLessons, setTopicLessons] = useState([]);
  const [topicProgressRows, setTopicProgressRows] = useState([]);
  const [tutorTopicId, setTutorTopicId] = useState("");
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorDraft, setTutorDraft] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorRemaining, setTutorRemaining] = useState(null);
  const [tutorError, setTutorError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [plannedMinutes, setPlannedMinutes] = useState(40);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const diagnosticStartLock = useRef(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizRunId, setQuizRunId] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [responses, setResponses] = useState([]);
  const [quizStartedAt, setQuizStartedAt] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const user = session?.user ?? null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("aprova-theme", theme); } catch { /* armazenamento indisponível */ }
  }, [theme]);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return undefined;
    }
    const updateElapsed = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)));
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return undefined;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setNotice(error.message);
      setSession(data.session);
      setBooting(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadDashboard = useCallback(async (currentUser) => {
    setBusy(true);
    try {
      const { data: examData, error: examError } = await supabase.from("exams").select("*").eq("slug", EXAM_SLUG).single();
      if (examError) throw examError;

      const { data: profileData, error: profileError } = await supabase.from("study_profiles").select("*").eq("user_id", currentUser.id).maybeSingle();
      if (profileError) throw profileError;
      let activeProfile = profileData;
      if (!activeProfile) {
        const { data: newProfile, error: createProfileError } = await supabase.from("study_profiles").insert({
          user_id: currentUser.id,
          experience_level: "basico",
          availability_mode: "variavel",
          work_schedule: "Segunda a sexta, das 07:30 às 17:30. Disponibilidade de estudo variável.",
          weekday_min_minutes: 15,
          weekday_target_minutes: 40,
          weekend_target_minutes: 90,
          target_exam_date: EXAM_DAY,
          preferred_devices: ["desktop", "mobile"],
        }).select("*").single();
        if (createProfileError) throw createProfileError;
        activeProfile = newProfile;
      }

      const { data: subjectsData, error: subjectsError } = await supabase.from("exam_subjects")
        .select("id, display_order, question_count, total_points, points_per_question, subjects(id, slug, name), topics(id, slug, title, syllabus_text, priority, estimated_minutes, display_order)")
        .eq("exam_id", examData.id).order("display_order");
      if (subjectsError) throw subjectsError;

      const { data: attemptsData, error: attemptsError } = await supabase.from("question_attempts")
        .select("id, is_correct, answered_at, question_id").eq("user_id", currentUser.id).order("answered_at", { ascending: false });
      if (attemptsError) throw attemptsError;

      const { data: sessionsData, error: sessionsError } = await supabase.from("study_sessions")
        .select("id, duration_minutes, topic_id, study_method, studied_at").eq("user_id", currentUser.id).order("studied_at", { ascending: false });
      if (sessionsError) throw sessionsError;

      const { data: lessonsData, error: lessonsError } = await supabase.from("topic_lessons")
        .select("topic_id, title, content, source_basis, version")
        .eq("is_published", true);
      if (lessonsError) throw lessonsError;

      const { data: progressData, error: progressError } = await supabase.from("topic_progress")
        .select("topic_id, status, started_at, completed_at, last_studied_at, updated_at")
        .eq("user_id", currentUser.id);
      if (progressError) throw progressError;

      setExam(examData);
      setProfile(activeProfile);
      setSubjectRows((subjectsData || []).map((row) => ({ ...row, topics: [...(row.topics || [])].sort((a, b) => a.display_order - b.display_order) })));
      setAttempts(attemptsData || []);
      setSessions(sessionsData || []);
      setTopicLessons(lessonsData || []);
      setTopicProgressRows(progressData || []);
    } catch (err) {
      setNotice(err.message || "Não foi possível carregar seus dados.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id && supabase) loadDashboard(user);
  }, [user?.id, loadDashboard]);

  const allTopics = useMemo(() => subjectRows.flatMap((row) => row.topics || []), [subjectRows]);
  const topicProgressById = useMemo(() => new Map(topicProgressRows.map((item) => [item.topic_id, item])), [topicProgressRows]);
  const completedTopicIds = useMemo(() => new Set(topicProgressRows.filter((item) => item.status === "concluido").map((item) => item.topic_id)), [topicProgressRows]);
  const inProgressTopicIds = useMemo(() => new Set(topicProgressRows.filter((item) => item.status === "em_andamento").map((item) => item.topic_id)), [topicProgressRows]);
  const completedTopics = completedTopicIds.size;
  const topicProgress = allTopics.length ? Math.round((completedTopics / allTopics.length) * 100) : 0;
  const totalStudyMinutes = sessions.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
  const selectedLesson = selectedTopic ? topicLessons.find((item) => item.topic_id === selectedTopic.id) : null;
  const correctAnswers = attempts.filter((item) => item.is_correct).length;
  const accuracy = attempts.length ? Math.round((correctAnswers / attempts.length) * 100) : 0;
  const daysLeft = daysUntilExam();
  const currentQuestion = quizQuestions[quizIndex];

  function openLesson(topic) {
    if (activeSession && activeSession.topicId !== topic.id) {
      setNotice("Finalize ou cancele a sessão atual antes de abrir outro tópico.");
      return;
    }
    setSelectedTopic(topic);
    setNotice("");
  }

  async function startTopicSession(topic) {
    if (!user || activeSession) return;
    setActiveSession({
      topicId: topic.id,
      topicTitle: topic.title,
      method: "teoria",
      startedAt: Date.now(),
      plannedMinutes,
    });
    setNotice("Sessão iniciada. O tempo só será registrado quando você finalizar.");
  }

  async function finishTopicSession(markCompleted = false) {
    if (!user || !activeSession) return;
    const seconds = Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000));
    if (seconds < 60) {
      setNotice("Para registrar uma sessão, estude por pelo menos 1 minuto. Você também pode cancelar sem salvar.");
      return;
    }
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    const finishedAt = new Date().toISOString();
    const { error: sessionError } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      topic_id: activeSession.topicId,
      duration_minutes: durationMinutes,
      study_method: activeSession.method,
      studied_at: new Date(activeSession.startedAt).toISOString(),
      notes: "Sessão cronometrada: " + (activeSession.topicTitle || "Estudo livre"),
    });
    if (sessionError) {
      setNotice(sessionError.message || "Não foi possível salvar a sessão.");
      return;
    }

    if (activeSession.topicId) {
      const existing = topicProgressById.get(activeSession.topicId);
      const nextStatus = markCompleted ? "concluido" : (existing?.status === "concluido" ? "concluido" : "em_andamento");
      const { error: progressError } = await supabase.from("topic_progress").upsert({
        user_id: user.id,
        topic_id: activeSession.topicId,
        status: nextStatus,
        started_at: existing?.started_at || new Date(activeSession.startedAt).toISOString(),
        completed_at: markCompleted ? finishedAt : (existing?.completed_at || null),
        last_studied_at: finishedAt,
        updated_at: finishedAt,
      }, { onConflict: "user_id,topic_id" });
      if (progressError) {
        setNotice("A sessão foi salva, mas não foi possível atualizar o progresso: " + progressError.message);
        setActiveSession(null);
        await loadDashboard(user);
        return;
      }
    }

    setActiveSession(null);
    setNotice(markCompleted && activeSession.topicId
      ? "Sessão salva e tópico concluído."
      : "Sessão de " + durationMinutes + " minuto(s) salva. O tópico continua em andamento.");
    await loadDashboard(user);
  }

  function cancelTopicSession() {
    setActiveSession(null);
    setNotice("Sessão cancelada. Nenhum tempo foi registrado.");
  }

  async function sendTutorMessage() {
    const message = tutorDraft.trim();
    if (!message || tutorBusy) return;
    if (!tutorTopicId) {
      setTutorError("Selecione um tópico do edital para contextualizar sua dúvida.");
      return;
    }
    const previous = tutorMessages;
    const userMessage = { role: "user", content: message };
    setTutorMessages([...previous, userMessage]);
    setTutorDraft("");
    setTutorBusy(true);
    setTutorError("");
    try {
      const { data, error } = await supabase.functions.invoke("study-tutor", {
        body: {
          topic_id: tutorTopicId,
          message,
          history: previous.slice(-8).map((item) => ({ role: item.role, content: item.content })),
        },
      });
      if (error) {
        let detail = error.message || "Serviço indisponível.";
        try {
          const body = await error.context?.json?.();
          if (body?.error) detail = body.error;
        } catch { /* mantém mensagem genérica */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      const reply = String(data?.reply || "").trim();
      if (!reply) throw new Error("O Professor IA não retornou uma resposta.");
      setTutorMessages([...previous, userMessage, { role: "assistant", content: reply }]);
      if (typeof data.remaining_today === "number") setTutorRemaining(data.remaining_today);
    } catch (err) {
      const detail = err.message || "Não foi possível falar com o Professor IA.";
      setTutorError(detail);
      setTutorMessages([...previous, userMessage, {
        role: "assistant",
        content: detail.includes("OPENAI_API_KEY")
          ? "O Professor IA ainda está em configuração. A chave de acesso do provedor precisa ser adicionada aos Secrets do servidor."
          : "Não consegui responder agora. " + detail,
      }]);
    } finally {
      setTutorBusy(false);
    }
  }

  async function startDiagnostic() {
    if (!exam || !user || diagnosticStartLock.current) return;
    diagnosticStartLock.current = true;
    setBusy(true);
    setNotice("");
    setFeedback(null);
    setSelectedOption("");
    setResponses([]);
    setQuizResult(null);
    try {
      const { data: bank, error: bankError } = await supabase.from("questions")
        .select("id, exam_subject_id, topic_id, statement, options, difficulty, points, origin")
        .eq("exam_id", exam.id).eq("is_published", true);
      if (bankError) throw bankError;
      if (!bank || bank.length < 10) throw new Error("O banco de diagnóstico ainda está sendo preparado.");

      const selected = shuffle(bank);
      const { data: run, error: runError } = await supabase.from("assessment_runs").insert({
        user_id: user.id,
        exam_id: exam.id,
        run_type: "diagnostico",
        title: "Diagnóstico inicial — SBMG 2026",
        question_count: selected.length,
        metadata: { origin: "banco_autoral_inicial", exam_slug: EXAM_SLUG },
      }).select("id").single();
      if (runError) throw runError;

      setQuizQuestions(selected);
      setQuizRunId(run.id);
      setQuizIndex(0);
      setQuizStartedAt(Date.now());
      setQuestionStartedAt(Date.now());
      setView("diagnostic");
    } catch (err) {
      setNotice(err.message || "Não foi possível iniciar o diagnóstico.");
    } finally {
      diagnosticStartLock.current = false;
      setBusy(false);
    }
  }

  async function leaveDiagnostic() {
    if (quizRunId && user) {
      if (responses.length === 0) {
        const { error } = await supabase.from("assessment_runs")
          .delete().eq("id", quizRunId).eq("user_id", user.id);
        if (error) setNotice("Não foi possível descartar o diagnóstico vazio: " + error.message);
      } else {
        const { error } = await supabase.from("assessment_runs").update({
          finished_at: new Date().toISOString(),
          metadata: { origin: "banco_autoral_inicial", partial: true, abandoned: true },
        }).eq("id", quizRunId).eq("user_id", user.id);
        if (error) setNotice("Não foi possível registrar a saída do diagnóstico: " + error.message);
      }
    }
    setQuizRunId(null);
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedOption("");
    setFeedback(null);
    setResponses([]);
    setView("dashboard");
    if (user) await loadDashboard(user);
  }

  async function submitAnswer() {
    if (!currentQuestion || !selectedOption || feedback || !quizRunId) return;
    setBusy(true);
    try {
      const elapsed = questionStartedAt ? Math.round((Date.now() - questionStartedAt) / 1000) : 0;
      const { data, error } = await supabase.functions.invoke("answer-question", {
        body: { question_id: currentQuestion.id, selected_option: selectedOption, assessment_run_id: quizRunId, time_spent_seconds: elapsed },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFeedback(data);
      setResponses((previous) => [...previous, {
        questionId: currentQuestion.id,
        isCorrect: Boolean(data.correct),
        points: Number(currentQuestion.points || 1),
        topicId: currentQuestion.topic_id,
      }]);
    } catch (err) {
      setNotice(err.message || "Erro ao corrigir a resposta. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function nextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((value) => value + 1);
      setSelectedOption("");
      setFeedback(null);
      setQuestionStartedAt(Date.now());
      return;
    }
    const earned = responses.reduce((sum, item) => sum + (item.isCorrect ? item.points : 0), 0);
    const possible = quizQuestions.reduce((sum, item) => sum + Number(item.points || 1), 0);
    const finalScore = possible ? Number(((earned / possible) * 100).toFixed(2)) : 0;
    const elapsed = quizStartedAt ? Math.round((Date.now() - quizStartedAt) / 1000) : 0;
    const { error } = await supabase.from("assessment_runs").update({
      finished_at: new Date().toISOString(),
      duration_seconds: elapsed,
      score: finalScore,
      max_score: 100,
      correct_count: responses.filter((item) => item.isCorrect).length,
      question_count: quizQuestions.length,
      metadata: { origin: "banco_autoral_inicial", raw_points: earned, raw_max_points: possible },
    }).eq("id", quizRunId).eq("user_id", user.id);
    if (error) { setNotice(error.message); return; }
    setQuizResult({
      score: finalScore,
      correct: responses.filter((item) => item.isCorrect).length,
      total: quizQuestions.length,
      minutes: Math.max(1, Math.round(elapsed / 60)),
    });
    setView("results");
    await loadDashboard(user);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setView("dashboard");
    setSubjectRows([]);
  }

  if (!isSupabaseConfigured) {
    return <div className="config-screen"><div className="config-card"><span className="brand-mark">A</span><h1>Configure o Supabase</h1><p>Crie um arquivo .env.local usando .env.example e informe a URL e a publishable key do projeto Aprova.</p></div></div>;
  }
  if (booting) return <div className="loading-screen"><span className="loader" /><span>Preparando seu ambiente de estudos...</span></div>;
  if (!user) return <AuthScreen theme={theme} setTheme={setTheme} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup brand-dark"><span className="brand-mark">A</span><span>APROVA</span></div>
        <div className="sidebar-label">ÁREA DE ESTUDOS</div>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={view === item.id || (view === "results" && item.id === "diagnostic") ? "nav-link active" : "nav-link"} onClick={() => item.id === "diagnostic" ? startDiagnostic() : setView(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-exam-card">
          <span className="eyebrow eyebrow-light">SEU OBJETIVO</span>
          <strong>SBMG 2026</strong>
          <span>Auxiliar Administrativo/Financeiro</span>
          <div className="mini-progress"><span style={{ width: topicProgress + "%" }} /></div>
          <small>{topicProgress}% do conteúdo marcado como estudado</small>
        </div>
        <div className="sidebar-user">
          <div className="avatar">{(user.email || "A").slice(0, 1).toUpperCase()}</div>
          <div className="user-copy"><strong>{user.email?.split("@")[0] || "Candidato"}</strong><span>Plano de preparação</span></div>
          <button className="icon-button" title="Sair" onClick={signOut}>↪</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">CONCURSO SBMG · 2026</span><div className="topbar-title">{NAV_ITEMS.find((item) => item.id === view)?.label || (view === "results" ? "Resultado do diagnóstico" : "Área do candidato")}</div></div>
          <div className="topbar-right">
            <span className="top-date">{formatDate(new Date())}</span>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
              <span>{theme === "dark" ? "☼" : "◐"}</span><small>{theme === "dark" ? "Claro" : "Escuro"}</small>
            </button>
            <button className="avatar avatar-small" title={user.email}>{(user.email || "A").slice(0, 1).toUpperCase()}</button>
          </div>
        </header>
        {notice && <div className="global-notice"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
        {activeSession && (
          <div className="active-session-strip">
            <div><span className="session-live-dot" /><strong>Estudo em andamento</strong><small>{activeSession.topicTitle}</small></div>
            <b>{formatElapsed(elapsedSeconds)}</b>
            <button className="text-button" onClick={() => { setView("study"); if (activeSession.topicId) setSelectedTopic(allTopics.find((item) => item.id === activeSession.topicId) || null); }}>Voltar ao estudo</button>
            <button className="text-button" onClick={() => finishTopicSession(false)}>Finalizar</button>
          </div>
        )}
        {busy && <div className="busy-line"><span /></div>}

        {view === "dashboard" && (
          <section className="content-section">
            <div className="welcome-row">
              <div><span className="eyebrow">BEM-VINDO À SUA PREPARAÇÃO</span><h1>Um passo de cada vez.</h1><p className="muted">O plano se adapta aos dias corridos e aos períodos com mais disponibilidade.</p></div>
              <button className="button button-primary" onClick={startDiagnostic} disabled={busy}>Fazer diagnóstico inicial <span>→</span></button>
            </div>
            <div className="countdown-banner">
              <div className="countdown-icon">◷</div>
              <div className="countdown-copy"><span>CONTAGEM REGRESSIVA</span><strong>Faltam <b>{daysLeft}</b> dias para a prova</strong><small>24 de janeiro de 2027 · Período da tarde</small></div>
              <div className="countdown-side"><span>NOTA MÍNIMA OBJETIVA</span><strong>60 / 100</strong></div>
              <div className="countdown-side"><span>NOTA MÍNIMA REDAÇÃO</span><strong>50 / 100</strong></div>
            </div>
            <div className="stat-grid">
              <StatCard label="Conteúdo estudado" value={topicProgress + "%"} helper={completedTopics + " de " + allTopics.length + " tópicos"} icon="▤" />
              <StatCard label="Tempo de estudo" value={Math.floor(totalStudyMinutes / 60) + "h " + (totalStudyMinutes % 60) + "m"} helper="Tempo registrado no sistema" icon="◷" />
              <StatCard label="Questões respondidas" value={String(attempts.length)} helper={attempts.length ? accuracy + "% de aproveitamento" : "Seu primeiro diagnóstico ainda está pendente"} icon="✓" />
              <StatCard label="Acertos" value={String(correctAnswers)} helper={attempts.length ? (attempts.length - correctAnswers) + " respostas para revisar" : "Vamos descobrir seu nível atual"} icon="↗" />
            </div>
            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-heading"><div><span className="eyebrow">TRILHA DE ESTUDOS</span><h2>Disciplinas do edital</h2></div><button className="text-button" onClick={() => setView("study")}>Ver conteúdo →</button></div>
                <div className="subject-list">{subjectRows.map((row) => <SubjectRow key={row.id} row={row} completedTopicIds={completedTopicIds} onOpen={() => { setExpandedSubject(row.id); setView("study"); }} />)}</div>
              </div>
              <div className="panel plan-panel">
                <div className="panel-heading"><div><span className="eyebrow">PLANO FLEXÍVEL</span><h2>Escolha o tamanho do bloco</h2></div></div>
                <p className="muted small-copy">Ele trabalha das 07:30 às 17:30. Escolha uma duração e depois abra um tópico para iniciar uma sessão cronometrada. O tempo só será salvo ao finalizar.</p>
                <div className="study-options">
                  <button className={plannedMinutes === 15 ? "selected" : ""} onClick={() => { setPlannedMinutes(15); setView("study"); }}><strong>15 min</strong><span>Dia corrido</span></button>
                  <button className={plannedMinutes === 40 ? "selected" : ""} onClick={() => { setPlannedMinutes(40); setView("study"); }}><strong>40 min</strong><span>Rotina normal</span></button>
                  <button className={plannedMinutes === 90 ? "selected" : ""} onClick={() => { setPlannedMinutes(90); setView("study"); }}><strong>90 min</strong><span>Bloco de fim de semana</span></button>
                </div>
                <div className="plan-tip"><span>✦</span><p><strong>Constância vale mais que maratonas.</strong><br />Uma sessão curta com atenção e exercícios é melhor do que tentar compensar vários dias de uma vez.</p></div>
                <button className="button button-primary button-wide" onClick={startDiagnostic}>Começar pelo diagnóstico</button>
              </div>
            </div>
          </section>
        )}

        {view === "study" && (
          <section className="content-section">
            <div className="page-heading"><span className="eyebrow">ANEXO III · EDITAL 001/2026</span><h1>Sala de estudos</h1><p className="muted">Aulas organizadas pelo edital, com explicações desde o básico, exemplos e atividades de fixação.</p></div>
            <div className="study-weight-note"><strong>Bloco selecionado: {plannedMinutes} minutos</strong><span>Abra uma aula e inicie o cronômetro. O tempo só será registrado quando salvar a sessão.</span></div>
            <div className="study-subject-grid">
              {subjectRows.map((row) => {
                const subject = row.subjects || {};
                const topics = row.topics || [];
                const studied = topics.filter((topic) => completedTopicIds.has(topic.id)).length;
                const open = expandedSubject === row.id;
                return (
                  <article className={open ? "subject-card expanded" : "subject-card"} key={row.id}>
                    <button className="subject-card-head" onClick={() => setExpandedSubject(open ? null : row.id)}>
                      <span className="subject-icon">{SUBJECT_ICONS[subject.slug] || "•"}</span>
                      <span className="subject-title-wrap"><strong>{subject.name}</strong><small>{row.question_count} questões · {row.total_points || row.question_count} pontos em 2026</small></span>
                      <span className="subject-progress-text">{studied}/{topics.length}</span><span className="chevron">{open ? "−" : "+"}</span>
                    </button>
                    <div className="subject-progress-track"><span style={{ width: (topics.length ? studied / topics.length * 100 : 0) + "%" }} /></div>
                    {open && <div className="topic-list">
                      {topics.map((topic, index) => (
                        <div className="topic-item" key={topic.id}>
                          <div className="topic-index">{String(index + 1).padStart(2, "0")}</div>
                          <div className="topic-main">
                            <strong>{topic.title}</strong>
                            <p>{topic.syllabus_text}</p>
                            <div className="topic-meta">
                              <span>{topic.estimated_minutes} min de referência</span>
                              <span className={"priority priority-" + topic.priority}>{PRIORITY_LABELS[topic.priority] || "Importante"}</span>
                              <span className={completedTopicIds.has(topic.id) ? "topic-status complete" : inProgressTopicIds.has(topic.id) ? "topic-status active" : "topic-status"}>
                                {completedTopicIds.has(topic.id) ? "Concluído" : inProgressTopicIds.has(topic.id) ? "Em andamento" : "Não iniciado"}
                              </span>
                            </div>
                          </div>
                          <button className="button button-secondary topic-open-button" onClick={() => openLesson(topic)}>
                            Abrir aula →
                          </button>
                        </div>
                      ))}
                    </div>}
                  </article>
                );
              })}
            </div>
            {selectedTopic && (
              <TopicLessonPanel
                topic={selectedTopic}
                lesson={selectedLesson}
                progress={topicProgressById.get(selectedTopic.id)}
                plannedMinutes={plannedMinutes}
                activeSession={activeSession}
                elapsedSeconds={elapsedSeconds}
                busy={busy}
                onStart={() => startTopicSession(selectedTopic)}
                onFinish={(complete) => finishTopicSession(complete)}
                onCancel={cancelTopicSession}
                onAskTutor={() => { setTutorTopicId(selectedTopic.id); setView("tutor"); }}
                onClose={() => setSelectedTopic(null)}
              />
            )}
          </section>
        )}

        {view === "tutor" && (
          <section className="content-section tutor-view">
            <div className="page-heading">
              <span className="eyebrow">TUTOR DE ESTUDOS · SBMG 2026</span>
              <h1>Professor IA</h1>
              <p className="muted">Tire dúvidas sobre a aula selecionada. O tutor usa o conteúdo do tópico e explica desde o básico.</p>
            </div>
            <div className="tutor-layout">
              <aside className="panel tutor-context">
                <span className="eyebrow">CONTEXTO DA DÚVIDA</span>
                <label className="tutor-select-label" htmlFor="tutor-topic-select">Tópico do edital</label>
                <select id="tutor-topic-select" className="tutor-topic-select" value={tutorTopicId} onChange={(event) => { setTutorTopicId(event.target.value); setTutorMessages([]); setTutorError(""); }}>
                  <option value="">Selecione um tópico</option>
                  {subjectRows.map((row) => (
                    <optgroup key={row.id} label={row.subjects?.name || "Disciplina"}>
                      {(row.topics || []).map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                    </optgroup>
                  ))}
                </select>
                <p className="muted small-copy">O professor recebe o texto da aula selecionada para manter as explicações alinhadas ao edital.</p>
                {tutorRemaining !== null && <div className="tutor-limit"><strong>{tutorRemaining}</strong><span>perguntas restantes hoje</span></div>}
                <div className="plan-tip"><span>✦</span><p><strong>Como estudar com o tutor</strong><br />Peça uma explicação, solicite outro exemplo ou peça uma pergunta curta para conferir se entendeu.</p></div>
              </aside>
              <div className="panel tutor-chat">
                <div className="tutor-chat-head">
                  <div className="tutor-avatar">✦</div>
                  <div><strong>Professor IA</strong><small>{allTopics.find((topic) => topic.id === tutorTopicId)?.title || "Aguardando tópico selecionado"}</small></div>
                  <span className="tutor-status">Aulas do edital</span>
                </div>
                <div className="tutor-messages">
                  {tutorMessages.length === 0 && (
                    <div className="tutor-empty">
                      <div className="tutor-empty-icon">✦</div>
                      <h2>Vamos aprender passo a passo.</h2>
                      <p>Selecione um tópico e envie sua primeira dúvida. O professor pode explicar de outra forma, montar exemplos e propor exercícios.</p>
                      <div className="tutor-prompts">
                        {["Explique esse assunto desde o começo.", "Dê um exemplo prático relacionado ao cargo.", "Faça uma pergunta para testar meu entendimento."].map((prompt) => (
                          <button key={prompt} onClick={() => setTutorDraft(prompt)}>{prompt}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {tutorMessages.map((item, index) => (
                    <div className={item.role === "user" ? "tutor-message user" : "tutor-message assistant"} key={index}>
                      <span>{item.role === "user" ? "Você" : "Professor IA"}</span>
                      <p>{item.content}</p>
                    </div>
                  ))}
                  {tutorBusy && <div className="tutor-typing"><span /><span /><span /> Professor está preparando a explicação...</div>}
                </div>
                {tutorError && <div className="notice notice-error tutor-error">{tutorError}</div>}
                <form className="tutor-composer" onSubmit={(event) => { event.preventDefault(); sendTutorMessage(); }}>
                  <textarea value={tutorDraft} onChange={(event) => setTutorDraft(event.target.value)} placeholder="Escreva sua dúvida sobre o tópico selecionado..." rows={3} maxLength={1800} disabled={tutorBusy} />
                  <div><small className="muted">{tutorDraft.length}/1800 caracteres · O histórico fica nesta sessão do navegador.</small><button className="button button-primary" type="submit" disabled={tutorBusy || !tutorDraft.trim() || !tutorTopicId}>{tutorBusy ? "Consultando..." : "Enviar pergunta"} →</button></div>
                </form>
              </div>
            </div>
          </section>
        )}

        {view === "diagnostic" && currentQuestion && (
          <section className="content-section quiz-section">
            <div className="quiz-topline"><button className="back-button" onClick={leaveDiagnostic}>← Sair do diagnóstico</button><span>DIAGNÓSTICO INICIAL · QUESTÕES AUTORAIS</span><strong>{quizIndex + 1} <small>/ {quizQuestions.length}</small></strong></div>
            <div className="quiz-progress"><span style={{ width: ((quizIndex + (feedback ? 1 : 0)) / quizQuestions.length * 100) + "%" }} /></div>
            <div className="quiz-card">
              <div className="quiz-meta"><span className="eyebrow">{getSubjectName(subjectRows, currentQuestion.exam_subject_id)}</span><span className={"difficulty difficulty-" + currentQuestion.difficulty}>{currentQuestion.difficulty}</span></div>
              <h1>{currentQuestion.statement}</h1>
              <div className="option-list">
                {(currentQuestion.options || []).map((option) => {
                  const isSelected = selectedOption === option.id;
                  const stateClass = feedback && option.id === feedback.correct_option ? "option correct" : feedback && isSelected && !feedback.correct ? "option incorrect" : isSelected ? "option selected" : "option";
                  return <button key={option.id} className={stateClass} disabled={Boolean(feedback)} onClick={() => setSelectedOption(option.id)}><span className="option-letter">{option.id}</span><span>{option.text}</span>{feedback && option.id === feedback.correct_option && <b>✓</b>}</button>;
                })}
              </div>
              {feedback && <div className={feedback.correct ? "answer-feedback good" : "answer-feedback bad"}><strong>{feedback.correct ? "Muito bem! Resposta correta." : "Resposta incorreta. Alternativa " + feedback.correct_option + "."}</strong><p>{feedback.explanation}</p></div>}
              <div className="quiz-actions"><span className="muted small-copy">Valor desta questão: {currentQuestion.points || 1} {(currentQuestion.points || 1) === 1 ? "ponto" : "pontos"}</span>{!feedback ? <button className="button button-primary" disabled={!selectedOption || busy} onClick={submitAnswer}>{busy ? "Corrigindo..." : "Confirmar resposta"}</button> : <button className="button button-primary" onClick={nextQuestion}>{quizIndex === quizQuestions.length - 1 ? "Ver resultado" : "Próxima questão"} →</button>}</div>
            </div>
          </section>
        )}

        {view === "diagnostic" && !currentQuestion && (
          <section className="content-section"><div className="empty-state"><h2>Diagnóstico inicial</h2><p>O objetivo é identificar o que você já domina e o que precisa estudar desde o começo.</p><button className="button button-primary" onClick={startDiagnostic}>Iniciar diagnóstico</button></div></section>
        )}

        {view === "results" && quizResult && (
          <section className="content-section">
            <div className="result-hero"><span className="eyebrow eyebrow-light">DIAGNÓSTICO CONCLUÍDO</span><div className="result-score">{quizResult.score.toFixed(1).replace(".", ",")}<small>/100</small></div><h1>Seu ponto de partida está registrado.</h1><p>O resultado é diagnóstico, não uma previsão de aprovação. Use-o para direcionar os próximos estudos.</p></div>
            <div className="stat-grid result-stats"><StatCard label="Acertos" value={quizResult.correct + "/" + quizResult.total} helper="Questões respondidas" icon="✓" /><StatCard label="Nota ponderada" value={quizResult.score.toFixed(1).replace(".", ",")} helper="Escala normalizada de 0 a 100" icon="∑" /><StatCard label="Tempo utilizado" value={quizResult.minutes + " min"} helper="Duração aproximada" icon="◷" /><StatCard label="Próximo passo" value="Reforço" helper="Estudar os tópicos com erros" icon="↗" /></div>
            <div className="panel result-next"><div><span className="eyebrow">RECOMENDAÇÃO</span><h2>Agora vamos transformar os erros em plano.</h2><p className="muted">Revise as explicações, abra a Sala de Estudos e avance pelos tópicos fundamentais. O sistema já salvou as respostas para acompanhar sua evolução.</p></div><button className="button button-primary" onClick={() => setView("study")}>Ir para sala de estudos →</button></div>
          </section>
        )}

        {view === "performance" && (
          <section className="content-section">
            <div className="page-heading"><span className="eyebrow">ACOMPANHAMENTO</span><h1>Meu desempenho</h1><p className="muted">Seus registros de estudo e questões respondidas ficam salvos na sua conta.</p></div>
            <div className="stat-grid"><StatCard label="Aproveitamento" value={accuracy + "%"} helper={correctAnswers + " acertos em " + attempts.length + " respostas"} icon="↗" /><StatCard label="Tópicos estudados" value={String(completedTopics)} helper={"De " + allTopics.length + " tópicos cadastrados"} icon="▤" /><StatCard label="Horas acumuladas" value={(totalStudyMinutes / 60).toFixed(1).replace(".", ",") + "h"} helper="Sessões registradas" icon="◷" /><StatCard label="Questões" value={String(attempts.length)} helper="Tentativas registradas" icon="✓" /></div>
            <div className="panel performance-panel"><h2>Progresso do edital</h2>{subjectRows.map((row) => { const topics = row.topics || []; const done = topics.filter((topic) => completedTopicIds.has(topic.id)).length; const pct = topics.length ? Math.round(done / topics.length * 100) : 0; return <div className="performance-row" key={row.id}><div><strong>{row.subjects?.name}</strong><span>{done} de {topics.length} tópicos</span></div><div className="wide-progress"><span style={{ width: pct + "%" }} /></div><b>{pct}%</b></div>; })}</div>
          </section>
        )}
        <footer className="app-footer"><span>APROVA · SBMG 2026</span><span>Conteúdo organizado a partir do edital de abertura. Questões autorais identificadas.</span></footer>
      </main>
    </div>
  );
}
