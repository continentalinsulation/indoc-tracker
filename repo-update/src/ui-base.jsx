// ─── Date helpers + status config (shared pure utils) ─────────────────────
const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MON_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseYmd(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function isToday(d) { const t = new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate(); }
function formatLong(d) { return `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}, ${MON_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }
function hoursTotal(job) { return (job.crew || []).reduce((s, c) => s + (c.reg || 0) + (c.ot || 0), 0); }

const STATUS = {
  active:   { label: 'Active',    bar: '#d97706' },
  deferred: { label: 'Deferred',  bar: '#94a3b8' },
  hold:     { label: 'On Hold',   bar: '#f59e0b' },
  complete: { label: 'Complete',  bar: '#16a34a' },
  planned:  { label: 'Planned',   bar: '#3b82f6' },
  visit:    { label: 'Site Visit',bar: '#8b5cf6' },
};

Object.assign(window, { DOW, MON, MON_FULL, ymd, parseYmd, addDays, isToday, formatLong, hoursTotal, STATUS });

// ─── Login screen ──────────────────────────────────────────────────────────
function LoginScreen({ onSignedIn }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await window.signIn(email.trim(), password); onSignedIn(); }
    catch (ex) { setErr(ex.message || 'Login failed.'); }
    setBusy(false);
  };

  return (
    <div style={loginS.root}>
      <form onSubmit={submit} style={loginS.card}>
        <div style={loginS.logoRow}>
          <div style={loginS.logo}>CI</div>
          <div>
            <div style={loginS.brand}>Continental Insulation</div>
            <div style={loginS.sub}>Operations Daily Log</div>
          </div>
        </div>
        <label style={loginS.label}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          autoFocus required style={loginS.input}/>
        <label style={loginS.label}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          required style={loginS.input}/>
        {err && <div style={loginS.err}>{err}</div>}
        <button type="submit" disabled={busy} style={loginS.btn}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="mailto:nicholas@cisudbury.ca?subject=Daily%20Log%20access%20request&body=Hi%20Nick%2C%0A%0AI%27d%20like%20an%20account%20for%20the%20Operations%20Daily%20Log.%0A%0AName%3A%20%0AEmail%20I%27d%20like%20to%20use%3A%20"
           style={loginS.foot}>Request access</a>
      </form>
    </div>
  );
}

const loginS = {
  root: { position:'fixed', inset:0, background:'#F4F1EB', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"IBM Plex Sans", system-ui, sans-serif' },
  card: { width:380, background:'#FAF8F3', border:'1px solid #D8D0BE', padding:'28px 32px', display:'flex', flexDirection:'column' },
  logoRow: { display:'flex', alignItems:'center', gap:14, marginBottom:24 },
  logo: { width:44, height:44, background:'#1A1A1A', color:'#E85D2F', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, letterSpacing:1 },
  brand: { fontSize:15, fontWeight:700, letterSpacing:0.2 },
  sub: { fontSize:11, color:'#6B6252', textTransform:'uppercase', letterSpacing:1.2, fontWeight:600, marginTop:2 },
  label: { fontSize:10, textTransform:'uppercase', letterSpacing:1.2, color:'#6B6252', fontWeight:700, marginBottom:5, marginTop:10 },
  input: { padding:'9px 11px', border:'1px solid #D8D0BE', background:'#fff', fontSize:13, fontFamily:'inherit', outline:'none' },
  err: { marginTop:12, padding:'8px 10px', background:'#FEE4E2', border:'1px solid #E85D2F', color:'#B42318', fontSize:12 },
  btn: { marginTop:18, padding:'10px', background:'#1A1A1A', color:'#FAF8F3', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', fontFamily:'inherit' },
  foot: { marginTop:14, fontSize:11, color:'#6B6252', textAlign:'center', textDecoration:'none', display:'block' },
};

// ─── Mini calendar ─────────────────────────────────────────────────────────
function MiniCalendar({ value, onPick, onClose }) {
  const [viewMonth, setViewMonth] = React.useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const [submittedSet, setSubmittedSet] = React.useState(new Set());

  React.useEffect(() => { window.listSubmittedDateStrings().then(setSubmittedSet); }, []);

  const first = new Date(viewMonth);
  const startWeek = new Date(first); startWeek.setDate(1 - first.getDay());
  const cells = Array.from({length: 42}, (_, i) => addDays(startWeek, i));

  return (
    <div style={calS.root}>
      <div style={calS.head}>
        <button type="button" style={calS.navB} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()-1, 1))}>‹</button>
        <div style={calS.title}>{MON_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear()}</div>
        <button type="button" style={calS.navB} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 1))}>›</button>
      </div>
      <div style={calS.dow}>{DOW.map(d => <div key={d} style={calS.dowCell}>{d[0]}</div>)}</div>
      <div style={calS.grid}>
        {cells.map((c, i) => {
          const inMonth = c.getMonth() === viewMonth.getMonth();
          const sel = ymd(c) === ymd(value);
          const sub = submittedSet.has(ymd(c));
          const today = isToday(c);
          return (
            <button type="button" key={i} onClick={() => { onPick(c); onClose(); }}
              style={{...calS.cell, color: inMonth ? '#1A1A1A' : '#C9BFA9',
                background: sel ? '#1A1A1A' : (today ? '#FEF8F0' : 'transparent'),
                ...(sel ? {color:'#FAF8F3'} : {})}}>
              <span>{c.getDate()}</span>
              {sub && <span style={{...calS.pip, background: sel ? '#E85D2F' : '#16a34a'}}/>}
            </button>
          );
        })}
      </div>
      <div style={calS.foot}>
        <span style={calS.footItem}><span style={{width:4,height:4,borderRadius:2,background:'#16a34a',display:'inline-block'}}/> submitted</span>
        <button type="button" style={calS.todayBtn} onClick={() => { onPick(new Date()); onClose(); }}>Jump to today</button>
      </div>
    </div>
  );
}
const calS = {
  root: { position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', marginTop:6, width:280, background:'#fff', border:'1px solid #D8D0BE', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:10, zIndex:50 },
  head: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 4px 10px' },
  navB: { width:24, height:24, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontSize:12 },
  title: { fontSize:13, fontWeight:700, letterSpacing:-0.2 },
  dow: { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', marginBottom:4 },
  dowCell: { fontSize:10, textAlign:'center', color:'#8a7f6a', textTransform:'uppercase', letterSpacing:1, fontWeight:700 },
  grid: { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:1 },
  cell: { position:'relative', aspectRatio:'1/1', border:'none', cursor:'pointer', fontSize:11, fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center' },
  pip: { position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:2 },
  foot: { display:'flex', alignItems:'center', gap:8, marginTop:8, paddingTop:8, borderTop:'1px solid #E8DFCB', fontSize:10, color:'#6B6252', textTransform:'uppercase', letterSpacing:1, fontWeight:600 },
  footItem: { display:'flex', alignItems:'center', gap:4 },
  todayBtn: { marginLeft:'auto', padding:'3px 8px', fontSize:10, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', textTransform:'uppercase', letterSpacing:1, fontWeight:700 },
};

// ─── History drawer ────────────────────────────────────────────────────────
function HistoryDrawer({ open, onClose, onPick, currentDate }) {
  const [query, setQuery] = React.useState('');
  const [days, setDays] = React.useState([]);
  React.useEffect(() => { if (open) window.listLoggedDays().then(setDays); }, [open]);

  const filtered = days.filter(d => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (formatLong(parseYmd(d.date)).toLowerCase().includes(q)) return true;
    if ((d.signoff||'').toLowerCase().includes(q)) return true;
    return false;
  });

  if (!open) return null;
  return (
    <div style={hS.overlay} onClick={onClose}>
      <div style={hS.drawer} onClick={e => e.stopPropagation()}>
        <header style={hS.head}>
          <div>
            <div style={{fontSize:10, letterSpacing:1.5, color:'#E85D2F', fontWeight:700}}>INDEX</div>
            <h2 style={{fontSize:18, fontWeight:700, margin:'2px 0 0', letterSpacing:-0.3}}>All Daily Logs</h2>
          </div>
          <button type="button" onClick={onClose} style={hS.x}>✕</button>
        </header>
        <div style={hS.searchWrap}>
          <span style={{color:'#8a7f6a'}}>⌕</span>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by date or signoff…" style={hS.search}/>
          <span style={hS.count}>{filtered.length} days</span>
        </div>
        <div style={hS.list}>
          {filtered.length === 0 && <div style={hS.empty}>No days logged yet. Start a day in the main screen.</div>}
          {filtered.map(d => {
            const dd = parseYmd(d.date);
            const isCur = d.date === currentDate;
            return (
              <button type="button" key={d.date} onClick={() => { onPick(dd); onClose(); }}
                style={{...hS.row, ...(isCur ? hS.rowCur : {})}}>
                <div style={hS.rowDate}>
                  <div style={hS.rowDow}>{DOW[dd.getDay()]}</div>
                  <div style={hS.rowDay}>{MON[dd.getMonth()]} {dd.getDate()}</div>
                  <div style={hS.rowYear}>{dd.getFullYear()}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={hS.rowTitle}>{formatLong(dd)}</div>
                  <div style={hS.rowMeta}>
                    {d.submitted ? <span style={hS.submitted}>● submitted</span> : <span style={hS.draft}>○ draft</span>}
                    <span>·</span>
                    <span>{d.jobCount} jobs</span>
                    <span>·</span>
                    <span style={hS.mono}>{(d.hours || 0).toFixed(1)}h</span>
                    {d.signoff && <><span>·</span><span>by {d.signoff}</span></>}
                  </div>
                </div>
                <div style={hS.rowArrow}>›</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
const hS = {
  overlay: { position:'fixed', inset:0, background:'rgba(26,26,26,0.4)', zIndex:100, display:'flex', justifyContent:'flex-end' },
  drawer: { width:560, maxWidth:'90%', height:'100%', background:'#FAF8F3', display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.15)' },
  head: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #D8D0BE' },
  x: { width:32, height:32, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontSize:14 },
  searchWrap: { display:'flex', alignItems:'center', gap:10, padding:'10px 18px', background:'#fff', border:'1px solid #D8D0BE', margin:'14px 24px' },
  search: { flex:1, border:'none', outline:'none', fontSize:13, fontFamily:'inherit' },
  count: { fontSize:10, fontFamily:'"IBM Plex Mono", monospace', color:'#8a7f6a', textTransform:'uppercase', letterSpacing:1, fontWeight:600 },
  list: { flex:1, overflow:'auto', padding:'0 24px 24px' },
  empty: { padding:'40px 20px', textAlign:'center', color:'#8a7f6a', fontSize:13 },
  row: { display:'flex', alignItems:'center', gap:14, width:'100%', padding:'12px 14px', background:'#fff', border:'1px solid #E8DFCB', borderLeft:'3px solid #E8DFCB', marginBottom:6, cursor:'pointer', textAlign:'left', fontFamily:'inherit' },
  rowCur: { borderLeftColor:'#E85D2F', background:'#FEF8F0' },
  rowDate: { width:60, textAlign:'center', borderRight:'1px solid #E8DFCB', paddingRight:12 },
  rowDow: { fontSize:9, letterSpacing:1.5, fontWeight:700, color:'#E85D2F' },
  rowDay: { fontSize:15, fontWeight:700, fontFamily:'"IBM Plex Mono", monospace', lineHeight:1.1 },
  rowYear: { fontSize:10, color:'#8a7f6a', fontFamily:'"IBM Plex Mono", monospace' },
  rowTitle: { fontSize:13, fontWeight:600, marginBottom:3 },
  rowMeta: { fontSize:11, color:'#6B6252', display:'flex', gap:6, alignItems:'center', fontFamily:'"IBM Plex Mono", monospace' },
  submitted: { color:'#16a34a', fontWeight:700 },
  draft: { color:'#8a7f6a', fontWeight:700 },
  mono: { fontFamily:'"IBM Plex Mono", monospace', fontWeight:700, color:'#1A1A1A' },
  rowArrow: { color:'#8a7f6a', fontSize:18 },
};

Object.assign(window, { LoginScreen, MiniCalendar, HistoryDrawer });
