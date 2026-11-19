import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ESSAY_COURSE, ESSAY_MODEL_TEXT, ESSAY_RUBRIC } from "./data/essayCourse";

const EXAM_SLUG = "sbmg-2026-auxiliar-administrativo-financeiro";
const EXAM_DAY = "2027-01-24";
const NAV_ITEMS = [
  { id: "dashboard", icon: "⌂", label: "Visão geral" },
  { id: "study", icon: "▤", label: "Sala de estudos" },
  { id: "tutor", icon: "✦", label: "Professor IA" },
  { id: "simulations", icon: "▧", label: "Simulados" },
  { id: "essay", icon: "✎", label: "Redação" },
  { id: "reviews", icon: "↻", label: "Revisões" },
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

function TopicLessonPanel({ topic, lesson, progress, plannedMinutes, activeSession, elapsedSeconds, busy, onStart, onFinish, onMarkComplete, onCancel, onAskTutor, onClose }) {
  const [completionMode, setCompletionMode] = useState(null);
  const content = lesson?.content || {};
  const hasActiveSession = activeSession?.kind === "topico" && activeSession?.topicId === topic.id;
  const anotherSessionActive = Boolean(activeSession) && !hasActiveSession;
  const completed = progress?.status === "concluido";
  const inProgress = progress?.status === "em_andamento";

  function confirmAction() {
    const mode = completionMode;
    setCompletionMode(null);
    if (mode === "start") onStart();
    if (mode === "session") onFinish(true);
    if (mode === "topic") onMarkComplete();
  }

  return (
    <section className="lesson-panel" id="topic-lesson">
      <div className="lesson-panel-head">
        <div>
          <span className="eyebrow">AULA DO EDITAL · {lesson?.source_basis || "Anexo III"}</span>
          <h2>{topic.title}</h2>
          <p className="muted">{content.introduction || "O conteúdo desta aula está sendo preparado."}</p>
        </div>
        <button className="icon-button lesson-close" onClick={onClose} title="Fechar aula" aria-label="Fechar aula">×</button>
      </div>
      <div className="lesson-open-safety-note">
        <strong>Visualização da aula</strong>
        <span>Abrir ou fechar esta tela não altera seu progresso. O registro só muda quando você escolhe iniciar ou concluir.</span>
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
        <div className="lesson-progress-copy">
          <span className="eyebrow">SEU PROGRESSO</span>
          <strong>{completed ? "Tópico concluído" : inProgress ? "Em andamento" : "Ainda não iniciado"}</strong>
          <small>Bloco planejado: {plannedMinutes} min</small>
        </div>
        <div className="lesson-tutor-action"><button className="button button-secondary" onClick={onAskTutor}>Tirar dúvida com o Professor IA</button></div>
        {hasActiveSession ? (
          <div className="lesson-timer-controls">
            <div className="lesson-timer"><span className="session-live-dot" />{formatElapsed(elapsedSeconds)}</div>
            <button className="button button-secondary" onClick={() => onFinish(false)} disabled={busy}>Salvar sessão (sem concluir)</button>
            <button className="button button-primary" onClick={() => setCompletionMode("session")} disabled={busy}>Finalizar e concluir tópico</button>
            <button className="text-button" onClick={onCancel}>Cancelar sessão sem salvar</button>
          </div>
        ) : (
          <div className="lesson-timer-controls">
            <button className="button button-primary" onClick={() => setCompletionMode("start")} disabled={busy || anotherSessionActive || !lesson}>
              {anotherSessionActive ? "Finalize a sessão atual" : completed ? "Iniciar revisão cronometrada" : inProgress ? "Retomar estudo" : "Iniciar estudo"}
            </button>
            {inProgress && !anotherSessionActive && (
              <button className="button button-secondary" onClick={() => setCompletionMode("topic")} disabled={busy}>Marcar tópico como concluído</button>
            )}
            {completed && <span className="lesson-completed-hint">✓ Concluído. Você pode iniciar uma sessão de revisão sem perder o histórico.</span>}
            <small className="muted">O cronômetro só começa quando você clicar em iniciar. Salvar uma sessão registra o tempo, mas não conclui o tópico.</small>
          </div>
        )}
      </div>

      {completionMode && (
        <div className="lesson-confirm-backdrop" role="presentation">
          <div className="lesson-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="topic-confirm-title">
            <span className="eyebrow">CONFIRMAÇÃO NECESSÁRIA</span>
            <h3 id="topic-confirm-title">{completionMode === "start" ? "Iniciar este estudo?" : "Concluir este tópico?"}</h3>
            <p>{completionMode === "start"
              ? "Ao confirmar, o tópico será marcado como “Em andamento” e o cronômetro começará agora."
              : completionMode === "session"
                ? "Esta ação vai salvar o tempo da sessão atual e marcar o tópico como concluído."
                : "Esta ação vai marcar o tópico como concluído. Nenhum tempo adicional será registrado."}</p>
            <p className="lesson-confirm-warning">{completionMode === "start"
              ? "Confirme somente quando estiver pronto para estudar. Abrir a aula não inicia o cronômetro."
              : "Só confirme se terminou o conteúdo. Você pode continuar apenas visualizando a aula sem concluir."}</p>
            <div className="lesson-confirm-actions">
              <button className="button button-secondary" onClick={() => setCompletionMode(null)}>Não, voltar</button>
              <button className="button button-primary" onClick={confirmAction} disabled={busy}>
                {completionMode === "start" ? "Sim, iniciar estudo" : "Sim, concluir tópico"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function EssayExerciseCard({ lesson, progress, onAnswer, disabled = false }) {
  const chosen = progress?.exercise_answers?.selected_option;
  const answered = Number.isInteger(chosen);
  const correct = answered && chosen === lesson.exercise.correctIndex;
  return (
    <section className="essay-exercise-card">
      <div className="essay-exercise-head">
        <span className="eyebrow">EXERCÍCIO · AULA {String(lesson.number).padStart(2, "0")}</span>
        {answered && <span className={correct ? "essay-exercise-status correct" : "essay-exercise-status incorrect"}>{correct ? "Acertou" : "Revise"}</span>}
      </div>
      <h3>{lesson.exercise.prompt}</h3>
      <div className="essay-exercise-options">
        {lesson.exercise.options.map((option, index) => {
          const selected = answered && chosen === index;
          const isAnswer = index === lesson.exercise.correctIndex;
          const statusClass = answered && isAnswer ? " correct" : selected && !correct ? " incorrect" : "";
          return (
            <button key={index} className={"essay-exercise-option" + (selected ? " selected" : "") + statusClass} onClick={() => onAnswer(lesson, index)} disabled={disabled}>
              <span>{String.fromCharCode(65 + index)}</span><span>{option}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={correct ? "essay-exercise-feedback correct" : "essay-exercise-feedback incorrect"}>
          <strong>{correct ? "Resposta correta." : "Ainda não. Veja a explicação:"}</strong>
          <p>{lesson.exercise.explanation}</p>
        </div>
      )}
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

const ESSAY_PROMPTS = [
  { id: "transporte-regional", title: "A importância do transporte regional para a integração econômica e social", prompt: "Redija um texto dissertativo-argumentativo sobre a importância do transporte regional para a integração econômica e social, considerando acesso a serviços, desenvolvimento e desafios de infraestrutura." },
  { id: "tecnologia-servicos", title: "O uso responsável da tecnologia na melhoria dos serviços públicos", prompt: "Redija um texto dissertativo-argumentativo sobre como a tecnologia pode melhorar os serviços públicos, considerando eficiência, segurança da informação e inclusão digital." },
  { id: "sustentabilidade", title: "Responsabilidade ambiental e gestão adequada de resíduos", prompt: "Redija um texto dissertativo-argumentativo sobre a responsabilidade ambiental nas organizações, considerando redução de desperdícios, gestão de resíduos e participação social." },
  { id: "etica-transparencia", title: "Ética, transparência e confiança nas instituições", prompt: "Redija um texto dissertativo-argumentativo sobre a relação entre ética, transparência e confiança nas instituições, considerando integridade, prestação de contas e interesse coletivo." },
  { id: "desinformacao", title: "Desinformação e responsabilidade no uso das informações", prompt: "Redija um texto dissertativo-argumentativo sobre os desafios da desinformação na sociedade, considerando educação midiática, responsabilidade individual e qualidade do debate público." },
  { id: "seguranca-coletiva", title: "Prevenção de riscos e segurança em espaços de uso coletivo", prompt: "Redija um texto dissertativo-argumentativo sobre a importância da prevenção de riscos e da segurança em espaços de uso coletivo, considerando planejamento, comunicação e responsabilidade." },
];

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
  const [essaySubmissions, setEssaySubmissions] = useState([]);
  const [essayPromptId, setEssayPromptId] = useState("transporte-regional");
  const [essayText, setEssayText] = useState("");
  const [essayId, setEssayId] = useState(null);
  const [essayStatus, setEssayStatus] = useState("rascunho");
  const [essayBusy, setEssayBusy] = useState(false);
  const [essayNotice, setEssayNotice] = useState("");
  const [essayEvaluation, setEssayEvaluation] = useState(null);
  const [essayLearningProgress, setEssayLearningProgress] = useState([]);
  const [essayLearningTab, setEssayLearningTab] = useState("learn");
  const [activeEssayLessonId, setActiveEssayLessonId] = useState("fundamentos");
  const [essayLearningBusy, setEssayLearningBusy] = useState(false);
  const [essayLearningNotice, setEssayLearningNotice] = useState("");
  const [essayLessonCompletionPending, setEssayLessonCompletionPending] = useState(null);
  const [essayLessonStartPending, setEssayLessonStartPending] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardReviews, setFlashcardReviews] = useState([]);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [flashcardBusy, setFlashcardBusy] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [plannedMinutes, setPlannedMinutes] = useState(40);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lessonSessionBusy, setLessonSessionBusy] = useState(false);
  const diagnosticStartLock = useRef(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizMode, setQuizMode] = useState("diagnostico");
  const [quizRunId, setQuizRunId] = useState(null);
  const [quizElapsedSeconds, setQuizElapsedSeconds] = useState(0);
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
    if (view !== "diagnostic" && view !== "simulation") {
      setQuizElapsedSeconds(0);
      return undefined;
    }
    if (!quizStartedAt) {
      setQuizElapsedSeconds(0);
      return undefined;
    }
    const updateQuizElapsed = () => setQuizElapsedSeconds(Math.max(0, Math.floor((Date.now() - quizStartedAt) / 1000)));
    updateQuizElapsed();
    const interval = window.setInterval(updateQuizElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [view, quizStartedAt]);

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

      const { data: activeLessonSessionData, error: activeLessonSessionError } = await supabase.from("lesson_study_sessions")
        .select("id, lesson_type, topic_id, essay_lesson_id, lesson_title, started_at")
        .eq("user_id", currentUser.id).eq("status", "em_andamento").maybeSingle();
      if (activeLessonSessionError) throw activeLessonSessionError;

      const { data: essayData, error: essayError } = await supabase.from("essay_submissions")
        .select("id, prompt, text_content, line_count, score_adequacy, score_content, score_coherence, score_language, score_total, ai_feedback, status, created_at, ai_model")
        .eq("user_id", currentUser.id).order("created_at", { ascending: false });
      if (essayError) throw essayError;

      const { data: essayLearningData, error: essayLearningError } = await supabase.from("essay_learning_progress")
        .select("lesson_id, exercise_answers, completed, status, started_at, last_activity_at, completed_at")
        .eq("user_id", currentUser.id);
      if (essayLearningError) throw essayLearningError;

      const { data: flashcardData, error: flashcardError } = await supabase.from("flashcards")
        .select("id, topic_id, front, back, difficulty")
        .eq("is_published", true);
      if (flashcardError) throw flashcardError;

      const { data: flashcardReviewData, error: flashcardReviewError } = await supabase.from("flashcard_reviews")
        .select("id, flashcard_id, confidence, reviewed_at, next_review_at")
        .eq("user_id", currentUser.id).order("reviewed_at", { ascending: true });
      if (flashcardReviewError) throw flashcardReviewError;

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
      if (activeLessonSessionData) {
        const restoredSession = {
          id: activeLessonSessionData.id,
          kind: activeLessonSessionData.lesson_type,
          topicId: activeLessonSessionData.topic_id,
          essayLessonId: activeLessonSessionData.essay_lesson_id,
          lessonTitle: activeLessonSessionData.lesson_title,
          topicTitle: activeLessonSessionData.lesson_title,
          startedAt: new Date(activeLessonSessionData.started_at).getTime(),
        };
        setActiveSession(restoredSession);
        if (restoredSession.kind === "topico") {
          const restoredTopic = (subjectsData || []).flatMap((row) => row.topics || []).find((topic) => topic.id === restoredSession.topicId);
          if (restoredTopic) setSelectedTopic(restoredTopic);
          setView("study");
        } else if (restoredSession.kind === "redacao") {
          setActiveEssayLessonId(restoredSession.essayLessonId);
          setEssayLearningTab("learn");
          setEssayLessonStartPending(null);
          setView("essay");
        }
      } else {
        setActiveSession(null);
      }
      setEssaySubmissions(essayData || []);
      setEssayLearningProgress(essayLearningData || []);
      setFlashcards(flashcardData || []);
      setFlashcardReviews(flashcardReviewData || []);
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
  const currentEssayPrompt = ESSAY_PROMPTS.find((item) => item.id === essayPromptId) || ESSAY_PROMPTS[0];
  const essayLessonProgressById = useMemo(() => new Map(essayLearningProgress.map((item) => [item.lesson_id, item])), [essayLearningProgress]);
  const activeEssayLesson = ESSAY_COURSE.find((item) => item.id === activeEssayLessonId) || ESSAY_COURSE[0];
  const activeEssayProgress = essayLessonProgressById.get(activeEssayLesson.id);
  const activeEssayStatus = activeEssayProgress?.status || (activeEssayProgress?.completed ? "concluida" : "nao_iniciada");
  const activeEssaySession = activeSession?.kind === "redacao" && activeSession.essayLessonId === activeEssayLesson.id;
  const anotherLessonSessionActive = Boolean(activeSession) && !activeEssaySession;
  const completedEssayLessons = essayLearningProgress.filter((item) => item.status === "concluida" || item.completed).length;
  const essayLearningPercent = Math.round((completedEssayLessons / ESSAY_COURSE.length) * 100);
  const essayLineCount = essayText.trim() ? essayText.trim().split(/\r?\n/).length : 0;
  const latestFlashcardReviewById = useMemo(() => {
    const map = new Map();
    [...flashcardReviews]
      .sort((a, b) => new Date(a.reviewed_at) - new Date(b.reviewed_at))
      .forEach((item) => map.set(item.flashcard_id, item));
    return map;
  }, [flashcardReviews]);
  const dueFlashcards = useMemo(() => {
    const now = Date.now();
    return flashcards.filter((card) => {
      const latest = latestFlashcardReviewById.get(card.id);
      return !latest || !latest.next_review_at || new Date(latest.next_review_at).getTime() <= now;
    });
  }, [flashcards, latestFlashcardReviewById]);
  const currentDueFlashcard = dueFlashcards[0] || null;
  const correctAnswers = attempts.filter((item) => item.is_correct).length;
  const accuracy = attempts.length ? Math.round((correctAnswers / attempts.length) * 100) : 0;
  const daysLeft = daysUntilExam();
  const currentQuestion = quizQuestions[quizIndex];

  function openLesson(topic) {
    if (activeSession && !(activeSession.kind === "topico" && activeSession.topicId === topic.id)) {
      setNotice("Finalize ou cancele a sessão atual antes de abrir outra aula.");
      return;
    }
    setSelectedTopic(topic);
    setNotice("");
  }

  async function startTopicSession(topic) {
    if (!user || activeSession || lessonSessionBusy) return;
    setLessonSessionBusy(true);
    const startedAt = new Date();
    const startedAtIso = startedAt.toISOString();
    let createdSession = null;
    try {
      const { data: sessionRow, error: sessionError } = await supabase.from("lesson_study_sessions")
        .insert({
          user_id: user.id,
          lesson_type: "topico",
          topic_id: topic.id,
          essay_lesson_id: null,
          lesson_title: topic.title,
          status: "em_andamento",
          started_at: startedAtIso,
        })
        .select("id, started_at")
        .single();
      if (sessionError) throw sessionError;
      createdSession = sessionRow;

      const existing = topicProgressById.get(topic.id);
      const nextStatus = existing?.status === "concluido" ? "concluido" : "em_andamento";
      const { error: progressError } = await supabase.from("topic_progress").upsert({
        user_id: user.id,
        topic_id: topic.id,
        status: nextStatus,
        started_at: existing?.started_at || startedAtIso,
        completed_at: existing?.completed_at || null,
        last_studied_at: existing?.last_studied_at || null,
        updated_at: startedAtIso,
      }, { onConflict: "user_id,topic_id" });
      if (progressError) {
        await supabase.from("lesson_study_sessions").update({
          status: "cancelada",
          ended_at: new Date().toISOString(),
          duration_seconds: 0,
        }).eq("id", sessionRow.id).eq("user_id", user.id);
        throw progressError;
      }

      setTopicProgressRows((previous) => [
        ...previous.filter((item) => item.topic_id !== topic.id),
        {
          ...existing,
          topic_id: topic.id,
          status: nextStatus,
          started_at: existing?.started_at || startedAtIso,
          completed_at: existing?.completed_at || null,
          last_studied_at: existing?.last_studied_at || null,
          updated_at: startedAtIso,
        },
      ]);
      setActiveSession({
        id: sessionRow.id,
        kind: "topico",
        topicId: topic.id,
        essayLessonId: null,
        topicTitle: topic.title,
        lessonTitle: topic.title,
        method: "teoria",
        startedAt: new Date(sessionRow.started_at).getTime(),
        plannedMinutes,
      });
      setNotice("Estudo iniciado. O cronômetro está vinculado somente a este tópico.");
    } catch (error) {
      setNotice(error.message || "Não foi possível iniciar este tópico.");
    } finally {
      setLessonSessionBusy(false);
    }
  }

  async function finishTopicSession(markCompleted = false) {
    if (!user || !activeSession || activeSession.kind !== "topico" || lessonSessionBusy) return;
    const currentSession = activeSession;
    const seconds = Math.max(0, Math.floor((Date.now() - currentSession.startedAt) / 1000));
    if (seconds < 1) {
      setNotice("A sessão precisa ter pelo menos um segundo para ser registrada.");
      return;
    }
    setLessonSessionBusy(true);
    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    try {
      const { error: exactSessionError } = await supabase.from("lesson_study_sessions").update({
        status: "salva",
        ended_at: finishedAt,
        duration_seconds: seconds,
      }).eq("id", currentSession.id).eq("user_id", user.id).eq("status", "em_andamento");
      if (exactSessionError) throw exactSessionError;

      const { error: historyError } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        topic_id: currentSession.topicId,
        duration_minutes: durationMinutes,
        study_method: currentSession.method || "teoria",
        studied_at: new Date(currentSession.startedAt).toISOString(),
        notes: "Aula: " + currentSession.lessonTitle + " · tempo exato: " + formatElapsed(seconds),
      });

      const existing = topicProgressById.get(currentSession.topicId);
      const nextStatus = markCompleted ? "concluido" : (existing?.status === "concluido" ? "concluido" : "em_andamento");
      const { error: progressError } = await supabase.from("topic_progress").upsert({
        user_id: user.id,
        topic_id: currentSession.topicId,
        status: nextStatus,
        started_at: existing?.started_at || new Date(currentSession.startedAt).toISOString(),
        completed_at: markCompleted ? finishedAt : (existing?.completed_at || null),
        last_studied_at: finishedAt,
        updated_at: finishedAt,
      }, { onConflict: "user_id,topic_id" });

      setActiveSession(null);
      if (progressError) {
        setNotice("A sessão foi registrada, mas não foi possível atualizar o progresso: " + progressError.message);
      } else if (historyError) {
        setNotice("Tempo exato salvo para esta aula. O resumo geral não foi atualizado: " + historyError.message);
      } else {
        setNotice(markCompleted
          ? "Sessão salva e tópico concluído."
          : "Sessão salva: " + formatElapsed(seconds) + ". O tópico continua em andamento.");
      }
      await loadDashboard(user);
    } catch (error) {
      setNotice(error.message || "Não foi possível salvar a sessão. Ela continua em andamento.");
    } finally {
      setLessonSessionBusy(false);
    }
  }

  async function cancelTopicSession() {
    if (!user || !activeSession || activeSession.kind !== "topico" || lessonSessionBusy) return;
    setLessonSessionBusy(true);
    try {
      const { error } = await supabase.from("lesson_study_sessions").update({
        status: "cancelada",
        ended_at: new Date().toISOString(),
        duration_seconds: 0,
      }).eq("id", activeSession.id).eq("user_id", user.id).eq("status", "em_andamento");
      if (error) throw error;
      setActiveSession(null);
      setElapsedSeconds(0);
      setNotice("Sessão cancelada. Nenhum tempo foi registrado.");
    } catch (error) {
      setNotice(error.message || "Não foi possível cancelar a sessão.");
    } finally {
      setLessonSessionBusy(false);
    }
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


  async function saveEssayLearningProgress(lessonId, patch) {
    if (!user || essayLearningBusy) return false;
    const existing = essayLessonProgressById.get(lessonId);
    const now = new Date().toISOString();
    const nextStatus = patch.status
      || (patch.completed === true ? "concluida" : patch.completed === false ? "nao_iniciada" : existing?.status || (existing?.completed ? "concluida" : "nao_iniciada"));
    const nextRow = {
      user_id: user.id,
      lesson_id: lessonId,
      exercise_answers: patch.exercise_answers ?? existing?.exercise_answers ?? {},
      completed: nextStatus === "concluida",
      status: nextStatus,
      started_at: patch.started_at ?? existing?.started_at ?? (nextStatus !== "nao_iniciada" ? now : null),
      last_activity_at: now,
      completed_at: nextStatus === "concluida"
        ? (existing?.completed_at || now)
        : null,
      updated_at: now,
    };

    setEssayLearningBusy(true);
    setEssayLearningNotice("");
    try {
      const { data, error } = await supabase.from("essay_learning_progress")
        .upsert(nextRow, { onConflict: "user_id,lesson_id" })
        .select("lesson_id, exercise_answers, completed, status, started_at, last_activity_at, completed_at")
        .single();
      if (error) throw error;
      setEssayLearningProgress((previous) => [
        ...previous.filter((item) => item.lesson_id !== lessonId),
        data,
      ]);
      setEssayLearningNotice(nextStatus === "concluida"
        ? "Aula concluída. Seu progresso foi salvo."
        : nextStatus === "em_andamento"
          ? "Aula iniciada. Seu progresso foi salvo."
          : patch.exercise_answers
            ? "Resposta salva no seu progresso."
            : "Progresso salvo.");
      return true;
    } catch (error) {
      setEssayLearningNotice(error.message || "Não foi possível salvar seu progresso. Tente novamente.");
      return false;
    } finally {
      setEssayLearningBusy(false);
    }
  }

  async function startEssayLesson(lessonId) {
    if (!user || activeSession || lessonSessionBusy) return;
    const lesson = ESSAY_COURSE.find((item) => item.id === lessonId);
    if (!lesson) return;
    const existing = essayLessonProgressById.get(lessonId);
    const startedAt = new Date();
    const startedAtIso = startedAt.toISOString();
    setLessonSessionBusy(true);
    try {
      const { data: sessionRow, error: sessionError } = await supabase.from("lesson_study_sessions")
        .insert({
          user_id: user.id,
          lesson_type: "redacao",
          topic_id: null,
          essay_lesson_id: lesson.id,
          lesson_title: lesson.title,
          status: "em_andamento",
          started_at: startedAtIso,
        })
        .select("id, started_at")
        .single();
      if (sessionError) throw sessionError;

      if (existing?.status !== "concluida" && existing?.completed !== true) {
        const progressSaved = await saveEssayLearningProgress(lessonId, {
          status: "em_andamento",
          started_at: existing?.started_at || startedAtIso,
        });
        if (!progressSaved) {
          await supabase.from("lesson_study_sessions").update({
            status: "cancelada",
            ended_at: new Date().toISOString(),
            duration_seconds: 0,
          }).eq("id", sessionRow.id).eq("user_id", user.id);
          throw new Error("Não foi possível registrar o início da aula. Tente novamente.");
        }
      }

      setActiveSession({
        id: sessionRow.id,
        kind: "redacao",
        topicId: null,
        essayLessonId: lesson.id,
        topicTitle: lesson.title,
        lessonTitle: lesson.title,
        method: "redacao",
        startedAt: new Date(sessionRow.started_at).getTime(),
      });
      setEssayLearningNotice(existing?.status === "concluida" || existing?.completed
        ? "Revisão iniciada. O tempo será registrado separadamente nesta aula."
        : "Aula iniciada. O cronômetro está vinculado somente a esta aula.");
    } catch (error) {
      setEssayLearningNotice(error.message || "Não foi possível iniciar esta aula.");
    } finally {
      setLessonSessionBusy(false);
    }
  }

  async function finishEssayLessonSession(markCompleted = false) {
    if (!user || !activeSession || activeSession.kind !== "redacao" || lessonSessionBusy) return;
    const currentSession = activeSession;
    const seconds = Math.max(0, Math.floor((Date.now() - currentSession.startedAt) / 1000));
    if (seconds < 1) {
      setEssayLearningNotice("A sessão precisa ter pelo menos um segundo para ser registrada.");
      return;
    }
    setLessonSessionBusy(true);
    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    try {
      const { error: exactSessionError } = await supabase.from("lesson_study_sessions").update({
        status: "salva",
        ended_at: finishedAt,
        duration_seconds: seconds,
      }).eq("id", currentSession.id).eq("user_id", user.id).eq("status", "em_andamento");
      if (exactSessionError) throw exactSessionError;

      const { error: historyError } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        topic_id: null,
        duration_minutes: durationMinutes,
        study_method: "redacao",
        studied_at: new Date(currentSession.startedAt).toISOString(),
        notes: "Aula de redação: " + currentSession.lessonTitle + " · tempo exato: " + formatElapsed(seconds),
      });

      let progressError = null;
      if (markCompleted) {
        const saved = await saveEssayLearningProgress(currentSession.essayLessonId, { status: "concluida" });
        if (!saved) progressError = new Error("A sessão foi salva, mas não foi possível concluir a aula. Tente novamente.");
      }

      setActiveSession(null);
      if (progressError) {
        setEssayLearningNotice(progressError.message);
      } else if (historyError) {
        setEssayLearningNotice("Tempo exato salvo para esta aula. O resumo geral não foi atualizado: " + historyError.message);
      } else {
        setEssayLearningNotice(markCompleted
          ? "Aula concluída. Sessão de " + formatElapsed(seconds) + " salva."
          : "Sessão de " + formatElapsed(seconds) + " salva. A aula continua disponível para retomar.");
      }
      await loadDashboard(user);
    } catch (error) {
      setEssayLearningNotice(error.message || "Não foi possível salvar a sessão. Ela continua em andamento.");
    } finally {
      setLessonSessionBusy(false);
    }
  }

  async function cancelEssayLessonSession() {
    if (!user || !activeSession || activeSession.kind !== "redacao" || lessonSessionBusy) return;
    setLessonSessionBusy(true);
    try {
      const { error } = await supabase.from("lesson_study_sessions").update({
        status: "cancelada",
        ended_at: new Date().toISOString(),
        duration_seconds: 0,
      }).eq("id", activeSession.id).eq("user_id", user.id).eq("status", "em_andamento");
      if (error) throw error;
      setActiveSession(null);
      setElapsedSeconds(0);
      setEssayLearningNotice("Sessão cancelada. Nenhum tempo foi registrado.");
    } catch (error) {
      setEssayLearningNotice(error.message || "Não foi possível cancelar a sessão.");
    } finally {
      setLessonSessionBusy(false);
    }
  }

  async function confirmEssayLessonStart() {
    if (!essayLessonStartPending) return;
    const lessonId = essayLessonStartPending;
    setEssayLessonStartPending(null);
    await startEssayLesson(lessonId);
  }

  async function confirmEssayLessonCompletion() {
    if (!essayLessonCompletionPending) return;
    const lessonId = essayLessonCompletionPending;
    if (activeSession?.kind !== "redacao" || activeSession.essayLessonId !== lessonId) return;
    setEssayLessonCompletionPending(null);
    await finishEssayLessonSession(true);
  }

  async function markTopicCompleted(topic) {
    if (!user) return;
    const existing = topicProgressById.get(topic.id);
    if (existing?.status !== "em_andamento") return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("topic_progress").upsert({
      user_id: user.id,
      topic_id: topic.id,
      status: "concluido",
      started_at: existing.started_at || now,
      completed_at: now,
      last_studied_at: existing.last_studied_at || null,
      updated_at: now,
    }, { onConflict: "user_id,topic_id" });
    if (error) {
      setNotice(error.message || "Não foi possível concluir o tópico.");
      return;
    }
    setNotice("Tópico marcado como concluído. Nenhuma sessão adicional foi registrada.");
    await loadDashboard(user);
  }

  function answerEssayExercise(lesson, selectedOption) {
    const existing = essayLessonProgressById.get(lesson.id);
    return saveEssayLearningProgress(lesson.id, {
      exercise_answers: {
        ...(existing?.exercise_answers || {}),
        selected_option: selectedOption,
      },
    });
  }

  function newEssayDraft() {
    setEssayId(null);
    setEssayStatus("rascunho");
    setEssayPromptId("transporte-regional");
    setEssayText("");
    setEssayEvaluation(null);
    setEssayNotice("");
  }

  function openEssaySubmission(item) {
    setEssayId(item.id);
    setEssayStatus(item.status || "rascunho");
    const prompt = ESSAY_PROMPTS.find((entry) => entry.prompt === item.prompt);
    setEssayPromptId(prompt?.id || "transporte-regional");
    setEssayText(item.text_content || "");
    setEssayEvaluation(item.status === "corrigida"
      ? { ...(item.ai_feedback || {}), total_score: item.score_total }
      : null);
    setEssayNotice("");
  }

  async function persistEssayDraft() {
    if (!user || !exam) return null;
    if (essayStatus === "corrigida") {
      setEssayNotice("Esta redação já foi corrigida. Crie uma nova para fazer outra tentativa.");
      return null;
    }
    if (!essayText.trim()) {
      setEssayNotice("Escreva o texto antes de salvar.");
      return null;
    }
    const lineCount = essayText.trim().split(/\r?\n/).length;
    setEssayBusy(true);
    setEssayNotice("");
    try {
      let savedId = essayId;
      const values = {
        user_id: user.id,
        exam_id: exam.id,
        prompt: currentEssayPrompt.prompt,
        text_content: essayText,
        line_count: lineCount,
      };
      if (savedId) {
        const { error } = await supabase.from("essay_submissions")
          .update({ prompt: values.prompt, text_content: values.text_content, line_count: lineCount })
          .eq("id", savedId).eq("user_id", user.id).eq("status", "rascunho");
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("essay_submissions")
          .insert(values).select("id").single();
        if (error) throw error;
        savedId = data.id;
        setEssayId(savedId);
      }
      setEssayNotice("Rascunho salvo.");
      await loadDashboard(user);
      return savedId;
    } catch (err) {
      setEssayNotice(err.message || "Não foi possível salvar o rascunho.");
      return null;
    } finally {
      setEssayBusy(false);
    }
  }

  async function requestEssayCorrection() {
    if (essayStatus === "corrigida") {
      setEssayNotice("Esta redação já tem correção. Crie uma nova tentativa para solicitar outra avaliação.");
      return;
    }
    if (essayLineCount < 20 || essayLineCount > 30) {
      setEssayNotice("A redação precisa ter de 20 a 30 linhas digitadas antes de solicitar a correção.");
      return;
    }
    const savedId = await persistEssayDraft();
    if (!savedId) return;
    setEssayBusy(true);
    setEssayNotice("Enviando para correção formativa...");
    try {
      const { data, error } = await supabase.functions.invoke("essay-feedback", {
        body: { submission_id: savedId },
      });
      if (error) {
        let detail = error.message || "Serviço indisponível.";
        try {
          const responseBody = await error.context?.json?.();
          if (responseBody?.error) detail = responseBody.error;
        } catch { /* conserva a mensagem genérica */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setEssayEvaluation(data.evaluation);
      setEssayStatus("corrigida");
      setEssayNotice("Correção formativa concluída. Esta não é uma nota oficial da banca.");
      await loadDashboard(user);
    } catch (err) {
      setEssayNotice(err.message || "Não foi possível corrigir esta redação.");
    } finally {
      setEssayBusy(false);
    }
  }

  async function rateFlashcard(confidence) {
    if (!user || !currentDueFlashcard || flashcardBusy) return;
    setFlashcardBusy(true);
    try {
      const reviewedAt = new Date();
      const intervals = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };
      const nextReview = new Date(reviewedAt.getTime() + intervals[confidence] * 86400000);
      const { data, error } = await supabase.from("flashcard_reviews").insert({
        user_id: user.id,
        flashcard_id: currentDueFlashcard.id,
        confidence,
        reviewed_at: reviewedAt.toISOString(),
        next_review_at: nextReview.toISOString(),
      }).select("id, flashcard_id, confidence, reviewed_at, next_review_at").single();
      if (error) throw error;
      setFlashcardReviews((previous) => [...previous, data]);
      setFlashcardRevealed(false);
    } catch (err) {
      setNotice(err.message || "Não foi possível registrar a revisão.");
    } finally {
      setFlashcardBusy(false);
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
    setQuizMode("diagnostico");
    try {
      const { data: bank, error: bankError } = await supabase.from("questions")
        .select("id, exam_subject_id, topic_id, statement, options, difficulty, points, origin")
        .eq("exam_id", exam.id).eq("is_published", true);
      if (bankError) throw bankError;
      if (!bank || bank.length < 22) throw new Error("O banco do diagnóstico ainda está sendo preparado.");

      const sampleCounts = {
        "lingua-portuguesa": 3,
        "matematica-raciocinio-logico": 3,
        informatica: 3,
        "conhecimentos-gerais-atualidades": 3,
        "conhecimentos-especificos": 10,
      };
      const selected = subjectRows.flatMap((row) => {
        const slug = row.subjects?.slug;
        const count = sampleCounts[slug] || 0;
        return shuffle(bank.filter((question) => question.exam_subject_id === row.id)).slice(0, count);
      });
      if (selected.length !== 22) {
        throw new Error("Não foi possível montar o diagnóstico com a distribuição prevista de 22 questões.");
      }

      const { data: run, error: runError } = await supabase.from("assessment_runs").insert({
        user_id: user.id,
        exam_id: exam.id,
        run_type: "diagnostico",
        title: "Diagnóstico inicial — 22 questões",
        question_count: selected.length,
        metadata: { origin: "banco_autoral_ia", question_distribution: sampleCounts },
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

  async function startSimulation() {
    if (!exam || !user || diagnosticStartLock.current) return;
    diagnosticStartLock.current = true;
    setBusy(true);
    setNotice("");
    setFeedback(null);
    setSelectedOption("");
    setResponses([]);
    setQuizResult(null);
    setQuizMode("simulado");
    try {
      const { data: bank, error: bankError } = await supabase.from("questions")
        .select("id, exam_subject_id, topic_id, statement, options, difficulty, points, origin")
        .eq("exam_id", exam.id).eq("is_published", true);
      if (bankError) throw bankError;
      if (!bank || bank.length !== 70) {
        throw new Error("O simulado completo exige exatamente 70 questões publicadas. O banco ainda não está completo.");
      }

      const selected = subjectRows.flatMap((row) => {
        const count = row.subjects?.slug === "conhecimentos-especificos" ? 30 : 10;
        return shuffle(bank.filter((question) => question.exam_subject_id === row.id)).slice(0, count);
      });
      if (selected.length !== 70) {
        throw new Error("Não foi possível montar o simulado na distribuição oficial de 70 questões.");
      }

      const { data: run, error: runError } = await supabase.from("assessment_runs").insert({
        user_id: user.id,
        exam_id: exam.id,
        run_type: "simulado",
        title: "Simulado completo — 70 questões",
        question_count: 70,
        metadata: {
          origin: "banco_autoral_ia",
          question_distribution: {
            "lingua-portuguesa": 10,
            "matematica-raciocinio-logico": 10,
            informatica: 10,
            "conhecimentos-gerais-atualidades": 10,
            "conhecimentos-especificos": 30,
          },
        },
      }).select("id").single();
      if (runError) throw runError;

      setQuizQuestions(selected);
      setQuizRunId(run.id);
      setQuizIndex(0);
      setQuizStartedAt(Date.now());
      setQuestionStartedAt(Date.now());
      setView("simulation");
    } catch (err) {
      setNotice(err.message || "Não foi possível iniciar o simulado.");
    } finally {
      diagnosticStartLock.current = false;
      setBusy(false);
    }
  }

  async function leaveAssessment() {
    if (quizRunId && user) {
      const { error } = await supabase.functions.invoke("finish-assessment", {
        body: {
          assessment_run_id: quizRunId,
          allow_partial: responses.length > 0,
          abandon: responses.length === 0,
        },
      });
      if (error) setNotice(error.message || "Não foi possível encerrar a avaliação.");
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
        body: {
          question_id: currentQuestion.id,
          selected_option: selectedOption,
          assessment_run_id: quizRunId,
          time_spent_seconds: elapsed,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (quizMode === "simulado") {
        if (!data?.recorded || data?.feedback_hidden !== true) throw new Error("Não foi possível registrar a resposta.");
        setFeedback({ recorded: true });
        setResponses((previous) => [...previous, {
          questionId: currentQuestion.id,
          points: Number(currentQuestion.points || 1),
          topicId: currentQuestion.topic_id,
        }]);
      } else {
        setFeedback(data);
        setResponses((previous) => [...previous, {
          questionId: currentQuestion.id,
          isCorrect: Boolean(data.correct),
          points: Number(currentQuestion.points || 1),
          topicId: currentQuestion.topic_id,
        }]);
      }
    } catch (err) {
      setNotice(err.message || "Erro ao registrar a resposta. Tente novamente.");
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

    setBusy(true);
    try {
      const elapsed = quizStartedAt ? Math.round((Date.now() - quizStartedAt) / 1000) : 0;
      const { data, error } = await supabase.functions.invoke("finish-assessment", {
        body: { assessment_run_id: quizRunId, allow_partial: false },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuizResult({
        ...data,
        mode: quizMode,
        score: Number(data.score ?? 0),
        correct: Number(data.correct ?? 0),
        total: Number(data.total ?? quizQuestions.length),
        minutes: Math.max(1, Number(data.minutes ?? Math.round(elapsed / 60))),
      });
      setView("results");
      await loadDashboard(user);
    } catch (err) {
      setNotice(err.message || "Não foi possível finalizar e corrigir esta avaliação.");
    } finally {
      setBusy(false);
    }
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
          {NAV_ITEMS.filter((item) => item.id !== "tutor").map((item) => (
            <button key={item.id} className={view === item.id || (view === "results" && item.id === (quizResult?.mode === "simulado" ? "simulations" : "diagnostic")) || (view === "simulation" && item.id === "simulations") ? "nav-link active" : "nav-link"} onClick={() => item.id === "diagnostic" ? startDiagnostic() : setView(item.id)}>
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
          <div><span className="eyebrow">CONCURSO SBMG · 2026</span><div className="topbar-title">{view === "simulation" ? "Simulado completo" : NAV_ITEMS.find((item) => item.id === view)?.label || (view === "results" ? (quizResult?.mode === "simulado" ? "Resultado do simulado" : "Resultado do diagnóstico") : "Área do candidato")}</div></div>
          <div className="topbar-right">
            <span className="top-date">{formatDate(new Date())}</span>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
              <span>{theme === "dark" ? "☼" : "◐"}</span><small>{theme === "dark" ? "Claro" : "Escuro"}</small>
            </button>
            <button
              className={view === "tutor" ? "topbar-tutor-button active" : "topbar-tutor-button"}
              type="button"
              onClick={() => setView("tutor")}
              aria-label="Abrir Professor IA"
              title="Professor IA"
            >
              <span className="topbar-tutor-icon">✦</span><span className="topbar-tutor-label">Professor IA</span>
            </button>
            <div className="topbar-user">
              <span className="topbar-user-name" title={user.email}>{user.email?.split("@")[0] || "Candidato"}</span>
              <span className="avatar avatar-small" aria-hidden="true">{(user.email || "A").slice(0, 1).toUpperCase()}</span>
            </div>
          </div>
        </header>
        {notice && <div className="global-notice"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
        {activeSession && (
          <div className="active-session-strip">
            <div><span className="session-live-dot" /><strong>Sessão em andamento</strong><small>{activeSession.lessonTitle || activeSession.topicTitle}</small></div>
            <b>{formatElapsed(elapsedSeconds)}</b>
            <button className="text-button" onClick={() => {
              if (activeSession.kind === "topico") {
                setView("study");
                setSelectedTopic(allTopics.find((item) => item.id === activeSession.topicId) || null);
              } else {
                setView("essay");
                setEssayLearningTab("learn");
                setActiveEssayLessonId(activeSession.essayLessonId);
              }
            }}>Voltar à aula</button>
            <button className="text-button" onClick={() => activeSession.kind === "topico" ? finishTopicSession(false) : finishEssayLessonSession(false)} disabled={lessonSessionBusy}>
              Salvar sessão
            </button>
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
                <button className="button button-secondary button-wide" onClick={() => setView("simulations")}>Ver simulados completos →</button>
              </div>
            </div>
          </section>
        )}

        {view === "study" && (
          <section className={selectedTopic ? "content-section study-session-page" : "content-section"}>
            {selectedTopic ? (
              <>
                <button className="back-button lesson-back-button" onClick={() => setSelectedTopic(null)}>← Voltar à lista de aulas</button>
                <TopicLessonPanel
                  topic={selectedTopic}
                  lesson={selectedLesson}
                  progress={topicProgressById.get(selectedTopic.id)}
                  plannedMinutes={plannedMinutes}
                  activeSession={activeSession}
                  elapsedSeconds={elapsedSeconds}
                  busy={busy || lessonSessionBusy}
                  onStart={() => startTopicSession(selectedTopic)}
                  onFinish={(complete) => finishTopicSession(complete)}
                  onMarkComplete={() => markTopicCompleted(selectedTopic)}
                  onCancel={cancelTopicSession}
                  onAskTutor={() => { setTutorTopicId(selectedTopic.id); setView("tutor"); }}
                  onClose={() => setSelectedTopic(null)}
                />
              </>
            ) : (
              <>
                <div className="page-heading"><span className="eyebrow">ANEXO III · EDITAL 001/2026</span><h1>Sala de estudos</h1><p className="muted">Aulas organizadas pelo edital, com explicações desde o básico, exemplos e atividades de fixação.</p></div>
                <div className="study-weight-note"><strong>Bloco selecionado: {plannedMinutes} minutos</strong><span>Abra uma aula para visualizar. O cronômetro só começa após confirmação de início.</span></div>
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
                                Abrir aula <span aria-hidden="true">→</span>
                              </button>
                            </div>
                          ))}
                        </div>}
                      </article>
                    );
                  })}
                </div>
              </>
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

        {view === "essay" && (
          <section className="content-section">
            <div className="page-heading">
              <span className="eyebrow">PROVA DE REDAÇÃO · EDITAL 001/2026</span>
              <h1>Redação: aprender e praticar</h1>
              <p className="muted">Aprenda a construir um texto dissertativo-argumentativo desde o início. Depois, pratique, analise exemplos e faça sua própria redação.</p>
            </div>

            <div className="essay-course-progress panel">
              <div className="essay-course-progress-copy">
                <span className="eyebrow">SUA TRILHA DE APRENDIZAGEM</span>
                <strong>{completedEssayLessons} de {ESSAY_COURSE.length} aulas concluídas</strong>
                <small>{essayLearningPercent}% do curso concluído · As respostas e o progresso ficam salvos na sua conta.</small>
              </div>
              <div className="essay-course-progress-meter"><span style={{ width: essayLearningPercent + "%" }} /></div>
            </div>

            <nav className="essay-learning-tabs" aria-label="Etapas do curso de redação">
              {[
                ["learn", "Aprender", "book"],
                ["practice", "Praticar", "puzzle"],
                ["analyze", "Analisar", "file"],
                ["write", "Escrever", "pen"],
              ].map(([id, label, icon], index) => (
                <button key={id} className={essayLearningTab === id ? "essay-learning-tab active" : "essay-learning-tab"} onClick={() => setEssayLearningTab(id)}>
                  <span className="essay-learning-tab-number">0{index + 1}</span>
                  <strong>{label}</strong>
                </button>
              ))}
            </nav>

            {essayLearningNotice && <div className={essayLearningNotice.includes("não foi possível") ? "notice notice-error" : "notice notice-success"}>{essayLearningNotice}</div>}

            {essayLearningTab === "learn" && (
              <div className="essay-course-layout">
                <aside className="panel essay-course-index">
                  <div className="panel-heading">
                    <div><span className="eyebrow">PASSO A PASSO</span><h2>Conteúdo das aulas</h2></div>
                  </div>
                  {ESSAY_COURSE.map((lesson) => {
                    const progress = essayLessonProgressById.get(lesson.id);
                    const status = progress?.status || (progress?.completed ? "concluida" : "nao_iniciada");
                    const statusLabel = status === "concluida" ? "Concluída" : status === "em_andamento" ? "Em andamento" : "Pendente";
                    return (
                      <button key={lesson.id} className={activeEssayLessonId === lesson.id ? "essay-course-index-item active" : "essay-course-index-item"} onClick={() => { setActiveEssayLessonId(lesson.id); setEssayLessonCompletionPending(null); setEssayLessonStartPending(null); }}>
                        <span className={status === "concluida" ? "essay-course-index-number done" : "essay-course-index-number"}>{status === "concluida" ? "✓" : String(lesson.number).padStart(2, "0")}</span>
                        <span className="essay-course-index-copy"><strong>{lesson.shortTitle}</strong><small>{lesson.duration} · {statusLabel}</small></span>
                        <span className="essay-course-index-arrow">›</span>
                      </button>
                    );
                  })}
                </aside>

                <article className="panel essay-course-lesson">
                  <div className="essay-course-lesson-head">
                    <span className="eyebrow">AULA {String(activeEssayLesson.number).padStart(2, "0")} DE {ESSAY_COURSE.length} · {activeEssayLesson.duration.toUpperCase()}</span>
                    {activeEssayStatus === "concluida" && <span className="essay-completed-label">✓ Concluída</span>}
                  </div>
                  <h2>{activeEssayLesson.title}</h2>
                  <p className="essay-course-intro">{activeEssayLesson.introduction}</p>

                  {!activeEssaySession && (
                    <section className="essay-lesson-preview">
                      <div className="essay-lesson-preview-heading">
                        <span className="eyebrow">RESUMO DA AULA</span>
                        <strong>Antes de começar</strong>
                      </div>
                      <div className="essay-lesson-preview-grid">
                        <div className="essay-course-objective">
                          <strong>O que você vai aprender</strong>
                          <span>{activeEssayLesson.objective}</span>
                        </div>
                        <div className="essay-lesson-summary-list">
                          <strong>Conteúdo desta aula</strong>
                          <ul>
                            {activeEssayLesson.sections.map((section) => <li key={section.heading}>{section.heading}</li>)}
                            <li>Exemplo comentado e exercício de fixação</li>
                          </ul>
                        </div>
                      </div>
                      <div className="essay-lesson-preview-footer">
                        <div className="essay-lesson-state-copy">
                          <span className="muted small-copy">STATUS DA AULA</span>
                          <strong>{activeEssayStatus === "concluida" ? "Concluída" : activeEssayStatus === "em_andamento" ? "Em andamento" : "Não iniciada"}</strong>
                          <small>{activeEssayStatus === "concluida" ? "Você pode iniciar uma revisão cronometrada." : "A aula só começa quando você confirmar o início."}</small>
                        </div>
                        <button
                          className="button button-primary essay-start-button"
                          onClick={() => setEssayLessonStartPending(activeEssayLesson.id)}
                          disabled={lessonSessionBusy || anotherLessonSessionActive}
                        >
                          {anotherLessonSessionActive ? "Finalize a sessão atual" : activeEssayStatus === "concluida" ? "Iniciar revisão" : activeEssayStatus === "em_andamento" ? "Retomar aula" : "Iniciar aula"}
                        </button>
                      </div>
                      {anotherLessonSessionActive && <p className="muted essay-session-hint">Existe uma sessão ativa em outra aula. Salve ou cancele essa sessão antes de iniciar esta.</p>}
                    </section>
                  )}

                  {activeEssaySession && (
                    <div className="essay-active-lesson">
                      <div className="essay-active-timer">
                        <div><span className="session-live-dot" /><span className="eyebrow">CRONÔMETRO DESTA AULA</span></div>
                        <strong>{formatElapsed(elapsedSeconds)}</strong>
                      </div>

                      <div className="essay-course-objective">
                        <strong>Ao final desta aula, você deverá:</strong>
                        <span>{activeEssayLesson.objective}</span>
                      </div>

                      <div className="essay-course-sections">
                        {activeEssayLesson.sections.map((section, index) => (
                          <section className="essay-course-section" key={section.heading}>
                            <span className="essay-course-section-number">{String(index + 1).padStart(2, "0")}</span>
                            <div><h3>{section.heading}</h3><p>{section.text}</p></div>
                          </section>
                        ))}
                      </div>

                      <div className="essay-course-example">
                        <span className="eyebrow">EXEMPLO COMENTADO</span>
                        <h3>{activeEssayLesson.example.title}</h3>
                        <div className="essay-example-version weak"><strong>EVITE</strong><p>{activeEssayLesson.example.weak}</p></div>
                        <div className="essay-example-version strong"><strong>PREFIRA</strong><p>{activeEssayLesson.example.strong}</p></div>
                        <ul>{activeEssayLesson.example.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
                      </div>

                      <EssayExerciseCard
                        lesson={activeEssayLesson}
                        progress={activeEssayProgress}
                        onAnswer={answerEssayExercise}
                        disabled={essayLearningBusy || lessonSessionBusy}
                      />

                      <div className="essay-course-footer">
                        <div className="essay-lesson-state-copy">
                          <span className="muted small-copy">STATUS DA AULA</span>
                          <strong>{activeEssayStatus === "concluida" ? "Concluída · revisão em andamento" : "Em andamento"}</strong>
                          <small>O tempo desta sessão é salvo separadamente para esta aula.</small>
                        </div>
                        <div className="essay-lesson-session-actions">
                          <button className="button button-secondary" onClick={() => finishEssayLessonSession(false)} disabled={lessonSessionBusy}>
                            Salvar sessão (sem concluir)
                          </button>
                          {activeEssayStatus !== "concluida" && (
                            <button className="button button-primary" onClick={() => setEssayLessonCompletionPending(activeEssayLesson.id)} disabled={lessonSessionBusy}>
                              Concluir aula
                            </button>
                          )}
                          <button className="text-button" onClick={cancelEssayLessonSession} disabled={lessonSessionBusy}>
                            Cancelar sessão sem salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="essay-course-next">
                    <button className="text-button" onClick={() => setEssayLearningTab("practice")}>Ir para os exercícios →</button>
                    {activeEssayLesson.number < ESSAY_COURSE.length && <button className="text-button" onClick={() => setActiveEssayLessonId(ESSAY_COURSE[activeEssayLesson.number].id)}>Próxima aula: {ESSAY_COURSE[activeEssayLesson.number].shortTitle} →</button>}
                  </div>
                </article>
              </div>
            )}

              {essayLessonStartPending && (
                <div className="lesson-confirm-backdrop" role="presentation">
                  <div className="lesson-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="essay-start-confirm-title">
                    <span className="eyebrow">CONFIRMAÇÃO NECESSÁRIA</span>
                    <h3 id="essay-start-confirm-title">Iniciar esta aula?</h3>
                    <p>O status será salvo como “Em andamento” e um cronômetro exclusivo será iniciado para “{activeEssayLesson.title}”.</p>
                    <p className="lesson-confirm-warning">Confirme somente quando estiver pronto para estudar. Apenas abrir a prévia não inicia nem registra tempo.</p>
                    <div className="lesson-confirm-actions">
                      <button className="button button-secondary" onClick={() => setEssayLessonStartPending(null)}>Não, voltar</button>
                      <button className="button button-primary" onClick={confirmEssayLessonStart} disabled={lessonSessionBusy}>
                        {lessonSessionBusy ? "Iniciando..." : "Sim, iniciar aula"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {essayLessonCompletionPending && (
                <div className="lesson-confirm-backdrop" role="presentation">
                  <div className="lesson-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="essay-confirm-title">
                    <span className="eyebrow">CONFIRMAÇÃO NECESSÁRIA</span>
                    <h3 id="essay-confirm-title">Concluir esta aula?</h3>
                    <p>Ao confirmar, o tempo exato da sessão atual será salvo e o status da aula mudará para “Concluída”.</p>
                    <p className="lesson-confirm-warning">Se ainda estiver estudando, salve a sessão sem concluir. Você poderá iniciar uma nova revisão depois.</p>
                    <div className="lesson-confirm-actions">
                      <button className="button button-secondary" onClick={() => setEssayLessonCompletionPending(null)}>Não, voltar</button>
                      <button className="button button-primary" onClick={confirmEssayLessonCompletion} disabled={lessonSessionBusy || essayLearningBusy}>
                        {lessonSessionBusy || essayLearningBusy ? "Salvando..." : "Sim, concluir aula"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {essayLearningTab === "practice" && (
              <div className="essay-practice-view">
                <div className="page-heading essay-subheading">
                  <span className="eyebrow">FIXAÇÃO DO CONTEÚDO</span>
                  <h2>Teste o que aprendeu</h2>
                  <p className="muted">Responda às seis questões. A explicação aparece logo após a escolha e sua resposta fica salva.</p>
                </div>
                <div className="essay-practice-grid">
                  {ESSAY_COURSE.map((lesson) => (
                    <EssayExerciseCard
                      key={lesson.id}
                      lesson={lesson}
                      progress={essayLessonProgressById.get(lesson.id)}
                      onAnswer={answerEssayExercise}
                      disabled={essayLearningBusy}
                    />
                  ))}
                </div>
              </div>
            )}

            {essayLearningTab === "analyze" && (
              <div className="essay-analysis-view">
                <div className="page-heading essay-subheading">
                  <span className="eyebrow">LEITURA ORIENTADA</span>
                  <h2>Veja como as partes se conectam</h2>
                  <p className="muted">Leia um texto curto e observe a função de cada parágrafo. O exemplo é didático e autoral, não é resposta oficial.</p>
                </div>
                <div className="panel essay-model-panel">
                  <span className="eyebrow">TEXTO DIDÁTICO COMENTADO</span>
                  <h2>{ESSAY_MODEL_TEXT.title}</h2>
                  <div className="notice notice-success essay-model-notice">{ESSAY_MODEL_TEXT.notice}</div>
                  {ESSAY_MODEL_TEXT.paragraphs.map((paragraph, index) => (
                    <article className="essay-model-paragraph" key={paragraph.part}>
                      <div className="essay-model-paragraph-label"><span>0{index + 1}</span><strong>{paragraph.part}</strong></div>
                      <p>{paragraph.text}</p>
                      <div className="essay-model-analysis"><strong>O que observar</strong><span>{paragraph.analysis}</span></div>
                    </article>
                  ))}
                </div>
                <div className="essay-rubric-heading">
                  <span className="eyebrow">RÉGUA DE AUTOAVALIAÇÃO</span>
                  <h2>Quatro critérios de correção</h2>
                  <p className="muted small-copy">A plataforma usa esta rubrica formativa, com até 25 pontos por critério. A nota gerada pela IA é uma estimativa de estudo, não uma nota oficial.</p>
                </div>
                <div className="essay-rubric-grid">
                  {ESSAY_RUBRIC.map((criterion, index) => (
                    <article className="essay-rubric-card" key={criterion.title}>
                      <span>0{index + 1}</span><h3>{criterion.title}</h3><strong>{criterion.weight}</strong><p>{criterion.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {essayLearningTab === "write" && (
              <>
            <div className="essay-rules-grid">
              <div className="essay-rule"><strong>20–30</strong><span>linhas</span></div>
              <div className="essay-rule"><strong>4</strong><span>critérios</span></div>
              <div className="essay-rule"><strong>25</strong><span>pontos por critério</span></div>
              <div className="essay-rule"><strong>100</strong><span>pontos possíveis</span></div>
            </div>
            <div className="notice notice-success essay-edital-note"><strong>Conforme o edital:</strong> texto dissertativo-argumentativo sobre questões da atualidade, de 20 a 30 linhas. A nota mínima prevista para a redação é 50/100.</div>
            <div className="essay-workspace">
              <div className="panel essay-editor">
                <div className="panel-heading">
                  <div><span className="eyebrow">PROPOSTA DE TREINO</span><h2>Escolha um tema</h2></div>
                  <button className="text-button" onClick={newEssayDraft}>Nova redação +</button>
                </div>
                <label className="essay-label" htmlFor="essay-prompt">Tema</label>
                <select id="essay-prompt" className="tutor-topic-select" value={essayPromptId} disabled={essayStatus === "corrigida" && Boolean(essayId)} onChange={(event) => { setEssayPromptId(event.target.value); setEssayId(null); setEssayStatus("rascunho"); setEssayEvaluation(null); }}>
                  {ESSAY_PROMPTS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <div className="essay-prompt-text"><strong>Proposta:</strong> {currentEssayPrompt.prompt}</div>
                <label className="essay-label" htmlFor="essay-text">Seu texto</label>
                <textarea id="essay-text" className="essay-textarea" value={essayText} readOnly={essayStatus === "corrigida" && Boolean(essayId)} onChange={(event) => { setEssayText(event.target.value); setEssayEvaluation(null); }} placeholder="Escreva a introdução, desenvolva seus argumentos e conclua..." rows={18} maxLength={12000}/>
                <div className={essayLineCount < 20 || essayLineCount > 30 ? "essay-line-meter out" : "essay-line-meter in"}>
                  <strong>{essayLineCount}</strong><span>linhas digitadas</span><small>{essayLineCount < 20 ? "Abaixo do mínimo" : essayLineCount > 30 ? "Acima do máximo" : "Dentro da faixa do edital"}</small>
                </div>
                <div className="essay-line-note">O contador considera quebras de linha manuais. Na prova oficial, as linhas são manuscritas; quebras automáticas da tela não equivalem necessariamente às linhas da folha de resposta.</div>
                {essayNotice && <div className={essayNotice.includes("concluída") || essayNotice.includes("salvo") ? "notice notice-success" : "notice notice-error"}>{essayNotice}</div>}
                {essayStatus === "corrigida" && essayId ? (
                  <div className="essay-actions"><button className="button button-primary" onClick={newEssayDraft}>Criar nova tentativa →</button></div>
                ) : (
                  <div className="essay-actions">
                    <button className="button button-secondary" onClick={persistEssayDraft} disabled={essayBusy || !essayText.trim()}>Salvar rascunho</button>
                    <button className="button button-primary" onClick={requestEssayCorrection} disabled={essayBusy || essayLineCount < 20 || essayLineCount > 30}>{essayBusy ? "Processando..." : "Solicitar correção por IA →"}</button>
                  </div>
                )}
                <small className="muted essay-disclaimer">A correção por IA é formativa e não substitui a avaliação oficial da banca. Exige OPENAI_API_KEY nos Secrets do Supabase.</small>
              </div>
              <aside className="panel essay-history">
                <span className="eyebrow">MEUS RASCUNHOS</span><h2>Histórico</h2>
                {essaySubmissions.length === 0 ? <p className="muted small-copy">As redações salvas aparecerão aqui.</p> : essaySubmissions.map((item) => (
                  <button className={essayId === item.id ? "essay-history-item active" : "essay-history-item"} key={item.id} onClick={() => openEssaySubmission(item)}>
                    <strong>{ESSAY_PROMPTS.find((p) => p.prompt === item.prompt)?.title || item.prompt}</strong>
                    <small>{new Date(item.created_at).toLocaleDateString("pt-BR")} · {item.line_count || 0} linhas</small>
                    <span>{item.status === "corrigida" ? "Corrigida por IA" : "Rascunho"}</span>
                    {item.score_total != null && <b>{item.score_total}/100</b>}
                  </button>
                ))}
              </aside>
            </div>
            {essayEvaluation && (
              <div className="panel essay-evaluation">
                <div className="essay-evaluation-head">
                  <div><span className="eyebrow">DEVOLUTIVA FORMATIVA</span><h2>Resultado da correção</h2></div>
                  <div className="essay-score">{essayEvaluation.total_score ?? essayEvaluation.score_total ?? "—"}<small>/100</small></div>
                </div>
                <div className="essay-criteria-grid">
                  {(essayEvaluation.criterion_feedback || []).map((criterion, index) => (
                    <article className="essay-criterion" key={index}>
                      <strong>{criterion.criterion}</strong><b>{criterion.score}/25</b>
                      <p>{criterion.comments}</p><small>{criterion.improvement}</small>
                    </article>
                  ))}
                </div>
                <div className="essay-feedback-columns">
                  <div><h3>Pontos fortes</h3><ul>{(essayEvaluation.strengths || []).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
                  <div><h3>O que melhorar</h3><ul>{(essayEvaluation.improvements || []).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
                </div>
                <p className="muted small-copy">{essayEvaluation.general_feedback}</p>
                <p className="muted small-copy">{essayEvaluation.line_count_comment}</p>
                <div className="notice notice-success">Esta pontuação é uma estimativa pedagógica gerada por IA, não uma nota oficial.</div>
              </div>
            )}
              </>
            )}
          </section>
        )}

        {view === "reviews" && (
          <section className="content-section">
            <div className="page-heading">
              <span className="eyebrow">MEMORIZAÇÃO ATIVA</span>
              <h1>Revisões e flashcards</h1>
              <p className="muted">Responda de memória, revele o verso e marque o quanto lembrou. Os cartões voltam em intervalos crescentes.</p>
            </div>
            <div className="stat-grid">
              <StatCard label="Cartões cadastrados" value={String(flashcards.length)} helper="Um cartão inicial por tópico" icon="▤" />
              <StatCard label="Para revisar agora" value={String(dueFlashcards.length)} helper="Novos cartões e revisões vencidas" icon="↻" />
              <StatCard label="Revisões realizadas" value={String(flashcardReviews.length)} helper="Histórico salvo na sua conta" icon="✓" />
              <StatCard label="Próximo intervalo" value="1–15 dias" helper="Conforme sua autoavaliação" icon="◷" />
            </div>
            <div className="panel flashcard-panel">
              {currentDueFlashcard ? (
                <>
                  <div className="flashcard-top"><span className="eyebrow">FLASHCARD · {currentDueFlashcard.difficulty}</span><span className="muted small-copy">{dueFlashcards.length} pendentes</span></div>
                  <div className="flashcard-face">
                    <span className="eyebrow">PERGUNTA</span><h2>{currentDueFlashcard.front}</h2>
                    <div className="flashcard-topic-label">{allTopics.find((topic) => topic.id === currentDueFlashcard.topic_id)?.title || "Tópico do edital"}</div>
                    {!flashcardRevealed ? (
                      <button className="button button-primary" onClick={() => setFlashcardRevealed(true)}>Revelar resposta</button>
                    ) : (
                      <div className="flashcard-answer">
                        <span className="eyebrow">RESPOSTA / EXPLICAÇÃO</span><p>{currentDueFlashcard.back}</p>
                        <div className="flashcard-rating">
                          <span>Quanto você lembrou?</span>
                          {[[1,"Não lembrei"],[2,"Com dificuldade"],[3,"Parcialmente"],[4,"Quase tudo"],[5,"Dominei"]].map(([value,label]) => (
                            <button key={value} className={"flash-rating rate-" + value} disabled={flashcardBusy} onClick={() => rateFlashcard(value)}>{label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flashcard-empty"><span>✓</span><h2>Você está em dia!</h2><p className="muted">Não há cartões vencidos agora. Os próximos retornam conforme os intervalos de revisão.</p></div>
              )}
            </div>
            <div className="notice notice-success review-method-note"><strong>Como funciona:</strong> Não lembrei: 1 dia · Com dificuldade: 2 dias · Parcialmente: 4 dias · Quase tudo: 7 dias · Dominei: 15 dias. A agenda é baseada na sua autoavaliação.</div>
          </section>
        )}

        {view === "simulations" && (
          <section className="content-section">
            <div className="page-heading">
              <span className="eyebrow">TREINO CRONOMETRADO · EDITAL 001/2026</span>
              <h1>Simulados</h1>
              <p className="muted">Treine a prova objetiva completa com 70 questões, distribuição e pontuação iguais às previstas no edital.</p>
            </div>
            <div className="simulation-hero">
              <div>
                <span className="eyebrow eyebrow-light">SIMULADO COMPLETO</span>
                <h2>70 questões · 100 pontos</h2>
                <p>As questões são autorais, baseadas no conteúdo programático. Durante a prova, o sistema não revela acertos nem gabarito. A correção comentada aparece somente depois da entrega.</p>
                <button className="button button-primary" onClick={startSimulation} disabled={busy}>Iniciar simulado completo →</button>
              </div>
              <div className="simulation-total"><strong>70</strong><span>questões</span><small>100 pontos</small></div>
            </div>
            <div className="panel simulation-distribution">
              <div className="panel-heading"><div><span className="eyebrow">DISTRIBUIÇÃO OFICIAL</span><h2>Estrutura da prova objetiva</h2></div><span className="muted small-copy">Tempo total do concurso: 4h30 para objetiva e redação</span></div>
              {subjectRows.map((row) => (
                <div className="simulation-subject-row" key={row.id}>
                  <div><strong>{row.subjects?.name}</strong><small>{row.question_count} questões</small></div>
                  <div className="simulation-bar"><span style={{ width: ((row.question_count || 0) / 70 * 100) + "%" }} /></div>
                  <b>{row.total_points || row.question_count} pts</b>
                </div>
              ))}
            </div>
            <div className="notice notice-success simulation-note">
              <strong>Como funciona:</strong> todas as questões são respondidas sem feedback imediato. Ao concluir, o servidor calcula a nota ponderada, mostra o resultado por disciplina e libera o gabarito comentado.
            </div>
          </section>
        )}

        {(view === "diagnostic" || view === "simulation") && currentQuestion && (
          <section className="content-section quiz-section">
            <div className="quiz-topline"><button className="back-button" onClick={leaveAssessment}>← {quizMode === "simulado" ? "Sair do simulado" : "Sair do diagnóstico"}</button><span>{quizMode === "simulado" ? "SIMULADO COMPLETO · SEM GABARITO DURANTE A PROVA" : "DIAGNÓSTICO INICIAL · QUESTÕES AUTORAIS"}</span><strong>{quizIndex + 1} <small>/ {quizQuestions.length}</small></strong></div>
            <div className="quiz-timer-strip"><span>{quizMode === "simulado" ? "SIMULADO · 70 QUESTÕES" : "DIAGNÓSTICO · 22 QUESTÕES"}</span><strong>{formatElapsed(quizElapsedSeconds)}</strong></div><div className="quiz-progress"><span style={{ width: ((quizIndex + (feedback ? 1 : 0)) / quizQuestions.length * 100) + "%" }} /></div>
            <div className="quiz-card">
              <div className="quiz-meta"><span className="eyebrow">{getSubjectName(subjectRows, currentQuestion.exam_subject_id)}</span><span className={"difficulty difficulty-" + currentQuestion.difficulty}>{currentQuestion.difficulty}</span></div>
              <h1>{currentQuestion.statement}</h1>
              <div className="option-list">
                {(currentQuestion.options || []).map((option) => {
                  const isSelected = selectedOption === option.id;
                  const stateClass = quizMode === "simulado" ? (isSelected ? "option selected" : "option") : feedback && option.id === feedback.correct_option ? "option correct" : feedback && isSelected && !feedback.correct ? "option incorrect" : isSelected ? "option selected" : "option";
                  return <button key={option.id} className={stateClass} disabled={Boolean(feedback)} onClick={() => setSelectedOption(option.id)}><span className="option-letter">{option.id}</span><span>{option.text}</span>{feedback && option.id === feedback.correct_option && <b>✓</b>}</button>;
                })}
              </div>
              {feedback && (quizMode === "simulado" ? <div className="answer-feedback good"><strong>Resposta registrada.</strong><p>O gabarito e as explicações serão liberados somente depois da finalização do simulado.</p></div> : <div className={feedback.correct ? "answer-feedback good" : "answer-feedback bad"}><strong>{feedback.correct ? "Muito bem! Resposta correta." : "Resposta incorreta. Alternativa " + feedback.correct_option + "."}</strong><p>{feedback.explanation}</p></div>)}
              <div className="quiz-actions"><span className="muted small-copy">Valor desta questão: {currentQuestion.points || 1} {(currentQuestion.points || 1) === 1 ? "ponto" : "pontos"}</span>{!feedback ? <button className="button button-primary" disabled={!selectedOption || busy} onClick={submitAnswer}>{busy ? "Corrigindo..." : "Confirmar resposta"}</button> : <button className="button button-primary" onClick={nextQuestion}>{quizIndex === quizQuestions.length - 1 ? "Ver resultado" : "Próxima questão"} →</button>}</div>
            </div>
          </section>
        )}

        {(view === "diagnostic" || view === "simulation") && !currentQuestion && (
          <section className="content-section"><div className="empty-state"><h2>Diagnóstico inicial</h2><p>O objetivo é identificar o que você já domina e o que precisa estudar desde o começo.</p><button className="button button-primary" onClick={startDiagnostic}>Iniciar diagnóstico</button></div></section>
        )}

        {view === "results" && quizResult && (
          <section className="content-section">
            <div className="result-hero">
              <span className="eyebrow eyebrow-light">{quizResult.mode === "simulado" ? "SIMULADO CONCLUÍDO" : "DIAGNÓSTICO CONCLUÍDO"}</span>
              <div className="result-score">{Number(quizResult.score || 0).toFixed(1).replace(".", ",")}<small>/100</small></div>
              <h1>{quizResult.mode === "simulado" ? "Resultado do simulado completo." : "Seu ponto de partida está registrado."}</h1>
              <p>{quizResult.mode === "simulado" ? "Pontuação ponderada conforme o peso de cada disciplina no edital. As questões autorais ainda precisam de revisão humana independente." : "O resultado é diagnóstico, não uma previsão de aprovação. Use-o para direcionar os próximos estudos."}</p>
            </div>
            <div className="stat-grid result-stats">
              <StatCard label="Acertos" value={quizResult.correct + "/" + quizResult.total} helper="Questões respondidas" icon="✓" />
              <StatCard label="Nota ponderada" value={Number(quizResult.score || 0).toFixed(1).replace(".", ",")} helper="Escala normalizada de 0 a 100" icon="∑" />
              <StatCard label="Tempo utilizado" value={quizResult.minutes + " min"} helper="Duração da avaliação" icon="◷" />
              <StatCard label="Próximo passo" value="Reforço" helper="Estudar os tópicos com erros" icon="↗" />
            </div>
            {quizResult.subjects?.length > 0 && (
              <div className="panel simulation-distribution">
                <div className="panel-heading"><div><span className="eyebrow">RESULTADO POR DISCIPLINA</span><h2>Onde concentrar os estudos</h2></div></div>
                {quizResult.subjects.map((item) => (
                  <div className="simulation-subject-row" key={item.slug}>
                    <div><strong>{item.name}</strong><small>{item.correct}/{item.answered} acertos · {item.raw_points}/{item.max_points} pontos</small></div>
                    <div className="simulation-bar"><span style={{ width: item.percentage + "%" }} /></div>
                    <b>{Number(item.percentage).toFixed(0)}%</b>
                  </div>
                ))}
              </div>
            )}
            {quizResult.review?.length > 0 && (
              <details className="panel answer-review">
                <summary><strong>Ver gabarito comentado</strong><span>{quizResult.review.length} questões</span></summary>
                <div className="answer-review-list">
                  {quizResult.review.map((item, index) => (
                    <article key={item.question_id} className="answer-review-item">
                      <div className="answer-review-top"><strong>Questão {index + 1}</strong><span className={item.correct ? "review-correct" : "review-incorrect"}>{item.correct ? "Acertou" : "Errou"} · {item.points} pts</span></div>
                      <h3>{item.statement}</h3>
                      <p><strong>Sua resposta:</strong> {item.selected_option || "Em branco"} · <strong>Gabarito:</strong> {item.correct_option}</p>
                      <p className="muted">{item.explanation}</p>
                    </article>
                  ))}
                </div>
              </details>
            )}
            <div className="panel result-next">
              <div><span className="eyebrow">RECOMENDAÇÃO</span><h2>Agora vamos transformar os erros em plano.</h2><p className="muted">Revise as explicações, abra a Sala de Estudos e avance pelos tópicos fundamentais. O sistema já salvou as respostas para acompanhar sua evolução.</p></div>
              <button className="button button-primary" onClick={() => setView("study")}>Ir para sala de estudos →</button>
            </div>
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
