import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ESSAY_COURSE, ESSAY_MODEL_TEXT, ESSAY_RUBRIC } from "./data/essayCourse";

const EXAM_SLUG = "sbmg-2026-auxiliar-administrativo-financeiro";
const EXAM_DAY = "2027-01-24";
const NAV_ITEMS = [
  { id: "dashboard", icon: "dashboard", label: "Visão geral" },
  { id: "study", icon: "study", label: "Sala de estudos" },
  { id: "tutor", icon: "tutor", label: "Professor IA" },
  { id: "simulations", icon: "simulations", label: "Simulados" },
  { id: "essay", icon: "essay", label: "Redação" },
  { id: "reviews", icon: "reviews", label: "Revisões" },
  { id: "diagnostic", icon: "diagnostic", label: "Diagnóstico" },
  { id: "performance", icon: "performance", label: "Desempenho" },
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


function NavIcon({ name }) {
  const common = {
    className: "nav-svg", viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round",
    strokeLinejoin: "round", "aria-hidden": true, focusable: "false",
  };
  switch (name) {
    case "dashboard":
      return <svg {...common}><path d="M3.5 10.5 12 3.8l8.5 6.7v9a1.4 1.4 0 0 1-1.4 1.4H4.9a1.4 1.4 0 0 1-1.4-1.4z" /><path d="M9 20.8v-6.2h6v6.2" /></svg>;
    case "study":
      return <svg {...common}><path d="M4 4.2h12.2a3.8 3.8 0 0 1 3.8 3.8v12H7.5A3.5 3.5 0 0 1 4 16.5z" /><path d="M4 16.5A3.5 3.5 0 0 1 7.5 13H20" /><path d="M8 7.8h7M8 10.5h5" /></svg>;
    case "simulations":
      return <svg {...common}><rect x="5" y="4.5" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4" /></svg>;
    case "essay":
      return <svg {...common}><path d="m4 16.8-.9 4.1 4.1-.9L19.8 7.4a2.1 2.1 0 0 0-3-3z" /><path d="m14.9 6.4 3 3M4 4h7" /></svg>;
    case "reviews":
      return <svg {...common}><path d="M20 8.5A8.5 8.5 0 1 0 20.2 13" /><path d="M20 3.8v5h-5" /><path d="M12 7.5v5l3.2 1.8" /></svg>;
    case "diagnostic":
      return <svg {...common}><rect x="4.5" y="4.5" width="15" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8.2 12.5l2.4 2.4 5.2-5.2" /></svg>;
    case "performance":
      return <svg {...common}><path d="M4 20.5V4M4 20.5h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

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
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function getStudyPlanTimer(activeSession, elapsedSeconds) {
  const plannedSeconds = Math.max(1, Number(activeSession?.plannedMinutes) || 40) * 60;
  const remainingSeconds = plannedSeconds - Math.max(0, Number(elapsedSeconds) || 0);
  const reached = remainingSeconds <= 0;
  return {
    reached,
    value: reached ? "+" + formatElapsed(Math.abs(remainingSeconds)) : formatElapsed(remainingSeconds),
    label: reached ? "Meta atingida · tempo excedido" : "Tempo restante para a meta",
    plannedMinutes: Math.max(1, Number(activeSession?.plannedMinutes) || 40),
    remainingSeconds: Math.max(0, remainingSeconds),
    overtimeSeconds: Math.max(0, -remainingSeconds),
  };
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

function LessonVisualAid({ topic, content }) {
  const title = (topic?.title || "").toLowerCase();
  const intro = (content?.introduction || "").toLowerCase();
  const full = title + " " + intro;
  let aid = null;
  if (/hardware|perif|software|informática|computador/.test(full)) aid = {label:"Mapa do computador", items:[["ENTRADA","Teclado · mouse · scanner"],["PROCESSAMENTO","CPU · memória RAM"],["ARMAZENAMENTO","SSD · HD · pendrive"],["SAÍDA","Monitor · impressora"]],note:"O fluxo ajuda a classificar o papel de cada componente."};
  else if (/interpreta|compreensão|texto|gramática|linguagem/.test(full)) aid = {label:"Como analisar um texto",items:[["1 · LOCALIZE","O que o texto afirma explicitamente?"],["2 · INTERPRETE","Que conclusão é sustentada pelas pistas?"],["3 · CONFIRA","A alternativa extrapola o texto?"]],note:"A resposta precisa ter evidência no texto — plausibilidade não basta."};
  else if (/número|operaç|porcent|fraç|razão|propor|matem|lógic|equação/.test(full)) aid = {label:"Roteiro de resolução",items:[["IDENTIFIQUE","Dados e o que a questão pede"],["ORGANIZE","Operação, fórmula ou relação"],["RESOLVA","Faça uma etapa por vez"],["VALIDAÇÃO","Confira sinal, unidade e resultado"]],note:"Antes de calcular, transforme o enunciado em uma pergunta objetiva."};
  else if (/direito|administra|constitui|lei|princípio|gestão pública/.test(full)) aid = {label:"Aplicação prática",items:[["REGRA","Qual princípio, norma ou conceito se aplica?"],["SITUAÇÃO","Qual é o fato apresentado?"],["ANÁLISE","A conduta respeita a regra?"],["CONCLUSÃO","Justifique com base no conceito"]],note:"Em questões jurídicas, não confunda opinião pessoal com fundamento normativo."};
  else if (/atualidade|notícia|sociedade|economia|política|ambiente|energia|transporte/.test(full)) aid = {label:"Filtro de leitura crítica",items:[["FATO","O que ocorreu? Quando e onde?"],["FONTE","Quem publicou e qual evidência?"],["CONTEXTO","Quais causas e impactos?"],["LIMITE","Fato confirmado ou projeção?"]],note:"Separe informação verificável, interpretação e previsão."};
  else aid = {label:"Estruture o raciocínio",items:[["CONCEITO","Defina a ideia central"],["EXEMPLO","Veja como aparece na prática"],["APLICAÇÃO","Use o conceito em uma situação"],["REVISÃO","Explique sem consultar"]],note:"Use este roteiro para transformar leitura em compreensão ativa."};
  return <div className="lesson-visual-aid"><span className="eyebrow">VISUAL PARA ENTENDER</span><h3>{aid.label}</h3><div className="lesson-visual-flow">{aid.items.map((item,i)=><div className="lesson-visual-node" key={i}><b>{item[0]}</b><span>{item[1]}</span>{i<aid.items.length-1&&<i aria-hidden="true">↓</i>}</div>)}</div><p>{aid.note}</p></div>;
}

function TopicLessonPanel({ topic, lesson, progress, plannedMinutes, activeSession, elapsedSeconds, busy, onStart, onFinish, onMarkComplete, onCancel, onAskTutor, onClose }) {
  const [completionMode, setCompletionMode] = useState(null);
  const [understoodSections, setUnderstoodSections] = useState([]);
  const [revealedChecks, setRevealedChecks] = useState([]);
  const content = lesson?.content || {};
  const sections = content.sections || [];
  const lessonProgressPercent = sections.length ? Math.round((understoodSections.length / sections.length) * 100) : 0;
  function toggleSectionUnderstood(index) { setUnderstoodSections((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); }
  function toggleCheckReveal(index) { setRevealedChecks((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); }
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
        <div className="lesson-start-card"><div className="lesson-start-icon">✦</div><div><span className="eyebrow">MISSÃO DE APRENDIZAGEM</span><h3>Aprenda uma parte por vez. Não tente decorar tudo de uma vez.</h3><p>Leia o bloco, pare por alguns segundos e tente explicar a ideia sem olhar. Isso transforma leitura em memória.</p></div></div>
        <div className="lesson-learning-map"><div className="lesson-learning-map-head"><div><span className="eyebrow">TRILHA DA AULA</span><strong>{understoodSections.length} de {sections.length} etapas dominadas</strong></div><span className="lesson-map-percent">{lessonProgressPercent}%</span></div><div className="lesson-map-track"><span style={{width: lessonProgressPercent + "%"}} /></div><div className="lesson-map-steps">{sections.map((section,index)=><button key={index} className={understoodSections.includes(index) ? "lesson-map-step done" : "lesson-map-step"} onClick={() => document.getElementById("lesson-step-"+index).scrollIntoView({behavior:"smooth",block:"center"})} title={"Ir para: "+section.heading}><span>{understoodSections.includes(index) ? "✓" : index+1}</span></button>)}</div></div>
        <LessonVisualAid topic={topic} content={content} />
        <div className="lesson-section lesson-objectives-card"><span className="eyebrow">AO FINAL, VOCÊ CONSEGUIRÁ</span><ul className="lesson-objectives">{(content.objectives || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        <div className="lesson-section lesson-article"><div className="lesson-article-heading"><span className="eyebrow">APRENDA EM BLOCOS CURTOS</span><p className="muted">Cada bloco tem uma ideia principal e um mini desafio de memória.</p></div>{sections.map((section, index) => <article id={"lesson-step-"+index} className={understoodSections.includes(index) ? "lesson-learning-card understood" : "lesson-learning-card"} key={index}><div className="lesson-learning-card-number">{understoodSections.includes(index) ? "✓" : String(index+1).padStart(2,"0")}</div><div className="lesson-learning-card-content"><div className="lesson-learning-card-title-row"><h3>{section.heading}</h3><span className="lesson-concept-tag">IDEIA-CHAVE</span></div><p>{section.text}</p><div className="lesson-recall-check"><span className="eyebrow">PARE E RECUPERE DA MEMÓRIA</span><strong>Sem olhar o texto: como você explicaria "{section.heading}" para alguém?</strong><button className="text-button lesson-recall-toggle" onClick={() => toggleCheckReveal(index)}>{revealedChecks.includes(index) ? "Ocultar referência" : "Ver referência para conferir"}</button>{revealedChecks.includes(index) && <div className="lesson-recall-answer"><strong>Confira:</strong> {section.text}<p>Se você explicou a ideia com suas próprias palavras, avance. Se não, releia e tente novamente.</p></div>}</div><button className={understoodSections.includes(index) ? "lesson-understood-button active" : "lesson-understood-button"} onClick={() => toggleSectionUnderstood(index)}>{understoodSections.includes(index) ? "✓ Marquei como entendido" : "Marcar como entendido"}</button></div></article>)}</div>
        {content.worked_example && <div className="lesson-example lesson-example-visual"><span className="eyebrow">🧩 EXEMPLO RESOLVIDO — RACIOCÍNIO VISUAL</span><h3>{content.worked_example.prompt}</h3><div className="lesson-example-flow">{(content.worked_example.steps || []).map((step, index) => <div className="lesson-example-flow-step" key={index}><span className="lesson-flow-number">{index+1}</span><p>{step}</p>{index < content.worked_example.steps.length-1 && <span className="lesson-flow-arrow">↓</span>}</div>)}</div><p className="lesson-result"><strong>🎯 Conclusão:</strong> {content.worked_example.result}</p></div>}
        <div className="lesson-two-column">
          <div className="lesson-section lesson-summary"><span className="eyebrow">⚡ REVISÃO EM 30 SEGUNDOS</span><ul>{(content.summary || []).map((item, index) => <li key={index}><span className="lesson-summary-bullet">{index+1}</span>{item}</li>)}</ul></div>
          <div className="lesson-section lesson-mistakes"><span className="eyebrow">⚠️ PEGADINHAS QUE PODEM CUSTAR PONTOS</span><ul>{(content.common_mistakes || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        </div>
        {content.practice && <div className="lesson-practice"><span className="eyebrow">ATIVIDADE DE FIXAÇÃO</span><h3>{content.practice}</h3><p className="muted">Resolva no caderno ou explique a resposta com suas palavras. Depois, pratique questões do banco.</p></div>}
      </>}
      <div className="lesson-session-footer">
        <div className="lesson-progress-copy">
          <span className="eyebrow">SEU PROGRESSO</span>
          <strong>{completed ? "Tópico concluído" : inProgress ? "Em andamento" : "Ainda não iniciado"}</strong>
          <small>Meta desta sessão: {hasActiveSession ? activeSession.plannedMinutes : plannedMinutes} min</small>
        </div>
        <div className="lesson-tutor-action"><button className="button button-secondary" onClick={onAskTutor}>Tirar dúvida com o Professor IA</button></div>
        {hasActiveSession ? (
          <div className="lesson-timer-controls">
            {(() => {
              const timer = getStudyPlanTimer(activeSession, elapsedSeconds);
              return <div className={timer.reached ? "lesson-timer goal-reached" : "lesson-timer"}>
                <span className="session-live-dot" />
                <strong>{timer.value}</strong>
                <small>{timer.label}</small>
              </div>;
            })()}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("aprova-sidebar-collapsed") === "true"; }
    catch { return false; }
  });
  const [assessmentConfirmAction, setAssessmentConfirmAction] = useState(null);
  const [assessmentExitTarget, setAssessmentExitTarget] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("aprova-theme") || "light"; }
    catch { return "light"; }
  });
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
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
  const [plannedMinutes, setPlannedMinutes] = useState(() => {
    try {
      const stored = Number(localStorage.getItem("aprova-plan-minutes"));
      return [15, 40, 90].includes(stored) ? stored : 40;
    } catch {
      return 40;
    }
  });
  const [goalNotificationPermission, setGoalNotificationPermission] = useState(() => {
    try { return typeof Notification === "undefined" ? "unsupported" : Notification.permission; }
    catch { return "unsupported"; }
  });
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lessonSessionBusy, setLessonSessionBusy] = useState(false);
  const notifiedGoalSessionRef = useRef(null);
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
  const [pendingDiagnosticResume, setPendingDiagnosticResume] = useState(null);
  const user = session?.user ?? null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("aprova-theme", theme); } catch { /* armazenamento indisponível */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem("aprova-sidebar-collapsed", String(sidebarCollapsed)); }
    catch { /* armazenamento indisponível */ }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try { localStorage.setItem("aprova-plan-minutes", String(plannedMinutes)); }
    catch { /* armazenamento indisponível */ }
  }, [plannedMinutes]);

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
      notifiedGoalSessionRef.current = null;
      return undefined;
    }

    const updateElapsed = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000));
      setElapsedSeconds(elapsed);

      const targetSeconds = Math.max(1, Number(activeSession.plannedMinutes) || 40) * 60;
      const hasReachedGoal = elapsed >= targetSeconds;
      const alreadyNotified = Boolean(activeSession.goalReachedAt) || notifiedGoalSessionRef.current === activeSession.id;

      if (hasReachedGoal && !alreadyNotified) {
        const reachedAt = new Date(activeSession.startedAt + targetSeconds * 1000).toISOString();
        notifiedGoalSessionRef.current = activeSession.id;
        setActiveSession((current) => current?.id === activeSession.id
          ? { ...current, goalReachedAt: reachedAt }
          : current);
        setNotice("Meta de " + (activeSession.plannedMinutes || 40) + " minutos atingida em “" + (activeSession.lessonTitle || activeSession.topicTitle) + "”. A sessão continua ativa; você pode salvar quando terminar.");

        if (goalNotificationPermission === "granted" && typeof Notification !== "undefined") {
          try {
            new Notification("Meta de estudo atingida", {
              body: (activeSession.lessonTitle || activeSession.topicTitle) + " · " + (activeSession.plannedMinutes || 40) + " minutos. A sessão continua ativa.",
              tag: "aprova-study-goal-" + activeSession.id,
            });
          } catch { /* o aviso interno continua disponível */ }
        }

        supabase.from("lesson_study_sessions")
          .update({ goal_reached_at: reachedAt })
          .eq("id", activeSession.id)
          .eq("status", "em_andamento")
          .then(({ error }) => {
            if (error) setNotice("Meta atingida. O aviso apareceu, mas não foi possível salvar o marco no histórico: " + error.message);
          });
      }
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession?.id, activeSession?.startedAt, activeSession?.plannedMinutes, activeSession?.goalReachedAt, goalNotificationPermission]);

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

      const { data: openDiagnosticData, error: openDiagnosticError } = await supabase.from("assessment_runs")
        .select("id, started_at, question_count")
        .eq("user_id", currentUser.id)
        .eq("exam_id", examData.id)
        .eq("run_type", "diagnostico")
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (openDiagnosticError) throw openDiagnosticError;
      setPendingDiagnosticResume(openDiagnosticData || null);

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
        .select("id, lesson_type, topic_id, essay_lesson_id, lesson_title, started_at, planned_minutes, goal_reached_at")
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
          plannedMinutes: Number(activeLessonSessionData.planned_minutes || 40),
          goalReachedAt: activeLessonSessionData.goal_reached_at || null,
        };
        setPlannedMinutes(restoredSession.plannedMinutes);
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
          planned_minutes: plannedMinutes,
          goal_reached_at: null,
        })
        .select("id, started_at, planned_minutes, goal_reached_at")
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
        plannedMinutes: Number(sessionRow.planned_minutes || plannedMinutes),
        goalReachedAt: sessionRow.goal_reached_at || null,
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
          planned_minutes: plannedMinutes,
          goal_reached_at: null,
        })
        .select("id, started_at, planned_minutes, goal_reached_at")
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
        plannedMinutes: Number(sessionRow.planned_minutes || plannedMinutes),
        goalReachedAt: sessionRow.goal_reached_at || null,
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

  async function enableGoalNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setGoalNotificationPermission("unsupported");
      setNotice("Este navegador não oferece notificações. O aviso dentro da plataforma continuará funcionando.");
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setGoalNotificationPermission(permission);
      setNotice(permission === "granted"
        ? "Notificações ativadas. Você receberá um aviso do navegador ao atingir a meta do bloco."
        : permission === "denied"
          ? "As notificações foram bloqueadas pelo navegador. O aviso dentro da plataforma continuará funcionando."
          : "A permissão de notificações não foi concedida. O aviso dentro da plataforma continuará funcionando.");
    } catch (error) {
      setNotice(error.message || "Não foi possível ativar as notificações.");
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

  async function beginDiagnostic() {
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
      const { data, error } = await supabase.functions.invoke("diagnostic-session", {
        body: { action: "start" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.run_id || !Array.isArray(data.questions) || data.questions.length !== 22) {
        throw new Error("O servidor não retornou uma sequência válida de 22 questões.");
      }

      const restoredAttempts = Array.isArray(data.attempts) ? data.attempts : [];
      if (restoredAttempts.length > 22) {
        throw new Error("A tentativa contém mais respostas que o limite do diagnóstico. Nenhuma resposta foi alterada.");
      }

      const finalQuestionPending = data.completed_pending === true && restoredAttempts.length === 22;
      const lastAttempt = finalQuestionPending ? restoredAttempts[restoredAttempts.length - 1] : null;
      const lastFeedback = finalQuestionPending && data.last_answer_feedback
        ? { ...data.last_answer_feedback, recorded: true, restored: true }
        : null;
      const startedAt = Date.parse(data.started_at);

      setQuizQuestions(data.questions);
      setQuizRunId(data.run_id);
      setQuizIndex(finalQuestionPending ? 21 : restoredAttempts.length);
      setSelectedOption(lastAttempt?.selected_option || "");
      setFeedback(lastFeedback);
      setResponses(restoredAttempts.map((attempt) => ({
        questionId: attempt.question_id,
        isCorrect: Boolean(attempt.is_correct),
        points: Number(attempt.points || 1),
        topicId: attempt.topic_id || null,
      })));
      setQuizStartedAt(Number.isFinite(startedAt) ? startedAt : Date.now());
      setQuestionStartedAt(Date.now());
      setPendingDiagnosticResume(null);
      setView("diagnostic");
      setNotice(data.resumed
        ? "Diagnóstico retomado. " + restoredAttempts.length + " de 22 respostas foram recuperadas."
        : "Diagnóstico iniciado. Sua sequência de questões e respostas será preservada automaticamente.");
    } catch (err) {
      setNotice(err.message || "Não foi possível iniciar ou retomar o diagnóstico.");
    } finally {
      diagnosticStartLock.current = false;
      setBusy(false);
    }
  }

  function startDiagnostic() {
    if (view === "diagnostic" && quizRunId) {
      setNotice("O diagnóstico já está em andamento. Continue de onde parou.");
      return;
    }
    setAssessmentConfirmAction("start-diagnostic");
  }

  async function confirmAssessmentAction() {
    const action = assessmentConfirmAction;
    const destination = assessmentExitTarget;
    setAssessmentConfirmAction(null);
    if (action === "start-diagnostic") {
      await beginDiagnostic();
      return;
    }
    if (action === "leave-diagnostic") {
      await leaveAssessmentNow(destination);
      return;
    }
    if (action === "finish-diagnostic") await finishDiagnosticNow();
  }

  function requestAssessmentExit(destination = "dashboard") {
    if (quizMode === "diagnostico" && view === "diagnostic" && quizRunId) {
      setAssessmentExitTarget(destination);
      setAssessmentConfirmAction("leave-diagnostic");
      return;
    }
    setView(destination);
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

  function leaveAssessment() {
    if (quizMode === "diagnostico" && quizRunId) {
      setAssessmentExitTarget("dashboard");
      setAssessmentConfirmAction("leave-diagnostic");
      return;
    }
    return leaveAssessmentNow("dashboard");
  }

  async function leaveAssessmentNow(destination = "dashboard") {
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
    setView(destination);
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

    if (quizMode === "diagnostico") {
      setAssessmentConfirmAction("finish-diagnostic");
      return;
    }
    await finishDiagnosticNow();
  }

  async function finishDiagnosticNow() {
    if (!quizRunId || !user) return;
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
    setProfileMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice(error.message || "Não foi possível encerrar a sessão.");
      return;
    }
    setSession(null);
    setView("dashboard");
    setSubjectRows([]);
  }

  function updateProfilePreference(key, value) {
    setProfile((current) => ({
      ...(current || {}),
      study_preferences: { ...(current?.study_preferences || {}), [key]: value },
    }));
  }

  async function saveProfile() {
    if (!user?.id || !profile) return;
    setProfileSaving(true);
    setNotice("");
    try {
      const payload = {
        user_id: user.id,
        display_name: profile.display_name?.trim() || null,
        experience_level: profile.experience_level || "basico",
        availability_mode: profile.availability_mode || "variavel",
        work_schedule: profile.work_schedule || null,
        weekday_min_minutes: Number(profile.weekday_min_minutes) || 15,
        weekday_target_minutes: Number(profile.weekday_target_minutes) || 40,
        weekend_target_minutes: Number(profile.weekend_target_minutes) || 90,
        target_exam_date: profile.target_exam_date || EXAM_DAY,
        preferred_devices: profile.preferred_devices || ["desktop", "mobile"],
        study_preferences: profile.study_preferences || {},
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("study_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      setProfile(data);
      setNotice("Perfil atualizado e salvo com sucesso.");
    } catch (err) {
      setNotice(err.message || "Não foi possível salvar seu perfil.");
    } finally {
      setProfileSaving(false);
    }
  }

  if (!isSupabaseConfigured) {
    return <div className="config-screen"><div className="config-card"><span className="brand-mark">A</span><h1>Configure o Supabase</h1><p>Crie um arquivo .env.local usando .env.example e informe a URL e a publishable key do projeto Aprova.</p></div></div>;
  }
  if (booting) return <div className="loading-screen"><span className="loader" /><span>Preparando seu ambiente de estudos...</span></div>;
  if (!user) return <AuthScreen theme={theme} setTheme={setTheme} />;

  return (
    <div className={sidebarCollapsed ? "app-shell sidebar-is-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <div className="sidebar-top-row">
          <div className="brand-lockup brand-dark"><span className="brand-mark">A</span><span>APROVA</span></div>
          <button className="sidebar-collapse-toggle" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Minimizar menu lateral"} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={sidebarCollapsed ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} /></svg>
          </button>
        </div>
        <div className="sidebar-label">ÁREA DE ESTUDOS</div>
        <nav className="side-nav">
          {NAV_ITEMS.filter((item) => item.id !== "tutor").map((item) => (
            <button key={item.id} title={sidebarCollapsed ? item.label : undefined} aria-label={item.label} className={view === item.id || (view === "results" && item.id === (quizResult?.mode === "simulado" ? "simulations" : "diagnostic")) || (view === "simulation" && item.id === "simulations") ? "nav-link active" : "nav-link"} onClick={() => item.id === "diagnostic" ? startDiagnostic() : requestAssessmentExit(item.id)}>
              <span className="nav-icon"><NavIcon name={item.id} /></span><span className="nav-label">{item.label}</span>
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
          <div><span className="eyebrow">CONCURSO SBMG · 2026</span><div className="topbar-title">{view === "simulation" ? "Simulado completo" : view === "profile" ? "Meu perfil" : NAV_ITEMS.find((item) => item.id === view)?.label || (view === "results" ? (quizResult?.mode === "simulado" ? "Resultado do simulado" : "Resultado do diagnóstico") : "Área do candidato")}</div></div>
          <div className="topbar-right">
            <span className="top-date">{formatDate(new Date())}</span>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
              <span>{theme === "dark" ? "☼" : "◐"}</span>
            </button>
            <button
              className={view === "tutor" ? "topbar-tutor-button active" : "topbar-tutor-button"}
              type="button"
              onClick={() => requestAssessmentExit("tutor")}
              aria-label="Abrir Professor IA"
              title="Professor IA"
            >
              <span className="topbar-tutor-icon">✦</span>
            </button>
            <div className="profile-menu-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setProfileMenuOpen(false); }}>
              <button className="topbar-user profile-menu-trigger" type="button" aria-haspopup="menu" aria-expanded={profileMenuOpen} aria-label="Menu do usuário" onClick={() => setProfileMenuOpen((open) => !open)}>
                <span className="topbar-user-name" title={user.email}>{profile?.display_name || user.email?.split("@")[0] || "Candidato"}</span>
                <span className="avatar avatar-small" aria-hidden="true">{(profile?.display_name || user.email || "A").slice(0, 1).toUpperCase()}</span>
                <span className="profile-menu-chevron" aria-hidden="true">⌄</span>
              </button>
              {profileMenuOpen && <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-heading"><strong>{profile?.display_name || user.email?.split("@")[0] || "Candidato"}</strong><small>{user.email}</small></div>
                <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); setView("profile"); }}><span>◉</span> Meu perfil</button>
                <button type="button" role="menuitem" className="profile-dropdown-logout" onClick={signOut}><span>↪</span> Sair da sessão</button>
              </div>}
            </div>
          </div>
        </header>
        {notice && <div className="global-notice"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
        {activeSession && (
          <div className="active-session-strip">
            <div><span className="session-live-dot" /><strong>Sessão em andamento</strong><small>{activeSession.lessonTitle || activeSession.topicTitle}</small></div>
            {(() => {
              const timer = getStudyPlanTimer(activeSession, elapsedSeconds);
              return <div className={timer.reached ? "active-session-timer reached" : "active-session-timer"}>
                <b>{timer.value}</b>
                <small>{timer.reached ? "excedido" : "restante"} · meta {timer.plannedMinutes} min</small>
              </div>;
            })()}
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


        {assessmentConfirmAction && (
          <div className="lesson-confirm-backdrop" role="presentation">
            <div className="lesson-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="assessment-confirm-title">
              <span className="eyebrow">CONFIRMAÇÃO DO DIAGNÓSTICO</span>
              <h3 id="assessment-confirm-title">
                {assessmentConfirmAction === "start-diagnostic"
                  ? "Iniciar o diagnóstico?"
                  : assessmentConfirmAction === "leave-diagnostic"
                    ? "Sair do diagnóstico?"
                    : "Finalizar o diagnóstico?"}
              </h3>
              <p>
                {assessmentConfirmAction === "start-diagnostic"
                  ? pendingDiagnosticResume
                    ? "Encontramos uma tentativa em andamento. Ao confirmar, a sequência de questões e as respostas já registradas serão recuperadas para você continuar de onde parou."
                    : "Serão carregadas 22 questões e o cronômetro começará. A sequência de questões ficará salva para permitir a retomada se você atualizar a página."
                  : assessmentConfirmAction === "leave-diagnostic"
                    ? "A avaliação será encerrada. As respostas já enviadas poderão compor um resultado parcial; questões ainda não respondidas não serão registradas."
                    : "Suas respostas serão enviadas para correção e o resultado será calculado. Depois disso, esta tentativa não poderá continuar."}
              </p>
              <p className="lesson-confirm-warning">
                {assessmentConfirmAction === "start-diagnostic"
                  ? "Se você apenas queria abrir a área, escolha voltar. A tentativa só será iniciada ou retomada depois desta confirmação."
                  : assessmentConfirmAction === "leave-diagnostic"
                    ? "Só confirme se realmente deseja interromper esta tentativa."
                    : "Confirme somente depois de revisar suas respostas."}
              </p>
              <div className="lesson-confirm-actions">
                <button className="button button-secondary" onClick={() => setAssessmentConfirmAction(null)} disabled={busy}>Não, voltar</button>
                <button className="button button-primary" onClick={confirmAssessmentAction} disabled={busy}>
                  {busy ? "Processando..." : assessmentConfirmAction === "start-diagnostic" ? "Sim, iniciar ou retomar" : assessmentConfirmAction === "leave-diagnostic" ? "Sim, sair" : "Sim, finalizar diagnóstico"}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "profile" && (
          <section className="content-section profile-page">
            <div className="page-heading">
              <span className="eyebrow">CONTA E PREFERÊNCIAS</span>
              <h1>Meu perfil</h1>
              <p className="muted">Atualize seus dados e preferências de preparação. As alterações ficam salvas na sua conta.</p>
            </div>
            <div className="profile-layout">
              <div className="panel profile-card">
                <div className="profile-card-avatar">{(profile?.display_name || user.email || "A").slice(0, 1).toUpperCase()}</div>
                <h2>{profile?.display_name || "Seu perfil"}</h2>
                <p>{user.email}</p>
                <span className="profile-account-badge">Conta autenticada</span>
                <div className="profile-card-note">Seu progresso, simulados, revisões e sessões de estudo permanecem vinculados a esta conta.</div>
              </div>
              <form className="panel profile-form" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
                <div className="panel-heading"><div><span className="eyebrow">DADOS PESSOAIS</span><h2>Informações do candidato</h2></div></div>
                <div className="profile-form-grid">
                  <label>Nome de exibição
                    <input value={profile?.display_name || ""} onChange={(e) => setProfile((current) => ({ ...(current || {}), display_name: e.target.value }))} placeholder="Como deseja ser chamado?" maxLength={80} />
                  </label>
                  <label>E-mail
                    <input value={user.email || ""} disabled readOnly />
                    <small>O e-mail da conta não pode ser alterado aqui.</small>
                  </label>
                  <label>Telefone
                    <input value={profile?.study_preferences?.phone || ""} onChange={(e) => updateProfilePreference("phone", e.target.value)} placeholder="(00) 00000-0000" autoComplete="tel" />
                  </label>
                  <label>Ocupação atual
                    <input value={profile?.study_preferences?.occupation || ""} onChange={(e) => updateProfilePreference("occupation", e.target.value)} placeholder="Sua ocupação" />
                  </label>
                  <label>Escolaridade
                    <select value={profile?.study_preferences?.education || ""} onChange={(e) => updateProfilePreference("education", e.target.value)}>
                      <option value="">Selecione</option><option>Ensino fundamental</option><option>Ensino médio</option><option>Ensino técnico</option><option>Graduação em andamento</option><option>Graduação completa</option><option>Pós-graduação</option><option>Mestrado</option><option>Doutorado</option>
                    </select>
                  </label>
                  <div className="profile-location-fields">
                    <label>Cidade
                      <input value={profile?.study_preferences?.city || ""} onChange={(e) => updateProfilePreference("city", e.target.value)} placeholder="Cidade" />
                    </label>
                    <label>Estado
                      <select value={profile?.study_preferences?.state || ""} onChange={(e) => updateProfilePreference("state", e.target.value)}>
                        <option value="">UF</option>{["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="profile-form-divider" />
                <div className="panel-heading"><div><span className="eyebrow">PREPARAÇÃO</span><h2>Preferências de estudo</h2></div></div>
                <div className="profile-form-grid">
                  <label>Nível atual
                    <select value={profile?.experience_level || "basico"} onChange={(e) => setProfile((current) => ({ ...(current || {}), experience_level: e.target.value }))}>
                      <option value="basico">Básico</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option>
                    </select>
                  </label>
                  <label>Disponibilidade
                    <select value={profile?.availability_mode || "variavel"} onChange={(e) => setProfile((current) => ({ ...(current || {}), availability_mode: e.target.value }))}>
                      <option value="variavel">Variável</option><option value="fixa">Fixa</option>
                    </select>
                  </label>
                  <label className="profile-field-full">Rotina / horário disponível
                    <textarea rows={3} value={profile?.work_schedule || ""} onChange={(e) => setProfile((current) => ({ ...(current || {}), work_schedule: e.target.value }))} placeholder="Descreva seus horários e limitações de estudo" />
                  </label>
                  <label>Meta mínima (dias úteis, min)
                    <input type="number" min="1" max="600" value={profile?.weekday_min_minutes ?? 15} onChange={(e) => setProfile((current) => ({ ...(current || {}), weekday_min_minutes: Number(e.target.value) }))} />
                  </label>
                  <label>Meta alvo (dias úteis, min)
                    <input type="number" min="1" max="600" value={profile?.weekday_target_minutes ?? 40} onChange={(e) => setProfile((current) => ({ ...(current || {}), weekday_target_minutes: Number(e.target.value) }))} />
                  </label>
                  <label>Meta alvo (fins de semana, min)
                    <input type="number" min="1" max="600" value={profile?.weekend_target_minutes ?? 90} onChange={(e) => setProfile((current) => ({ ...(current || {}), weekend_target_minutes: Number(e.target.value) }))} />
                  </label>
                  <label>Data-alvo da prova
                    <input type="date" value={profile?.target_exam_date || EXAM_DAY} onChange={(e) => setProfile((current) => ({ ...(current || {}), target_exam_date: e.target.value }))} />
                  </label>
                </div>
                <div className="profile-devices"><strong>Dispositivos preferidos</strong><div>
                  {["desktop","mobile","tablet"].map((device) => <label key={device}><input type="checkbox" checked={(profile?.preferred_devices || ["desktop","mobile"]).includes(device)} onChange={(e) => { const old = profile?.preferred_devices || ["desktop","mobile"]; setProfile((current) => ({ ...(current || {}), preferred_devices: e.target.checked ? [...old.filter((item) => item !== device), device] : old.filter((item) => item !== device) })); }} />{device === "desktop" ? "Computador" : device === "mobile" ? "Celular" : "Tablet"}</label>)}
                </div></div>
                <div className="profile-form-footer"><span className="muted small-copy">Não esqueça de salvar para registrar as alterações.</span><button className="button button-primary" type="submit" disabled={profileSaving}>{profileSaving ? "Salvando..." : "Salvar alterações"}</button></div>
              </form>
            </div>
          </section>
        )}

        {view === "dashboard" && (
          <section className="content-section">
            <div className="welcome-row">
              <div><span className="eyebrow">BEM-VINDO À SUA PREPARAÇÃO</span><h1>Um passo de cada vez.</h1><p className="muted">O plano se adapta aos dias corridos e aos períodos com mais disponibilidade.</p></div>
              <button className="button button-primary" onClick={startDiagnostic} disabled={busy}>{pendingDiagnosticResume ? "Retomar diagnóstico" : "Fazer diagnóstico inicial"} <span>→</span></button>
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
                <p className="muted small-copy">Escolha a meta da próxima sessão. Ao iniciar uma aula, o cronômetro fará a contagem regressiva e avisará quando a meta for atingida, sem encerrar a aula automaticamente.</p>
                <div className="study-options">
                  <button className={plannedMinutes === 15 ? "selected" : ""} aria-pressed={plannedMinutes === 15} onClick={() => { setPlannedMinutes(15); setView("study"); }}><strong>15 min</strong><span>Dia corrido</span></button>
                  <button className={plannedMinutes === 40 ? "selected" : ""} aria-pressed={plannedMinutes === 40} onClick={() => { setPlannedMinutes(40); setView("study"); }}><strong>40 min</strong><span>Rotina normal</span></button>
                  <button className={plannedMinutes === 90 ? "selected" : ""} aria-pressed={plannedMinutes === 90} onClick={() => { setPlannedMinutes(90); setView("study"); }}><strong>90 min</strong><span>Bloco de fim de semana</span></button>
                </div>
                <div className="plan-current-target">
                  <div><span className="eyebrow">META SELECIONADA</span><strong>{plannedMinutes} minutos</strong><small>Equivale a {formatElapsed(plannedMinutes * 60)} de estudo.</small></div>
                  {goalNotificationPermission === "granted" ? (
                    <span className="plan-notification-state enabled">✓ Aviso do navegador ativado</span>
                  ) : goalNotificationPermission === "unsupported" ? (
                    <span className="plan-notification-state">Aviso dentro da plataforma</span>
                  ) : goalNotificationPermission === "denied" ? (
                    <span className="plan-notification-state blocked">Avisos bloqueados nas permissões do navegador</span>
                  ) : (
                    <button className="text-button plan-notification-button" type="button" onClick={enableGoalNotifications}>
                      Ativar aviso no navegador
                    </button>
                  )}
                </div>
                {activeSession && (
                  <div className="plan-active-note">
                    Esta sessão está usando a meta de {activeSession.plannedMinutes} minutos. Alterar a seleção acima afeta somente a próxima sessão.
                  </div>
                )}
                <div className="plan-tip"><span>✦</span><p><strong>Meta flexível, não limite obrigatório.</strong><br />Quando o tempo terminar, o sistema avisa e continua contando o excedente até você salvar ou cancelar a sessão.</p></div>
                <button className="button button-primary button-wide" onClick={startDiagnostic}>{pendingDiagnosticResume ? "Retomar diagnóstico" : "Começar pelo diagnóstico"}</button>
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
                  key={selectedTopic.id}
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
                <div className="study-weight-note"><strong>Meta da próxima sessão: {plannedMinutes} minutos</strong><span>Abra uma aula e confirme o início. O cronômetro avisará ao atingir a meta, sem encerrar a sessão.</span></div>
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
                        <div><span className="session-live-dot" /><span className="eyebrow">META DE {activeSession.plannedMinutes} MIN · {getStudyPlanTimer(activeSession, elapsedSeconds).label.toUpperCase()}</span></div>
                        <strong className={getStudyPlanTimer(activeSession, elapsedSeconds).reached ? "goal-reached-text" : ""}>{getStudyPlanTimer(activeSession, elapsedSeconds).value}</strong>
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
