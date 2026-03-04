import { useState, useEffect, useMemo } from "react";

/* ─── Course Catalog ─────────────────────────────────── */
const CATALOG_RAW = [
  {course_id:"1101061",course_name:"VECTOR GRAPHIC DESIGN",teachers:"ผู้ช่วยศาสตราจารย์ ดร.ธวัชพงษ์ พิทักษ์",credit:"3 (2-2-5)",lang:"TH : ไทย",lvl:"ปริญญาตรี",time:"Mo 08:00-12:00  DIGITAL TECH LAB ANIMATION 3 Th 13:00-17:00  DIGITAL TECH LAB ANIMATION 3 เรียนระหว่าง 16/2/2569-27/3/2569 ",group:"1",seat:"60",enroll:"60",remain:"0",status:"W"},
  {course_id:"1101062",course_name:"RASTER GRAPHIC DESIGN",teachers:"ผู้ช่วยศาสตราจารย์ ดร.ธวัชพงษ์ พิทักษ์",credit:"3 (2-2-5)",lang:"TH : ไทย",lvl:"ปริญญาตรี",time:"Mo 08:00-12:00  DIGITAL TECH LAB ANIMATION 3 Th 13:00-17:00  DIGITAL TECH LAB ANIMATION 3 เรียนระหว่าง 6/4/2569-15/5/2569 ",group:"1",seat:"58",enroll:"58",remain:"0",status:"W"},
  {course_id:"1101063",course_name:"PROJECT IN VISUAL MESSAGE DESIGN",teachers:"ผู้ช่วยศาสตราจารย์ ดร.ธวัชพงษ์ พิทักษ์",credit:"2 (0-6-0)",lang:"TH : ไทย",lvl:"ปริญญาตรี",time:"Tu 09:00-12:00  DIGITAL TECH LAB ANIMATION 2 Sa 13:00-16:00  B6101-A เรียนระหว่าง 16/2/2569-15/5/2569 ",group:"1",seat:"55",enroll:"55",remain:"0",status:"W"},
];

const DAY_MAP = {Mo:"จันทร์",Tu:"อังคาร",We:"พุธ",Th:"พฤหัสบดี",Fr:"ศุกร์",Sa:"เสาร์",Su:"อาทิตย์"};
function parseSessions(timeStr){
  const pattern = /(Mo|Tu|We|Th|Fr|Sa|Su)\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})\s+([^\n]*?)(?=Mo|Tu|We|Th|Fr|Sa|Su|เรียน|$)/g;
  const sessions = [];
  let m;
  while((m=pattern.exec(timeStr))!==null){
    const [,dc,sh,sm,eh,em,room] = m;
    sessions.push({ day:DAY_MAP[dc]||dc, startHour:+sh, startMin:+sm, endHour:+eh, endMin:+em, room:room.trim().replace(/\s+/g," ") });
  }
  return sessions;
}
const CATALOG = CATALOG_RAW.map(c=>({ ...c, sessions:parseSessions(c.time), creditNum:(c.credit.match(/^(\d+)/)||["","?"])[1] }));

/* ─── Constants ──────────────────────────────────────── */
const DAYS  = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];
const HOURS = Array.from({length:13},(_,i)=>i+8);
const COLORS = [
  {bg:"#4F46E5"},{bg:"#059669"},{bg:"#DC2626"},{bg:"#D97706"},
  {bg:"#7C3AED"},{bg:"#0891B2"},{bg:"#BE185D"},{bg:"#65A30D"},
];
const PALETTE = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16"];
const DEF_FORM = {
  name:"",code:"",instructor:"",room:"",
  day:"จันทร์",startHour:8,startMin:0,endHour:9,endMin:0,colorIdx:0,
  hasExam:false,examDate:"",examStartHour:9,examStartMin:0,examEndHour:11,examEndMin:0,examRoom:"",
};

/* ─── Helpers ────────────────────────────────────────── */
const toMin   = (h,m) => +h*60 + +m;
const fmt     = (h,m) => `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
const fmtDate = d => { if(!d)return""; const[y,mo,day]=d.split("-"); return`${day}/${mo}/${y}`; };
const uid     = () => Date.now()+Math.random().toString(36).slice(2,7);

function classConflicts(courses,f,excl=null){
  const s=toMin(f.startHour,f.startMin),e=toMin(f.endHour,f.endMin);
  return courses.filter(c=>c.id!==excl&&c.day===f.day&&s<toMin(c.endHour,c.endMin)&&e>toMin(c.startHour,c.startMin));
}
function examConflictsOf(courses,f,excl=null){
  if(!f.hasExam||!f.examDate)return[];
  const s=toMin(f.examStartHour,f.examStartMin),e=toMin(f.examEndHour,f.examEndMin);
  return courses.filter(c=>c.id!==excl&&c.hasExam&&c.examDate===f.examDate&&s<toMin(c.examEndHour,c.examEndMin)&&e>toMin(c.examStartHour,c.examStartMin));
}

/* ─── Storage ────────────────────────────────────────── */
function loadData(){
  try{ const r=localStorage.getItem("dgt_v2"); if(r)return JSON.parse(r); }catch{}
  return {
    schedules:[{ id:"demo1", name:"ภาคเรียนที่ 1/2568", color:"#3B82F6",
      courses:[
        {id:"c1",name:"แคลคูลัส 1",code:"MTH101",instructor:"อ.สมชาย",room:"B201",day:"จันทร์",startHour:9,startMin:0,endHour:11,endMin:0,colorIdx:0,hasExam:true,examDate:"2025-10-15",examStartHour:9,examStartMin:0,examEndHour:12,examEndMin:0,examRoom:"ห้องสอบ A"},
        {id:"c2",name:"ฟิสิกส์",code:"PHY101",instructor:"อ.วิชัย",room:"A301",day:"อังคาร",startHour:13,startMin:0,endHour:15,endMin:0,colorIdx:1,hasExam:true,examDate:"2025-10-18",examStartHour:9,examStartMin:0,examEndHour:12,examEndMin:0,examRoom:"ห้องสอบ B"},
        {id:"c3",name:"โปรแกรมมิ่ง",code:"CS101",instructor:"อ.นภา",room:"Lab1",day:"พุธ",startHour:10,startMin:0,endHour:12,endMin:0,colorIdx:4,hasExam:true,examDate:"2025-10-18",examStartHour:13,examStartMin:0,examEndHour:15,examEndMin:0,examRoom:"Lab Exam"},
      ]
    }], activeId:"demo1"
  };
}
function saveData(d){ try{localStorage.setItem("dgt_v2",JSON.stringify(d));}catch{} }

/* ─── useWidth ───────────────────────────────────────── */
function useWidth(){
  const [w,setW]=useState(()=>typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{
    const fn=()=>setW(window.innerWidth);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);
  return w;
}

/* ─── Shared UI ──────────────────────────────────────── */
function Btn({onClick,bg,color,children,style={}}){
  return <button onClick={onClick} style={{background:bg,border:"none",color,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,flexShrink:0,...style}}>{children}</button>;
}
function Empty({text}){ return <div style={{textAlign:"center",color:"#475569",padding:"40px 0",fontSize:13}}>{text}</div>; }
function Field({label,children}){ return <div style={{marginBottom:12}}><div style={{fontSize:11,color:"#64748B",marginBottom:4,fontWeight:600}}>{label}</div>{children}</div>; }
const inp={width:"100%",background:"#101830",border:"1px solid #334155",borderRadius:8,color:"#E2E8F0",padding:"8px 11px",fontSize:13,outline:"none",boxSizing:"border-box"};

/* ─── Timetable ──────────────────────────────────────── */
const HOUR_COLS=13, TOTAL_MINS=780, ROW_H=80, DAY_COL=72;

function Timetable({courses,onEdit}){
  return(
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <div style={{minWidth:640}}>
        <div style={{display:"flex"}}>
          <div style={{width:DAY_COL,flexShrink:0}}/>
          <div style={{flex:1,display:"flex",borderLeft:"1px solid #1E3A5F",borderTop:"1px solid #1E3A5F",borderRight:"1px solid #1E3A5F",borderRadius:"8px 8px 0 0",overflow:"hidden"}}>
            {HOURS.map((h,i)=>(
              <div key={h} style={{flex:1,textAlign:"center",fontSize:14,color:"#64748B",padding:"4px 2px",background:"#1E293B",borderRight:i<HOURS.length-1?"1px solid #1E3A5F":"none",lineHeight:1.3}}>
                {String(h).padStart(2,"0")}:00-{String(h+1).padStart(2,"0")}:00
              </div>
            ))}
          </div>
        </div>
        {DAYS.map((day,di)=>{
          const dc=courses.filter(c=>c.day===day);
          const isWE=day==="เสาร์"||day==="อาทิตย์";
          return(
            <div key={day} style={{display:"flex"}}>
              <div style={{width:DAY_COL,flexShrink:0,height:ROW_H,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:isWE?"#F59E0B":"#94A3B8",borderBottom:"1px solid #1E3A5F",borderRight:"1px solid #1E3A5F",background:isWE?"#1A1500":di%2===0?"#131D2E":"#101830"}}>{day}</div>
              <div style={{flex:1,height:ROW_H,position:"relative",borderBottom:"1px solid #1E3A5F",borderRight:"1px solid #1E3A5F",background:isWE?"#120F00":di%2===0?"#0E1828":"#101830",borderRadius:di===DAYS.length-1?"0 0 8px 0":undefined,overflow:"hidden"}}>
                {HOURS.map((_,i)=><div key={i} style={{position:"absolute",top:0,bottom:0,left:`${(i/HOUR_COLS)*100}%`,width:1,background:"#1E3A5F"}}/>)}
                {HOURS.map((_,i)=><div key={"h"+i} style={{position:"absolute",top:0,bottom:0,left:`${((i+0.5)/HOUR_COLS)*100}%`,width:1,background:"#162030"}}/>)}
                {dc.map(c=>{
                  const sm=toMin(c.startHour,c.startMin)-480;
                  const dm=toMin(c.endHour,c.endMin)-toMin(c.startHour,c.startMin);
                  const col=COLORS[c.colorIdx%COLORS.length].bg;
                  return(
                    <div key={c.id} onClick={()=>onEdit(c)}
                      style={{position:"absolute",top:2,bottom:2,left:`${(sm/TOTAL_MINS)*100}%`,width:`${(dm/TOTAL_MINS)*100}%`,background:col,borderRadius:6,padding:"10px 7px",overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.45)",display:"flex",flexDirection:"column",justifyContent:"center",transition:"opacity .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.opacity=".72"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      <div style={{fontSize:11,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.code+" "}{c.name}</div>
                      <div style={{fontSize:11,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.instructor}</div>
                      <div style={{fontSize:11,fontWeight:500,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.room}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.8)",whiteSpace:"nowrap"}}>{fmt(c.startHour,c.startMin)}-{fmt(c.endHour,c.endMin)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Course Cards ───────────────────────────────────── */
function CourseCards({courses,examConflictIds,onEdit,onDelete}){
  if(!courses.length) return <Empty text="ยังไม่มีวิชา กด + เพิ่มวิชา"/>;
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
      {courses.map(c=>{
        const col=COLORS[c.colorIdx%COLORS.length].bg;
        const dur=toMin(c.endHour,c.endMin)-toMin(c.startHour,c.startMin);
        const cx=examConflictIds.has(c.id);
        return(
          <div key={c.id} style={{background:"#1E293B",border:`1px solid ${cx?"#854D0E":"#1E3A5F"}`,borderLeft:`4px solid ${col}`,borderRadius:10,padding:"12px 13px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{background:col,color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700,flexShrink:0}}>{c.code||"—"}</span>
                <span style={{fontWeight:700,fontSize:13}}>{c.name}</span>
                {cx&&<span style={{fontSize:10,background:"#7C2D12",color:"#FDBA74",borderRadius:4,padding:"1px 6px"}}>⚠️ สอบซ้อน</span>}
              </div>
              <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.9}}>
                วัน{c.day} · {fmt(c.startHour,c.startMin)}-{fmt(c.endHour,c.endMin)} · {Math.round(dur/60*10)/10} ชม.
                {(c.room||c.instructor)&&<><br/>{c.room&&"📍 "+c.room}{c.room&&c.instructor&&" · "}{c.instructor&&"👤 "+c.instructor}</>}
                {c.hasExam&&c.examDate&&<><br/><span style={{color:cx?"#FBBF24":"#6EE7B7"}}>📝 {fmtDate(c.examDate)} · {fmt(c.examStartHour,c.examStartMin)}-{fmt(c.examEndHour,c.examEndMin)}{c.examRoom&&" · "+c.examRoom}</span></>}
              </div>
            </div>
            <div style={{display:"flex",gap:4,marginLeft:8,flexShrink:0}}>
              <Btn onClick={()=>onEdit(c)} bg="#334155" color="#94A3B8">✏️</Btn>
              <Btn onClick={()=>onDelete(c.id)} bg="#450A0A" color="#FCA5A5">🗑</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Exam Tab ───────────────────────────────────────── */
function ExamTab({courses,examConflictIds,onEdit}){
  const groups={};
  courses.forEach(c=>{if(c.hasExam&&c.examDate){if(!groups[c.examDate])groups[c.examDate]=[];groups[c.examDate].push(c);}});
  const dates=Object.keys(groups).sort();
  return(
    <div>
      {examConflictIds.size>0&&(
        <div style={{background:"#431407",border:"1px solid #C2410C",borderRadius:10,padding:"12px 14px",marginBottom:14,display:"flex",gap:10}}>
          <span>⚠️</span>
          <div><div style={{fontWeight:700,color:"#FED7AA",fontSize:13,marginBottom:2}}>พบวิชาสอบซ้อนกัน!</div><div style={{fontSize:11,color:"#FB923C"}}>กรุณาตรวจสอบวิชาที่มีสัญลักษณ์ ⚠️</div></div>
        </div>
      )}
      {!dates.length&&<Empty text="ยังไม่มีวิชาที่กรอกข้อมูลสอบ"/>}
      {dates.map(date=>{
        const exams=groups[date].sort((a,b)=>toMin(a.examStartHour,a.examStartMin)-toMin(b.examStartHour,b.examStartMin));
        return(
          <div key={date} style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#38BDF8",marginBottom:8}}>📅 {fmtDate(date)} <span style={{fontSize:11,color:"#475569",fontWeight:400}}>({exams.length} วิชา)</span></div>
            <div style={{background:"#0D1117",borderRadius:8,padding:"7px 10px",marginBottom:8,overflowX:"auto"}}>
              <div style={{minWidth:300}}>
                <div style={{display:"flex",marginBottom:3}}>{HOURS.map(h=><div key={h} style={{flex:1,textAlign:"center",fontSize:8,color:"#475569"}}>{String(h).padStart(2,"0")}</div>)}</div>
                <div style={{height:24,position:"relative",background:"#1E293B",borderRadius:5,overflow:"hidden"}}>
                  {HOURS.map((_,i)=><div key={i} style={{position:"absolute",top:0,bottom:0,left:`${(i/HOUR_COLS)*100}%`,width:1,background:"#334155"}}/>)}
                  {exams.map(c=>{
                    const sm=toMin(c.examStartHour,c.examStartMin)-480;
                    const dm=toMin(c.examEndHour,c.examEndMin)-toMin(c.examStartHour,c.examStartMin);
                    const col=COLORS[c.colorIdx%COLORS.length].bg;
                    const cx=examConflictIds.has(c.id);
                    return(
                      <div key={c.id} onClick={()=>onEdit(c)}
                        style={{position:"absolute",top:2,bottom:2,left:`${Math.max(0,(sm/TOTAL_MINS)*100)}%`,width:`${(dm/TOTAL_MINS)*100}%`,background:col,borderRadius:3,cursor:"pointer",border:cx?"2px solid #EF4444":"none",display:"flex",alignItems:"center",paddingLeft:4,overflow:"hidden"}}>
                        <span style={{fontSize:8,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.code||c.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {exams.map(c=>{
              const col=COLORS[c.colorIdx%COLORS.length].bg;
              const cx=examConflictIds.has(c.id);
              return(
                <div key={c.id} style={{background:"#1E293B",border:`1px solid ${cx?"#C2410C":"#1E3A5F"}`,borderLeft:`4px solid ${col}`,borderRadius:8,padding:"10px 13px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{background:col,color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>{c.code||"—"}</span>
                      <span style={{fontWeight:700,fontSize:13}}>{c.name}</span>
                      {cx&&<span style={{background:"#7C2D12",color:"#FDBA74",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:600}}>⚠️ ซ้อนกัน</span>}
                    </div>
                    <div style={{fontSize:11,color:"#94A3B8"}}>{fmt(c.examStartHour,c.examStartMin)}-{fmt(c.examEndHour,c.examEndMin)}{c.examRoom&&" · "+c.examRoom}</div>
                  </div>
                  <Btn onClick={()=>onEdit(c)} bg="#334155" color="#94A3B8" style={{marginLeft:8}}>✏️</Btn>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Add Mode Picker ────────────────────────────────── */
function AddModePicker({onManual,onCatalog,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:350}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0F1C30",border:"1px solid #1E3A5F",borderRadius:"18px 18px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 40px"}}>
        <div style={{width:40,height:4,background:"#334155",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontSize:15,fontWeight:700,color:"#F1F5F9",marginBottom:18,textAlign:"center"}}>เพิ่มวิชาใหม่</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <button onClick={onManual} style={{background:"#1E293B",border:"2px solid #334155",borderRadius:12,padding:"22px 16px",cursor:"pointer",textAlign:"center",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#60A5FA"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
            <div style={{fontSize:30,marginBottom:8}}>✏️</div>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>ป้อนเอง</div>
            <div style={{fontSize:11,color:"#64748B"}}>กรอกข้อมูลด้วยตัวเอง</div>
          </button>
          <button onClick={onCatalog} style={{background:"#0D1A2D",border:"2px solid #1E3A5F",borderRadius:12,padding:"22px 16px",cursor:"pointer",textAlign:"center",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#A78BFA"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1E3A5F"}>
            <div style={{fontSize:30,marginBottom:8}}>📋</div>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>เลือกจากระบบ</div>
            <div style={{fontSize:11,color:"#64748B"}}>{CATALOG.length} วิชาในฐานข้อมูล</div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Catalog Browser ────────────────────────────────── */
function CatalogModal({onSelectSession,onClose,courses}){
  const [q,setQ]=useState("");
  const [filterCredit,setFilterCredit]=useState("all");
  const [filterStatus,setFilterStatus]=useState("all");
  const [expanded,setExpanded]=useState(null);
  const credits=[...new Set(CATALOG.map(c=>c.creditNum))].sort();
  const statuses=[...new Set(CATALOG.map(c=>c.status))];
  const filtered=useMemo(()=>{
    const ql=q.toLowerCase();
    return CATALOG.filter(c=>{
      const match=!ql||c.course_name.toLowerCase().includes(ql)||c.course_id.includes(ql)||c.teachers.toLowerCase().includes(ql);
      return match&&(filterCredit==="all"||c.creditNum===filterCredit)&&(filterStatus==="all"||c.status===filterStatus);
    });
  },[q,filterCredit,filterStatus]);
  function isAdded(item,sess){ return courses.some(c=>c.code===item.course_id&&c.day===sess.day&&c.startHour===sess.startHour&&c.startMin===sess.startMin); }
  const statusLabel={W:"เต็ม",A:"เปิดรับ",C:"ปิดรับ"};
  const statusColor={W:"#EF4444",A:"#10B981",C:"#F59E0B"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.87)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0F1C30",border:"1px solid #1E3A5F",borderRadius:"18px 18px 0 0",width:"100%",maxWidth:620,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #1E3A5F",flexShrink:0}}>
          <div style={{width:40,height:4,background:"#334155",borderRadius:2,margin:"0 auto 12px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:"#F1F5F9",flex:1}}>📋 รายวิชาในระบบ</div>
            <button onClick={onClose} style={{background:"#334155",border:"none",color:"#94A3B8",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>✕ ปิด</button>
          </div>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#475569"}}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาชื่อวิชา รหัสวิชา หรืออาจารย์..." style={{...inp,paddingLeft:32}} autoFocus/>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:10,color:"#475569",flexShrink:0}}>หน่วยกิต:</span>
              {["all",...credits].map(v=>(
                <button key={v} onClick={()=>setFilterCredit(v)} style={{background:filterCredit===v?"#1E3A5F":"#1A2540",border:"1px solid "+(filterCredit===v?"#3B82F6":"#334155"),color:filterCredit===v?"#60A5FA":"#64748B",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontSize:11,fontWeight:filterCredit===v?700:400}}>
                  {v==="all"?"ทั้งหมด":v+" หน่วย"}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:10,color:"#475569",flexShrink:0}}>สถานะ:</span>
              {["all",...statuses].map(v=>(
                <button key={v} onClick={()=>setFilterStatus(v)} style={{background:filterStatus===v?"#1E3A5F":"#1A2540",border:"1px solid "+(filterStatus===v?"#3B82F6":"#334155"),color:filterStatus===v?"#60A5FA":"#64748B",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontSize:11,fontWeight:filterStatus===v?700:400}}>
                  {v==="all"?"ทั้งหมด":statusLabel[v]||v}
                </button>
              ))}
            </div>
            <div style={{marginLeft:"auto",fontSize:11,color:"#475569"}}>{filtered.length} วิชา</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 14px 24px"}}>
          {!filtered.length&&<Empty text="ไม่พบวิชาที่ตรงกัน"/>}
          {filtered.map(item=>{
            const isExp=expanded===item.course_id;
            const sColor=statusColor[item.status]||"#64748B";
            const sLabel=statusLabel[item.status]||item.status;
            const teacherShort=item.teachers.replace(/ผู้ช่วยศาสตราจารย์ /g,"ผศ.").replace(/รองศาสตราจารย์ /g,"รศ.").replace(/ศาสตราจารย์ /g,"ศ.");
            return(
              <div key={item.course_id} style={{background:"#1E293B",border:"1px solid #1E3A5F",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
                <div onClick={()=>setExpanded(isExp?null:item.course_id)} style={{padding:"11px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{background:"#0F2240",color:"#60A5FA",borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:700,flexShrink:0}}>{item.course_id}</span>
                      <span style={{fontWeight:700,fontSize:13,color:"#F1F5F9"}}>{item.course_name}</span>
                    </div>
                    <div style={{fontSize:11,color:"#64748B",display:"flex",gap:10,flexWrap:"wrap",marginBottom:5}}>
                      <span>📚 {item.credit}</span><span>👤 {teacherShort}</span><span>กลุ่ม {item.group}</span>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {item.sessions.map((s,i)=>(
                        <span key={i} style={{background:"#0D1A2D",border:"1px solid #1E3A5F",borderRadius:5,fontSize:10,color:"#94A3B8",padding:"1px 7px"}}>
                          {s.day} {fmt(s.startHour,s.startMin)}-{fmt(s.endHour,s.endMin)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                    <span style={{background:sColor+"22",color:sColor,border:"1px solid "+sColor+"55",borderRadius:5,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{sLabel}</span>
                    <span style={{fontSize:10,color:"#475569"}}>{item.remain} ที่นั่ง</span>
                    <span style={{fontSize:10,color:isExp?"#60A5FA":"#475569"}}>{isExp?"▲":"▼ เลือก"}</span>
                  </div>
                </div>
                {isExp&&(
                  <div style={{borderTop:"1px solid #1E3A5F",background:"#0D1A2D",padding:"10px 14px"}}>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:8}}>เลือก session ที่ต้องการเพิ่มลงตาราง:</div>
                    {item.sessions.length===0&&<div style={{fontSize:11,color:"#475569"}}>ไม่พบข้อมูลเวลา</div>}
                    {item.sessions.map((s,i)=>{
                      const added=isAdded(item,s);
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#111D2E",border:"1px solid #1E3A5F",borderRadius:8,padding:"9px 12px",marginBottom:6}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>วัน{s.day} · {fmt(s.startHour,s.startMin)}-{fmt(s.endHour,s.endMin)}</div>
                            {s.room&&<div style={{fontSize:11,color:"#64748B",marginTop:2}}>📍 {s.room}</div>}
                          </div>
                          {added?<span style={{fontSize:11,color:"#6EE7B7",background:"#064E3B",borderRadius:5,padding:"3px 10px",flexShrink:0}}>✓ เพิ่มแล้ว</span>:(
                            <button onClick={()=>onSelectSession(item,s)} style={{background:"linear-gradient(135deg,#2563EB,#7C3AED)",border:"none",color:"#fff",borderRadius:7,padding:"5px 14px",cursor:"pointer",fontWeight:600,fontSize:12,flexShrink:0}}>+ เพิ่ม</button>
                          )}
                        </div>
                      );
                    })}
                    <div style={{fontSize:10,color:"#2D3F55",marginTop:4}}>* กดเพิ่มแล้วแก้ไขรายละเอียดได้ก่อนบันทึก</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Course Form Modal ──────────────────────────────── */
function CourseModal({form,setForm,onSave,onDelete,onClose,editId,cConflicts,eConflicts,accentColor}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1E293B",border:"1px solid #334155",borderRadius:"16px 16px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#334155",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:"#F1F5F9"}}>{editId?"✏️ แก้ไขวิชา":"➕ เพิ่มวิชาใหม่"}</div>
        {(cConflicts.length>0||eConflicts.length>0)&&(
          <div style={{background:"#450A0A",border:"1px solid #DC2626",borderRadius:8,padding:11,marginBottom:13}}>
            {cConflicts.length>0&&<><div style={{color:"#FCA5A5",fontWeight:600,fontSize:12,marginBottom:3}}>⚠️ เวลาเรียนชนกับ:</div>{cConflicts.map(c=><div key={c.id} style={{color:"#FCA5A5",fontSize:11}}>• {c.name} ({fmt(c.startHour,c.startMin)}-{fmt(c.endHour,c.endMin)} วัน{c.day})</div>)}</>}
            {eConflicts.length>0&&<><div style={{color:"#FBBF24",fontWeight:600,fontSize:12,marginBottom:3,marginTop:cConflicts.length?8:0}}>📝 เวลาสอบซ้อนกับ:</div>{eConflicts.map(c=><div key={c.id} style={{color:"#FBBF24",fontSize:11}}>• {c.name} ({fmtDate(c.examDate)} · {fmt(c.examStartHour,c.examStartMin)}-{fmt(c.examEndHour,c.examEndMin)})</div>)}</>}
          </div>
        )}
        <div style={{fontSize:11,fontWeight:700,color:"#38BDF8",marginBottom:8}}>📚 ข้อมูลวิชา</div>
        <Field label="ชื่อวิชา *"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp} placeholder="เช่น แคลคูลัส 1"/></Field>
        <Field label="รหัสวิชา"><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} style={inp} placeholder="เช่น MTH101"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="อาจารย์"><input value={form.instructor} onChange={e=>setForm({...form,instructor:e.target.value})} style={inp} placeholder="อ.ชื่อ"/></Field>
          <Field label="ห้อง"><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} style={inp} placeholder="เช่น B201"/></Field>
        </div>
        <Field label="วันเรียน"><select value={form.day} onChange={e=>setForm({...form,day:e.target.value})} style={inp}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="เวลาเริ่ม">
            <div style={{display:"flex",gap:5}}>
              <select value={form.startHour} onChange={e=>setForm({...form,startHour:+e.target.value})} style={{...inp,flex:1}}>{HOURS.map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}</select>
              <select value={form.startMin}  onChange={e=>setForm({...form,startMin: +e.target.value})} style={{...inp,flex:1}}>{[0,15,30,45].map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
            </div>
          </Field>
          <Field label="เวลาสิ้นสุด">
            <div style={{display:"flex",gap:5}}>
              <select value={form.endHour} onChange={e=>setForm({...form,endHour:+e.target.value})} style={{...inp,flex:1}}>{HOURS.map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}</select>
              <select value={form.endMin}  onChange={e=>setForm({...form,endMin: +e.target.value})} style={{...inp,flex:1}}>{[0,15,30,45].map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
            </div>
          </Field>
        </div>
        <Field label="สีวิชา">
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {COLORS.map((c,i)=><div key={i} onClick={()=>setForm({...form,colorIdx:i})} style={{width:26,height:26,borderRadius:"50%",background:c.bg,cursor:"pointer",border:form.colorIdx===i?"3px solid #fff":"3px solid transparent",boxShadow:form.colorIdx===i?"0 0 0 2px "+c.bg:"none",transition:"all .15s"}}/>)}
          </div>
        </Field>
        <div style={{borderTop:"1px solid #1E3A5F",margin:"12px 0 10px",paddingTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#A78BFA"}}>📝 ข้อมูลการสอบ</div>
          <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:"#94A3B8"}}>
            <input type="checkbox" checked={form.hasExam} onChange={e=>setForm({...form,hasExam:e.target.checked})} style={{accentColor:"#7C3AED"}}/>มีสอบ
          </label>
        </div>
        {form.hasExam&&(
          <>
            <Field label="วันสอบ"><input type="date" value={form.examDate} onChange={e=>setForm({...form,examDate:e.target.value})} style={{...inp,colorScheme:"dark"}}/></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="เวลาเริ่มสอบ">
                <div style={{display:"flex",gap:5}}>
                  <select value={form.examStartHour} onChange={e=>setForm({...form,examStartHour:+e.target.value})} style={{...inp,flex:1}}>{HOURS.map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}</select>
                  <select value={form.examStartMin}  onChange={e=>setForm({...form,examStartMin: +e.target.value})} style={{...inp,flex:1}}>{[0,15,30,45].map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
                </div>
              </Field>
              <Field label="เวลาสิ้นสุดสอบ">
                <div style={{display:"flex",gap:5}}>
                  <select value={form.examEndHour} onChange={e=>setForm({...form,examEndHour:+e.target.value})} style={{...inp,flex:1}}>{HOURS.map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}</select>
                  <select value={form.examEndMin}  onChange={e=>setForm({...form,examEndMin: +e.target.value})} style={{...inp,flex:1}}>{[0,15,30,45].map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
                </div>
              </Field>
            </div>
            <Field label="ห้องสอบ"><input value={form.examRoom} onChange={e=>setForm({...form,examRoom:e.target.value})} style={inp} placeholder="เช่น ห้องสอบ A101"/></Field>
          </>
        )}
        <div style={{display:"flex",gap:8,marginTop:18}}>
          {editId&&<Btn onClick={()=>{onDelete(editId);onClose();}} bg="#450A0A" color="#FCA5A5">🗑 ลบ</Btn>}
          <div style={{flex:1}}/><Btn onClick={onClose} bg="#334155" color="#94A3B8">ยกเลิก</Btn>
          <button onClick={onSave} style={{background:"linear-gradient(135deg,"+accentColor+","+accentColor+"BB)",border:"none",color:"#fff",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600,fontSize:13}}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Schedule Modal ─────────────────────────────────── */
function ScheduleModal({mode,scheduleForm,setScheduleForm,onSave,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1E293B",border:"1px solid #334155",borderRadius:"16px 16px 0 0",padding:"20px 18px 32px",width:"100%",maxWidth:440}}>
        <div style={{width:40,height:4,background:"#334155",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:"#F1F5F9"}}>{mode==="add"?"➕ สร้างตารางใหม่":"✏️ แก้ไขตาราง"}</div>
        <Field label="ชื่อตาราง *"><input value={scheduleForm.name} onChange={e=>setScheduleForm({...scheduleForm,name:e.target.value})} style={inp} placeholder="เช่น ภาคเรียนที่ 1/2568" autoFocus/></Field>
        <Field label="สีตาราง">
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {PALETTE.map(col=><div key={col} onClick={()=>setScheduleForm({...scheduleForm,color:col})} style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:scheduleForm.color===col?"3px solid #fff":"3px solid transparent",boxShadow:scheduleForm.color===col?"0 0 0 2px "+col:"none",transition:"all .15s"}}/>)}
          </div>
        </Field>
        <div style={{display:"flex",gap:8,marginTop:18}}>
          <div style={{flex:1}}/><Btn onClick={onClose} bg="#334155" color="#94A3B8">ยกเลิก</Btn>
          <button onClick={onSave} style={{background:"linear-gradient(135deg,"+scheduleForm.color+","+scheduleForm.color+"BB)",border:"none",color:"#fff",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600,fontSize:13}}>{mode==="add"?"สร้าง":"บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Logo ───────────────────────────────────────────── */
function Logo(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:9,userSelect:"none"}}>
      <svg width="30" height="30" viewBox="0 0 34 34" fill="none">
        <rect width="34" height="34" rx="9" fill="url(#lg1)"/>
        <rect x="8" y="8" width="8" height="8" rx="2" fill="white" opacity="0.9"/>
        <rect x="18" y="8" width="8" height="8" rx="2" fill="white" opacity="0.45"/>
        <rect x="8" y="18" width="8" height="8" rx="2" fill="white" opacity="0.45"/>
        <rect x="18" y="18" width="8" height="8" rx="2" fill="white" opacity="0.9"/>
        <defs><linearGradient id="lg1" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
      </svg>
      <div style={{lineHeight:1}}>
        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
          <span style={{fontSize:17,fontWeight:800,letterSpacing:2,background:"linear-gradient(135deg,#60A5FA,#A78BFA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>DGT</span>
          <span style={{fontSize:14,fontWeight:600,color:"#E2E8F0",letterSpacing:.5}}>Planner</span>
        </div>
        <div style={{fontSize:8,color:"#475569",letterSpacing:2,marginTop:1}}>SCHEDULE MANAGER</div>
      </div>
    </div>
  );
}

/* ─── Sidebar Content ────────────────────────────────── */
function SidebarContent({data,setData,setShowScheduleModal,setScheduleForm,setEditScheduleId,closeDrawer}){
  function del(id){
    if(data.schedules.length<=1)return alert("ต้องมีตารางอย่างน้อย 1 อัน");
    if(!confirm("ลบตารางนี้?"))return;
    const rest=data.schedules.filter(s=>s.id!==id);
    setData(d=>({...d,schedules:rest,activeId:d.activeId===id?rest[0].id:d.activeId}));
  }
  function dup(s){
    const ns={...s,id:uid(),name:s.name+" (สำเนา)",courses:s.courses.map(c=>({...c,id:uid()}))};
    setData(d=>({...d,schedules:[...d.schedules,ns],activeId:ns.id}));
    closeDrawer();
  }
  return(
    <>
      {/* Sidebar header */}
      <div style={{padding:"16px 14px 12px",borderBottom:"1px solid #1E3A5F",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:1}}>ตารางทั้งหมด</div>
        <button onClick={()=>{setScheduleForm({name:"",color:"#3B82F6"});setEditScheduleId(null);setShowScheduleModal("add");}}
          style={{background:"#1E3A5F",border:"none",color:"#38BDF8",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>+</button>
      </div>
      {/* Schedule list */}
      <div style={{flex:1,overflowY:"auto",padding:"8px"}}>
        {data.schedules.map(s=>(
          <div key={s.id} onClick={()=>{setData(d=>({...d,activeId:s.id}));closeDrawer();}}
            style={{borderRadius:8,padding:"10px 11px",marginBottom:4,cursor:"pointer",background:data.activeId===s.id?"#1E293B":"transparent",border:"1px solid "+(data.activeId===s.id?"#1E3A5F":"transparent"),transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:data.activeId===s.id?"#F1F5F9":"#94A3B8"}}>{s.name}</div>
                <div style={{fontSize:10,color:"#475569",marginTop:1}}>{s.courses.length} วิชา</div>
              </div>
            </div>
            {data.activeId===s.id&&(
              <div style={{display:"flex",gap:4,marginTop:8}}>
                <button onClick={e=>{e.stopPropagation();setScheduleForm({name:s.name,color:s.color});setEditScheduleId(s.id);setShowScheduleModal("edit");}} style={{flex:1,background:"#334155",border:"none",color:"#94A3B8",borderRadius:5,padding:"4px 0",cursor:"pointer",fontSize:11}}>✏️</button>
                <button onClick={e=>{e.stopPropagation();dup(s);}} style={{flex:1,background:"#334155",border:"none",color:"#94A3B8",borderRadius:5,padding:"4px 0",cursor:"pointer",fontSize:11}}>⎘</button>
                <button onClick={e=>{e.stopPropagation();del(s.id);}} style={{flex:1,background:"#450A0A",border:"none",color:"#FCA5A5",borderRadius:5,padding:"4px 0",cursor:"pointer",fontSize:11}}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   App  —  Desktop: sidebar always visible (25%), main 75%
            Mobile:  sidebar as overlay drawer
   ═══════════════════════════════════════════════════════ */
export default function App(){
  const width      = useWidth();
  const isDesktop  = width >= 960;

  const [data,setData]               = useState(()=>loadData());
  const [tab,setTab]                 = useState("class");
  const [showPicker,setShowPicker]   = useState(false);
  const [showCatalog,setShowCatalog] = useState(false);
  const [showCM,setShowCM]           = useState(false);
  const [showSM,setShowSM]           = useState(false);
  const [form,setForm]               = useState(DEF_FORM);
  const [editCId,setEditCId]         = useState(null);
  const [cc,setCc]                   = useState([]);
  const [ec,setEc]                   = useState([]);
  const [sf,setSf]                   = useState({name:"",color:"#3B82F6"});
  const [editSId,setEditSId]         = useState(null);
  const [mobileDrawer,setMobileDrawer] = useState(false);

  useEffect(()=>{ saveData(data); },[data]);
  useEffect(()=>{ if(isDesktop) setMobileDrawer(false); },[isDesktop]);

  const active  = data.schedules.find(s=>s.id===data.activeId);
  const courses = active?.courses||[];

  function updCourses(fn){ setData(d=>({...d,schedules:d.schedules.map(s=>s.id===data.activeId?{...s,courses:fn(s.courses)}:s)})); }

  function openAdd()    { setShowPicker(true); }
  function openManual() { setForm({...DEF_FORM,colorIdx:courses.length%COLORS.length}); setEditCId(null); setCc([]); setEc([]); setShowPicker(false); setShowCM(true); }
  function openEdit(c)  { setForm({...c}); setEditCId(c.id); setCc([]); setEc([]); setShowCM(true); }
  function delCourse(id){ updCourses(cs=>cs.filter(c=>c.id!==id)); }

  function handleCatalogSelect(item,sess){
    setForm({...DEF_FORM,
      name:item.course_name, code:item.course_id,
      instructor:item.teachers.replace(/ผู้ช่วยศาสตราจารย์ /g,"ผศ.").replace(/รองศาสตราจารย์ /g,"รศ.").replace(/ศาสตราจารย์ /g,"ศ."),
      room:sess.room, day:sess.day,
      startHour:sess.startHour, startMin:sess.startMin,
      endHour:sess.endHour, endMin:sess.endMin,
      colorIdx:courses.length%COLORS.length,
    });
    setEditCId(null); setCc([]); setEc([]);
    setShowCatalog(false); setShowCM(true);
  }

  function saveC(){
    if(!form.name.trim())return alert("กรุณากรอกชื่อวิชา");
    if(toMin(form.endHour,form.endMin)<=toMin(form.startHour,form.startMin))return alert("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
    if(form.hasExam&&!form.examDate)return alert("กรุณากรอกวันสอบ");
    if(form.hasExam&&toMin(form.examEndHour,form.examEndMin)<=toMin(form.examStartHour,form.examStartMin))return alert("เวลาสอบสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ");
    const nc=classConflicts(courses,form,editCId), ne=examConflictsOf(courses,form,editCId);
    if(nc.length||ne.length){ setCc(nc); setEc(ne); return; }
    if(editCId) updCourses(cs=>cs.map(c=>c.id===editCId?{...form,id:editCId}:c));
    else updCourses(cs=>[...cs,{...form,id:uid()}]);
    setShowCM(false); setCc([]); setEc([]);
  }

  function addSched(){ if(!sf.name.trim())return alert("กรุณากรอกชื่อตาราง"); const ns={id:uid(),name:sf.name.trim(),color:sf.color,courses:[]}; setData(d=>({...d,schedules:[...d.schedules,ns],activeId:ns.id})); setShowSM(false); }
  function updSched(){ if(!sf.name.trim())return alert("กรุณากรอกชื่อตาราง"); setData(d=>({...d,schedules:d.schedules.map(s=>s.id===editSId?{...s,...sf}:s)})); setShowSM(false); }

  // Exam conflict IDs
  const ecIds=new Set();
  courses.forEach((c,i)=>{ if(!c.hasExam||!c.examDate)return; courses.forEach((d,j)=>{ if(j<=i||!d.hasExam||d.examDate!==c.examDate)return; if(toMin(c.examStartHour,c.examStartMin)<toMin(d.examEndHour,d.examEndMin)&&toMin(c.examEndHour,c.examEndMin)>toMin(d.examStartHour,d.examStartMin)){ ecIds.add(c.id); ecIds.add(d.id); } }); });

  const sidebarProps = { data, setData, setShowScheduleModal:setShowSM, setScheduleForm:setSf, setEditScheduleId:setEditSId, closeDrawer:()=>setMobileDrawer(false) };

  return(
    <div style={{fontFamily:"'Sarabun','Noto Sans Thai',sans-serif",height:"100vh",width:"100%",background:"#101830",color:"#E2E8F0",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{background:"#0D1424",borderBottom:"1px solid #1E3A5F",padding:"11px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0,position:"relative",zIndex:50}}>
        {/* Mobile hamburger */}
        {!isDesktop&&(
          <button onClick={()=>setMobileDrawer(v=>!v)} style={{background:"#1E293B",border:"1px solid #1E3A5F",color:"#64748B",borderRadius:7,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>☰</button>
        )}
        {/* Centered logo */}
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",pointerEvents:"none"}}><Logo/></div>
        {/* Right actions */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10,zIndex:1}}>
          {active&&isDesktop&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:active.color}}/>
              <span style={{fontSize:12,color:"#94A3B8",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{active.name}</span>
              {ecIds.size>0&&<span style={{fontSize:10,background:"#7C2D12",color:"#FDBA74",borderRadius:5,padding:"1px 7px"}}>⚠️ สอบซ้อน</span>}
            </div>
          )}
          <button onClick={openAdd} style={{background:"linear-gradient(135deg,"+(active?.color||"#3B82F6")+","+(active?.color||"#2563EB")+"BB)",border:"none",color:"#fff",borderRadius:8,padding:isDesktop?"8px 18px":"8px 12px",cursor:"pointer",fontWeight:600,fontSize:13,flexShrink:0}}>
            {isDesktop?"+ เพิ่มวิชา":"＋"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Desktop: always-visible sidebar — 25% of viewport */}
        {isDesktop&&(
          <div style={{
            width:"25%",
            minWidth:200,
            maxWidth:300,
            flexShrink:0,
            background:"#0D1424",
            borderRight:"1px solid #1E3A5F",
            display:"flex",
            flexDirection:"column",
            overflow:"hidden",
          }}>
            <SidebarContent {...sidebarProps} closeDrawer={()=>{}}/>
          </div>
        )}

        {/* Mobile: overlay drawer */}
        {!isDesktop&&mobileDrawer&&(
          <div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setMobileDrawer(false)}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)"}}/>
            <div style={{position:"absolute",top:0,left:0,bottom:0,width:"72%",maxWidth:260,background:"#0D1424",borderRight:"1px solid #1E3A5F",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
              <SidebarContent {...sidebarProps}/>
            </div>
          </div>
        )}

        {/* Main content — 75% on desktop, full width on mobile */}
        <div style={{
          flex:1,
          overflowY:"auto",
          overflowX:"hidden",
          padding:isDesktop?"20px 26px 40px":"12px 12px 80px",
        }}>
          {!active?<Empty text="เลือกหรือสร้างตารางใหม่"/>:(
            <>
              {/* Mobile: schedule name strip */}
              {!isDesktop&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:active.color}}/>
                  <span style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{active.name}</span>
                  <span style={{fontSize:11,color:"#475569"}}>{courses.length} วิชา</span>
                  {ecIds.size>0&&<span style={{fontSize:10,background:"#7C2D12",color:"#FDBA74",borderRadius:5,padding:"1px 7px"}}>⚠️ สอบซ้อน</span>}
                </div>
              )}

              <Timetable courses={courses} onEdit={openEdit}/>

              {/* Tab bar */}
              <div style={{marginTop:22,marginBottom:14,display:"flex",gap:6}}>
                {[["class","📚 รายวิชา"],["exam","📝 ตารางสอบ"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setTab(k)}
                    style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,transition:"all .15s",background:tab===k?"linear-gradient(135deg,"+active.color+","+active.color+"AA)":"#1E293B",color:tab===k?"#fff":"#64748B"}}>
                    {l}{k==="exam"&&ecIds.size>0&&<span style={{marginLeft:5,background:"#EF4444",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:9}}>!</span>}
                  </button>
                ))}
              </div>

              {tab==="class"&&<CourseCards courses={courses} examConflictIds={ecIds} onEdit={openEdit} onDelete={delCourse}/>}
              {tab==="exam"&&<ExamTab courses={courses} examConflictIds={ecIds} onEdit={openEdit}/>}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showPicker&&<AddModePicker onManual={openManual} onCatalog={()=>{setShowPicker(false);setShowCatalog(true);}} onClose={()=>setShowPicker(false)}/>}
      {showCatalog&&<CatalogModal onSelectSession={handleCatalogSelect} onClose={()=>setShowCatalog(false)} courses={courses}/>}
      {showCM&&<CourseModal form={form} setForm={setForm} onSave={saveC} onDelete={delCourse} onClose={()=>{setShowCM(false);setCc([]);setEc([]);}} editId={editCId} cConflicts={cc} eConflicts={ec} accentColor={active?.color||"#3B82F6"}/>}
      {showSM&&<ScheduleModal mode={showSM} scheduleForm={sf} setScheduleForm={setSf} onSave={showSM==="add"?addSched:updSched} onClose={()=>setShowSM(false)}/>}
    </div>
  );
}