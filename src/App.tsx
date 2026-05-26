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
  who?: "you" | "cpu";
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
  ph: CardItem[];
  ch: CardItem[];
  ps: number;
  cs: number;
  round: number;
  blocked: boolean;
  dbl: boolean;
}

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
   HELPERS
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

function bestCpuPlay(hand: CardItem[]): {v: CardItem; p: CardItem} | null {
  const verbs = hand.filter(c=>c.type==="verb");
  const parts = hand.filter(c=>c.type==="particle");
  let best: {v: CardItem; p: CardItem} | null = null;
  for (const v of verbs)
    for (const p of parts)
      if (PV[`${v.val} ${p.val}`] && (!best || v.pts > best.v.pts))
        best = {v,p};
  return best;
}

/* ═══════════════════════════════════════════════════════
   CARD COMPONENT
═══════════════════════════════════════════════════════ */
const CARD_CFG: Record<"verb" | "particle" | "action", {border: string; bg: string; glow: string}> = {
  verb:     {border:"#3355ff",bg:"linear-gradient(145deg,#1a1a5e,#0d0d3a)",glow:"#3355ff55"},
  particle: {border:"#ff7700",bg:"linear-gradient(145deg,#4d2000,#2a1000)",glow:"#ff770055"},
  action:   {border:"#ff1144",bg:"linear-gradient(145deg,#4d0011,#2a000c)",glow:"#ff114455"},
};
const ACT_ICON: Record<string, string> = {steal:"🗡️",swap:"🔄",block:"🛡️",double:"⚡"};
const ACT_CLR: Record<string, string>  = {steal:"#ff3366",swap:"#33ccff",block:"#33ff99",double:"#ffcc00"};

function Card({card, selected, onClick, faceDown}: CardProps) {
  if (faceDown) return (
    <div style={{width:60,height:88,borderRadius:8,flexShrink:0,background:"linear-gradient(145deg,#1a1a3e,#0d0d2a)",border:"2px solid #1a1a40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#22234a"}}>
      ♠
    </div>
  );
  
  const cfg = CARD_CFG[card.type];
  const isAct = card.type === "action";
  const aColor = isAct && card.act ? ACT_CLR[card.act] : undefined;
  const fz = card.val.length > 6 ? 9 : card.val.length > 4 ? 11 : 13;
  
  return (
    <div onClick={onClick} style={{
      width:60,height:88,borderRadius:8,flexShrink:0,position:"relative",
      background:cfg.bg,
      border:`2px solid ${selected?"#ffffff":cfg.border}`,
      boxShadow:selected?`0 0 24px #fff,0 0 50px ${cfg.glow}`:`0 4px 14px #0009,0 0 8px ${cfg.glow}`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      cursor:"pointer",userSelect:"none",
      transform:selected?"translateY(-14px) scale(1.07)":"translateY(0) scale(1)",
      transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{position:"absolute",top:3,left:4,fontSize:7,color:isAct?aColor:cfg.border,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>
        {card.type==="verb"?"V":card.type==="particle"?"P":"★"}
      </div>
      {card.type==="verb" && (
        <div style={{position:"absolute",top:3,right:3,background:"#ffd700",color:"#000",borderRadius:"50%",width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900}}>
          {card.pts}
        </div>
      )}
      <div style={{fontSize:isAct?22:fz,fontWeight:900,color:isAct?aColor:"#fff",lineHeight:1,textAlign:"center",padding:"0 3px"}}>
        {isAct && card.act ? ACT_ICON[card.act] : card.val}
      </div>
      {isAct && <div style={{fontSize:7,color:aColor,fontWeight:700,marginTop:3,letterSpacing:0.5}}>{card.val}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════════ */
function NotifPanel({n}: {n: NotifData}) {
  if (n.pass) return (
    <div style={{textAlign:"center",animation:"slideUp 0.3s ease"}}>
      <div style={{fontSize:26,marginBottom:6}}>🔁</div>
      <div style={{fontSize:11,color:"#445",letterSpacing:1}}>Comprando novas cartas...</div>
    </div>
  );
  if (n.bl) return (
    <div style={{textAlign:"center",animation:"popIn 0.35s ease"}}>
      <div style={{fontSize:38}}>🛡️</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,color:"#33ff99",marginTop:8,letterSpacing:2}}>CPU BLOQUEADA!</div>
    </div>
  );
  if (n.noPlay) return (
    <div style={{textAlign:"center",animation:"slideUp 0.3s ease"}}>
      <div style={{fontSize:26}}>😤</div>
      <div style={{fontSize:11,color:"#445",marginTop:6}}>CPU não tem par válido. Comprando cartas...</div>
    </div>
  );
  if (n.action && n.act) {
    const icons: Record<string, string> = {steal:"🗡️",swap:"🔄",block:"🛡️",double:"⚡"};
    const clrs: Record<string, string> = {steal:"#ff3366",swap:"#33ccff",block:"#33ff99",double:"#ffcc00"};
    const msgs: Record<string, string> = {
      steal: n.failed ? "CPU não tem par para roubar!" : `Roubaste ${n.pts} pts! (${n.key})`,
      swap: "Mão trocada com a CPU!",
      block: "CPU bloqueada na próxima rodada!",
      double: "Próxima jogada vale o DOBRO!",
    };
    return (
      <div style={{textAlign:"center",animation:"popIn 0.35s ease"}}>
        <div style={{fontSize:36}}>{icons[n.act]}</div>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:clrs[n.act],marginTop:8,letterSpacing:1,maxWidth:250}}>{msgs[n.act]}</div>
      </div>
    );
  }
  
  const isYou = n.who === "you";
  const color = n.valid ? (isYou?"#44ffaa":"#ff3366") : "#445";
  const longKey = n.key && n.key.length > 14;
  
  return (
    <div style={{textAlign:"center",animation:"popIn 0.35s ease",maxWidth:280,padding:"0 8px"}}>
      <div style={{fontSize:9,color:"#445",letterSpacing:2,marginBottom:4}}>{isYou?"VOCÊ JOGOU":"CPU JOGOU"}</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:longKey?11:17,fontWeight:900,color,textShadow:n.valid?`0 0 20px ${color}`:"none",letterSpacing:2,marginBottom:6}}>
        {n.key}
      </div>
      {n.valid ? (
        <>
          <div style={{fontSize:10,color:"#334",fontStyle:"italic",marginBottom:8,lineHeight:1.5}}>"{n.ex}"</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,color,textShadow:`0 0 15px ${color}`}}>+{n.pts} pts</div>
        </>
      ) : (
        <div style={{fontSize:11,color:"#ff3366"}}>❌ Combinação inválida! Sem pontos.</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════════ */
function Menu({onStart}: {onStart: () => void}) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#07071a,#0c1428,#07071a)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0"}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,color:"#ff6600",letterSpacing:6,marginBottom:16,animation:"glow 2s infinite"}}>CARD BATTLE</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:30,fontWeight:900,color:"#3355ff",textShadow:"0 0 40px #3355ff",letterSpacing:4,marginBottom:4}}>⚔ PHRASAL</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:30,fontWeight:900,color:"#ff3366",textShadow:"0 0 40px #ff3366",letterSpacing:4,marginBottom:36}}>VERB DUEL</div>
      <div style={{background:"#0d0d1e",border:"1px solid #1a1a3e",borderRadius:14,padding:"18px 22px",maxWidth:300,marginBottom:32,textAlign:"left",fontSize:12,lineHeight:2.1,color:"#778"}}>
        <div style={{color:"#3355ff",fontFamily:"'Orbitron',monospace",fontSize:10,letterSpacing:2,marginBottom:10}}>COMO JOGAR</div>
        <div>🔵 <b style={{color:"#99aaff"}}>Verbo</b> + 🟠 <b style={{color:"#ffaa55"}}>Partícula</b> = Phrasal verb!</div>
        <div>💛 Pontos = valor do verbo (2 ou 3)</div>
        <div>🗡️ <b style={{color:"#ff3366"}}>STEAL</b> — rouba pontos da CPU</div>
        <div>🔄 <b style={{color:"#33ccff"}}>SWAP</b> — troca mão com a CPU</div>
        <div>🛡️ <b style={{color:"#33ff99"}}>BLOCK</b> — bloqueia CPU por 1 turno</div>
        <div>⚡ <b style={{color:"#ffcc00"}}>DOUBLE</b> — dobra seus pontos</div>
        <div style={{marginTop:6,borderTop:"1px solid #1a1a3e",paddingTop:8,color:"#445",fontSize:11}}>10 rodadas • Maior pontuação vence</div>
      </div>
      <button
        onClick={onStart}
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}
        style={{padding:"14px 44px",background:"linear-gradient(135deg,#3355ff,#8844ff)",color:"#fff",border:"none",borderRadius:10,fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,letterSpacing:3,cursor:"pointer",boxShadow:"0 0 30px #3355ff66",transform:hover?"scale(1.06)":"scale(1)",transition:"transform 0.2s"}}
      >▶ COMEÇAR</button>
    </div>
  );
}

function GameOver({ps, cs, onPlay}: {ps: number; cs: number; onPlay: () => void}) {
  const win = ps > cs, tie = ps === cs;
  const color = tie ? "#ffcc00" : win ? "#44ffaa" : "#ff3366";
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#07071a,#0c1428,#07071a)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0"}}>
      <div style={{fontSize:60,marginBottom:16,animation:"popIn 0.5s ease"}}>{tie?"🤝":win?"🏆":"🤖"}</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,color,textShadow:`0 0 30px ${color}`,letterSpacing:3,marginBottom:32,animation:"popIn 0.5s ease 0.1s both"}}>
        {tie?"EMPATE!":win?"VOCÊ VENCEU!":"CPU VENCEU!"}
      </div>
      <div style={{display:"flex",gap:40,marginBottom:40,animation:"slideUp 0.5s ease 0.2s both"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"#556",letterSpacing:2,marginBottom:4}}>CPU</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:44,fontWeight:900,color:"#ff3366",textShadow:"0 0 20px #ff336688"}}>{cs}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",color:"#334",fontFamily:"'Orbitron',monospace",fontSize:14}}>VS</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"#556",letterSpacing:2,marginBottom:4}}>VOCÊ</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:44,fontWeight:900,color:"#44ffaa",textShadow:"0 0 20px #44ffaa88"}}>{ps}</div>
        </div>
      </div>
      <button onClick={onPlay} style={{padding:"14px 44px",background:"linear-gradient(135deg,#3355ff,#8844ff)",color:"#fff",border:"none",borderRadius:10,fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,letterSpacing:3,cursor:"pointer",boxShadow:"0 0 30px #3355ff66",animation:"slideUp 0.5s ease 0.3s both"}}>
        🔄 JOGAR DE NOVO
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN GAME
═══════════════════════════════════════════════════════ */
const MAX_ROUNDS = 10;

export default function PhrasalVerbDuel() {
  const [screen, setScreen] = useState<"menu" | "game" | "over">("menu");
  const [deck,   setDeck]   = useState<CardItem[]>([]);
  const [ph,     setPh]     = useState<CardItem[]>([]);
  const [ch,     setCh]     = useState<CardItem[]>([]);
  const [ps,     setPs]     = useState<number>(0);
  const [cs,     setCs]     = useState<number>(0);
  const [round,  setRound]  = useState<number>(1);
  const [phase,  setPhase]  = useState<"player" | "animating" | "cpu">("player");
  
  const [selV,   setSelV]   = useState<CardItem | null>(null);
  const [selP,   setSelP]   = useState<CardItem | null>(null);
  const [notif,  setNotif]  = useState<NotifData | null>(null);
  const [blocked,setBlocked]= useState<boolean>(false);
  const [dbl,    setDbl]    = useState<boolean>(false);

  const ref = useRef<GameRefState>({ deck: [], ph: [], ch: [], ps: 0, cs: 0, round: 1, blocked: false, dbl: false });
  ref.current = {deck,ph,ch,ps,cs,round,blocked,dbl};

  const cssInjected = useRef(false);

  useEffect(() => {
    if (cssInjected.current) return;
    cssInjected.current = true;
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
      *{box-sizing:border-box;}
      @keyframes popIn{0%{opacity:0;transform:scale(0.75)}60%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      @keyframes glow{0%,100%{opacity:1}50%{opacity:0.6}}
      @keyframes cpuBlink{0%,100%{opacity:0.3}50%{opacity:1}}
      @keyframes barGrow{from{width:0}to{width:var(--w)}}
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (phase !== "cpu") return;
    const t = setTimeout(doCpuTurn, 1100);
    return () => clearTimeout(t);
  }, [phase]);

  function newGame() {
    _uid = 0;
    const d = buildDeck();
    setPh(d.slice(0,6)); setCh(d.slice(6,12)); setDeck(d.slice(12));
    setPs(0); setCs(0); setRound(1); setPhase("player");
    setSelV(null); setSelP(null); setNotif(null);
    setBlocked(false); setDbl(false);
    setScreen("game");
  }

  function drawN(d: CardItem[], n: number) { return {drawn:d.slice(0,n), rest:d.slice(n)}; }

  function nextRound() {
    const next = ref.current.round + 1;
    if (next > MAX_ROUNDS) setScreen("over");
    else { setRound(next); setPhase("player"); }
  }

  function submitPlay() {
    if (!selV || !selP || phase !== "player") return;
    const {ph: hand, deck: d, dbl: da} = ref.current;
    const v=selV, p=selP;
    const key = `${v.val} ${p.val}`;
    const valid = !!PV[key];
    const ex = PV[key];
    setSelV(null); setSelP(null); setPhase("animating");
    const base = hand.filter(c=>c.id!==v.id&&c.id!==p.id);
    const {drawn, rest} = drawN(d, 2);
    let pts = 0;
    if (valid) { pts = v.pts*(da?2:1); setPs(s=>s+pts); setDbl(false); }
    setPh([...base,...drawn]); setDeck(rest);
    setNotif({who:"you",valid,key,ex,pts});
    setTimeout(()=>{setNotif(null);setPhase("cpu");}, 2700);
  }

  function doCpuTurn() {
    const {ch: hand, deck: d, blocked: bl} = ref.current;
    if (bl) {
      setBlocked(false);
      setNotif({who:"cpu",bl:true});
      setTimeout(()=>{setNotif(null);nextRound();}, 1900);
      return;
    }
    const play = bestCpuPlay(hand);
    if (play) {
      const base = hand.filter(c=>c.id!==play.v.id&&c.id!==play.p.id);
      const {drawn, rest} = drawN(d, 2);
      setCh([...base,...drawn]); setDeck(rest);
      const pts = play.v.pts;
      setCs(s=>s+pts);
      setNotif({who:"cpu",valid:true,key:`${play.v.val} ${play.p.val}`,ex:PV[`${play.v.val} ${play.p.val}`],pts});
    } else {
      const {drawn, rest} = drawN(d, 2);
      setCh(h=>[...h,...drawn]); setDeck(rest);
      setNotif({who:"cpu",noPlay:true});
    }
    setTimeout(()=>{setNotif(null);nextRound();}, 2500);
  }

  function handleCard(card: CardItem) {
    if (phase !== "player") return;
    if (card.type==="action") { doAction(card); return; }
    if (card.type==="verb") setSelV(prev=>prev?.id===card.id?null:card);
    else setSelP(prev=>prev?.id===card.id?null:card);
  }

  function doAction(card: CardItem) {
    if (phase !== "player" || !card.act) return;
    const {ph: hand, ch: cpuH, deck: d} = ref.current;
    const newHand = hand.filter(c=>c.id!==card.id);
    const notifData: NotifData = {who:"you",action:true,act:card.act};
    if (card.act==="steal") {
      const play = bestCpuPlay(cpuH);
      if (play) { const pts=play.v.pts; setPs(s=>s+pts); notifData.pts=pts; notifData.key=`${play.v.val} ${play.p.val}`; }
      else notifData.failed=true;
      const {drawn,rest}=drawN(d,1); setPh([...newHand,...drawn]); setDeck(rest);
    } else if (card.act==="swap") {
      setPh([...cpuH]); setCh([...newHand]);
    } else if (card.act==="block") {
      setBlocked(true);
      const {drawn,rest}=drawN(d,1); setPh([...newHand,...drawn]); setDeck(rest);
    } else if (card.act==="double") {
      setDbl(true);
      const {drawn,rest}=drawN(d,1); setPh([...newHand,...drawn]); setDeck(rest);
    }
    setSelV(null); setSelP(null); setNotif(notifData); setPhase("animating");
    setTimeout(()=>{setNotif(null);setPhase("cpu");}, 2100);
  }

  function passTurn() {
    if (phase !== "player") return;
    const {ph: hand, deck: d} = ref.current;
    const {drawn,rest} = drawN(d,2);
    setPh([...hand.slice(2),...drawn]); setDeck(rest);
    setSelV(null); setSelP(null);
    setNotif({pass:true}); setPhase("animating");
    setTimeout(()=>{setNotif(null);setPhase("cpu");}, 1600);
  }

  if (screen==="menu") return <Menu onStart={newGame}/>;
  if (screen==="over") return <GameOver ps={ps} cs={cs} onPlay={newGame}/>;

  const isPlayerTurn = phase==="player";
  const pvKey = selV && selP ? `${selV.val} ${selP.val}` : null;
  const pvValid = pvKey ? !!PV[pvKey] : null;
  const pct = (round/MAX_ROUNDS)*100;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#07071a,#0b1228,#07071a)",display:"flex",flexDirection:"column",fontFamily:"'Rajdhani',sans-serif",color:"#d0d0f0",overflow:"hidden"}}>

      {/* Header */}
      <div style={{padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #111133",flexShrink:0,background:"#06061500"}}>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#3355ff",letterSpacing:2,textShadow:"0 0 12px #3355ff66"}}>⚔ PHRASAL DUEL</span>
        <div style={{flex:1,margin:"0 12px",height:3,background:"#111133",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#3355ff,#ff3366)",borderRadius:2,width:`${pct}%`,transition:"width 0.5s ease"}}/>
        </div>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:10,color:"#445",letterSpacing:1}}>R{round}/{MAX_ROUNDS}</span>
      </div>

      {/* Scoreboard */}
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 16px 4px",flexShrink:0}}>
        <div style={{textAlign:"center",minWidth:80}}>
          <div style={{fontSize:8,letterSpacing:2,color:"#445",marginBottom:2}}>CPU</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:30,fontWeight:900,color:"#ff3366",textShadow:"0 0 20px #ff336688",lineHeight:1}}>{cs}</div>
          {blocked && <div style={{fontSize:8,color:"#33ff99",marginTop:2,animation:"glow 1s infinite"}}>🛡️ BLOQUEADA</div>}
        </div>
        <div style={{color:"#1a1a3e",fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:700}}>VS</div>
        <div style={{textAlign:"center",minWidth:80}}>
          <div style={{fontSize:8,letterSpacing:2,color:"#445",marginBottom:2}}>VOCÊ</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:30,fontWeight:900,color:"#44ffaa",textShadow:"0 0 20px #44ffaa88",lineHeight:1}}>{ps}</div>
          {dbl && <div style={{fontSize:8,color:"#ffcc00",marginTop:2,animation:"glow 1s infinite"}}>⚡ DOUBLE ATIVO</div>}
        </div>
      </div>

      {/* CPU Hand */}
      <div style={{padding:"4px 10px 6px",flexShrink:0}}>
        <div style={{fontSize:8,color:"#1a1a44",letterSpacing:2,textAlign:"center",marginBottom:4}}>MÃO DA CPU ({ch.length} cartas)</div>
        <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
          {ch.slice(0,6).map(c=><Card key={c.id} card={c} faceDown/>)}
          {ch.length>6 && <div style={{display:"flex",alignItems:"center",fontSize:10,color:"#223",fontWeight:700}}>+{ch.length-6}</div>}
        </div>
      </div>

      <div style={{height:1,background:"linear-gradient(90deg,transparent,#1a1a3e,transparent)",margin:"2px 0",flexShrink:0}}/>

      {/* Play Area */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 14px",minHeight:115}}>
        {notif ? (
          <NotifPanel n={notif}/>
        ) : phase==="cpu" ? (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:30,animation:"cpuBlink 0.8s infinite"}}>🤖</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:10,color:"#ff3366",letterSpacing:2,marginTop:6,animation:"cpuBlink 0.8s infinite"}}>CPU PENSANDO...</div>
          </div>
        ) : phase==="animating" ? (
          <div style={{fontSize:10,color:"#1a1a3e",letterSpacing:2}}>...</div>
        ) : pvKey ? (
          <div style={{textAlign:"center",animation:"popIn 0.3s ease"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:pvKey.length>15?11:18,fontWeight:900,color:pvValid?"#44ffaa":"#ff3366",textShadow:`0 0 20px ${pvValid?"#44ffaa":"#ff3366"}`,letterSpacing:2,marginBottom:5}}>
              {pvKey}
            </div>
            <div style={{fontSize:10,color:pvValid?"#44ffaa66":"#ff336666"}}>
              {pvValid?"✓ Phrasal verb válido! Pressione JOGAR":"✗ Combinação inválida — tente outra"}
            </div>
          </div>
        ) : (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"#223",letterSpacing:2,marginBottom:5}}>SUA VEZ</div>
            <div style={{fontSize:11,color:"#2a2a4a"}}>Selecione um <b style={{color:"#3355ff"}}>VERBO</b> + <b style={{color:"#ff7700"}}>PARTÍCULA</b></div>
            <div style={{fontSize:10,color:"#1a1a3e",marginTop:3}}>ou use uma carta de <b style={{color:"#ff3366"}}>AÇÃO</b></div>
            {dbl && <div style={{fontSize:11,color:"#ffcc00",marginTop:8,animation:"glow 1.5s infinite"}}>⚡ Próxima jogada vale o DOBRO!</div>}
          </div>
        )}
      </div>

      <div style={{height:1,background:"linear-gradient(90deg,transparent,#1a1a3e,transparent)",margin:"2px 0",flexShrink:0}}/>

      {/* Player Hand */}
      <div style={{padding:"6px 8px 4px",flexShrink:0}}>
        <div style={{fontSize:8,color:"#1a1a44",letterSpacing:2,textAlign:"center",marginBottom:5}}>SUA MÃO</div>
        <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
          {ph.map(c=>(
            <Card
              key={c.id} card={c}
              selected={selV?.id===c.id||selP?.id===c.id}
              onClick={()=>handleCard(c)}
            />
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div style={{padding:"8px 12px 16px",display:"flex",gap:8,justifyContent:"center",flexShrink:0}}>
        {selV && selP && isPlayerTurn && (
          <button onClick={submitPlay} style={{
            padding:"11px 28px",
            background:pvValid?"linear-gradient(135deg,#009944,#44ffaa)":"linear-gradient(135deg,#990022,#ff3366)",
            color:pvValid?"#002":"#fff",
            border:"none",borderRadius:9,
            fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:700,letterSpacing:2,
            cursor:"pointer",
            boxShadow:pvValid?"0 0 24px #44ffaa55":"0 0 24px #ff336655",
            animation:pvValid?"glow 1s infinite":"none",
            transition:"all 0.2s",
          }}>
            ⚔ JOGAR
          </button>
        )}
        {isPlayerTurn && (
          <button onClick={passTurn} style={{
            padding:"11px 18px",
            background:"#0d0d20",color:"#334",
            border:"1px solid #1a1a3e",borderRadius:9,
            fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:600,
            cursor:"pointer",transition:"all 0.2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#3355ff"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1a1a3e"}
          >↩ PASSAR</button>
        )}
      </div>

      {/* Legend */}
      <div style={{padding:"0 12px 10px",display:"flex",gap:12,justifyContent:"center",flexShrink:0}}>
        {[{c:"#3355ff",l:"VERBO"},{c:"#ff7700",l:"PARTÍCULA"},{c:"#ff1144",l:"AÇÃO"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#334"}}>
            <div style={{width:8,height:8,borderRadius:2,background:c,boxShadow:`0 0 6px ${c}55`}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

