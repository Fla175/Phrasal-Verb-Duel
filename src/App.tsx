import { useState, useEffect, useRef } from "react";

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

interface GameRefState {
  deck: CardItem[];
  p1Hand: CardItem[];
  p2Hand: CardItem[];
  p1Score: number;
  p2Score: number;
  round: number;
  p1Blocked: boolean;
  p2Blocked: boolean;
  p1Dbl: boolean;
  p2Dbl: boolean;
}

type Difficulty = "easy" | "medium" | "hard";
type GameMode = "solo" | "multi";
type GamePhase = "p1" | "p2" | "cpu" | "animating";

/* ═══════════════════════════════════════════════════════
   GAME DATA
═══════════════════════════════════════════════════════ */
const VERBS = [
  {v:"BREAK",p:3},{v:"LOOK",p:2},{v:"TAKE",p:2},{v:"TURN",p:2},
  {v:"GIVE",p:3},{v:"PUT",p:2},{v:"GET",p:3},{v:"COME",p:2},
  {v:"GO",p:2},{v:"RUN",p:3},{v:"SET",p:2},{v:"MAKE",p:3},
  {v:"BRING",p:2},{v:"KEEP",p:2},{v:"HOLD",p:3},{v:"PICK",p:2},
  {v:"CALL",p:2},{v:"CARRY",p:3},{v:"FALL",p:2},{v:"FIND",p:3},
];

const PARTS = ["UP","DOWN","AFTER","OFF","OUT","IN","ON","OVER","THROUGH","BACK","AWAY","AROUND","INTO","ABOUT","ACROSS"];

const PV: Record<string, string> = {
  "BREAK UP":"They decided to BREAK UP after 3 years.","BREAK DOWN":"My car BROKE DOWN on the highway.",
  "BREAK OUT":"A fire BROKE OUT in the building.","BREAK OFF":"She BROKE OFF the engagement.",
  "BREAK IN":"Burglars BROKE IN through the back window.","BREAK AWAY":"He managed to BREAK AWAY from the crowd.",
  "BREAK THROUGH":"Scientists BROKE THROUGH with a new treatment.","BREAK INTO":"They BROKE INTO the old warehouse.",
  "LOOK UP":"Let me LOOK UP the address online.","LOOK DOWN":"Don't LOOK DOWN from the top!",
  "LOOK AFTER":"Can you LOOK AFTER my cat while I'm away?","LOOK OUT":"LOOK OUT! A car is coming!",
  "LOOK IN":"I'll LOOK IN on you later.","LOOK ON":"Everyone LOOKED ON as it happened.",
  "LOOK OVER":"Please LOOK OVER this document.","LOOK BACK":"I like to LOOK BACK on happy memories.",
  "LOOK AWAY":"She couldn't LOOK AWAY from the accident.","LOOK AROUND":"Let's LOOK AROUND the museum.",
  "LOOK INTO":"The police are LOOKING INTO the matter.","LOOK ABOUT":"He LOOKED ABOUT nervously.",
  "LOOK THROUGH":"LOOK THROUGH these old photos.",
  "TAKE UP":"She TOOK UP painting as a hobby.","TAKE DOWN":"Please TAKE DOWN these notes.",
  "TAKE OFF":"The plane will TAKE OFF soon.","TAKE OUT":"He TOOK her OUT to dinner.",
  "TAKE IN":"I couldn't TAKE IN all that information.","TAKE ON":"She TOOK ON too much work.",
  "TAKE OVER":"He TOOK OVER the company last year.","TAKE BACK":"I TAKE BACK what I said.",
  "TAKE AWAY":"The police TOOK him AWAY.","TAKE AFTER":"She TAKES AFTER her mother.",
  "TAKE THROUGH":"She TOOK me THROUGH the process step by step.",
  "TURN UP":"He TURNED UP late to the meeting.","TURN DOWN":"She TURNED DOWN the job offer.",
  "TURN OFF":"Please TURN OFF the lights.","TURN OUT":"It TURNED OUT to be a great day.",
  "TURN IN":"It's time to TURN IN for the night.","TURN ON":"TURN ON the TV, please.",
  "TURN OVER":"TURN OVER the page.","TURN BACK":"We had to TURN BACK due to the storm.",
  "TURN AWAY":"They TURNED AWAY hundreds of fans.","TURN AROUND":"We need to TURN this situation AROUND.",
  "TURN INTO":"The frog TURNED INTO a prince.",
  "GIVE UP":"Don't GIVE UP on your dreams!","GIVE OUT":"She GAVE OUT flyers on the street.",
  "GIVE IN":"He finally GAVE IN to her demands.","GIVE BACK":"GIVE BACK what you borrowed.",
  "GIVE AWAY":"She GAVE AWAY her old clothes.",
  "PUT UP":"Can you PUT me UP for the night?","PUT DOWN":"PUT DOWN that phone!",
  "PUT OFF":"Don't PUT OFF what you can do today.","PUT OUT":"The firefighters PUT OUT the fire.",
  "PUT IN":"She PUT IN a lot of effort.","PUT ON":"PUT ON your jacket, it's cold.",
  "PUT THROUGH":"I'll PUT you THROUGH to the manager.","PUT BACK":"PUT BACK the book where you found it.",
  "PUT AWAY":"PUT AWAY your toys.",
  "GET UP":"I GET UP at 7 every morning.","GET DOWN":"GET DOWN from that table!",
  "GET OFF":"We need to GET OFF at the next stop.","GET OUT":"GET OUT of here!",
  "GET IN":"I GOT IN late last night.","GET ON":"How are you GETTING ON at your new job?",
  "GET OVER":"It took months to GET OVER the flu.","GET THROUGH":"We GOT THROUGH the difficult time.",
  "GET BACK":"I'll GET BACK to you tomorrow.","GET AWAY":"We managed to GET AWAY for the weekend.",
  "GET AROUND":"She GETS AROUND the city by bike.","GET INTO":"How did you GET INTO photography?",
  "GET ABOUT":"She GETS ABOUT quite well despite her age.","GET ACROSS":"It's hard to GET this idea ACROSS.",
  "COME UP":"Something CAME UP at work.","COME DOWN":"Prices CAME DOWN last month.",
  "COME OFF":"The button CAME OFF my shirt.","COME OUT":"Her new book COMES OUT next month.",
  "COME IN":"COME IN, the door is open.","COME ON":"COME ON, we'll be late!",
  "COME OVER":"Why don't you COME OVER for dinner?","COME THROUGH":"She CAME THROUGH the surgery fine.",
  "COME BACK":"When will you COME BACK?","COME AROUND":"He CAME AROUND to her point of view.",
  "COME ACROSS":"I CAME ACROSS this old photo.","COME ABOUT":"How did this COME ABOUT?",
  "COME INTO":"She CAME INTO a lot of money.",
  "GO UP":"Prices keep GOING UP.","GO DOWN":"The sun GOES DOWN early in winter.",
  "GO OFF":"The alarm WENT OFF at 6am.","GO OUT":"Let's GO OUT for dinner.",
  "GO IN":"We should GO IN now.","GO ON":"What's GOING ON here?",
  "GO OVER":"Let's GO OVER the plan again.","GO THROUGH":"We WENT THROUGH a tough time.",
  "GO BACK":"I want to GO BACK to Spain.","GO AWAY":"The pain finally WENT AWAY.",
  "GO AROUND":"There's enough food to GO AROUND.","GO INTO":"She didn't want to GO INTO detail.",
  "GO ABOUT":"How do you GO ABOUT solving this?","GO ACROSS":"GO ACROSS the bridge and turn left.",
  "RUN UP":"She RAN UP a huge bill.","RUN DOWN":"The battery RAN DOWN quickly.",
  "RUN OFF":"The thief RAN OFF with my bag.","RUN OUT":"We've RUN OUT of time.",
  "RUN ON":"The meeting RAN ON longer than expected.","RUN OVER":"A car almost RAN OVER the dog.",
  "RUN THROUGH":"Let me RUN THROUGH the main points.","RUN BACK":"RUN BACK and get your coat.",
  "RUN AWAY":"He RAN AWAY from home at 16.","RUN AROUND":"Stop RUNNING AROUND the house!",
  "RUN INTO":"I RAN INTO my ex at the supermarket.","RUN ACROSS":"I RAN ACROSS an interesting article.",
  "SET UP":"She SET UP her own business.","SET OFF":"We SET OFF at dawn.",
  "SET OUT":"He SET OUT to prove them wrong.","SET IN":"The cold weather has SET IN.",
  "SET BACK":"The delay SET us BACK two weeks.","SET ABOUT":"She SET ABOUT cleaning the house.",
  "SET DOWN":"SET DOWN your bags here.",
  "MAKE UP":"They argued but soon MADE UP.","MAKE OUT":"I can barely MAKE OUT what you're saying.",
  "MAKE OVER":"She MADE OVER the entire room.","MAKE INTO":"They MADE the garage INTO a studio.",
  "BRING UP":"She BROUGHT UP an interesting point.","BRING DOWN":"The scandal BROUGHT DOWN the government.",
  "BRING OFF":"He BROUGHT OFF a brilliant deal.","BRING OUT":"Travel BRINGS OUT the best in people.",
  "BRING IN":"The new law was BROUGHT IN last year.","BRING ON":"What BROUGHT ON this sudden change?",
  "BRING OVER":"BRING OVER some chairs.","BRING THROUGH":"Good care BROUGHT him THROUGH the illness.",
  "BRING BACK":"Those photos BRING BACK happy memories.","BRING AROUND":"She BROUGHT him AROUND to the idea.",
  "KEEP UP":"KEEP UP the good work!","KEEP DOWN":"Keep your voice DOWN.",
  "KEEP OFF":"KEEP OFF the grass!","KEEP OUT":"KEEP OUT! Danger zone.",
  "KEEP IN":"The teacher KEPT him IN after class.","KEEP ON":"KEEP ON trying!",
  "KEEP BACK":"KEEP BACK from the edge.","KEEP AWAY":"KEEP AWAY from trouble.",
  "HOLD UP":"Sorry I'm late — I was HELD UP in traffic.","HOLD DOWN":"He couldn't HOLD DOWN a job.",
  "HOLD OFF":"HOLD OFF on making a decision.","HOLD OUT":"She HELD OUT for a better offer.",
  "HOLD IN":"He HELD IN his emotions.","HOLD ON":"HOLD ON, I'll be right there.",
  "HOLD OVER":"The show was HELD OVER for another week.","HOLD BACK":"Don't HOLD BACK — say what you think.",
  "PICK UP":"Can you PICK ME UP from the airport?","PICK OUT":"PICK OUT your favorite color.",
  "PICK ON":"Stop PICKING ON your sister!","PICK OVER":"She PICKED OVER the details carefully.",
  "CALL UP":"CALL ME UP when you arrive.","CALL OFF":"The game was CALLED OFF due to rain.",
  "CALL OUT":"She CALLED OUT for help.","CALL IN":"CALL IN sick if you're not feeling well.",
  "CALL ON":"The teacher CALLED ON me to answer.","CALL BACK":"I'll CALL YOU BACK in five minutes.",
  "CALL AWAY":"He was CALLED AWAY on urgent business.",
  "CARRY ON":"CARRY ON with the good work!","CARRY OUT":"They CARRIED OUT a series of tests.",
  "CARRY OFF":"She CARRIED OFF the performance brilliantly.","CARRY THROUGH":"She CARRIED THROUGH her plans.",
  "CARRY AWAY":"Don't get CARRIED AWAY!","CARRY OVER":"Some costs will CARRY OVER to next year.",
  "FALL DOWN":"The old building finally FELL DOWN.","FALL OFF":"The apple FELL OFF the tree.",
  "FALL OUT":"They FELL OUT over money.","FALL IN":"FALL IN line, everyone.",
  "FALL ON":"Christmas FALLS ON a Sunday this year.","FALL OVER":"She tripped and FELL OVER.",
  "FALL THROUGH":"The deal FELL THROUGH at the last minute.","FALL BACK":"We FELL BACK on our savings.",
  "FALL AWAY":"Support FELL AWAY quickly.",
  "FIND OUT":"I need to FIND OUT the truth.",
};

/* ═══════════════════════════════════════════════════════
   HELPERS & REFACTORING
═══════════════════════════════════════════════════════ */
let _uid = 0;
const uid = () => ++_uid;

function shuffle(a: CardItem[]): CardItem[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(): CardItem[] {
  const cards: CardItem[] = [];
  VERBS.forEach(({v,p}) => {
    cards.push({id:uid(),type:"verb",val:v,pts:p});
    cards.push({id:uid(),type:"verb",val:v,pts:p});
  });
  PARTS.forEach(p => {
    for (let i=0;i<3;i++) cards.push({id:uid(),type:"particle",val:p,pts:0});
  });
  ([
   {val:"STEAL",act:"steal"},{val:"STEAL",act:"steal"},
   {val:"SWAP",act:"swap"},{val:"SWAP",act:"swap"},
   {val:"BLOCK",act:"block"},{val:"BLOCK",act:"block"},
   {val:"DOUBLE",act:"double"},{val:"DOUBLE",act:"double"}
  ] as const).forEach(a => cards.push({id:uid(),type:"action",val:a.val,act:a.act,pts:0}));
  return shuffle(cards);
}

// Inteligência Artificial Inteligente por Níveis de Dificuldade
function calculateCpuPlay(hand: CardItem[], diff: Difficulty, playerPts: number, cpuPts: number): { type: "combo"; v: CardItem; p: CardItem } | { type: "action"; card: CardItem } | null {
  const verbs = hand.filter(c=>c.type==="verb");
  const parts = hand.filter(c=>c.type==="particle");
  const actions = hand.filter(c=>c.type==="action");

  // Estratégia Avançada (Hard) com Cartas de Ação
  if (diff === "hard" && actions.length > 0) {
    const steal = actions.find(c => c.act === "steal");
    if (steal && playerPts > 4) return { type: "action", card: steal };

    const block = actions.find(c => c.act === "block");
    if (block && playerPts > cpuPts) return { type: "action", card: block };
  }

  let validCombos: {v: CardItem; p: CardItem}[] = [];
  for (const v of verbs) {
    for (const p of parts) {
      if (PV[`${v.val} ${p.val}`]) validCombos.push({v,p});
    }
  }

  if (validCombos.length === 0) {
    if (actions.length > 0 && diff !== "easy") {
      return { type: "action", card: actions[0] };
    }
    return null;
  }

  // Ordena por maior pontuação
  validCombos.sort((a,b) => b.v.pts - a.v.pts);

  if (diff === "easy") {
    if (Math.random() > 0.6) return null; // 60% de chance de errar ou passar bobeira
    return { type: "combo", ...validCombos[Math.floor(Math.random() * validCombos.length)] };
  }

  if (diff === "medium") {
    return Math.random() > 0.2 ? { type: "combo", ...validCombos[0] } : null;
  }

  // Hard Mode sempre joga perfeitamente a melhor combinação
  return { type: "combo", ...validCombos[0] };
}

/* ═══════════════════════════════════════════════════════
   CARD COMPONENT
═══════════════════════════════════════════════════════ */
const CARD_CFG = {
  verb:     {border:"#3355ff",bg:"linear-gradient(145deg,#0f163a,#070b24)",glow:"rgba(51,85,255,0.4)"},
  particle: {border:"#ff7700",bg:"linear-gradient(145deg,#2e1400,#140800)",glow:"rgba(255,119,0,0.4)"},
  action:   {border:"#ff1144",bg:"linear-gradient(145deg,#33000a,#140003)",glow:"rgba(255,17,68,0.4)"},
};
const ACT_ICON: Record<string, string> = {steal:"🗡️",swap:"🔄",block:"🛡️",double:"⚡"};
const ACT_CLR: Record<string, string>  = {steal:"#ff3366",swap:"#33ccff",block:"#33ff99",double:"#ffcc00"};

function Card({card, selected, onClick, faceDown}: CardProps) {
  if (faceDown) return (
    <div style={{width:64,height:92,borderRadius:10,flexShrink:0,background:"linear-gradient(145deg,#151535,#0a0a1f)",border:"2px solid #222554",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#3b3e75",boxShadow:"inset 0 0 10px rgba(0,0,0,0.8)"}}>
      ⚡
    </div>
  );
  
  const cfg = CARD_CFG[card.type];
  const isAct = card.type === "action";
  const aColor = isAct && card.act ? ACT_CLR[card.act] : undefined;
  const fz = card.val.length > 6 ? 9 : card.val.length > 4 ? 11 : 13;
  
  return (
    <div onClick={onClick} style={{
      width:64,height:92,borderRadius:10,flexShrink:0,position:"relative",
      background:cfg.bg,
      border:`2px solid ${selected?"#ffffff":cfg.border}`,
      boxShadow:selected?`0 0 25px #ffffff, 0 0 15px ${cfg.glow}`:`0 6px 16px rgba(0,0,0,0.6), 0 0 6px ${cfg.glow}`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      cursor:"pointer",userSelect:"none",
      transform:selected?"translateY(-12px) scale(1.08)":"translateY(0) scale(1)",
      transition:"all 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
    }}>
      <div style={{position:"absolute",top:4,left:5,fontSize:8,color:isAct?aColor:cfg.border,fontWeight:800,letterSpacing:0.5}}>
        {card.type==="verb"?"V":card.type==="particle"?"P":"★"}
      </div>
      {card.type==="verb" && (
        <div style={{position:"absolute",top:4,right:4,background:"linear-gradient(135deg,#ffd700,#ffa500)",color:"#000",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,boxShadow:"0 2px 4px rgba(0,0,0,0.4)"}}>
          {card.pts}
        </div>
      )}
      <div style={{fontSize:isAct?24:fz,fontWeight:900,color:isAct?aColor:"#ffffff",lineHeight:1,textAlign:"center",padding:"0 4px",textShadow:"0 2px 4px rgba(0,0,0,0.8)"}}>
        {isAct && card.act ? ACT_ICON[card.act] : card.val}
      </div>
      {isAct && <div style={{fontSize:8,color:aColor,fontWeight:800,marginTop:4,letterSpacing:0.5}}>{card.val}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════════ */
function NotifPanel({n}: {n: NotifData}) {
  if (n.pass) return (
    <div className="pop-in" style={{textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:6}}>🔁</div>
      <div style={{fontSize:12,color:"#a0a0d0",letterSpacing:1}}>Comprando novas cartas e passando turno...</div>
    </div>
  );
  if (n.bl) return (
    <div className="pop-in" style={{textAlign:"center"}}>
      <div style={{fontSize:40}}>🛡️</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,color:"#33ff99",marginTop:8,letterSpacing:2,textShadow:"0 0 10px #33ff99"}}>BLOQUEADO! TURNO PULADO.</div>
    </div>
  );
  if (n.noPlay) return (
    <div className="pop-in" style={{textAlign:"center"}}>
      <div style={{fontSize:28}}>😤</div>
      <div style={{fontSize:12,color:"#a0a0d0",marginTop:6}}>Sem combinações válidas! Comprando cartas...</div>
    </div>
  );
  if (n.action && n.act) {
    const clrs: Record<string, string> = {steal:"#ff3366",swap:"#33ccff",block:"#33ff99",double:"#ffcc00"};
    const msgs: Record<string, string> = {
      steal: n.failed ? "Nenhuma carta para roubar!" : `Roubou ${n.pts} pts da combinação (${n.key})!`,
      swap: "Mãos trocadas completamente!",
      block: "Oponente bloqueado no próximo turno!",
      double: "Próxima jogada valerá o DOBRO de pontos!",
    };
    return (
      <div className="pop-in" style={{textAlign:"center",maxWidth:260}}>
        <div style={{fontSize:38}}>{ACT_ICON[n.act]}</div>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:12,color:clrs[n.act],marginTop:8,letterSpacing:1,textShadow:`0 0 8px ${clrs[n.act]}`}}>{msgs[n.act]}</div>
      </div>
    );
  }
  
  const label = n.who === "p1" ? "JOGADOR 1" : n.who === "p2" ? "JOGADOR 2" : "CPU";
  const color = n.valid ? (n.who === "cpu" ? "#ff3366" : "#44ffaa") : "#666688";
  
  return (
    <div className="pop-in" style={{textAlign:"center",maxWidth:280}}>
      <div style={{fontSize:10,color:"#8080a0",letterSpacing:2,marginBottom:4}}>{label} JOGOU</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,color,textShadow:n.valid?`0 0 15px ${color}`:"none",letterSpacing:1,marginBottom:6}}>
        {n.key}
      </div>
      {n.valid ? (
        <>
          <div style={{fontSize:11,color:"#b0b0d0",fontStyle:"italic",marginBottom:8,lineHeight:1.4}}>"{n.ex}"</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:900,color,textShadow:`0 0 10px ${color}`}}>+{n.pts} pts</div>
        </>
      ) : (
        <div style={{fontSize:12,color:"#ff3366"}}>❌ Combinação inválida! Zero pontos.</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════════ */
function Menu({onStart}: {onStart: (mode: GameMode, diff: Difficulty) => void}) {
  const [mode, setMode] = useState<GameMode>("solo");
  const [diff, setDiff] = useState<Difficulty>("medium");

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#040410,#090d22,#040410)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0"}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,color:"#ff6600",letterSpacing:6,marginBottom:12,textShadow:"0 0 8px #ff6600"}}>CARD STRATEGY</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:36,fontWeight:900,color:"#3355ff",textShadow:"0 0 30px rgba(51,85,255,0.6)",letterSpacing:3,marginBottom:2}}>⚔ PHRASAL</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:36,fontWeight:900,color:"#ff1144",textShadow:"0 0 30px rgba(255,17,68,0.6)",letterSpacing:3,marginBottom:32}}>VERB DUEL</div>

      {/* Mode Selection */}
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <button onClick={()=>setMode("solo")} style={{padding:"10px 20px",background:mode==="solo"?"#3355ff":"#101430",border:mode==="solo"?"1px solid #fff":"1px solid #202550",color:"#fff",borderRadius:8,fontFamily:"'Orbitron',monospace",fontSize:11,cursor:"pointer",transition:"all 0.2s"}}>👤 VS CPU</button>
        <button onClick={()=>setMode("multi")} style={{padding:"10px 20px",background:mode==="multi"?"#3355ff":"#101430",border:mode==="multi"?"1px solid #fff":"1px solid #202550",color:"#fff",borderRadius:8,fontFamily:"'Orbitron',monospace",fontSize:11,cursor:"pointer",transition:"all 0.2s"}}>👥 2 JOGADORES</button>
      </div>

      {/* Difficulty Selection for Solo */}
      {mode === "solo" && (
        <div style={{display:"flex",gap:8,marginBottom:28,background:"#0a0d24",padding:4,borderRadius:8,border:"1px solid #1a2045"}}>
          {(["easy","medium","hard"] as const).map(d => (
            <button key={d} onClick={()=>setDiff(d)} style={{padding:"6px 14px",background:diff===d?"#ff7700":"transparent",border:"none",color:"#fff",borderRadius:6,fontSize:11,fontWeight:700,textTransform:"uppercase",cursor:"pointer",transition:"background 0.2s"}}>
              {d === "easy" ? "Fácil" : d === "medium" ? "Médio" : "Difícil"}
            </button>
          ))}
        </div>
      )}

      <div style={{background:"rgba(13,13,30,0.7)",border:"1px solid #1e234a",borderRadius:14,padding:"16px 20px",maxWidth:320,marginBottom:32,textAlign:"left",fontSize:12,lineHeight:1.8,color:"#a0a0c0",boxShadow:"0 10px 25px rgba(0,0,0,0.5)"}}>
        <div style={{color:"#3355ff",fontFamily:"'Orbitron',monospace",fontSize:11,letterSpacing:2,marginBottom:8}}>REGRAS RÁPIDAS</div>
        <div>🔵 <b style={{color:"#5588ff"}}>Verbo</b> + 🟠 <b style={{color:"#ff9933"}}>Partícula</b> = Phrasal Verb Válido!</div>
        <div>🗡️ <b>STEAL</b>: Rouba pontos da última jogada alheia.</div>
        <div>🔄 <b>SWAP</b>: Troca todas as cartas com o rival.</div>
        <div>🛡️ <b>BLOCK</b>: Faz o oponente perder o próximo turno.</div>
        <div>⚡ <b>DOUBLE</b>: Duplica os pontos da sua próxima combinação.</div>
      </div>

      <button
        onClick={()=>onStart(mode, diff)}
        style={{padding:"14px 50px",background:"linear-gradient(135deg,#3355ff,#ff1144)",color:"#fff",border:"none",borderRadius:10,fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,letterSpacing:3,cursor:"pointer",boxShadow:"0 0 25px rgba(51,85,255,0.5)",transition:"transform 0.2s"}}
        onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"}
        onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}
      >▶ INICIAR DUELO</button>
    </div>
  );
}

function GameOver({ps, cs, mode, onPlay}: {ps: number; cs: number; mode: GameMode; onPlay: () => void}) {
  const win = ps > cs, tie = ps === cs;
  let title = tie ? "EMPATE!" : win ? "JOGADOR 1 VENCEU!" : "CPU VENCEU!";
  if (mode === "multi") {
    title = tie ? "EMPATE!" : win ? "JOGADOR 1 VENCEU!" : "JOGADOR 2 VENCEU!";
  }
  const color = tie ? "#ffcc00" : win ? "#44ffaa" : "#ff3366";

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#040410,#090d22,#040410)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0"}}>
      <div style={{fontSize:64,marginBottom:12}}>{tie?"🤝":win?"🏆":"🤖"}</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:900,color,textShadow:`0 0 25px ${color}`,letterSpacing:2,marginBottom:32}}>
        {title}
      </div>
      <div style={{display:"flex",gap:40,marginBottom:40}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#707090",letterSpacing:2,marginBottom:4}}>{mode === "multi" ? "JOGADOR 2" : "CPU"}</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:46,fontWeight:900,color:"#ff3366",textShadow:"0 0 15px rgba(255,51,102,0.5)"}}>{cs}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",color:"#303560",fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700}}>VS</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#707090",letterSpacing:2,marginBottom:4}}>JOGADOR 1</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:46,fontWeight:900,color:"#44ffaa",textShadow:"0 0 15px rgba(68,255,170,0.5)"}}>{ps}</div>
        </div>
      </div>
      <button onClick={onPlay} style={{padding:"14px 40px",background:"linear-gradient(135deg,#3355ff,#ff7700)",color:"#fff",border:"none",borderRadius:10,fontFamily:"'Orbitron',monospace",fontSize:13,fontWeight:700,letterSpacing:2,cursor:"pointer",boxShadow:"0 0 20px rgba(255,119,0,0.4)"}}>
        🔄 JOGAR NOVAMENTE
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN GAME COMPONENT
═══════════════════════════════════════════════════════ */
const MAX_ROUNDS = 10;

export default function PhrasalVerbDuel() {
  const [screen, setScreen] = useState<"menu" | "game" | "over">("menu");
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  
  const [deck, setDeck] = useState<CardItem[]>([]);
  const [p1Hand, setP1Hand] = useState<CardItem[]>([]);
  const [p2Hand, setP2Hand] = useState<CardItem[]>([]);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>("p1");
  
  const [selV, setSelV] = useState<CardItem | null>(null);
  const [selP, setSelP] = useState<CardItem | null>(null);
  const [notif, setNotif] = useState<NotifData | null>(null);
  
  const [p1Blocked, setP1Blocked] = useState<boolean>(false);
  const [p2Blocked, setP2Blocked] = useState<boolean>(false);
  const [p1Dbl, setP1Dbl] = useState<boolean>(false);
  const [p2Dbl, setP2Dbl] = useState<boolean>(false);

  const ref = useRef<GameRefState>({ deck: [], p1Hand: [], p2Hand: [], p1Score: 0, p2Score: 0, round: 1, p1Blocked: false, p2Blocked: false, p1Dbl: false, p2Dbl: false });
  ref.current = { deck, p1Hand, p2Hand, p1Score, p2Score, round, p1Blocked, p2Blocked, p1Dbl, p2Dbl };

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@600;800;900&display=swap');
      * { box-sizing: border-box; }
      .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      @keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (phase !== "cpu") return;
    const t = setTimeout(doCpuTurn, 1200);
    return () => clearTimeout(t);
  }, [phase]);

  function startDuel(mode: GameMode, diff: Difficulty) {
    _uid = 0;
    const d = buildDeck();
    setGameMode(mode);
    setDifficulty(diff);
    setP1Hand(d.slice(0, 6));
    setP2Hand(d.slice(6, 12));
    setDeck(d.slice(12));
    setP1Score(0);
    setP2Score(0);
    setRound(1);
    setPhase("p1");
    setSelV(null);
    setSelP(null);
    setNotif(null);
    setP1Blocked(false);
    setP2Blocked(false);
    setP1Dbl(false);
    setP2Dbl(false);
    setScreen("game");
  }

  function drawN(d: CardItem[], n: number) { return { drawn: d.slice(0, n), rest: d.slice(n) }; }

  function advanceTurn(currentPhase: GamePhase) {
    const state = ref.current;
    if (gameMode === "solo") {
      if (currentPhase === "p1") {
        if (state.p2Blocked) {
          setP2Blocked(false);
          setNotif({ who: "cpu", bl: true });
          setTimeout(() => { setNotif(null); finishRound(); }, 1800);
        } else {
          setPhase("cpu");
        }
      } else {
        finishRound();
      }
    } else {
      // Multiplayer Turn Switch
      if (currentPhase === "p1") {
        if (state.p2Blocked) {
          setP2Blocked(false);
          setNotif({ who: "p2", bl: true });
          setTimeout(() => { setNotif(null); finishRound(); }, 1800);
        } else {
          setPhase("p2");
        }
      } else {
        finishRound();
      }
    }
  }

  function finishRound() {
    const next = ref.current.round + 1;
    if (next > MAX_ROUNDS) {
      setScreen("over");
    } else {
      setRound(next);
      if (ref.current.p1Blocked) {
        setP1Blocked(false);
        setNotif({ who: "p1", bl: true });
        setTimeout(() => {
          setNotif(null);
          setPhase(gameMode === "solo" ? "cpu" : "p2");
        }, 1800);
      } else {
        setPhase("p1");
      }
    }
  }

  function submitPlay() {
    if (!selV || !selP || (phase !== "p1" && phase !== "p2")) return;
    const isP1 = phase === "p1";
    const currentHand = isP1 ? p1Hand : p2Hand;
    const currentDbl = isP1 ? p1Dbl : p2Dbl;

    const key = `${selV.val} ${selP.val}`;
    const valid = !!PV[key];
    const ex = PV[key];

    setSelV(null);
    setSelP(null);
    setPhase("animating");

    const filteredHand = currentHand.filter(c => c.id !== selV.id && c.id !== selP.id);
    const { drawn, rest } = drawN(deck, 2);

    let pts = 0;
    if (valid) {
      pts = selV.pts * (currentDbl ? 2 : 1);
      if (isP1) {
        setP1Score(s => s + pts);
        setP1Dbl(false);
      } else {
        setP2Score(s => s + pts);
        setP2Dbl(false);
      }
    }

    if (isP1) setP1Hand([...filteredHand, ...drawn]);
    else setP2Hand([...filteredHand, ...drawn]);
    
    setDeck(rest);
    setNotif({ who: phase, valid, key, ex, pts });

    setTimeout(() => {
      setNotif(null);
      advanceTurn(phase);
    }, 2500);
  }

  function doCpuTurn() {
    const { p2Hand: cpuHand, deck: d, p1Score: p1Pts, p2Score: cpuPts } = ref.current;
    const decision = calculateCpuPlay(cpuHand, difficulty, p1Pts, cpuPts);

    if (decision?.type === "combo") {
      const { v, p } = decision;
      const filtered = cpuHand.filter(c => c.id !== v.id && c.id !== p.id);
      const { drawn, rest } = drawN(d, 2);
      
      let pts = v.pts * (p2Dbl ? 2 : 1);
      setP2Score(s => s + pts);
      setP2Dbl(false);
      setP2Hand([...filtered, ...drawn]);
      setDeck(rest);
      setNotif({ who: "cpu", valid: true, key: `${v.val} ${p.val}`, ex: PV[`${v.val} ${p.val}`], pts });
    } else if (decision?.type === "action") {
      const { card } = decision;
      const filtered = cpuHand.filter(c => c.id !== card.id);
      const { drawn, rest } = drawN(d, 1);
      setP2Hand([...filtered, ...drawn]);
      setDeck(rest);

      const notifData: NotifData = { who: "cpu", action: true, act: card.act };
      if (card.act === "steal") {
        const lastP1Play = calculateCpuPlay(p1Hand, "hard", 0, 0); // Moca pra pegar valor
        if (lastP1Play && lastP1Play.type === "combo") {
          setP2Score(s => s + lastP1Play.v.pts);
          notifData.pts = lastP1Play.v.pts;
          notifData.key = `${lastP1Play.v.val} ${lastP1Play.p.val}`;
        } else {
          notifData.failed = true;
        }
      } else if (card.act === "swap") {
        const p1HandTmp = ref.current.p1Hand;
        setP1Hand([...filtered]);
        setP2Hand([...p1HandTmp]);
      } else if (card.act === "block") {
        setP1Blocked(true);
      } else if (card.act === "double") {
        setP2Dbl(true);
      }
      setNotif(notifData);
    } else {
      const { drawn, rest } = drawN(d, 2);
      setP2Hand(h => [...h.slice(2), ...drawn]);
      setDeck(rest);
      setNotif({ who: "cpu", noPlay: true });
    }

    setTimeout(() => {
      setNotif(null);
      advanceTurn("cpu");
    }, 2500);
  }

  function handleCardClick(card: CardItem) {
    if (phase !== "p1" && phase !== "p2") return;
    if (card.type === "action") {
      triggerActionCard(card);
      return;
    }
    if (card.type === "verb") setSelV(p => p?.id === card.id ? null : card);
    else setSelP(p => p?.id === card.id ? null : card);
  }

  function triggerActionCard(card: CardItem) {
    const isP1 = phase === "p1";
    const currentHand = isP1 ? p1Hand : p2Hand;
    const targetHand = isP1 ? p2Hand : p1Hand;
    
    const filteredHand = currentHand.filter(c => c.id !== card.id);
    const { drawn, rest } = drawN(deck, 1);
    
    const notifData: NotifData = { who: phase, action: true, act: card.act };

    if (card.act === "steal") {
      const targetCombo = calculateCpuPlay(targetHand, "hard", 0, 0);
      if (targetCombo && targetCombo.type === "combo") {
        const pts = targetCombo.v.pts;
        if (isP1) setP1Score(s => s + pts); else setP2Score(s => s + pts);
        notifData.pts = pts;
        notifData.key = `${targetCombo.v.val} ${targetCombo.p.val}`;
      } else {
        notifData.failed = true;
      }
    } else if (card.act === "swap") {
      if (isP1) {
        setP1Hand([...targetHand]);
        setP2Hand([...filteredHand]);
      } else {
        setP2Hand([...targetHand]);
        setP1Hand([...filteredHand]);
      }
    } else if (card.act === "block") {
      if (isP1) setP2Blocked(true); else setP1Blocked(true);
    } else if (card.act === "double") {
      if (isP1) setP1Dbl(true); else setP2Dbl(true);
    }

    if (card.act !== "swap") {
      if (isP1) setP1Hand([...filteredHand, ...drawn]);
      else setP2Hand([...filteredHand, ...drawn]);
    }

    setDeck(rest);
    setSelV(null);
    setSelP(null);
    setNotif(notifData);
    setPhase("animating");

    setTimeout(() => {
      setNotif(null);
      advanceTurn(phase);
    }, 2200);
  }

  function passTurn() {
    if (phase !== "p1" && phase !== "p2") return;
    const isP1 = phase === "p1";
    const currentHand = isP1 ? p1Hand : p2Hand;
    const { drawn, rest } = drawN(deck, 2);

    if (isP1) setP1Hand([...currentHand.slice(2), ...drawn]);
    else setP2Hand([...currentHand.slice(2), ...drawn]);

    setDeck(rest);
    setSelV(null);
    setSelP(null);
    setNotif({ pass: true });
    setPhase("animating");

    setTimeout(() => {
      setNotif(null);
      advanceTurn(phase);
    }, 1600);
  }

  if (screen === "menu") return <Menu onStart={startDuel} />;
  if (screen === "over") return <GameOver ps={p1Score} cs={p2Score} mode={gameMode} onPlay={() => setScreen("menu")} />;

  const currentActiveHand = phase === "p1" ? p1Hand : p2Hand;
  const showOpponentCards = gameMode === "multi"; // Local Pass&Play esconde/revela dependendo do design tático.
  const pvKey = selV && selP ? `${selV.val} ${selP.val}` : null;
  const pvValid = pvKey ? !!PV[pvKey] : null;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#040414,#0b0f26,#040414)",display:"flex",flexDirection:"column",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0",overflow:"hidden"}}>
      
      {/* Top Header & Progress */}
      <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #141938",background:"rgba(6,6,21,0.4)"}}>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#3355ff",letterSpacing:2,textShadow:"0 0 10px rgba(51,85,255,0.4)"}}>⚔ PHRASAL DUEL</span>
        <div style={{flex:1,margin:"0 16px",height:4,background:"#101435",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#3355ff,#ff1144)",width:`${(round/MAX_ROUNDS)*100}%`,transition:"width 0.4s ease"}}/>
        </div>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#a0a0c0"}}>RODADA {round}/{MAX_ROUNDS}</span>
      </div>

      {/* Scoreboard */}
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"12px 16px",background:"rgba(10,14,38,0.3)"}}>
        <div style={{textAlign:"center",minWidth:90}}>
          <div style={{fontSize:9,letterSpacing:1.5,color:"#8080a0",marginBottom:2}}>{gameMode === "multi" ? "JOGADOR 2" : "CPU"}</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:32,fontWeight:900,color:"#ff3366",textShadow:"0 0 15px rgba(255,51,102,0.4)"}}>{p2Score}</div>
          {p2Blocked && <div style={{fontSize:9,color:"#33ff99",animation:"pulse 1s infinite"}}>🛡️ BLOQUEADO</div>}
          {p2Dbl && <div style={{fontSize:9,color:"#ffcc00",animation:"pulse 1s infinite"}}>⚡ DOUBLE</div>}
        </div>
        <div style={{color:"#1f2456",fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:900}}>VS</div>
        <div style={{textAlign:"center",minWidth:90}}>
          <div style={{fontSize:9,letterSpacing:1.5,color:"#8080a0",marginBottom:2}}>JOGADOR 1</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:32,fontWeight:900,color:"#44ffaa",textShadow:"0 0 15px rgba(68,255,170,0.4)"}}>{p1Score}</div>
          {p1Blocked && <div style={{fontSize:9,color:"#33ff99",animation:"pulse 1s infinite"}}>🛡️ BLOQUEADO</div>}
          {p1Dbl && <div style={{fontSize:9,color:"#ffcc00",animation:"pulse 1s infinite"}}>⚡ DOUBLE</div>}
        </div>
      </div>

      {/* Enemy / Opponent Hand */}
      <div style={{padding:"8px 12px",background:"rgba(0,0,0,0.15)"}}>
        <div style={{fontSize:9,color:"#4a5080",letterSpacing:1,textAlign:"center",marginBottom:6}}>MÃO DO OPONENTE ({p2Hand.length} cartas)</div>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {p2Hand.map(c => <Card key={c.id} card={c} faceDown={!showOpponentCards || phase === "p1"} />)}
        </div>
      </div>

      {/* Center Dynamic Battle Arena */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,minHeight:140,borderTop:"1px solid #101435",borderBottom:"1px solid #101435",background:"rgba(5,7,22,0.4)"}}>
        {notif ? (
          <NotifPanel n={notif}/>
        ) : phase === "cpu" ? (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32,animation:"pulse 0.8s infinite"}}>🤖</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#ff3366",letterSpacing:2,marginTop:6}}>CPU PENSANDO...</div>
          </div>
        ) : (
          <div style={{textAlign:"center"}} className="pop-in">
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:12,color:"#ff7700",letterSpacing:2,marginBottom:4,fontWeight:800}}>
              TURNO ATUAL: {phase === "p1" ? "JOGADOR 1" : "JOGADOR 2"}
            </div>
            {pvKey ? (
              <div style={{marginTop:8}}>
                <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,color:pvValid?"#44ffaa":"#ff3366",textShadow:`0 0 15px ${pvValid?"#44ffaa":"#ff3366"}`}}>{pvKey}</div>
                <div style={{fontSize:11,color:"#8080a0",marginTop:4}}>{pvValid?"✓ Válido! Clique em JOGAR":"✗ Combinação inválida"}</div>
              </div>
            ) : (
              <div style={{fontSize:12,color:"#a0a0c0",maxWidth:280,lineHeight:1.4}}>
                Combine <b style={{color:"#3355ff"}}>Verbo</b> + <b style={{color:"#ff7700"}}>Partícula</b> ou utilize um card de <b style={{color:"#ff1144"}}>Ação</b> estratégico.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Active Player Hand */}
      <div style={{padding:"12px 8px",background:"rgba(10,14,35,0.2)"}}>
        <div style={{fontSize:9,color:"#4a5080",letterSpacing:1.5,textAlign:"center",marginBottom:8}}>
          SUAS CARTAS DISPONÍVEIS ({phase === "animating" ? "..." : phase.toUpperCase()})
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",minHeight:94}}>
          {phase !== "cpu" && phase !== "animating" && currentActiveHand.map(c => (
            <Card
              key={c.id} card={c}
              selected={selV?.id === c.id || selP?.id === c.id}
              onClick={() => handleCardClick(c)}
            />
          ))}
        </div>
      </div>

      {/* Controller Buttons */}
      <div style={{padding:"8px 16px 20px",display:"flex",gap:10,justifyContent:"center"}}>
        {selV && selP && (phase === "p1" || phase === "p2") && (
          <button onClick={submitPlay} style={{
            padding:"12px 32px",
            background:pvValid?"linear-gradient(135deg,#00aa55,#44ffaa)":"linear-gradient(135deg,#aa0022,#ff3366)",
            color:pvValid?"#001a08":"#fff",
            border:"none",borderRadius:8,fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:900,letterSpacing:2,
            cursor:"pointer",boxShadow:pvValid?"0 0 20px rgba(68,255,170,0.4)":"0 0 20px rgba(255,51,102,0.4)"
          }}>
            ⚔ LAÇAR JOGADA
          </button>
        )}
        {(phase === "p1" || phase === "p2") && (
          <button onClick={passTurn} style={{
            padding:"12px 22px",background:"#0a0e28",color:"#7075a5",
            border:"1px solid #1f2556",borderRadius:8,fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,
            cursor:"pointer",transition:"all 0.2s"
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#3355ff"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1f2556"}
          >↩ PASSAR VEZ</button>
        )}
      </div>

      {/* Footer Indicators */}
      <div style={{paddingBottom:12,display:"flex",gap:16,justifyContent:"center"}}>
        {[{c:"#3355ff",l:"VERBO"},{c:"#ff7700",l:"PARTÍCULA"},{c:"#ff1144",l:"AÇÃO"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#505580",fontWeight:600}}>
            <div style={{width:8,height:8,borderRadius:2,background:c,boxShadow:`0 0 6px ${c}`}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

