import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, provider } from "./firebase.js";

// ── Colors & Fonts ────────────────────────────────────────────────────────────
const C = {
  navy:"#0B1F3A", navyMid:"#132A4E", blue:"#1B5EE8", blueDim:"#EBF1FF", blueMid:"#BBCEFF",
  white:"#FFFFFF", surface:"#F5F7FB", surfaceAlt:"#EDF0F7", border:"#E2E6EF", borderMid:"#CBD1DF",
  muted:"#8B95A8", body:"#3C4560", heading:"#0B1F3A",
  red:"#DC2626", redDim:"#FEF2F2", green:"#15803D", greenDim:"#F0FDF4",
  amber:"#B45309", amberDim:"#FFFBEB", purple:"#6D28D9", purpleDim:"#F5F3FF",
};
const FONT = "'Inter', system-ui, sans-serif";

const NAV = [
  { id:"dashboard", label:"Dashboard",  d:"M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15" },
  { id:"tasks",     label:"Tasks",       d:"M9 11L12 14L22 4M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" },
  { id:"reminders", label:"Reminders",   d:"M15 17H20L18.6 15.6C18.2 15.2 18 14.7 18 14.2V11C18 8.4 16.3 6.2 14 5.3V5C14 3.9 13.1 3 12 3C10.9 3 10 3.9 10 5V5.3C7.7 6.2 6 8.4 6 11V14.2C6 14.7 5.8 15.2 5.4 15.6L4 17H9M15 17V18C15 19.7 13.7 21 12 21C10.3 21 9 19.7 9 18V17M15 17H9" },
  { id:"thoughts",  label:"Thoughts",    d:"M11 5H6C4.9 5 4 5.9 4 7V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V13M18.6 3.6C19.4 2.8 20.6 2.8 21.4 3.6C22.2 4.4 22.2 5.6 21.4 6.4L11.8 16H9V13.2L18.6 3.6Z" },
  { id:"goals",     label:"Goals",       d:"M13 10V3L4 14H11V21L20 10H13Z" },
  { id:"finances",  label:"Finances",    d:"M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 6V12L15 15" },
  { id:"debt",      label:"Debt",        d:"M3 10H21M7 15H8M12 15H13M6 19H18C19.1 19 20 18.1 20 17V7C20 5.9 19.1 5 18 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19Z" },
  { id:"clients",   label:"Clients",     d:"M17 20H22V18C22 16.3 20.7 15 19 15C18 15 17.2 15.4 16.6 16.1M7 20H2V18C2 16.3 3.3 15 5 15C6 15 6.8 15.4 7.4 16.1M7 20V18C7 17.3 7.1 16.7 7.4 16.1M16.6 16.1C16 14.3 14.1 13 12 13C9.9 13 8 14.3 7.4 16.1M15 7C15 8.7 13.7 10 12 10C10.3 10 9 8.7 9 7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7ZM21 10C21 11.1 20.1 12 19 12C17.9 12 17 11.1 17 10C17 8.9 17.9 8 19 8C20.1 8 21 8.9 21 10ZM7 10C7 11.1 6.1 12 5 12C3.9 12 3 11.1 3 10C3 8.9 3.9 8 5 8C6.1 8 7 8.9 7 10Z" },
];

const SEED = {
  tasks:[
    { id:1, text:"Review project proposal", done:false, priority:"high", date:"2025-05-01" },
    { id:2, text:"Buy groceries", done:true, priority:"low", date:"2025-04-30" },
    { id:3, text:"Gym session", done:false, priority:"medium", date:"2025-04-30" },
  ],
  reminders:[
    { id:1, title:"Team standup", time:"09:00", date:"2025-05-01", done:false },
    { id:2, title:"Take medication", time:"20:00", date:"2025-04-30", done:false },
  ],
  thoughts:[
    { id:1, title:"Morning reflection", body:"Today I want to focus on deep work and avoid distractions. Feeling motivated to push through the project milestones.", date:"2025-04-30", mood:"motivated" },
    { id:2, title:"Business idea", body:"A SaaS tool for freelancers to manage clients and invoices. Could be a great side project to explore this quarter.", date:"2025-04-29", mood:"excited" },
  ],
  goals:[
    { id:1, title:"Save ₨500,000 this year", category:"Finance", target:500000, current:150000, deadline:"2025-12-31", status:"active", unit:"₨" },
    { id:2, title:"Read 12 books", category:"Learning", target:12, current:3, deadline:"2025-12-31", status:"active", unit:"books" },
    { id:3, title:"Launch SaaS product", category:"Business", target:1, current:0, deadline:"2025-08-01", status:"active", unit:"launch" },
  ],
  expenses:[
    { id:1, category:"Diet", item:"Groceries", amount:3500, date:"2025-04-29" },
    { id:2, category:"Transport", item:"Uber ride", amount:450, date:"2025-04-28" },
    { id:3, category:"Diet", item:"Restaurant lunch", amount:1200, date:"2025-04-27" },
    { id:4, category:"Utilities", item:"Internet bill", amount:2500, date:"2025-04-26" },
  ],
  income:150000,
  debts:[
    { id:1, person:"Ahmed Bhai", amount:15000, type:"owe", note:"Borrowed for laptop repair", date:"2025-03-15", settled:false },
    { id:2, person:"Rayan", amount:5000, type:"lent", note:"Lent for transport expenses", date:"2025-04-10", settled:false },
  ],
  clients:[
    { id:1, name:"Ali Raza", company:"TechVentures PK", email:"ali@techventures.pk", phone:"+92 300 1234567",
      projects:[
        { name:"E-commerce Website", budget:85000, status:"active", paid:40000 },
        { name:"Mobile App UI", budget:45000, status:"completed", paid:45000 },
      ]},
    { id:2, name:"Sara Khan", company:"DigitalEdge", email:"sara@digitaledge.co", phone:"+92 321 9876543",
      projects:[{ name:"Brand Identity Design", budget:35000, status:"active", paid:17500 }]},
    { id:3, name:"Usman Malik", company:"StartupHub", email:"usman@startuphub.io", phone:"+92 333 4561234",
      projects:[{ name:"Dashboard Development", budget:120000, status:"pending", paid:0 }]},
  ]
};

// ── Primitives ─────────────────────────────────────────────────────────────────
const BADGE = { high:{bg:C.redDim,fg:C.red}, medium:{bg:C.amberDim,fg:C.amber}, low:{bg:C.greenDim,fg:C.green}, active:{bg:C.blueDim,fg:C.blue}, completed:{bg:C.greenDim,fg:C.green}, pending:{bg:C.amberDim,fg:C.amber}, motivated:{bg:C.blueDim,fg:C.blue}, excited:{bg:"#FFF5EB",fg:"#C2660A"}, calm:{bg:C.greenDim,fg:C.green}, reflective:{bg:C.purpleDim,fg:C.purple}, anxious:{bg:C.amberDim,fg:C.amber}, Finance:{bg:C.blueDim,fg:C.blue}, Learning:{bg:C.purpleDim,fg:C.purple}, Business:{bg:C.greenDim,fg:C.green}, Health:{bg:C.redDim,fg:C.red}, Personal:{bg:C.amberDim,fg:C.amber}, owe:{bg:C.redDim,fg:C.red}, lent:{bg:C.greenDim,fg:C.green}, settled:{bg:C.surfaceAlt,fg:C.muted} };
function Badge({ type, children }) {
  const s = BADGE[type]||{bg:C.surfaceAlt,fg:C.muted};
  return <span style={{background:s.bg,color:s.fg,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,letterSpacing:"0.02em",display:"inline-block",textTransform:"capitalize"}}>{children}</span>;
}
function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"20px 22px",...style}}>{children}</div>;
}
function SLabel({ children }) {
  return <p style={{margin:"0 0 13px",fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.09em"}}>{children}</p>;
}
function PHeader({ title, sub, action, aLabel }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:26,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
      <div>
        <h2 style={{margin:0,fontSize:21,fontWeight:700,color:C.heading,letterSpacing:"-0.3px"}}>{title}</h2>
        {sub&&<p style={{margin:"4px 0 0",fontSize:13,color:C.muted}}>{sub}</p>}
      </div>
      {action&&<Btn onClick={action}>{aLabel}</Btn>}
    </div>
  );
}
function Input({ style={}, ...p }) {
  return <input style={{width:"100%",padding:"10px 13px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13.5,color:C.heading,background:C.white,outline:"none",boxSizing:"border-box",fontFamily:FONT,...style}} {...p}/>;
}
function Sel({ children, style={}, ...p }) {
  return <select style={{width:"100%",padding:"10px 13px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13.5,color:C.heading,background:C.white,outline:"none",fontFamily:FONT,...style}} {...p}>{children}</select>;
}
function TA({ style={}, ...p }) {
  return <textarea style={{width:"100%",padding:"10px 13px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13.5,color:C.heading,background:C.white,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:FONT,lineHeight:1.6,...style}} {...p}/>;
}
function Btn({ onClick, v="primary", children, style={} }) {
  const vs = { primary:{background:C.blue,color:C.white,border:"none"}, ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`}, danger:{background:C.redDim,color:C.red,border:`1px solid #FECACA`} };
  return <button onClick={onClick} style={{padding:"9px 18px",borderRadius:8,fontSize:13.5,fontWeight:600,cursor:"pointer",fontFamily:FONT,...vs[v],...style}}>{children}</button>;
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(11,31,58,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.white,borderRadius:16,padding:"26px 28px",width:wide?580:460,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{margin:0,fontSize:16.5,fontWeight:700,color:C.heading}}>{title}</h3>
          <button onClick={onClose} style={{background:C.surfaceAlt,border:"none",cursor:"pointer",width:28,height:28,borderRadius:7,color:C.muted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Bar({ pct, color=C.blue, h=6 }) {
  return <div style={{height:h,background:C.border,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:99,transition:"width .4s"}}/></div>;
}
function Stat({ label, value, sub, accent }) {
  return (
    <Card style={{borderLeft:`3px solid ${accent}`}}>
      <p style={{margin:"0 0 9px",fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.09em"}}>{label}</p>
      <p style={{margin:"0 0 4px",fontSize:23,fontWeight:700,color:C.heading,letterSpacing:"-0.5px"}}>{value}</p>
      {sub&&<p style={{margin:0,fontSize:12,color:C.muted}}>{sub}</p>}
    </Card>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, loading }) {
  return (
    <div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{width:72,height:72,borderRadius:20,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:C.white,margin:"0 auto 24px",letterSpacing:"-1px"}}>H</div>
        <h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:700,color:C.white,letterSpacing:"-0.5px"}}>Life of Hamxa</h1>
        <p style={{margin:"0 0 40px",fontSize:14,color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Personal HQ</p>
        <button
          onClick={onLogin}
          disabled={loading}
          style={{
            display:"flex",alignItems:"center",gap:12,padding:"14px 28px",
            background:C.white,border:"none",borderRadius:12,cursor:loading?"not-allowed":"pointer",
            fontSize:15,fontWeight:600,color:C.heading,fontFamily:FONT,
            opacity:loading?0.7:1,margin:"0 auto",
            boxShadow:"0 4px 24px rgba(0,0,0,0.3)"
          }}
        >
          {/* Google G logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
        <p style={{margin:"28px 0 0",fontSize:12,color:"rgba(255,255,255,0.2)"}}>Your data syncs across all your devices</p>
      </div>
    </div>
  );
}

// ── Sync Status Dot ────────────────────────────────────────────────────────────
function SyncDot({ syncing }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:"rgba(255,255,255,0.07)"}}>
      <div style={{width:6,height:6,borderRadius:99,background:syncing?"#F59E0B":"#22C55E",transition:"background 0.3s"}}/>
      <span style={{fontSize:10.5,color:"rgba(255,255,255,0.35)",fontWeight:500}}>{syncing?"Saving…":"Synced"}</span>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ data, nav }) {
  const totExp  = data.expenses.reduce((a,e)=>a+e.amount,0);
  const savings = data.income - totExp;
  const totOwed = data.debts.filter(d=>!d.settled&&d.type==="owe").reduce((a,d)=>a+d.amount,0);
  const totLent = data.debts.filter(d=>!d.settled&&d.type==="lent").reduce((a,d)=>a+d.amount,0);
  const pending = data.tasks.filter(t=>!t.done);
  const active  = data.goals.filter(g=>g.status==="active");
  return (
    <div>
      <div style={{marginBottom:26}}>
        <h2 style={{margin:0,fontSize:25,fontWeight:700,color:C.heading,letterSpacing:"-0.5px"}}>Good morning, Hamxa 👋</h2>
        <p style={{margin:"5px 0 0",fontSize:13.5,color:C.muted}}>{new Date().toLocaleDateString("en-PK",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:20}}>
        <Stat label="Income"   value={`₨${data.income.toLocaleString()}`}       sub="This month"                     accent={C.blue}  />
        <Stat label="Expenses" value={`₨${totExp.toLocaleString()}`}             sub="This month"                     accent={C.red}   />
        <Stat label="Savings"  value={`₨${savings.toLocaleString()}`}            sub={`${Math.round((savings/data.income)*100)}% saved`} accent={C.green} />
        <Stat label="Net Debt" value={`₨${(totOwed-totLent).toLocaleString()}`} sub={`You owe ₨${totOwed.toLocaleString()}`}         accent={C.amber} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
            <SLabel>Pending Tasks</SLabel>
            <button onClick={()=>nav("tasks")} style={{fontSize:12,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:FONT}}>View all</button>
          </div>
          {pending.slice(0,4).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.surface,borderRadius:8,marginBottom:7}}>
              <div style={{width:7,height:7,borderRadius:2,background:t.priority==="high"?C.red:t.priority==="medium"?C.amber:C.green,flexShrink:0}}/>
              <span style={{flex:1,fontSize:13.5,color:C.body}}>{t.text}</span>
              <Badge type={t.priority}>{t.priority}</Badge>
            </div>
          ))}
          {pending.length===0&&<p style={{color:C.muted,fontSize:13}}>All tasks complete 🎉</p>}
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
            <SLabel>Active Goals</SLabel>
            <button onClick={()=>nav("goals")} style={{fontSize:12,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:600,fontFamily:FONT}}>View all</button>
          </div>
          {active.slice(0,3).map(g=>{
            const pct = Math.round((g.current/g.target)*100);
            return (
              <div key={g.id} style={{marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13.5,color:C.body,fontWeight:500}}>{g.title}</span>
                  <span style={{fontSize:12,fontWeight:700,color:pct>=80?C.green:pct>=40?C.blue:C.amber}}>{pct}%</span>
                </div>
                <Bar pct={pct} color={pct>=80?C.green:pct>=40?C.blue:C.amber}/>
              </div>
            );
          })}
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <SLabel>Recent Thoughts</SLabel>
          {data.thoughts.slice(0,2).map(t=>(
            <div key={t.id} style={{marginBottom:9,padding:"11px 13px",background:C.surface,borderRadius:8,borderLeft:`3px solid ${C.blue}`}}>
              <p style={{margin:"0 0 3px",fontSize:13.5,fontWeight:600,color:C.heading}}>{t.title}</p>
              <p style={{margin:0,fontSize:12.5,color:C.muted,lineHeight:1.55}}>{t.body.slice(0,85)}…</p>
            </div>
          ))}
        </Card>
        <Card>
          <SLabel>Debt Overview</SLabel>
          {data.debts.filter(d=>!d.settled).slice(0,3).map(d=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:13.5,fontWeight:600,color:C.heading}}>{d.person}</p>
                <p style={{margin:0,fontSize:12,color:C.muted}}>{d.note}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:d.type==="owe"?C.red:C.green}}>₨{d.amount.toLocaleString()}</p>
                <Badge type={d.type}>{d.type==="owe"?"I owe":"They owe"}</Badge>
              </div>
            </div>
          ))}
          {data.debts.filter(d=>!d.settled).length===0&&<p style={{color:C.muted,fontSize:13}}>No active debts 🎉</p>}
        </Card>
      </div>
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function Tasks({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ text:"", priority:"medium", date:"" });
  const [filter, setFilter] = useState("all");
  const add = () => { if(!form.text.trim()) return; update("tasks",[...data.tasks,{id:Date.now(),...form,done:false}]); setForm({text:"",priority:"medium",date:""}); setModal(false); };
  const toggle = id => update("tasks",data.tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const remove = id => update("tasks",data.tasks.filter(t=>t.id!==id));
  const list = data.tasks.filter(t=>filter==="all"?true:filter==="done"?t.done:!t.done);
  return (
    <div>
      <PHeader title="Tasks" sub={`${data.tasks.filter(t=>!t.done).length} pending · ${data.tasks.filter(t=>t.done).length} completed`} action={()=>setModal(true)} aLabel="+ New Task"/>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","pending","done"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 16px",borderRadius:8,fontSize:12.5,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===f?C.blue:C.border}`,background:filter===f?C.blue:"transparent",color:filter===f?C.white:C.muted,textTransform:"capitalize",fontFamily:FONT}}>{f}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {list.map(t=>(
          <Card key={t.id} style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>toggle(t.id)} style={{width:20,height:20,borderRadius:6,border:`2px solid ${t.done?C.green:C.border}`,background:t.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:11}}>
                {t.done?"✓":""}
              </button>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:14,color:t.done?C.muted:C.heading,textDecoration:t.done?"line-through":"none",fontWeight:t.done?400:500}}>{t.text}</p>
                {t.date&&<p style={{margin:"2px 0 0",fontSize:11.5,color:C.muted}}>{t.date}</p>}
              </div>
              <Badge type={t.priority}>{t.priority}</Badge>
              <button onClick={()=>remove(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.borderMid,fontSize:13,padding:3}}>✕</button>
            </div>
          </Card>
        ))}
        {list.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"48px 0",fontSize:13.5}}>No tasks here.</p>}
      </div>
      {modal&&(
        <Modal title="New Task" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="What needs to be done?" value={form.text} onChange={e=>setForm({...form,text:e.target.value})} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Sel value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="high">High priority</option><option value="medium">Medium</option><option value="low">Low</option></Sel>
              <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            </div>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Add Task</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reminders ─────────────────────────────────────────────────────────────────
function Reminders({ data, update }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ title:"", time:"", date:"" });
  const add    = () => { if(!form.title.trim()) return; update("reminders",[...data.reminders,{id:Date.now(),...form,done:false}]); setForm({title:"",time:"",date:""}); setModal(false); };
  const toggle = id => update("reminders",data.reminders.map(r=>r.id===id?{...r,done:!r.done}:r));
  const remove = id => update("reminders",data.reminders.filter(r=>r.id!==id));
  return (
    <div>
      <PHeader title="Reminders" sub={`${data.reminders.filter(r=>!r.done).length} upcoming`} action={()=>setModal(true)} aLabel="+ New Reminder"/>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {data.reminders.map(r=>(
          <Card key={r.id} style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:50,height:50,borderRadius:12,background:C.blueDim,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:10,color:C.blue,fontWeight:700,lineHeight:1.2}}>{r.date?.slice(5)}</span>
                <span style={{fontSize:14,color:C.blue,fontWeight:700}}>{r.time}</span>
              </div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:r.done?C.muted:C.heading,textDecoration:r.done?"line-through":"none"}}>{r.title}</p>
                <p style={{margin:"3px 0 0",fontSize:12,color:C.muted}}>{r.date}</p>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>toggle(r.id)} style={{padding:"6px 14px",borderRadius:7,fontSize:12.5,fontWeight:600,cursor:"pointer",background:r.done?C.greenDim:C.blueDim,color:r.done?C.green:C.blue,border:"none",fontFamily:FONT}}>{r.done?"Done ✓":"Mark done"}</button>
                <button onClick={()=>remove(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.borderMid,fontSize:14}}>✕</button>
              </div>
            </div>
          </Card>
        ))}
        {data.reminders.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"48px 0",fontSize:13.5}}>No reminders set.</p>}
      </div>
      {modal&&(
        <Modal title="New Reminder" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Reminder title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
              <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            </div>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Set Reminder</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Thoughts ──────────────────────────────────────────────────────────────────
function Thoughts({ data, update }) {
  const [modal, setModal] = useState(false);
  const [view, setView]   = useState(null);
  const [form, setForm]   = useState({ title:"", body:"", mood:"motivated" });
  const MOODS = ["motivated","excited","calm","reflective","anxious"];
  const add = () => { if(!form.title.trim()||!form.body.trim()) return; update("thoughts",[{id:Date.now(),...form,date:new Date().toISOString().slice(0,10)},...data.thoughts]); setForm({title:"",body:"",mood:"motivated"}); setModal(false); };
  const remove = id => update("thoughts",data.thoughts.filter(t=>t.id!==id));
  return (
    <div>
      <PHeader title="Thoughts & Stories" sub={`${data.thoughts.length} journal entries`} action={()=>setModal(true)} aLabel="+ Write"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:13}}>
        {data.thoughts.map(t=>(
          <Card key={t.id} style={{cursor:"pointer"}} onClick={()=>setView(t)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <Badge type={t.mood}>{t.mood}</Badge>
              <button onClick={e=>{e.stopPropagation();remove(t.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.borderMid,fontSize:12}}>✕</button>
            </div>
            <h3 style={{margin:"0 0 7px",fontSize:15,fontWeight:600,color:C.heading}}>{t.title}</h3>
            <p style={{margin:"0 0 13px",fontSize:13,color:C.muted,lineHeight:1.65}}>{t.body.slice(0,105)}{t.body.length>105?"…":""}</p>
            <p style={{margin:0,fontSize:11,color:C.borderMid,fontWeight:500}}>{t.date}</p>
          </Card>
        ))}
        {data.thoughts.length===0&&<p style={{color:C.muted,fontSize:13.5}}>Start writing your thoughts.</p>}
      </div>
      {view&&(
        <Modal title={view.title} onClose={()=>setView(null)}>
          <div style={{display:"flex",gap:9,marginBottom:16}}><Badge type={view.mood}>{view.mood}</Badge><span style={{fontSize:12.5,color:C.muted,alignSelf:"center"}}>{view.date}</span></div>
          <p style={{fontSize:14.5,color:C.body,lineHeight:1.8,margin:0}}>{view.body}</p>
        </Modal>
      )}
      {modal&&(
        <Modal title="New Journal Entry" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
            <TA rows={5} placeholder="Write your thoughts…" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
            <Sel value={form.mood} onChange={e=>setForm({...form,mood:e.target.value})}>{MOODS.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</Sel>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Save Entry</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────
function Goals({ data, update }) {
  const [modal, setModal] = useState(false);
  const [editG, setEditG] = useState(null);
  const [form, setForm]   = useState({ title:"", category:"Finance", target:"", current:"", deadline:"", unit:"₨" });
  const CATS = ["Finance","Learning","Business","Health","Personal"];
  const add = () => {
    if(!form.title.trim()||!form.target) return;
    update("goals",[...data.goals,{id:Date.now(),...form,target:Number(form.target),current:Number(form.current||0),status:"active"}]);
    setForm({title:"",category:"Finance",target:"",current:"",deadline:"",unit:"₨"}); setModal(false);
  };
  const updateProg = (id,val) => update("goals",data.goals.map(g=>g.id===id?{...g,current:Number(val)}:g));
  const markDone   = id => update("goals",data.goals.map(g=>g.id===id?{...g,status:"completed",current:g.target}:g));
  const remove     = id => update("goals",data.goals.filter(g=>g.id!==id));
  const active    = data.goals.filter(g=>g.status==="active");
  const completed = data.goals.filter(g=>g.status==="completed");
  return (
    <div>
      <PHeader title="Goals" sub={`${active.length} active · ${completed.length} achieved`} action={()=>setModal(true)} aLabel="+ New Goal"/>
      {active.length>0&&(
        <div style={{marginBottom:26}}>
          <SLabel>Active Goals</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {active.map(g=>{
              const pct = Math.min(Math.round((g.current/g.target)*100),100);
              const col = pct>=80?C.green:pct>=40?C.blue:C.amber;
              return (
                <Card key={g.id}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                        <p style={{margin:0,fontSize:15,fontWeight:600,color:C.heading}}>{g.title}</p>
                        <Badge type={g.category}>{g.category}</Badge>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                        <span style={{fontSize:13,color:C.muted}}>{g.unit}{typeof g.current==="number"?g.current.toLocaleString():g.current} / {g.unit}{typeof g.target==="number"?g.target.toLocaleString():g.target}</span>
                        {g.deadline&&<span style={{fontSize:12,color:C.muted}}>· Due {g.deadline}</span>}
                        <span style={{fontSize:13,fontWeight:700,color:col,marginLeft:"auto"}}>{pct}%</span>
                      </div>
                      <Bar pct={pct} color={col} h={7}/>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                      <button onClick={()=>setEditG(g)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:C.blueDim,color:C.blue,border:"none",fontFamily:FONT}}>Update</button>
                      <button onClick={()=>markDone(g.id)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:C.greenDim,color:C.green,border:"none",fontFamily:FONT}}>Complete</button>
                      <button onClick={()=>remove(g.id)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:C.redDim,color:C.red,border:"none",fontFamily:FONT}}>Delete</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {completed.length>0&&(
        <div>
          <SLabel>Achieved</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {completed.map(g=>(
              <Card key={g.id} style={{opacity:.65}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:28,height:28,borderRadius:8,background:C.greenDim,display:"flex",alignItems:"center",justifyContent:"center",color:C.green,fontSize:13}}>✓</div>
                  <p style={{margin:0,flex:1,fontSize:13.5,fontWeight:500,color:C.body,textDecoration:"line-through"}}>{g.title}</p>
                  <Badge type="completed">Achieved</Badge>
                  <button onClick={()=>remove(g.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.borderMid,fontSize:13}}>✕</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {data.goals.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"60px 0",fontSize:13.5}}>Set your first goal to get started.</p>}
      {modal&&(
        <Modal title="New Goal" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Goal title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Sel value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</Sel>
              <Input placeholder="Unit (₨, books, km…)" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Input type="number" placeholder="Target" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/>
              <Input type="number" placeholder="Current progress" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/>
            </div>
            <Input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Add Goal</Btn>
            </div>
          </div>
        </Modal>
      )}
      {editG&&(
        <Modal title="Update Progress" onClose={()=>setEditG(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <p style={{margin:0,fontSize:13.5,color:C.body}}>{editG.title}</p>
            <Input type="number" placeholder="Current value" defaultValue={editG.current} id="prog" autoFocus/>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setEditG(null)}>Cancel</Btn>
              <Btn onClick={()=>{updateProg(editG.id,document.getElementById("prog").value);setEditG(null);}}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Finances ──────────────────────────────────────────────────────────────────
function Finances({ data, update }) {
  const [modal, setModal]     = useState(false);
  const [editInc, setEditInc] = useState(false);
  const [incVal, setIncVal]   = useState(data.income);
  const [form, setForm]       = useState({ category:"Diet", item:"", amount:"" });
  const CATS = ["Diet","Transport","Utilities","Entertainment","Health","Shopping","Other"];
  const totExp = data.expenses.reduce((a,e)=>a+e.amount,0);
  const savings = data.income - totExp;
  const byCat = data.expenses.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});
  const add = () => { if(!form.item.trim()||!form.amount) return; update("expenses",[...data.expenses,{id:Date.now(),...form,amount:Number(form.amount),date:new Date().toISOString().slice(0,10)}]); setForm({category:"Diet",item:"",amount:""}); setModal(false); };
  const remove = id => update("expenses",data.expenses.filter(e=>e.id!==id));
  return (
    <div>
      <PHeader title="Finances" sub="Income, expenses & savings" action={()=>setModal(true)} aLabel="+ Add Expense"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:20}}>
        <Stat label="Income"   value={`₨${data.income.toLocaleString()}`}  sub="Click below to edit" accent={C.blue}/>
        <Stat label="Expenses" value={`₨${totExp.toLocaleString()}`}        sub="This month"          accent={C.red}/>
        <Stat label="Savings"  value={`₨${savings.toLocaleString()}`}       sub={`${Math.round((savings/data.income)*100)}% of income`} accent={savings>=0?C.green:C.red}/>
      </div>
      <div style={{marginBottom:20}}>
        <button onClick={()=>setEditInc(v=>!v)} style={{fontSize:12.5,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0,fontFamily:FONT}}>{editInc?"▲ Hide":"▼ Edit income"}</button>
        {editInc&&(
          <div style={{display:"flex",gap:9,marginTop:9,maxWidth:320}}>
            <Input type="number" value={incVal} onChange={e=>setIncVal(Number(e.target.value))}/>
            <Btn onClick={()=>{update("income",incVal);setEditInc(false);}}>Save</Btn>
          </div>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
        <Card>
          <SLabel>Expense Log</SLabel>
          {data.expenses.map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 0",borderBottom:`1px solid ${C.surface}`}}>
              <div style={{width:37,height:37,borderRadius:9,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9.5,fontWeight:700,color:C.muted,flexShrink:0,letterSpacing:"0.03em"}}>{e.category.slice(0,3).toUpperCase()}</div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:13.5,fontWeight:500,color:C.heading}}>{e.item}</p>
                <p style={{margin:0,fontSize:12,color:C.muted}}>{e.category} · {e.date}</p>
              </div>
              <span style={{fontSize:14,fontWeight:700,color:C.red}}>₨{e.amount.toLocaleString()}</span>
              <button onClick={()=>remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.borderMid,fontSize:13,padding:3}}>✕</button>
            </div>
          ))}
          {data.expenses.length===0&&<p style={{color:C.muted,fontSize:13}}>No expenses logged.</p>}
        </Card>
        <Card>
          <SLabel>By Category</SLabel>
          {Object.entries(byCat).map(([cat,amt])=>(
            <div key={cat} style={{marginBottom:13}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,color:C.body}}>{cat}</span>
                <span style={{fontSize:13,fontWeight:600,color:C.heading}}>₨{amt.toLocaleString()}</span>
              </div>
              <Bar pct={(amt/totExp)*100}/>
            </div>
          ))}
          {Object.keys(byCat).length===0&&<p style={{color:C.muted,fontSize:13}}>No data yet.</p>}
        </Card>
      </div>
      {modal&&(
        <Modal title="Add Expense" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Sel value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</Sel>
            <Input placeholder="Item description" value={form.item} onChange={e=>setForm({...form,item:e.target.value})} autoFocus/>
            <Input type="number" placeholder="Amount (₨)" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Add Expense</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Debt ──────────────────────────────────────────────────────────────────────
function Debt({ data, update }) {
  const [modal, setModal] = useState(false);
  const [tab, setTab]     = useState("all");
  const [form, setForm]   = useState({ person:"", amount:"", type:"owe", note:"", date:"" });
  const add    = () => { if(!form.person.trim()||!form.amount) return; update("debts",[...data.debts,{id:Date.now(),...form,amount:Number(form.amount),settled:false}]); setForm({person:"",amount:"",type:"owe",note:"",date:""}); setModal(false); };
  const settle = id => update("debts",data.debts.map(d=>d.id===id?{...d,settled:true}:d));
  const remove = id => update("debts",data.debts.filter(d=>d.id!==id));
  const totOwed = data.debts.filter(d=>!d.settled&&d.type==="owe").reduce((a,d)=>a+d.amount,0);
  const totLent = data.debts.filter(d=>!d.settled&&d.type==="lent").reduce((a,d)=>a+d.amount,0);
  const shown = data.debts.filter(d=>tab==="all"?true:tab==="settled"?d.settled:!d.settled&&d.type===tab);
  return (
    <div>
      <PHeader title="Debt Tracker" sub="Money you owe & are owed" action={()=>setModal(true)} aLabel="+ Add Entry"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:20}}>
        <Stat label="You Owe"   value={`₨${totOwed.toLocaleString()}`} sub="To others"       accent={C.red}/>
        <Stat label="Owed to You" value={`₨${totLent.toLocaleString()}`} sub="From others"   accent={C.green}/>
        <Stat label="Net"       value={`₨${(totLent-totOwed).toLocaleString()}`} sub={totLent>=totOwed?"You're ahead":"You're behind"} accent={totLent>=totOwed?C.green:C.red}/>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["all","All"],["owe","I Owe"],["lent","Owed to Me"],["settled","Settled"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{padding:"7px 16px",borderRadius:8,fontSize:12.5,fontWeight:600,cursor:"pointer",border:`1px solid ${tab===v?C.blue:C.border}`,background:tab===v?C.blue:"transparent",color:tab===v?C.white:C.muted,fontFamily:FONT}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {shown.map(d=>(
          <Card key={d.id} style={{opacity:d.settled?.65:1}}>
            <div style={{display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:44,height:44,borderRadius:11,background:d.type==="owe"?C.redDim:C.greenDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:d.type==="owe"?C.red:C.green,flexShrink:0}}>
                {d.person.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:3}}>
                  <p style={{margin:0,fontSize:14.5,fontWeight:600,color:C.heading}}>{d.person}</p>
                  <Badge type={d.settled?"settled":d.type}>{d.settled?"Settled":d.type==="owe"?"I owe":"They owe"}</Badge>
                </div>
                {d.note&&<p style={{margin:0,fontSize:13,color:C.muted}}>{d.note}</p>}
                <p style={{margin:"3px 0 0",fontSize:11.5,color:C.borderMid}}>{d.date}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{margin:"0 0 8px",fontSize:18,fontWeight:700,color:d.type==="owe"?C.red:C.green}}>₨{d.amount.toLocaleString()}</p>
                {!d.settled&&(
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>settle(d.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:C.greenDim,color:C.green,border:"none",fontFamily:FONT}}>Settle</button>
                    <button onClick={()=>remove(d.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:C.redDim,color:C.red,border:"none",fontFamily:FONT}}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {shown.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"48px 0",fontSize:13.5}}>No entries here.</p>}
      </div>
      {modal&&(
        <Modal title="Add Debt Entry" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Person's name" value={form.person} onChange={e=>setForm({...form,person:e.target.value})} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Input type="number" placeholder="Amount (₨)" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
              <Sel value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="owe">I owe them</option><option value="lent">They owe me</option></Sel>
            </div>
            <Input placeholder="Note (optional)" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
            <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={add}>Add Entry</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Clients ───────────────────────────────────────────────────────────────────
function Clients({ data, update }) {
  const [modal, setModal]       = useState(false);
  const [detail, setDetail]     = useState(null);
  const [projModal, setProjModal] = useState(null);
  const [form, setForm]         = useState({ name:"", company:"", email:"", phone:"" });
  const [projForm, setProjForm] = useState({ name:"", budget:"", status:"active", paid:"" });
  const addClient = () => { if(!form.name.trim()) return; update("clients",[...data.clients,{id:Date.now(),...form,projects:[]}]); setForm({name:"",company:"",email:"",phone:""}); setModal(false); };
  const addProject = () => {
    if(!projForm.name.trim()||!projForm.budget) return;
    const updated = data.clients.map(c=>c.id===projModal?{...c,projects:[...c.projects,{...projForm,budget:Number(projForm.budget),paid:Number(projForm.paid||0)}]}:c);
    update("clients",updated); setProjForm({name:"",budget:"",status:"active",paid:""}); setProjModal(null);
    if(detail) setDetail(updated.find(c=>c.id===detail.id));
  };
  const deleteClient = id => { update("clients",data.clients.filter(c=>c.id!==id)); setDetail(null); };
  const totPipeline = data.clients.reduce((a,c)=>a+c.projects.reduce((b,p)=>b+p.budget,0),0);
  const totReceived = data.clients.reduce((a,c)=>a+c.projects.reduce((b,p)=>b+p.paid,0),0);
  return (
    <div>
      <PHeader title="Clients & Projects" sub={`${data.clients.length} clients · ₨${totPipeline.toLocaleString()} pipeline`} action={()=>setModal(true)} aLabel="+ Add Client"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:20}}>
        <Stat label="Total Clients"   value={data.clients.length}                       sub="All time"                                accent={C.blue}/>
        <Stat label="Pipeline"        value={`₨${totPipeline.toLocaleString()}`}        sub="All projects"                           accent={C.purple}/>
        <Stat label="Received"        value={`₨${totReceived.toLocaleString()}`}        sub={`₨${(totPipeline-totReceived).toLocaleString()} pending`} accent={C.green}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {data.clients.map(c=>(
          <Card key={c.id} style={{cursor:"pointer"}} onClick={()=>setDetail(c)}>
            <div style={{display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:46,height:46,borderRadius:12,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C.white,flexShrink:0}}>
                {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}>
                  <p style={{margin:0,fontSize:14.5,fontWeight:600,color:C.heading}}>{c.name}</p>
                  <span style={{fontSize:13,color:C.muted}}>{c.company}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {c.projects.map((p,i)=><Badge key={i} type={p.status}>{p.status}</Badge>)}
                  <span style={{fontSize:12,color:C.muted}}>{c.projects.length} project{c.projects.length!==1?"s":""}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{margin:"0 0 2px",fontSize:15,fontWeight:700,color:C.heading}}>₨{c.projects.reduce((a,p)=>a+p.budget,0).toLocaleString()}</p>
                <p style={{margin:0,fontSize:12,color:C.green}}>₨{c.projects.reduce((a,p)=>a+p.paid,0).toLocaleString()} received</p>
              </div>
            </div>
          </Card>
        ))}
        {data.clients.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"48px 0",fontSize:13.5}}>No clients yet.</p>}
      </div>
      {detail&&(
        <Modal title={detail.name} onClose={()=>setDetail(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:18,padding:"13px 15px",background:C.surface,borderRadius:10}}>
            {[["Company",detail.company],["Email",detail.email],["Phone",detail.phone]].map(([l,v])=>(
              <div key={l}><p style={{margin:"0 0 2px",fontSize:10.5,color:C.muted,fontWeight:700,textTransform:"uppercase"}}>{l}</p><p style={{margin:0,fontSize:13.5,color:l==="Email"?C.blue:C.heading}}>{v||"—"}</p></div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
            <SLabel>Projects</SLabel>
            <Btn style={{padding:"6px 12px",fontSize:12}} onClick={()=>setProjModal(detail.id)}>+ Add Project</Btn>
          </div>
          {detail.projects.map((p,i)=>(
            <div key={i} style={{padding:"13px 15px",background:C.surface,borderRadius:10,marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><p style={{margin:"0 0 5px",fontSize:14,fontWeight:600,color:C.heading}}>{p.name}</p><Badge type={p.status}>{p.status}</Badge></div>
                <div style={{textAlign:"right"}}><p style={{margin:"0 0 3px",fontSize:15,fontWeight:700,color:C.heading}}>₨{p.budget.toLocaleString()}</p><p style={{margin:0,fontSize:12,color:C.green}}>₨{p.paid.toLocaleString()} paid</p></div>
              </div>
              <Bar pct={p.budget>0?(p.paid/p.budget)*100:0} h={5}/>
            </div>
          ))}
          {detail.projects.length===0&&<p style={{color:C.muted,fontSize:13}}>No projects yet.</p>}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <Btn v="danger" onClick={()=>deleteClient(detail.id)}>Delete Client</Btn>
          </div>
        </Modal>
      )}
      {projModal&&(
        <Modal title="Add Project" onClose={()=>setProjModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Project name" value={projForm.name} onChange={e=>setProjForm({...projForm,name:e.target.value})} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Input type="number" placeholder="Budget (₨)" value={projForm.budget} onChange={e=>setProjForm({...projForm,budget:e.target.value})}/>
              <Input type="number" placeholder="Paid so far (₨)" value={projForm.paid} onChange={e=>setProjForm({...projForm,paid:e.target.value})}/>
            </div>
            <Sel value={projForm.status} onChange={e=>setProjForm({...projForm,status:e.target.value})}><option value="active">Active</option><option value="pending">Pending</option><option value="completed">Completed</option></Sel>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setProjModal(null)}>Cancel</Btn><Btn onClick={addProject}>Add Project</Btn>
            </div>
          </div>
        </Modal>
      )}
      {modal&&(
        <Modal title="Add Client" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
            <Input placeholder="Company (optional)" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/>
            <Input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <Input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={addClient}>Add Client</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Root App with Firebase Auth + Firestore ───────────────────────────────────
export default function App() {
  const [user,      setUser]     = useState(null);       // Firebase user
  const [authReady, setAuthReady]= useState(false);      // auth listener resolved
  const [data,      setData]     = useState(null);       // app data (null = loading)
  const [syncing,   setSyncing]  = useState(false);
  const [page,      setPage]     = useState("dashboard");
  const [collapsed, setCol]      = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Auth listener + redirect result ─────────────────────────────────────────
  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // ── Firestore real-time listener (runs when user logs in) ──────────────────
  useEffect(() => {
    if (!user) { setData(null); return; }
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setData(snap.data());
      } else {
        // First login — seed with default data
        setDoc(ref, SEED).then(() => setData(SEED));
      }
    });
    return unsub;
  }, [user]);

  // ── Write to Firestore on every data change ────────────────────────────────
  const update = useCallback((key, val) => {
    setData(d => {
      const next = { ...d, [key]: val };
      if (user) {
        setSyncing(true);
        setDoc(doc(db, "users", user.uid), next)
          .finally(() => setSyncing(false));
      }
      return next;
    });
  }, [user]);

  // ── Google login ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginLoading(true);
    try { await signInWithRedirect(auth, provider); }
    catch (e) { console.error(e); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => signOut(auth);

  // ── Render states ──────────────────────────────────────────────────────────
  if (!authReady) return (
    <div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <p style={{color:"rgba(255,255,255,0.3)",fontSize:13}}>Loading…</p>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} loading={loginLoading}/>;

  if (!data) return (
    <div style={{minHeight:"100vh",background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <p style={{color:C.muted,fontSize:13}}>Loading your data…</p>
    </div>
  );

  const PAGES = { dashboard:Dashboard, tasks:Tasks, reminders:Reminders, thoughts:Thoughts, goals:Goals, finances:Finances, debt:Debt, clients:Clients };
  const Page  = PAGES[page];
  const firstName = user.displayName?.split(" ")[0] || "Hamxa";

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.surface,fontFamily:FONT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#D0D5E0;border-radius:99px}button{transition:opacity .15s}button:hover{opacity:.82}`}</style>

      {/* Sidebar */}
      <aside style={{width:collapsed?60:212,flexShrink:0,background:C.navy,display:"flex",flexDirection:"column",padding:collapsed?"20px 10px":"20px 13px",transition:"width .22s ease",position:"sticky",top:0,height:"100vh",overflowX:"hidden"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",marginBottom:26}}>
          {!collapsed&&(
            <div>
              <p style={{margin:0,fontSize:14,fontWeight:700,color:"#fff",whiteSpace:"nowrap",letterSpacing:"-0.2px"}}>Life of {firstName}</p>
              <p style={{margin:"1px 0 0",fontSize:10,color:"rgba(255,255,255,.3)",whiteSpace:"nowrap",letterSpacing:"0.08em",textTransform:"uppercase"}}>Personal HQ</p>
            </div>
          )}
          <button onClick={()=>setCol(v=>!v)} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:7,width:27,height:27,cursor:"pointer",color:"rgba(255,255,255,.5)",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {collapsed?"›":"‹"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:1}}>
          {NAV.map(item=>{
            const on = page===item.id;
            return (
              <button key={item.id} onClick={()=>setPage(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:10,padding:collapsed?"9px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",borderRadius:9,cursor:"pointer",border:"none",background:on?"rgba(255,255,255,.12)":"transparent",color:on?"#fff":"rgba(255,255,255,.42)",transition:"background .15s,color .15s"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <path d={item.d}/>
                </svg>
                {!collapsed&&<span style={{fontSize:13.5,fontWeight:on?600:400,whiteSpace:"nowrap"}}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Profile + sync dot + logout */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:13}}>
          {!collapsed&&<div style={{marginBottom:8}}><SyncDot syncing={syncing}/></div>}
          <div style={{display:"flex",alignItems:"center",gap:collapsed?0:9,justifyContent:collapsed?"center":"flex-start"}}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{width:31,height:31,borderRadius:8,flexShrink:0,objectFit:"cover"}}/>
              : <div style={{width:31,height:31,borderRadius:8,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{firstName[0]}</div>
            }
            {!collapsed&&(
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firstName}</p>
                <button onClick={handleLogout} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:10.5,padding:0,fontFamily:FONT,fontWeight:500}}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflowY:"auto",padding:"34px 42px",minHeight:"100vh"}}>
        <div style={{maxWidth:940,margin:"0 auto"}}>
          <Page data={data} update={update} nav={setPage}/>
        </div>
      </main>
    </div>
  );
}
