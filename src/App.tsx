import { useState, useEffect, useRef } from "react";
import Joyride, { Step } from "react-joyride";

/* ═══════════════════════════════════════════════════════
   TYPES & INTERFACES
═══════════════════════════════════════════════════════ */
interface CardItem {
  id: number;
  type: "verb" | "particle" | "action";
  val: string;
  pts: number;
  act?: "steal" | "swap" | "block" | "double";
}

interface NotifData {
  who?: "p1" | "p2" | "cpu";
  valid?: boolean;
  key?: string;
  ex?: string;
  pts?: number;
  pass?: boolean;
  bl?: boolean;
  noPlay?: boolean;
  action?: boolean;
  act?: "steal" | "swap" | "block" | "double";
  failed?: boolean;
}

interface CardProps {
  card: CardItem;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
}

type Difficulty = "easy" | "medium" | "hard";
type GameMode = "solo" | "multi";
type GamePhase = "menu" | "p1" | "p2" | "cpu" | "end";

/* ═══════════════════════════════════════════════════════
   INITIAL DECK & DATA
═══════════════════════════════════════════════════════ */
const INITIAL_VERBS = [
  { val: "GET", pts: 2 }, { val: "LOOK", pts: 2 }, { val: "TAKE", pts: 3 },
  { val: "RUN", pts: 3 }, { val: "BRING", pts: 4 }, { val: "PUT", pts: 3 },
  { val: "GIVE", pts: 4 }, { val: "CALL", pts: 2 }, { val: "BREAK", pts: 4 }
];

const INITIAL_PARTICLES = [
  { val: "UP", pts: 2 }, { val: "OUT", pts: 3 }, { val: "OFF", pts: 4 },
  { val: "ON", pts: 2 }, { val: "DOWN", pts: 3 }, { val: "AWAY", pts: 4 },
  { val: "IN", pts: 2 }, { val: "AFTER", pts: 4 }, { val: "BACK", pts: 3 }
];

const VALID_COMBOS: Record<string, { ex: string; bonus: number }> = {
  "GET_UP": { ex: "Levantar-se da cama", bonus: 2 },
  "GET_OUT": { ex: "Sair de algum lugar", bonus: 1 },
  "LOOK_AFTER": { ex: "Cuidar de alguém/algo", bonus: 4 },
  "LOOK_UP": { ex: "Pesquisar uma informação", bonus: 2 },
  "TAKE_OFF": { ex: "Decolar (avião) ou tirar roupa", bonus: 4 },
  "RUN_AWAY": { ex: "Fugir de algo/alguém", bonus: 3 },
  "RUN_OUT": { val: "Ficar sem estoque/esgotar", bonus: 3 },
  "BRING_BACK": { ex: "Devolver algo ou relembrar", bonus: 4 },
  "PUT_ON": { ex: "Vestir uma roupa/calçado", bonus: 2 },
  "PUT_DOWN": { ex: "Insultar ou pousar objeto", bonus: 2 },
  "GIVE_UP": { ex: "Desistir de algo", bonus: 5 },
  "CALL_OFF": { ex: "Cancelar um evento", bonus: 4 },
  "BREAK_DOWN": { ex: "Enguiçar ou desabar emocionalmente", bonus: 4 }
};

function createDeck(): CardItem[] {
  const deck: CardItem[] = [];
  let id = 1;

  for (let i = 0; i < 3; i++) {
    INITIAL_VERBS.forEach(v => deck.push({ id: id++, type: "verb", val: v.val, pts: v.pts }));
    INITIAL_PARTICLES.forEach(p => deck.push({ id: id++, type: "particle", val: p.val, pts: p.pts }));
  }

  const actions: { val: string; act: "steal" | "swap" | "block" | "double" }[] = [
    { val: "⚡ STEAL", act: "steal" },
    { val: "🔄 SWAP", act: "swap" },
    { val: "🛡️ BLOCK", act: "block" },
    { val: "💥 DOUBLE", act: "double" }
  ];

  actions.forEach(act => {
    for (let i = 0; i < 3; i++) {
      deck.push({ id: id++, type: "action", val: act.val, pts: 0, act: act.act });
    }
  });

  return deck.sort(() => Math.random() - 0.5);
}

/* ═══════════════════════════════════════════════════════
   CARD COMPONENT
═══════════════════════════════════════════════════════ */
const Card = ({ card, selected, onClick, faceDown }: CardProps) => {
  const getTheme = () => {
    if (faceDown) return { border: "#333", bg: "#111424", glow: "rgba(0,0,0,0)", txt: "#555" };
    switch (card.type) {
      case "verb": return { border: "#3355ff", bg: "#0d1b40", glow: "rgba(51,85,255,0.4)", txt: "#88a0ff" };
      case "particle": return { border: "#ff7700", bg: "#40220d", glow: "rgba(255,119,0,0.4)", txt: "#ffb380" };
      case "action": return { border: "#ff1144", bg: "#400d1a", glow: "rgba(255,17,68,0.4)", txt: "#ff8099" };
    }
  };

  const t = getTheme();
  const isSpecial = card.type === "action";

  return (
    <div
      className={`${isSpecial ? "special-card" : ""}`}
      onClick={faceDown ? undefined : onClick}
      style={{
        width: 105,
        height: 155,
        borderRadius: 12,
        border: `2px solid ${selected ? "#fff" : t.border}`,
        background: t.bg,
        boxShadow: selected ? "0 0 22px #fff" : `0 0 12px ${t.glow}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 10,
        cursor: faceDown ? "default" : "pointer",
        userSelect: "none",
        position: "relative",
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s, border-color 0.2s",
        transform: selected ? "translateY(-15px) scale(1.05)" : "translateY(0) scale(1)",
      }}
    >
      {faceDown ? (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 24, color: "#1f2d5a", filter: "drop-shadow(0 0 5px #3355ff)" }}>MATRIX</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: t.border, letterSpacing: 1 }}>{card.type.toUpperCase()}</span>
            {card.pts > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>+{card.pts}</span>}
          </div>
          <div style={{ fontSize: card.val.length > 7 ? 13 : 16, fontWeight: 800, color: "#fff", textAlign: "center", margin: "auto 0", letterSpacing: 0.5 }}>
            {card.val}
          </div>
          <div style={{ fontSize: 8, color: t.txt, textAlign: "right" }}>CYBER_CARD_v1.2</div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<GamePhase>("menu");

  const [deck, setDeck] = useState<CardItem[]>([]);
  const [p1Hand, setP1Hand] = useState<CardItem[]>([]);
  const [p2Hand, setP2Hand] = useState<CardItem[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [round, setRound] = useState(1);

  const [p1Blocked, setP1Blocked] = useState(false);
  const [p2Blocked, setP2Blocked] = useState(false);
  const [p1Dbl, setP1Dbl] = useState(false);
  const [p2Dbl, setP2Dbl] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notif, setNotif] = useState<NotifData | null>(null);
  const [tourRun, setTourRun] = useState(false);

  const tourSteps: Step[] = [
    {
      target: ".player-hand",
      content: "Aqui ficam as cartas da sua mão. Clique nelas para selecionar e formar combos.",
      disableBeacon: true,
    },
    {
      target: ".special-card",
      content: "Cartas de Ação (STEAL, SWAP, BLOCK, DOUBLE) aplicam efeitos cibernéticos imediatamente.",
      disableBeacon: true,
    },
    {
      target: ".play-btn",
      content: "Após selecionar Verbo + Partícula ou uma única Ação, clique aqui para lançar a jogada.",
      disableBeacon: true,
    }
  ];

  useEffect(() => {
    const fresh = localStorage.getItem("cyber_phrasal_tour_done");
    if (!fresh) {
      setTourRun(true);
    }
  }, []);

  const handleTourEnd = (data: any) => {
    if (["finished", "skipped"].includes(data.status)) {
      localStorage.setItem("cyber_phrasal_tour_done", "true");
      setTourRun(false);
    }
  };

  const startGame = (mode: GameMode, diff: Difficulty) => {
    setGameMode(mode);
    setDifficulty(diff);
    const newDeck = createDeck();
    const p1 = newDeck.splice(0, 5);
    const p2 = newDeck.splice(0, 5);

    setDeck(newDeck);
    setP1Hand(p1);
    setP2Hand(p2);
    setP1Score(0);
    setP2Score(0);
    setRound(1);
    setP1Blocked(false);
    setP2Blocked(false);
    setP1Dbl(false);
    setP2Dbl(false);
    setSelectedIds([]);
    setNotif(null);
    setPhase("p1");
  };

  const selectCard = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const passTurn = () => {
    setSelectedIds([]);
    const current = phase;

    if (gameMode === "multi") {
      if (current === "p1") {
        setPhase("p2");
        setNotif({ who: "p1", pass: true });
      } else {
        advanceRound();
      }
    } else {
      setPhase("cpu");
      setNotif({ who: "p1", pass: true });
    }
  };

  const advanceRound = () => {
    if (round >= 5) {
      setPhase("end");
      return;
    }

    let currentDeck = [...deck];
    const fillHand = (hand: CardItem[]) => {
      const needed = 5 - hand.length;
      const added: CardItem[] = [];
      for (let i = 0; i < needed; i++) {
        if (currentDeck.length > 0) added.push(currentDeck.shift()!);
      }
      return [...hand, ...added];
    };

    const nextP1 = fillHand(p1Hand);
    const nextP2 = fillHand(p2Hand);

    setDeck(currentDeck);
    setP1Hand(nextP1);
    setP2Hand(nextP2);
    setP1Blocked(false);
    setP2Blocked(false);
    setRound(prev => prev + 1);
    setPhase("p1");
  };

  // EXECUTA AI JOGADA CIBERNETICA
  useEffect(() => {
    if (phase === "cpu" && gameMode === "solo") {
      const timer = setTimeout(() => {
        executeCPUTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const executeCPUTurn = () => {
    if (p2Blocked) {
      setNotif({ who: "cpu", bl: true });
      advanceRound();
      return;
    }

    // CHANCE DE PASSAR NO FACIL
    if (difficulty === "easy" && Math.random() < 0.4) {
      setNotif({ who: "cpu", pass: true });
      advanceRound();
      return;
    }

    const verbs = p2Hand.filter(c => c.type === "verb");
    const parts = p2Hand.filter(c => c.type === "particle");
    const acts = p2Hand.filter(c => c.type === "action");

    // BUSCA DE COMBOS VALIDOS
    let bestCombo: { v: CardItem; p: CardItem; key: string; score: number } | null = null;
    for (const v of verbs) {
      for (const p of parts) {
        const key = `${v.val}_${p.val}`;
        if (VALID_COMBOS[key]) {
          const score = v.pts + p.pts + VALID_COMBOS[key].bonus;
          if (!bestCombo || score > bestCombo.score) {
            bestCombo = { v, p, key, score };
          }
        }
      }
    }

    // LOGICA ESTRATEGICA REVOLUCIONARIA (DIFICIL)
    if (difficulty === "hard") {
      const hasSteal = acts.find(c => c.act === "steal");
      const hasBlock = acts.find(c => c.act === "block");
      const hasDouble = acts.find(c => c.act === "double");

      if (hasSteal && p1Score > p2Score + 5) {
        applyActionCPU(hasSteal);
        return;
      }
      if (hasBlock && p1Score > p2Score && !p1Blocked) {
        applyActionCPU(hasBlock);
        return;
      }
      if (hasDouble && bestCombo && bestCombo.score >= 7) {
        setP2Dbl(true);
        const comboPts = bestCombo.score * 2;
        setP2Score(prev => prev + comboPts);
        setP2Hand(prev => prev.filter(c => c.id !== bestCombo!.v.id && c.id !== bestCombo!.p.id && c.id !== hasDouble.id));
        setNotif({ who: "cpu", valid: true, key: bestCombo.key, ex: VALID_COMBOS[bestCombo.key].ex, pts: comboPts });
        setP2Dbl(false);
        advanceRound();
        return;
      }
    }

    // COMPORTAMENTO MEDIO / PADRAO (SE HIGHEST COMBO EXISTIR)
    if (bestCombo && (difficulty === "medium" || difficulty === "hard" || Math.random() > 0.3)) {
      let multiplier = p2Dbl ? 2 : 1;
      const finalPts = bestCombo.score * multiplier;
      setP2Score(prev => prev + finalPts);
      setP2Hand(prev => prev.filter(c => c.id !== bestCombo!.v.id && c.id !== bestCombo!.p.id));
      setNotif({ who: "cpu", valid: true, key: bestCombo.key, ex: VALID_COMBOS[bestCombo.key].ex, pts: finalPts });
      setP2Dbl(false);
      advanceRound();
      return;
    }

    // EXECUÇÃO DE AÇÃO RESERVA CASO NÃO HOUVER COMBO VÁLIDO
    if (acts.length > 0) {
      applyActionCPU(acts[0]);
      return;
    }

    // SE NAO CONSEGUIR JOGAR NADA, APENAS PASSA
    setNotif({ who: "cpu", pass: true });
    advanceRound();
  };

  const applyActionCPU = (card: CardItem) => {
    setP2Hand(prev => prev.filter(c => c.id !== card.id));
    if (card.act === "block") {
      setP1Blocked(true);
      setNotif({ who: "cpu", action: true, act: "block" });
      advanceRound();
    } else if (card.act === "steal") {
      const amt = Math.min(p1Score, 4);
      setP1Score(p => p - amt);
      setP2Score(p => p + amt);
      setNotif({ who: "cpu", action: true, act: "steal", pts: amt });
      advanceRound();
    } else if (card.act === "swap") {
      const s1 = p1Score;
      setP1Score(p2Score);
      setP2Score(s1);
      setNotif({ who: "cpu", action: true, act: "swap" });
      advanceRound();
    } else if (card.act === "double") {
      setP2Dbl(true);
      setNotif({ who: "cpu", action: true, act: "double" });
      advanceRound();
    }
  };

  // LANÇAR JOGADA DO JOGADOR ATUAL
  const executePlayerTurn = () => {
    const currentHand = phase === "p1" ? p1Hand : p2Hand;
    const setHand = phase === "p1" ? setP1Hand : setP2Hand;
    const isBlocked = phase === "p1" ? p1Blocked : p2Blocked;

    if (isBlocked) {
      setNotif({ who: phase, bl: true });
      setSelectedIds([]);
      if (gameMode === "multi" && phase === "p1") {
        setPhase("p2");
      } else {
        advanceRound();
      }
      return;
    }

    const selected = currentHand.filter(c => selectedIds.includes(c.id));

    if (selected.length === 1 && selected[0].type === "action") {
      const actCard = selected[0];
      setHand(prev => prev.filter(c => c.id !== actCard.id));
      setSelectedIds([]);

      // FIX LOGICA DE BLOQUEIO INTERCEPTADA IMEDIATAMENTE (CORREÇÃO DE BUG DO FLUXO)
      if (actCard.act === "block") {
        if (phase === "p1") setP2Blocked(true);
        else setP1Blocked(true);

        setNotif({ who: phase, action: true, act: "block" });
        // Redireciona o fluxo sem travar turnos
        if (gameMode === "multi" && phase === "p1") {
          setPhase("p2");
        } else if (gameMode === "multi" && phase === "p2") {
          advanceRound();
        } else {
          setPhase("cpu");
        }
        return;
      }

      // OUTRAS AÇÕES
      if (actCard.act === "double") {
        if (phase === "p1") setP1Dbl(true); else setP2Dbl(true);
        setNotif({ who: phase, action: true, act: "double" });
      } else if (actCard.act === "steal") {
        if (phase === "p1") {
          const amt = Math.min(p2Score, 4);
          setP2Score(p => p - amt); setP1Score(p => p + amt);
          setNotif({ who: "p1", action: true, act: "steal", pts: amt });
        } else {
          const amt = Math.min(p1Score, 4);
          setP1Score(p => p - amt); setP2Score(p => p + amt);
          setNotif({ who: "p2", action: true, act: "steal", pts: amt });
        }
      } else if (actCard.act === "swap") {
        const temp = p1Score;
        setP1Score(p2Score);
        setP2Score(temp);
        setNotif({ who: phase, action: true, act: "swap" });
      }

      if (gameMode === "multi" && phase === "p1") {
        setPhase("p2");
      } else if (gameMode === "multi" && phase === "p2") {
        advanceRound();
      } else {
        setPhase("cpu");
      }
      return;
    }

    // VERIFICADOR DE PHRASAL VERBS COMBOS
    const verb = selected.find(c => c.type === "verb");
    const part = selected.find(c => c.type === "particle");

    if (selected.length === 2 && verb && part) {
      const comboKey = `${verb.val}_${part.val}`;
      const hasMatch = VALID_COMBOS[comboKey];

      setHand(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);

      if (hasMatch) {
        const base = verb.pts + part.pts + hasMatch.bonus;
        const currentDbl = phase === "p1" ? p1Dbl : p2Dbl;
        const finalPts = base * (currentDbl ? 2 : 1);

        if (phase === "p1") {
          setP1Score(p => p + finalPts);
          setP1Dbl(false);
        } else {
          setP2Score(p => p + finalPts);
          setP2Dbl(false);
        }

        setNotif({ who: phase, valid: true, key: comboKey, ex: hasMatch.ex, pts: finalPts });
      } else {
        setNotif({ who: phase, valid: false, failed: true });
      }

      if (gameMode === "multi" && phase === "p1") {
        setPhase("p2");
      } else if (gameMode === "multi" && phase === "p2") {
        advanceRound();
      } else {
        setPhase("cpu");
      }
    } else {
      setNotif({ noPlay: true });
    }
  };

  const selectedCards = (phase === "p1" ? p1Hand : p2Hand).filter(c => selectedIds.includes(c.id));
  const isVerb = selectedCards.find(c => c.type === "verb");
  const isPart = selectedCards.find(c => c.type === "particle");
  const isAct = selectedCards.find(c => c.type === "action");

  const pvValid = (selectedCards.length === 2 && !!isVerb && !!isPart) || (selectedCards.length === 1 && !!isAct);

  return (
    <div style={{
      minHeight: "100vh", background: "#060913", color: "#fff", fontFamily: "'Rajdhani', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, overflowX: "hidden"
    }}>
      <Joyride steps={tourSteps} run={tourRun} callback={handleTourEnd} continuous showSkipButton styles={{
        options: { primaryColor: "#ff1144", backgroundColor: "#0d1127", textColor: "#fff", arrowColor: "#0d1127" }
      }} />

      {phase === "menu" ? (
        <div style={{
          maxWidth: 450, width: "100%", background: "#0a0e20", padding: 40, borderRadius: 24,
          border: "2px solid #3355ff", boxShadow: "0 0 40px rgba(51,85,255,0.25)", textAlign: "center"
        }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, margin: "0 0 10px 0", letterSpacing: 2, color: "#fff", textShadow: "0 0 15px #3355ff" }}>PHRASAL_MATRIX</h1>
          <p style={{ color: "#7185b3", fontSize: 14, margin: "0 0 35px 0" }}>Hackee a linguagem e domine os Phrasal Verbs no ciberespaço.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <button onClick={() => startGame("solo", "easy")} style={{
              padding: 16, borderRadius: 12, border: "1px solid #ff7700", background: "rgba(255,119,0,0.05)",
              color: "#ff7700", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s"
            }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,119,0,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,119,0,0.05)"}>
              SOLO MODE : NÍVEL FÁCIL
            </button>
            <button onClick={() => startGame("solo", "medium")} style={{
              padding: 16, borderRadius: 12, border: "1px solid #3355ff", background: "rgba(51,85,255,0.05)",
              color: "#3355ff", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s"
            }} onMouseEnter={e => e.currentTarget.style.background = "rgba(51,85,255,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(51,85,255,0.05)"}>
              SOLO MODE : NÍVEL MÉDIO
            </button>
            <button onClick={() => startGame("solo", "hard")} style={{
              padding: 16, borderRadius: 12, border: "1px solid #ff1144", background: "rgba(255,17,68,0.05)",
              color: "#ff1144", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s"
            }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,17,68,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,17,68,0.05)"}>
              SOLO MODE : NÍVEL DIFÍCIL (AI STRATEGY)
            </button>
            <div style={{ height: 1, background: "#1a223f", margin: "10px 0" }} />
            <button onClick={() => startGame("multi", "medium")} style={{
              padding: 18, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3355ff,#ff1144)",
              color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, boxShadow: "0 0 25px rgba(255,17,68,0.3)"
            }}>
              💥 2 JOGADORES LOCAL (PASS & PLAY)
            </button>
          </div>
        </div>
      ) : phase === "end" ? (
        <div style={{ textAlign: "center", background: "#0a0e20", padding: 40, borderRadius: 24, border: "2px solid #ff1144" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", textShadow: "0 0 10px #ff1144" }}>RODADAS ENCERRADAS</h2>
          <div style={{ display: "flex", gap: 50, margin: "30px 0", justifyContent: "center" }}>
            <div>
              <p style={{ color: "#7185b3", margin: 0 }}>JOGADOR 1</p>
              <h3 style={{ fontSize: 44, color: "#3355ff" }}>{p1Score} pts</h3>
            </div>
            <div>
              <p style={{ color: "#7185b3", margin: 0 }}>{gameMode === "solo" ? "CPU" : "JOGADOR 2"}</p>
              <h3 style={{ fontSize: 44, color: "#ff7700" }}>{p2Score} pts</h3>
            </div>
          </div>
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 30 }}>
            {p1Score > p2Score ? "🏆 JOGADOR 1 VENCEU!" : p2Score > p1Score ? (gameMode === "solo" ? "🤖 CPU VENCEU!" : "🏆 JOGADOR 2 VENCEU!") : "🤝 EMPATE TÉCNICO!"}
          </h1>
          <button onClick={() => setPhase("menu")} style={{
            padding: "14px 28px", border: "none", borderRadius: 8, background: "#fff", color: "#000", fontWeight: 700, cursor: "pointer"
          }}>VOLTAR AO MENU</button>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* HEADER PLACAR */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0e20",
            padding: "16px 30px", borderRadius: 16, border: "1px solid #1f2a4e"
          }}>
            <div>
              <span style={{ color: "#7185b3", fontSize: 12, fontWeight: 700 }}>MODO: {gameMode.toUpperCase()} ({difficulty.toUpperCase()})</span>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>RODADA <span style={{ color: "#ff1144" }}>{round}/5</span></h2>
            </div>
            <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#3355ff", fontWeight: 700, fontSize: 12 }}>JOGADOR 1 {p1Blocked && "🚫"} {p1Dbl && "💥"}</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{p1Score} <span style={{ fontSize: 14, color: "#7185b3" }}>PTS</span></div>
              </div>
              <div style={{ fontSize: 20, color: "#1f2a4e", fontWeight: 900 }}>VS</div>
              <div>
                <div style={{ color: "#ff7700", fontWeight: 700, fontSize: 12 }}>{gameMode === "solo" ? "CPU" : "JOGADOR 2"} {p2Blocked && "🚫"} {p2Dbl && "💥"}</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{p2Score} <span style={{ fontSize: 14, color: "#7185b3" }}>PTS</span></div>
              </div>
            </div>
          </div>

          {/* NOTIFICAÇÃO DE FEEDBACK VISUAL */}
          {notif && (
            <div style={{
              background: "#0d152d", borderLeft: `4px solid ${notif.failed ? "#ff1144" : "#00ffaa"}`,
              padding: 16, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
              animation: "pulse 1.5s infinite", boxShadow: "0 0 15px rgba(0,255,170,0.1)"
            }}>
              <div>
                <b style={{ color: "#fff", textTransform: "uppercase" }}>{notif.who === "p1" ? "Jogador 1" : notif.who === "cpu" ? "CPU" : "Jogador 2"}: </b>
                {notif.pass && <span style={{ color: "#7185b3" }}>Passou o turno.</span>}
                {notif.bl && <span style={{ color: "#ff1144" }}>Está bloqueado e perdeu a vez!</span>}
                {notif.failed && <span style={{ color: "#ff1144" }}>Tentou um combo inválido e queimou as cartas!</span>}
                {notif.valid && <span style={{ color: "#00ffaa" }}>Formou <b style={{ fontSize: 16 }}>{notif.key}</b> (+{notif.pts} pts) — {notif.ex}</span>}
                {notif.action && <span style={{ color: "#ff1144" }}>Disparou efeito <b style={{ color: "#fff" }}>{notif.act?.toUpperCase()}</b> {notif.pts ? `(${notif.pts} pts modificados)` : ""}</span>}
                {notif.noPlay && <span style={{ color: "#ffcc00" }}>Selecione 1 Verbo + 1 Partícula, ou apenas 1 card de Ação!</span>}
              </div>
              <button onClick={() => setNotif(null)} style={{ background: "none", border: "none", color: "#7185b3", cursor: "pointer", fontWeight: 900 }}>[X]</button>
            </div>
          )}

          {/* MÃO DO ADVERSÁRIO (CPU OU JOGADOR 2 PAIND & PLAY) */}
          <div style={{ background: "rgba(10,14,32,0.4)", padding: 20, borderRadius: 16, border: "1px dashed #1f2a4e" }}>
            <div style={{ fontSize: 12, color: "#7185b3", marginBottom: 10, fontWeight: 700 }}>MÃO DO OPONENTE ({gameMode === "solo" ? "CPU" : "JOGADOR 2"})</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {p2Hand.map(card => (
                <Card key={card.id} card={card} faceDown={gameMode === "multi" && phase !== "p2"} />
              ))}
            </div>
          </div>

          {/* TABULEIRO CENTRAL DE AÇÃO */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 20, padding: 30,
            background: "radial-gradient(circle, #0e1634 0%, #060913 100%)", borderRadius: 24, border: "1px solid #151f3d", minHeight: 120
          }}>
            {selectedIds.length === 0 ? (
              <div style={{ color: "#4e5d8c", fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>Aguardando inserção de dados no buffer matriz...</div>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                { (phase === "p1" ? p1Hand : p2Hand).filter(c => selectedIds.includes(c.id)).map(card => (
                  <Card key={card.id} card={card} onClick={() => selectCard(card.id)} />
                ))}
              </div>
            )}
          </div>

          {/* MÃO DO JOGADOR ATUAL */}
          <div className="player-hand" style={{ background: "#0a0e20", padding: 25, borderRadius: 20, border: "2px solid #1f2a4e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 800, letterSpacing: 1 }}>
                MÃO ATUAL: <span style={{ color: "#3355ff" }}>{phase === "p1" ? "JOGADOR 1" : "JOGADOR 2"}</span>
              </div>
              {phase === "cpu" && <div style={{ color: "#ff7700", fontWeight: 800, fontSize: 13 }}>Sincronizando jogada da inteligência artificial...</div>}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", minHeight: 160 }}>
              {(phase === "p1" ? p1Hand : p2Hand).map(card => (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedIds.includes(card.id)}
                  onClick={() => (phase === "p1" || (phase === "p2" && gameMode === "multi")) && selectCard(card.id)}
                />
              ))}
            </div>
          </div>

          {/* CONTROLES / BOTÕES */}
          <div style={{ display: "flex", gap: 15, justifyContent: "flex-end", marginTop: 10 }}>
            {(phase === "p1" || (phase === "p2" && gameMode === "multi")) && (
              <>
                <button onClick={passTurn} style={{
                  padding: "16px 26px", background: "#111633", color: "#7185b3", border: "1px solid #1f2a4e",
                  borderRadius: 10, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                }} onMouseEnter={e => e.currentTarget.style.borderColor = "#3355ff"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1f2a4e"}>
                  ↩ PASSAR VEZ
                </button>
                <button className="play-btn" onClick={executePlayerTurn} style={{
                  padding: "16px 36px", background: pvValid ? "linear-gradient(135deg, #00aa55, #33ffaa)" : "#1f1f1f",
                  color: pvValid ? "#051a0e" : "#555", border: "none", borderRadius: 10, fontFamily: "'Orbitron', monospace",
                  fontSize: 13, fontWeight: 900, cursor: pvValid ? "pointer" : "default", boxShadow: pvValid ? "0 0 20px rgba(51,255,170,0.4)" : "none",
                  transition: "all 0.2s"
                }}>
                  ⚔️ LANÇAR JOGADA
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

