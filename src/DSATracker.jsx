import { useState, useEffect, useMemo, useRef } from "react";

/* ── Constants ───────────────────────────────────────────────────────── */
const PATTERNS = [
  "Arrays","Hashing","Two Pointers","Sliding Window","Stack",
  "Binary Search","Linked List","Trees","Tries","Heap / Priority Queue",
  "Backtracking","Graphs","Dynamic Programming","Greedy",
  "Intervals","Math & Geometry","Bit Manipulation"
];
const DIFFICULTIES = ["Easy","Medium","Hard"];
const STATUSES = ["Not Started","Attempted","Solved"];
const STORAGE_KEY = "dsa-tracker-v1";
const genId = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36);

const diffColor  = { Easy:"#22c55e", Medium:"#f59e0b", Hard:"#ef4444" };
const statColor  = { "Not Started":"#6b7280", Attempted:"#f97316", Solved:"#22c55e" };

/* ── Persistence ─────────────────────────────────────────────────────── */
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
const save = (qs) => localStorage.setItem(STORAGE_KEY, JSON.stringify(qs));

/* ── Global Styles ───────────────────────────────────────────────────── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#080c14;font-family:'Syne','Segoe UI',sans-serif}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:#0a0d16}
    ::-webkit-scrollbar-thumb{background:#1e2535;border-radius:3px}
    select option{background:#0f1117;color:#e2e8f0}
    input::placeholder,textarea::placeholder{color:#374151}
    .qrow{transition:background .15s}
    .qrow:hover{background:#0f1520!important}
    .star-btn{transition:all .2s;font-size:16px}
    .card-flip{transition:transform .55s cubic-bezier(.4,0,.2,1)}
    .tag-chip{transition:all .2s}
    .tag-chip:hover{opacity:.8}
    a{transition:color .15s}
  `}</style>
);

/* ── Badge ───────────────────────────────────────────────────────────── */
function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-block",padding:"2px 9px",borderRadius:4,
      fontSize:11,fontWeight:700,letterSpacing:".05em",
      color,border:`1px solid ${color}33`,background:`${color}15`
    }}>{label}</span>
  );
}

/* ── Modal Overlay ───────────────────────────────────────────────────── */
function Overlay({ children, onClose, width = "min(720px,96vw)" }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.88)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:1000,backdropFilter:"blur(6px)"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0a0d16",border:"1px solid #1e2535",
        borderRadius:14,width,maxHeight:"92vh",
        display:"flex",flexDirection:"column",overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,.8)"
      }}>{children}</div>
    </div>
  );
}

/* ── Question Modal ──────────────────────────────────────────────────── */
const BLANK = {
  name:"",link:"",difficulty:"Medium",pattern:"Arrays",
  status:"Not Started",isImportant:false,
  hint:"",patternNotes:"",codeSnippet:"",flashcard:"",
  reviewAgain:false,lastReviewed:null
};

function QuestionModal({ initial, onSave, onClose }) {
  const [q,setQ] = useState(initial || BLANK);
  const [tab,setTab] = useState("hint");
  const [customMode,setCustomMode] = useState(!PATTERNS.includes(initial?.pattern || "Arrays"));

  const set = (k,v) => setQ(p=>({...p,[k]:v}));

  const handleSave = () => {
    if (!q.name.trim()) return alert("Question name is required.");
    const flashcard = q.flashcard ||
      `Pattern: ${q.pattern}\n\nHint:\n${q.hint}\n\nPattern Notes:\n${q.patternNotes}\n\nCode:\n${q.codeSnippet}`;
    onSave({ ...q, flashcard, id: q.id || genId() });
  };

  const inp = {
    width:"100%",background:"#080c14",border:"1px solid #1e2535",
    borderRadius:6,padding:"8px 12px",color:"#e2e8f0",
    fontSize:13,outline:"none"
  };
  const lbl = { fontSize:11,color:"#64748b",marginBottom:4,display:"block",fontWeight:700,letterSpacing:".06em" };
  const tabBtn = (active) => ({
    padding:"9px 16px",fontSize:12,fontWeight:700,letterSpacing:".05em",
    cursor:"pointer",border:"none",background:"transparent",
    color:active?"#f0a500":"#4b5563",
    borderBottom:active?"2px solid #f0a500":"2px solid transparent",
    transition:"all .2s"
  });

  const TABS = [
    ["hint","💡 HINT"],["patternNotes","🧩 PATTERN"],
    ["codeSnippet","</> CODE TEMPLATE"],["flashcard","🃏 FLASHCARD"]
  ];

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{padding:"18px 24px",borderBottom:"1px solid #1e2535",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{color:"#f0a500",fontWeight:800,fontSize:15,letterSpacing:".06em"}}>
          {initial?.id ? "✏️  EDIT QUESTION" : "➕  ADD QUESTION"}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
      </div>

      <div style={{overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
        {/* Row 1 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={lbl}>QUESTION NAME *</label>
            <input style={inp} value={q.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Two Sum" />
          </div>
          <div>
            <label style={lbl}>LEETCODE / NEETCODE LINK</label>
            <input style={inp} value={q.link} onChange={e=>set("link",e.target.value)} placeholder="https://leetcode.com/problems/..." />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div>
            <label style={lbl}>DIFFICULTY</label>
            <select style={inp} value={q.difficulty} onChange={e=>set("difficulty",e.target.value)}>
              {DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>STATUS</label>
            <select style={inp} value={q.status} onChange={e=>set("status",e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>PATTERN</label>
            {!customMode ? (
              <select style={inp} value={PATTERNS.includes(q.pattern)?q.pattern:"__c"} onChange={e=>{
                if(e.target.value==="__c"){setCustomMode(true);set("pattern","");}
                else set("pattern",e.target.value);
              }}>
                {PATTERNS.map(p=><option key={p}>{p}</option>)}
                <option value="__c">+ Custom pattern...</option>
              </select>
            ):(
              <div style={{display:"flex",gap:6}}>
                <input style={{...inp,flex:1}} value={q.pattern} onChange={e=>set("pattern",e.target.value)} placeholder="Custom pattern name" autoFocus />
                <button onClick={()=>{setCustomMode(false);set("pattern","Arrays");}} style={{
                  padding:"0 10px",borderRadius:6,border:"1px solid #1e2535",
                  background:"transparent",color:"#64748b",cursor:"pointer",fontSize:12
                }}>↩</button>
              </div>
            )}
          </div>
        </div>

        {/* Important */}
        <div>
          <button onClick={()=>set("isImportant",!q.isImportant)} style={{
            padding:"7px 16px",borderRadius:6,border:`1px solid ${q.isImportant?"#f0a500":"#1e2535"}`,
            background:q.isImportant?"#f0a50018":"transparent",
            color:q.isImportant?"#f0a500":"#4b5563",
            cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6
          }}>
            {q.isImportant?"⭐ IMPORTANT":"☆ MARK AS IMPORTANT"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{borderBottom:"1px solid #1e2535"}}>
          {TABS.map(([k,l])=>(
            <button key={k} style={tabBtn(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Tab panels */}
        {tab==="hint"&&(
          <textarea style={{...inp,minHeight:130,resize:"vertical",lineHeight:1.7,fontFamily:"inherit"}}
            value={q.hint} onChange={e=>set("hint",e.target.value)}
            placeholder="Your own hint — the key insight that unlocks the solution. What should you think of first?" />
        )}
        {tab==="patternNotes"&&(
          <textarea style={{...inp,minHeight:130,resize:"vertical",lineHeight:1.7,fontFamily:"inherit"}}
            value={q.patternNotes} onChange={e=>set("patternNotes",e.target.value)}
            placeholder="Describe the pattern: When do you use it? What's the template? What edge cases apply?" />
        )}
        {tab==="codeSnippet"&&(
          <textarea style={{...inp,minHeight:170,resize:"vertical",fontFamily:"'JetBrains Mono',monospace",fontSize:13,lineHeight:1.7}}
            value={q.codeSnippet} onChange={e=>set("codeSnippet",e.target.value)}
            placeholder={"# Key solution template / skeleton\ndef solve(nums):\n    left, right = 0, len(nums)-1\n    while left < right:\n        ..."} />
        )}
        {tab==="flashcard"&&(
          <div>
            <p style={{fontSize:12,color:"#64748b",marginBottom:8,lineHeight:1.6}}>
              Auto-generated from your notes if left blank. Edit to customize exactly what appears on the card back.
            </p>
            <textarea style={{...inp,minHeight:150,resize:"vertical",lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}
              value={q.flashcard} onChange={e=>set("flashcard",e.target.value)}
              placeholder={`Pattern: ${q.pattern}\n\nHint:\n${q.hint || "..."}\n\nCode:\n${q.codeSnippet || "..."}`} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{padding:"14px 24px",borderTop:"1px solid #1e2535",display:"flex",justifyContent:"flex-end",gap:10}}>
        <button onClick={onClose} style={{
          padding:"8px 20px",borderRadius:6,border:"1px solid #1e2535",
          background:"transparent",color:"#64748b",cursor:"pointer",fontWeight:700,fontSize:13
        }}>CANCEL</button>
        <button onClick={handleSave} style={{
          padding:"8px 28px",borderRadius:6,border:"none",
          background:"#f0a500",color:"#080c14",cursor:"pointer",fontWeight:800,fontSize:13,
          boxShadow:"0 0 20px #f0a50040"
        }}>SAVE QUESTION</button>
      </div>
    </Overlay>
  );
}

/* ── Flashcard Review ────────────────────────────────────────────────── */
function FlashcardReview({ questions, onClose, onUpdate }) {
  const [filter,setFilter] = useState("all");
  const [idx,setIdx] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [animating,setAnimating] = useState(false);

  const cards = useMemo(()=>{
    if(filter==="important") return questions.filter(q=>q.isImportant);
    if(filter==="review") return questions.filter(q=>q.reviewAgain);
    return [...questions];
  },[questions,filter]);

  const cur = cards[idx];

  const navigate = (dir) => {
    if(animating) return;
    const next = idx + dir;
    if(next < 0 || next >= cards.length) return;
    setAnimating(true);
    setFlipped(false);
    setTimeout(()=>{ setIdx(next); setAnimating(false); },200);
  };

  useEffect(()=>{
    const fn = e=>{
      if(e.key==="ArrowRight") navigate(1);
      if(e.key==="ArrowLeft") navigate(-1);
      if(e.key===" ") { e.preventDefault(); setFlipped(f=>!f); }
    };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[idx,cards.length]);

  const markGotIt = () => { onUpdate(cur.id,{reviewAgain:false,lastReviewed:Date.now()}); navigate(1); };
  const markReview = () => { onUpdate(cur.id,{reviewAgain:true,lastReviewed:Date.now()}); navigate(1); };

  const backContent = cur
    ? (cur.flashcard || `Pattern: ${cur.pattern}\n\nHint:\n${cur.hint || "—"}\n\nPattern Notes:\n${cur.patternNotes || "—"}\n\nCode:\n${cur.codeSnippet || "—"}`)
    : "";

  const FILTERS = [["all","All"],["important","⭐ Important"],["review","🔁 Review Again"]];

  return (
    <Overlay onClose={onClose} width="min(680px,96vw)">
      <div style={{padding:"18px 24px",borderBottom:"1px solid #1e2535",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <span style={{color:"#f0a500",fontWeight:800,fontSize:15,letterSpacing:".06em"}}>🃏 FLASHCARD REVIEW</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {FILTERS.map(([k,l])=>(
            <button key={k} onClick={()=>{setFilter(k);setIdx(0);setFlipped(false);}} style={{
              padding:"5px 12px",borderRadius:5,border:`1px solid ${filter===k?"#f0a50040":"#1e2535"}`,
              background:filter===k?"#f0a50018":"transparent",
              color:filter===k?"#f0a500":"#4b5563",
              cursor:"pointer",fontSize:11,fontWeight:700
            }}>{l}</button>
          ))}
          <button onClick={onClose} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:22,lineHeight:1,marginLeft:8}}>×</button>
        </div>
      </div>

      <div style={{padding:"28px 32px",display:"flex",flexDirection:"column",alignItems:"center",minHeight:420}}>
        {cards.length===0 ? (
          <div style={{textAlign:"center",marginTop:80,color:"#374151"}}>
            <div style={{fontSize:52,marginBottom:16}}>🃏</div>
            <div style={{fontSize:16,fontWeight:700,color:"#64748b"}}>No cards in this set</div>
            <div style={{fontSize:13,marginTop:6}}>Adjust the filter above.</div>
          </div>
        ):(
          <>
            {/* Progress bar */}
            <div style={{width:"100%",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:"#4b5563",fontWeight:600}}>CARD {idx+1} OF {cards.length}</span>
                <span style={{fontSize:11,color:"#374151"}}>Space to flip · ← → to navigate</span>
              </div>
              <div style={{height:3,background:"#1e2535",borderRadius:2}}>
                <div style={{height:"100%",borderRadius:2,background:"#f0a500",width:`${((idx+1)/cards.length)*100}%`,transition:"width .3s"}} />
              </div>
            </div>

            {/* Card */}
            <div onClick={()=>setFlipped(f=>!f)} style={{width:"100%",perspective:1200,cursor:"pointer",userSelect:"none"}}>
              <div className="card-flip" style={{
                position:"relative",width:"100%",height:280,
                transformStyle:"preserve-3d",
                transform:flipped?"rotateY(180deg)":"rotateY(0deg)"
              }}>
                {/* Front */}
                <div style={{
                  position:"absolute",inset:0,backfaceVisibility:"hidden",
                  background:"#080c14",border:"1px solid #1e2535",borderRadius:14,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  padding:32,textAlign:"center",gap:12
                }}>
                  <Badge label={cur.pattern} color="#00d4aa" />
                  <div style={{fontSize:26,fontWeight:800,color:"#e2e8f0",lineHeight:1.25,letterSpacing:"-.01em"}}>
                    {cur.name}
                  </div>
                  <Badge label={cur.difficulty} color={diffColor[cur.difficulty]} />
                  {cur.isImportant && <span style={{fontSize:13,color:"#f0a500"}}>⭐ Important</span>}
                  <div style={{color:"#374151",fontSize:12,marginTop:8}}>Click or press Space to reveal →</div>
                </div>

                {/* Back */}
                <div style={{
                  position:"absolute",inset:0,backfaceVisibility:"hidden",
                  transform:"rotateY(180deg)",
                  background:"linear-gradient(135deg,#0a0f1e,#080c14)",
                  border:"1px solid #f0a50030",borderRadius:14,
                  padding:"20px 24px",overflowY:"auto"
                }}>
                  <div style={{color:"#f0a500",fontWeight:700,fontSize:11,letterSpacing:".1em",marginBottom:12}}>
                    ◆ PATTERN & SOLUTION
                  </div>
                  <pre style={{
                    color:"#cbd5e1",fontSize:13,lineHeight:1.8,
                    fontFamily:"'JetBrains Mono',monospace",
                    whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0
                  }}>{backContent}</pre>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{display:"flex",gap:10,marginTop:22,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
              <button onClick={()=>navigate(-1)} disabled={idx===0} style={{
                padding:"8px 16px",borderRadius:6,border:"1px solid #1e2535",
                background:"transparent",color:idx===0?"#1e2535":"#64748b",
                cursor:idx===0?"not-allowed":"pointer",fontWeight:700,fontSize:12
              }}>← PREV</button>

              {!flipped?(
                <button onClick={()=>setFlipped(true)} style={{
                  padding:"10px 32px",borderRadius:6,border:"none",
                  background:"#f0a500",color:"#080c14",cursor:"pointer",fontWeight:800,fontSize:13,
                  boxShadow:"0 0 24px #f0a50050"
                }}>FLIP CARD</button>
              ):(
                <>
                  <button onClick={markReview} style={{
                    padding:"10px 20px",borderRadius:6,border:"1px solid #ef444460",
                    background:"#ef444415",color:"#ef4444",cursor:"pointer",fontWeight:700,fontSize:13
                  }}>🔁 REVIEW AGAIN</button>
                  <button onClick={markGotIt} style={{
                    padding:"10px 20px",borderRadius:6,border:"none",
                    background:"#22c55e",color:"#080c14",cursor:"pointer",fontWeight:800,fontSize:13
                  }}>✓ GOT IT</button>
                </>
              )}

              <button onClick={()=>navigate(1)} disabled={idx===cards.length-1} style={{
                padding:"8px 16px",borderRadius:6,border:"1px solid #1e2535",
                background:"transparent",color:idx===cards.length-1?"#1e2535":"#64748b",
                cursor:idx===cards.length-1?"not-allowed":"pointer",fontWeight:700,fontSize:12
              }}>NEXT →</button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────── */
function DetailDrawer({ q, onClose, onEdit }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{padding:"18px 24px",borderBottom:"1px solid #1e2535",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"#f0a500",fontWeight:800,fontSize:15}}>{q.name}</div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <Badge label={q.pattern} color="#00d4aa" />
            <Badge label={q.difficulty} color={diffColor[q.difficulty]} />
            <Badge label={q.status} color={statColor[q.status]} />
            {q.isImportant&&<span style={{fontSize:13}}>⭐</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onEdit} style={{
            padding:"7px 16px",borderRadius:6,border:"1px solid #1e2535",
            background:"transparent",color:"#94a3b8",cursor:"pointer",fontWeight:700,fontSize:12
          }}>✏️ EDIT</button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:22}}>×</button>
        </div>
      </div>
      <div style={{overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:20}}>
        {q.link&&(
          <a href={q.link} target="_blank" rel="noreferrer" style={{
            color:"#00d4aa",fontSize:13,fontFamily:"'JetBrains Mono',monospace",
            textDecoration:"none",borderBottom:"1px dashed #00d4aa40",width:"fit-content"
          }}>{q.link}</a>
        )}
        {[
          ["💡 HINT",q.hint],
          ["🧩 PATTERN NOTES",q.patternNotes],
          ["</> CODE TEMPLATE",q.codeSnippet]
        ].filter(([,v])=>v).map(([label,val])=>(
          <div key={label}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".08em",color:"#4b5563",marginBottom:8}}>{label}</div>
            <pre style={{
              background:"#080c14",border:"1px solid #1e2535",borderRadius:8,
              padding:"14px 16px",fontSize:13,lineHeight:1.8,color:"#cbd5e1",
              fontFamily: label.includes("</>") ? "'JetBrains Mono',monospace" : "inherit",
              whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0
            }}>{val}</pre>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

/* ── Sort Button ─────────────────────────────────────────────────────── */
function SortBtn({ field, label, sortBy, sortDir, onSort }) {
  const active = sortBy===field;
  return (
    <button onClick={()=>onSort(field)} style={{
      background:"transparent",border:"none",cursor:"pointer",padding:0,
      color:active?"#f0a500":"#4b5563",
      fontSize:11,fontWeight:700,letterSpacing:".06em",
      display:"flex",alignItems:"center",gap:4
    }}>
      {label} <span style={{fontSize:10}}>{active?(sortDir==="asc"?"↑":"↓"):"↕"}</span>
    </button>
  );
}

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [questions,setQuestions] = useState(load);
  const [search,setSearch] = useState("");
  const [fPat,setFPat] = useState("All");
  const [fDiff,setFDiff] = useState("All");
  const [fStat,setFStat] = useState("All");
  const [fImp,setFImp] = useState(false);
  const [sortBy,setSortBy] = useState("name");
  const [sortDir,setSortDir] = useState("asc");
  const [modal,setModal] = useState(null);       // null | { mode, question }
  const [drawer,setDrawer] = useState(null);     // question | null
  const [review,setReview] = useState(false);
  const fileRef = useRef();

  useEffect(()=>save(questions),[questions]);

  const updateQ = (id,patch) => setQuestions(qs=>qs.map(q=>q.id===id?{...q,...patch}:q));

  const handleSave = (q) => {
    setQuestions(qs=>{
      const i=qs.findIndex(x=>x.id===q.id);
      if(i>=0){const next=[...qs];next[i]=q;return next;}
      return [q,...qs];
    });
    setModal(null);
    setDrawer(null);
  };

  const handleDelete = (id) => {
    if(!confirm("Delete this question?")) return;
    setQuestions(qs=>qs.filter(q=>q.id!==id));
    setDrawer(null);
  };

  const handleExport = () => {
    const blob=new Blob([JSON.stringify(questions,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download="dsa-tracker.json";a.click();
  };
  const handleImport = e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)){setQuestions(d);alert(`Imported ${d.length} questions.`);}}
      catch{alert("Invalid JSON.");}
    };
    r.readAsText(f);e.target.value="";
  };

  /* ── Sort handler ─────────────────── */
  const handleSort = (field) => {
    if(sortBy===field) setSortDir(d=>d==="asc"?"desc":"asc");
    else{setSortBy(field);setSortDir("asc");}
  };

  /* ── Filtered + sorted list ───────── */
  const filtered = useMemo(()=>{
    let qs=[...questions];
    if(search) qs=qs.filter(q=>q.name.toLowerCase().includes(search.toLowerCase()));
    if(fPat!=="All") qs=qs.filter(q=>q.pattern===fPat);
    if(fDiff!=="All") qs=qs.filter(q=>q.difficulty===fDiff);
    if(fStat!=="All") qs=qs.filter(q=>q.status===fStat);
    if(fImp) qs=qs.filter(q=>q.isImportant);
    const d=sortDir==="asc"?1:-1;
    return qs.sort((a,b)=>{
      if(sortBy==="name") return d*a.name.localeCompare(b.name);
      if(sortBy==="pattern") return d*a.pattern.localeCompare(b.pattern);
      if(sortBy==="difficulty") return d*(DIFFICULTIES.indexOf(a.difficulty)-DIFFICULTIES.indexOf(b.difficulty));
      if(sortBy==="status") return d*(STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status));
      return 0;
    });
  },[questions,search,fPat,fDiff,fStat,fImp,sortBy,sortDir]);

  /* ── Stats ────────────────────────── */
  const solved = questions.filter(q=>q.status==="Solved").length;
  const attempted = questions.filter(q=>q.status==="Attempted").length;
  const total = questions.length;
  const pct = total>0?Math.round((solved/total)*100):0;

  const patternStats = useMemo(()=>{
    const m={};
    questions.forEach(q=>{
      if(!m[q.pattern])m[q.pattern]={t:0,s:0};
      m[q.pattern].t++; if(q.status==="Solved")m[q.pattern].s++;
    });
    return Object.entries(m).sort((a,b)=>b[1].t-a[1].t);
  },[questions]);

  /* ── Styles ───────────────────────── */
  const inp = {
    background:"#0a0d16",border:"1px solid #1e2535",borderRadius:6,
    padding:"7px 12px",color:"#e2e8f0",fontSize:13,outline:"none"
  };
  const btnGhost = {
    padding:"7px 14px",borderRadius:6,border:"1px solid #1e2535",
    background:"transparent",color:"#64748b",cursor:"pointer",fontSize:12,fontWeight:700
  };

  return (
    <div style={{minHeight:"100vh",background:"#080c14",color:"#e2e8f0",fontFamily:"'Syne','Segoe UI',sans-serif"}}>
      <G />

      {/* ── HEADER ───────────────────────────────────────── */}
      <div style={{
        background:"#0a0d16",borderBottom:"1px solid #1e2535",
        padding:"18px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:14
      }}>
        {/* Logo + Progress */}
        <div style={{display:"flex",alignItems:"center",gap:28}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"#f0a500",letterSpacing:".05em",lineHeight:1}}>
              ⚡ DSA TRACKER
            </div>
            <div style={{fontSize:11,color:"#374151",marginTop:3,letterSpacing:".04em"}}>
              DSA — PATTERN MASTERY by- Anupam Jose
            </div>
          </div>
          {total>0&&(
            <div style={{minWidth:200}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:"#4b5563",fontWeight:600}}>SOLVED</span>
                <span style={{fontSize:11,color:"#f0a500",fontWeight:700}}>{solved}/{total} ({pct}%)</span>
              </div>
              <div style={{height:5,background:"#1e2535",borderRadius:3,overflow:"hidden"}}>
                <div style={{
                  height:"100%",borderRadius:3,
                  background:"linear-gradient(90deg,#f0a500,#22c55e)",
                  width:`${pct}%`,transition:"width .6s ease"
                }}/>
              </div>
              <div style={{display:"flex",gap:12,marginTop:4}}>
                <span style={{fontSize:10,color:"#22c55e"}}>✓ {solved} solved</span>
                <span style={{fontSize:10,color:"#f97316"}}>~ {attempted} attempted</span>
                <span style={{fontSize:10,color:"#6b7280"}}>○ {total-solved-attempted} not started</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setReview(true)} style={{
            ...btnGhost,border:"1px solid #f0a50040",color:"#f0a500",background:"#f0a50012"
          }}>🃏 REVIEW CARDS</button>
          <button onClick={()=>setModal({mode:"add",question:null})} style={{
            padding:"7px 18px",borderRadius:6,border:"none",
            background:"#f0a500",color:"#080c14",cursor:"pointer",fontWeight:800,fontSize:12,
            boxShadow:"0 0 18px #f0a50040"
          }}>+ ADD QUESTION</button>
          <button onClick={handleExport} style={btnGhost} title="Export JSON">⬇ EXPORT</button>
          <button onClick={()=>fileRef.current.click()} style={btnGhost} title="Import JSON">⬆ IMPORT</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
        </div>
      </div>

      <div style={{padding:"22px 28px"}}>

        {/* ── PATTERN CHIPS ────────────────────────────── */}
        {patternStats.length>0&&(
          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:20}}>
            <button className="tag-chip" onClick={()=>setFPat("All")} style={{
              padding:"5px 12px",borderRadius:5,border:`1px solid ${fPat==="All"?"#f0a50040":"#1e2535"}`,
              background:fPat==="All"?"#f0a50015":"transparent",
              color:fPat==="All"?"#f0a500":"#4b5563",
              cursor:"pointer",fontSize:11,fontWeight:700
            }}>ALL</button>
            {patternStats.map(([pat,{t,s}])=>(
              <button key={pat} className="tag-chip" onClick={()=>setFPat(fPat===pat?"All":pat)} style={{
                padding:"5px 12px",borderRadius:5,
                border:`1px solid ${fPat===pat?"#00d4aa40":"#1e2535"}`,
                background:fPat===pat?"#00d4aa15":"transparent",
                color:fPat===pat?"#00d4aa":"#4b5563",
                cursor:"pointer",fontSize:11,fontWeight:700
              }}>
                {pat} <span style={{color:s===t&&t>0?"#22c55e":"#f0a500",marginLeft:4}}>{s}/{t}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── FILTERS ──────────────────────────────────── */}
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
          <input style={{...inp,width:220}} placeholder="🔍  Search by name..."
            value={search} onChange={e=>setSearch(e.target.value)} />

          <select style={inp} value={fDiff} onChange={e=>setFDiff(e.target.value)}>
            <option value="All">All Difficulties</option>
            {DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
          </select>

          <select style={inp} value={fStat} onChange={e=>setFStat(e.target.value)}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>

          <button onClick={()=>setFImp(!fImp)} style={{
            ...btnGhost,
            border:`1px solid ${fImp?"#f0a50040":"#1e2535"}`,
            color:fImp?"#f0a500":"#4b5563",
            background:fImp?"#f0a50012":"transparent"
          }}>⭐ IMPORTANT ONLY</button>

          {(search||fPat!=="All"||fDiff!=="All"||fStat!=="All"||fImp)&&(
            <button onClick={()=>{setSearch("");setFPat("All");setFDiff("All");setFStat("All");setFImp(false);}} style={{
              ...btnGhost,color:"#ef4444",borderColor:"#ef444440"
            }}>✕ CLEAR FILTERS</button>
          )}

          <span style={{color:"#374151",fontSize:12,marginLeft:"auto",fontWeight:600}}>
            {filtered.length} QUESTION{filtered.length!==1?"S":""}
          </span>
        </div>

        {/* ── TABLE ────────────────────────────────────── */}
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 0",color:"#374151"}}>
            <div style={{fontSize:52,marginBottom:16}}>{questions.length===0?"📭":"🔍"}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#4b5563"}}>
              {questions.length===0?"No questions yet":"No matching questions"}
            </div>
            <div style={{fontSize:13,marginTop:8,color:"#374151"}}>
              {questions.length===0?"Add your first question to get started!":"Try adjusting or clearing your filters."}
            </div>
            {questions.length===0&&(
              <button onClick={()=>setModal({mode:"add",question:null})} style={{
                marginTop:20,padding:"10px 28px",borderRadius:7,border:"none",
                background:"#f0a500",color:"#080c14",cursor:"pointer",fontWeight:800,fontSize:14,
                boxShadow:"0 0 24px #f0a50040"
              }}>+ ADD YOUR FIRST QUESTION</button>
            )}
          </div>
        ):(
          <div style={{background:"#0a0d16",border:"1px solid #1e2535",borderRadius:12,overflow:"hidden"}}>
            {/* Header row */}
            <div style={{
              display:"grid",gridTemplateColumns:"42px 1fr 160px 90px 130px 100px",
              padding:"10px 16px",borderBottom:"1px solid #1e2535",background:"#0d1220",
              alignItems:"center",gap:8
            }}>
              <div/>
              <SortBtn field="name" label="QUESTION" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
              <SortBtn field="pattern" label="PATTERN" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
              <SortBtn field="difficulty" label="DIFF" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
              <SortBtn field="status" label="STATUS" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
              <span style={{fontSize:11,fontWeight:700,color:"#374151",letterSpacing:".06em"}}>ACTIONS</span>
            </div>

            {/* Data rows */}
            {filtered.map((q,i)=>(
              <div key={q.id} className="qrow" style={{
                display:"grid",gridTemplateColumns:"42px 1fr 160px 90px 130px 100px",
                padding:"11px 16px",alignItems:"center",gap:8,
                borderBottom:i<filtered.length-1?"1px solid #0d1220":"none",
                background:q.isImportant?"#f0a5000a":"transparent",cursor:"default"
              }}>
                {/* Star */}
                <button className="star-btn" onClick={()=>updateQ(q.id,{isImportant:!q.isImportant})} style={{
                  background:"none",border:"none",cursor:"pointer",
                  color:q.isImportant?"#f0a500":"#1e2535",padding:0,
                  fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"
                }}>{q.isImportant?"⭐":"☆"}</button>

                {/* Name */}
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span onClick={()=>setDrawer(q)} style={{
                    fontWeight:600,fontSize:14,color:"#e2e8f0",cursor:"pointer",
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
                  }}
                    onMouseEnter={e=>e.target.style.color="#f0a500"}
                    onMouseLeave={e=>e.target.style.color="#e2e8f0"}
                  >{q.name}</span>
                  {q.link&&(
                    <a href={q.link} target="_blank" rel="noreferrer" title="Open problem" style={{
                      color:"#374151",fontSize:12,textDecoration:"none",flexShrink:0
                    }}
                      onMouseEnter={e=>e.target.style.color="#00d4aa"}
                      onMouseLeave={e=>e.target.style.color="#374151"}
                    >↗</a>
                  )}
                  {q.reviewAgain&&<span style={{fontSize:10,color:"#ef4444",flexShrink:0}}>🔁</span>}
                </div>

                {/* Pattern */}
                <div><Badge label={q.pattern} color="#00d4aa"/></div>

                {/* Difficulty */}
                <div><Badge label={q.difficulty} color={diffColor[q.difficulty]}/></div>

                {/* Status */}
                <div><Badge label={q.status} color={statColor[q.status]}/></div>

                {/* Actions */}
                <div style={{display:"flex",gap:6}}>
                  <button title="View/Edit" onClick={()=>setModal({mode:"edit",question:q})} style={{
                    padding:"4px 10px",borderRadius:4,border:"1px solid #1e2535",
                    background:"transparent",color:"#64748b",cursor:"pointer",fontSize:12
                  }}>✏️</button>
                  <button title="Delete" onClick={()=>handleDelete(q.id)} style={{
                    padding:"4px 10px",borderRadius:4,border:"1px solid #1e2535",
                    background:"transparent",color:"#64748b",cursor:"pointer",fontSize:12
                  }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────── */}
      {modal&&(
        <QuestionModal
          initial={modal.question}
          onSave={handleSave}
          onClose={()=>setModal(null)}
        />
      )}
      {drawer&&!modal&&(
        <DetailDrawer
          q={drawer}
          onClose={()=>setDrawer(null)}
          onEdit={()=>{setModal({mode:"edit",question:drawer});setDrawer(null);}}
        />
      )}
      {review&&(
        <FlashcardReview
          questions={questions}
          onClose={()=>setReview(false)}
          onUpdate={updateQ}
        />
      )}
    </div>
  );
}
