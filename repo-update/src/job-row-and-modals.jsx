// ────────────────────────────────────────────────────────────────────────────
// JobRow + modals + style object shared across the Daily Log UI.
// ────────────────────────────────────────────────────────────────────────────

function Total({ label, value, warn }) {
  return (
    <div style={dlS.totalCell}>
      <div style={{...dlS.totalValue, ...(warn && +value > 0 ? {color:'#d97706'} : {})}}>{value}</div>
      <div style={dlS.totalLabel}>{label}</div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight:6, verticalAlign:'-2px'}}>
      <rect x="2" y="3.5" width="12" height="11" rx="0.5"/>
      <path d="M2 6.5h12"/>
      <path d="M5.5 2v3M10.5 2v3"/>
    </svg>
  );
}

function JobRow({ job, crewLookup, expanded, onToggle, onCycleStatus, onChangePct, onEditNotes, onSaveHours, onAddPhotos }) {
  const S = window.STATUS[job.status];
  const total = window.hoursTotal(job);
  const [noteEdit, setNoteEdit] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState(job.notes || '');
  const [addCrewOpen, setAddCrewOpen] = React.useState(false);
  const [pctEdit, setPctEdit] = React.useState(false);
  const [pctDraft, setPctDraft] = React.useState(String(job.pct));
  React.useEffect(() => { setNoteDraft(job.notes || ''); }, [job.notes]);
  React.useEffect(() => { setPctDraft(String(job.pct)); }, [job.pct]);

  const saveNote = () => { onEditNotes(noteDraft); setNoteEdit(false); };
  const savePct = () => {
    const n = parseInt(pctDraft, 10);
    if (!isNaN(n)) onChangePct(n);
    setPctEdit(false);
  };

  return (
    <div style={{...dlS.jobRowWrap, borderLeftColor: S.bar}}>
      <div style={dlS.jobRow}>
        <button onClick={onCycleStatus}
          title={`${S.label} — click to cycle`}
          style={{...dlS.statusPill, background: S.bar+'22', color: S.bar, borderColor: S.bar+'55'}}>
          {S.label.slice(0, 3).toUpperCase()}
        </button>
        <div style={{width:50}} onClick={e => { e.stopPropagation(); setPctEdit(true); }}>
          {pctEdit ? (
            <input type="number" value={pctDraft} autoFocus
              onChange={e => setPctDraft(e.target.value)}
              onBlur={savePct} onKeyDown={e => { if (e.key === 'Enter') savePct(); if (e.key === 'Escape') { setPctDraft(String(job.pct)); setPctEdit(false); } }}
              style={{...dlS.pctBar, width:'100%', border:'1px solid #E85D2F', padding:'0 4px', fontSize:10, fontFamily:'"IBM Plex Mono", monospace', textAlign:'center'}}
              min="0" max="100"/>
          ) : (
            <div style={dlS.pctBar} title="Click to edit">
              <div style={{...dlS.pctFill, width: job.pct + '%', background: S.bar}}/>
              <span style={dlS.pctText}>{job.pct}%</span>
            </div>
          )}
        </div>
        <div style={{flex:1, minWidth:0, cursor:'pointer'}} onClick={onToggle}>
          <div style={dlS.jobName}>{job.name}</div>
          {job.notes && !noteEdit && <div style={dlS.jobNote}>{job.notes}</div>}
        </div>
        <div style={{width:70}}><span style={dlS.mono}>{job.jonas || '—'}</span></div>
        <div style={{width:130}}><span style={dlS.mono}>{job.wo || '—'}</span></div>
        <div style={{flex:1.1, minWidth:0, cursor:'pointer'}} onClick={onToggle}>
          <div style={dlS.crewChips}>
            {(job.crew || []).slice(0, 5).map(c => (
              <span key={c.id} style={dlS.chip} title={window.crewName(c.id)}>{window.crewName(c.id).split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            ))}
            {(job.crew || []).length > 5 && <span style={dlS.chipMore}>+{job.crew.length - 5}</span>}
            {(job.crew || []).length === 0 && <span style={{fontSize:11, color:'#C9BFA9'}}>no crew</span>}
          </div>
        </div>
        <div style={{width:88, textAlign:'right', cursor:'pointer'}} onClick={onToggle}>
          <span style={dlS.hoursNum}>{total.toFixed(1)}</span>
          <span style={dlS.hoursUnit}>h</span>
        </div>
        <button onClick={onToggle} style={{width:28, textAlign:'center', color:'#8a7f6a', background:'none', border:'none', cursor:'pointer', fontSize:13}}>{expanded ? '▾' : '▸'}</button>
      </div>
      {expanded && (
        <div style={dlS.jobExpand}>
          <div style={dlS.crewTable}>
            <div style={dlS.crewTHead}>
              <div style={{flex:1}}>Crew member</div>
              <div style={{width:70}}>Reg</div>
              <div style={{width:70}}>OT</div>
              <div style={{width:60}}>Total</div>
              <div style={{width:30}}/>
            </div>
            {(job.crew || []).map(c => (
              <HoursRow key={c.id} jobCrew={c} onSave={(reg, ot) => onSaveHours(c.id, reg, ot)}/>
            ))}
            {(job.crew || []).length === 0 && <div style={{padding:'12px', color:'#8a7f6a', fontSize:12}}>No crew assigned yet.</div>}
          </div>
          <div style={dlS.expandActions}>
            <button style={dlS.ghostBtn} onClick={() => setAddCrewOpen(true)}>+ Assign crew</button>
            <label style={{...dlS.ghostBtn, display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer'}}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 5h2.5l1-1.5h5l1 1.5H14v8H2z"/>
                <circle cx="8" cy="9" r="2.5"/>
              </svg>
              Add photo
              <input type="file" accept="image/*" capture="environment" multiple
                onChange={e => onAddPhotos(e.target.files)}
                style={{display:'none'}}/>
            </label>
            <button style={dlS.ghostBtn} onClick={() => setNoteEdit(v => !v)}>{noteEdit ? 'Cancel' : 'Edit notes'}</button>
          </div>
          {noteEdit && (
            <div style={{marginTop:10}}>
              <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                placeholder="Notes for this job today…"
                style={{width:'100%', padding:'8px', border:'1px solid #D8D0BE', fontFamily:'inherit', fontSize:12, minHeight:60, outline:'none', resize:'vertical'}}/>
              <button style={{...dlS.ghostBtn, marginTop:6, background:'#1A1A1A', color:'#FAF8F3', border:'none'}} onClick={saveNote}>Save notes</button>
            </div>
          )}
          {!noteEdit && job.notes && <div style={dlS.noteBox}>{job.notes}</div>}
          {(job.photos || []).length > 0 && (
            <div style={dlS.photoStrip}>
              {job.photos.map((p, i) => (
                <a key={p.id || i} href={p.url} target="_blank" rel="noopener" style={{textDecoration:'none', color:'inherit'}}>
                  <div style={dlS.photoTile}>
                    <img src={p.url} alt={p.caption || 'photo'} style={dlS.photoImg}/>
                    <div style={dlS.photoCaption}>{p.caption || `Photo ${i + 1}`}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
          {addCrewOpen && (
            <AssignCrewPicker
              excluded={(job.crew || []).map(c => c.id)}
              onClose={() => setAddCrewOpen(false)}
              onPick={async (crewId) => { await onSaveHours(crewId, 8, 0); setAddCrewOpen(false); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function HoursRow({ jobCrew, onSave }) {
  const [reg, setReg] = React.useState(String(jobCrew.reg));
  const [ot, setOt] = React.useState(String(jobCrew.ot));
  React.useEffect(() => { setReg(String(jobCrew.reg)); setOt(String(jobCrew.ot)); }, [jobCrew.reg, jobCrew.ot]);

  const commit = () => {
    const r = parseFloat(reg) || 0;
    const o = parseFloat(ot) || 0;
    if (r !== jobCrew.reg || o !== jobCrew.ot) onSave(r, o);
  };

  return (
    <div style={dlS.crewTRow}>
      <div style={{flex:1}}>{window.crewName(jobCrew.id)}</div>
      <div style={{width:70}}>
        <input type="number" step="0.5" value={reg} onChange={e => setReg(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={dlS.hoursInput}/>
      </div>
      <div style={{width:70}}>
        <input type="number" step="0.5" value={ot} onChange={e => setOt(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={dlS.hoursInput}/>
      </div>
      <div style={{width:60, ...dlS.mono}}>{((parseFloat(reg) || 0) + (parseFloat(ot) || 0)).toFixed(1)}</div>
      <button style={dlS.trashBtn} onClick={() => onSave(0, 0)} title="Remove from job">✕</button>
    </div>
  );
}

function AssignCrewPicker({ excluded, onClose, onPick }) {
  const [q, setQ] = React.useState('');
  const all = window.getCrew().filter(c => !excluded.includes(c.id));
  const filt = q ? all.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : all;
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <div style={{...modalS.box, maxWidth:380}} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>Assign crew member</div>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
          style={{...modalS.input, margin:'12px 16px'}}/>
        <div style={{maxHeight:340, overflow:'auto', padding:'0 8px 12px'}}>
          {filt.map(c => (
            <button key={c.id} onClick={() => onPick(c.id)} style={modalS.pickRow}>
              <span>{c.name}</span>
              <span style={{fontSize:10, color:'#8a7f6a', textTransform:'uppercase', letterSpacing:1, fontWeight:700}}>{c.trade}</span>
            </button>
          ))}
          {filt.length === 0 && <div style={{padding:'20px', textAlign:'center', color:'#8a7f6a', fontSize:12}}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────────────────────
function AddJobModal({ onClose, onAdd, facilities }) {
  const [form, setForm] = React.useState({ name:'', wo:'', jonas:'', facility_id: facilities[0]?.id, status:'active', pct:0, notes:'' });
  const [busy, setBusy] = React.useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try { await onAdd(form); onClose(); } catch (ex) { alert(ex.message); setBusy(false); }
  };
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <form onSubmit={submit} style={modalS.box} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>New job</div>
        <div style={modalS.body}>
          <Label>Job name *</Label>
          <input autoFocus value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required style={modalS.input}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <div>
              <Label>Jonas #</Label>
              <input value={form.jonas} onChange={e => setForm(f => ({...f, jonas:e.target.value}))} style={modalS.input}/>
            </div>
            <div>
              <Label>Work order</Label>
              <input value={form.wo} onChange={e => setForm(f => ({...f, wo:e.target.value}))} style={modalS.input}/>
            </div>
          </div>
          <Label>Facility</Label>
          <select value={form.facility_id} onChange={e => setForm(f => ({...f, facility_id:e.target.value}))} style={modalS.input}>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <div>
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))} style={modalS.input}>
                {Object.entries(window.STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>% complete</Label>
              <input type="number" min="0" max="100" value={form.pct} onChange={e => setForm(f => ({...f, pct: parseInt(e.target.value,10)||0}))} style={modalS.input}/>
            </div>
          </div>
          <Label>Notes</Label>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} style={{...modalS.input, minHeight:50, resize:'vertical'}}/>
        </div>
        <div style={modalS.foot}>
          <button type="button" onClick={onClose} style={modalS.cancel}>Cancel</button>
          <button type="submit" disabled={busy} style={modalS.save}>{busy ? 'Saving…' : 'Create job'}</button>
        </div>
      </form>
    </div>
  );
}

function AddTodoModal({ onClose, onAdd }) {
  const [text, setText] = React.useState('');
  const [pri, setPri] = React.useState('med');
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onAdd(text.trim(), pri);
    onClose();
  };
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <form onSubmit={submit} style={{...modalS.box, width:400}} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>New reminder</div>
        <div style={modalS.body}>
          <Label>What</Label>
          <input autoFocus value={text} onChange={e => setText(e.target.value)} required style={modalS.input}/>
          <Label>Priority</Label>
          <div style={{display:'flex', gap:6}}>
            {['high','med','low'].map(p => (
              <button type="button" key={p} onClick={() => setPri(p)}
                style={{...modalS.priBtn, ...(pri===p ? modalS.priBtnOn : {})}}>{p.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div style={modalS.foot}>
          <button type="button" onClick={onClose} style={modalS.cancel}>Cancel</button>
          <button type="submit" style={modalS.save}>Add</button>
        </div>
      </form>
    </div>
  );
}

function AddMeetingModal({ onClose, onAdd }) {
  const [f, setF] = React.useState({ time:'', what:'', where:'', who:'' });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.what.trim()) return;
    await onAdd(f); onClose();
  };
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <form onSubmit={submit} style={{...modalS.box, width:420}} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>New meeting / site visit</div>
        <div style={modalS.body}>
          <div style={{display:'grid', gridTemplateColumns:'100px 1fr', gap:10}}>
            <div><Label>Time</Label><input value={f.time} onChange={e => setF({...f, time:e.target.value})} placeholder="09:00" style={modalS.input}/></div>
            <div><Label>What *</Label><input autoFocus required value={f.what} onChange={e => setF({...f, what:e.target.value})} style={modalS.input}/></div>
          </div>
          <Label>Where</Label>
          <input value={f.where} onChange={e => setF({...f, where:e.target.value})} style={modalS.input}/>
          <Label>Who</Label>
          <input value={f.who} onChange={e => setF({...f, who:e.target.value})} style={modalS.input}/>
        </div>
        <div style={modalS.foot}>
          <button type="button" onClick={onClose} style={modalS.cancel}>Cancel</button>
          <button type="submit" style={modalS.save}>Add</button>
        </div>
      </form>
    </div>
  );
}

function AddCrewModal({ onClose, onAdd }) {
  const [name, setName] = React.useState('');
  const [trade, setTrade] = React.useState('Mechanic');
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), trade });
    onClose();
  };
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <form onSubmit={submit} style={{...modalS.box, width:400}} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>New crew member</div>
        <div style={modalS.body}>
          <Label>Name</Label>
          <input autoFocus required value={name} onChange={e => setName(e.target.value)} style={modalS.input}/>
          <Label>Trade</Label>
          <select value={trade} onChange={e => setTrade(e.target.value)} style={modalS.input}>
            <option value="Mechanic">Mechanic / Insulator</option>
            <option value="Apprentice">Apprentice</option>
            <option value="Asbestos">Asbestos Remover</option>
            <option value="Labour">Labour</option>
            <option value="Ops">Ops</option>
          </select>
        </div>
        <div style={modalS.foot}>
          <button type="button" onClick={onClose} style={modalS.cancel}>Cancel</button>
          <button type="submit" style={modalS.save}>Add</button>
        </div>
      </form>
    </div>
  );
}

function WeatherModal({ initial, onClose, onSave }) {
  const [w, setW] = React.useState({
    temp: initial.temp ?? '', feelsLike: initial.feelsLike ?? '',
    cond: initial.cond || '', alert: initial.alert || '',
  });
  const submit = async (e) => {
    e.preventDefault();
    await onSave({
      temp: w.temp === '' ? null : parseInt(w.temp, 10),
      feelsLike: w.feelsLike === '' ? null : parseInt(w.feelsLike, 10),
      cond: w.cond, alert: w.alert,
    });
    onClose();
  };
  return (
    <div style={modalS.overlay} onClick={onClose}>
      <form onSubmit={submit} style={{...modalS.box, width:420}} onClick={e => e.stopPropagation()}>
        <div style={modalS.head}>Weather</div>
        <div style={modalS.body}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <div><Label>Temp (°C)</Label><input type="number" value={w.temp} onChange={e => setW({...w, temp:e.target.value})} style={modalS.input}/></div>
            <div><Label>Feels like (°C)</Label><input type="number" value={w.feelsLike} onChange={e => setW({...w, feelsLike:e.target.value})} style={modalS.input}/></div>
          </div>
          <Label>Conditions</Label>
          <input value={w.cond} onChange={e => setW({...w, cond:e.target.value})} placeholder="Cloudy, snow flurries" style={modalS.input}/>
          <Label>Alert / warning</Label>
          <input value={w.alert} onChange={e => setW({...w, alert:e.target.value})} placeholder="Ice on stairs" style={modalS.input}/>
        </div>
        <div style={modalS.foot}>
          <button type="button" onClick={onClose} style={modalS.cancel}>Cancel</button>
          <button type="submit" style={modalS.save}>Save weather</button>
        </div>
      </form>
    </div>
  );
}

function Label({ children }) {
  return <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:1.2, color:'#6B6252', fontWeight:700, marginBottom:5, marginTop:10}}>{children}</div>;
}

const modalS = {
  overlay: { position:'fixed', inset:0, background:'rgba(26,26,26,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' },
  box: { width:460, maxWidth:'90vw', background:'#FAF8F3', border:'1px solid #D8D0BE', display:'flex', flexDirection:'column', maxHeight:'90vh', fontFamily:'"IBM Plex Sans", system-ui, sans-serif' },
  head: { padding:'14px 18px', borderBottom:'1px solid #D8D0BE', fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:1, background:'#fff' },
  body: { padding:'12px 18px 16px', overflow:'auto' },
  foot: { padding:'12px 18px', borderTop:'1px solid #D8D0BE', display:'flex', justifyContent:'flex-end', gap:8, background:'#fff' },
  input: { width:'100%', padding:'8px 10px', border:'1px solid #D8D0BE', background:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  cancel: { padding:'8px 14px', background:'#fff', border:'1px solid #D8D0BE', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600 },
  save: { padding:'8px 14px', background:'#1A1A1A', color:'#FAF8F3', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' },
  priBtn: { padding:'6px 14px', border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:0.5 },
  priBtnOn: { background:'#1A1A1A', color:'#FAF8F3', borderColor:'#1A1A1A' },
  pickRow: { width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, textAlign:'left' },
};

// ─── Main-app shared styles ────────────────────────────────────────────────
const dlS = {
  loading: { position:'fixed', inset:0, background:'#F4F1EB', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"IBM Plex Sans", system-ui, sans-serif', fontSize:13, color:'#6B6252' },
  root: { width:'100%', height:'100vh', background:'#F4F1EB', color:'#1A1A1A', fontFamily:'"IBM Plex Sans", -apple-system, system-ui, sans-serif', display:'flex', flexDirection:'column', fontSize:13, overflow:'hidden' },
  header: { display:'flex', alignItems:'center', gap:24, padding:'14px 20px', borderBottom:'1px solid #D8D0BE', background:'#FAF8F3', position:'relative', zIndex:10 },
  logo: { width:38, height:38, background:'#1A1A1A', color:'#E85D2F', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, letterSpacing:1 },
  brand: { fontSize:13, fontWeight:600, letterSpacing:0.2 },
  breadcrumb: { fontSize:11, color:'#6B6252', textTransform:'uppercase', letterSpacing:1.2 },
  linkBtn: { background:'none', border:'none', color:'#E85D2F', fontSize:11, padding:0, cursor:'pointer', textTransform:'uppercase', letterSpacing:1.2, fontWeight:700, fontFamily:'inherit' },
  dateNav: { display:'flex', alignItems:'center', gap:8, marginLeft:'auto', marginRight:'auto' },
  navBtn: { width:28, height:28, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontSize:14, color:'#6B6252' },
  date: { display:'flex', alignItems:'baseline', gap:6, padding:'4px 14px', background:'#1A1A1A', color:'#FAF8F3' },
  dow: { fontSize:10, letterSpacing:2, fontWeight:700, color:'#E85D2F' },
  day: { fontSize:17, fontWeight:700, letterSpacing:-0.3, fontFamily:'"IBM Plex Mono", monospace' },
  year: { fontSize:11, color:'#8a7f6a', fontFamily:'"IBM Plex Mono", monospace' },
  todayBtn: { padding:'5px 12px', fontSize:11, letterSpacing:0.5, textTransform:'uppercase', border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' },
  userBox: { display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 },
  userEmail: { fontSize:11, color:'#6B6252', fontFamily:'"IBM Plex Mono", monospace' },
  signOutBtn: { background:'none', border:'none', color:'#E85D2F', fontSize:10, padding:0, cursor:'pointer', textTransform:'uppercase', letterSpacing:1.2, fontWeight:700, fontFamily:'inherit' },
  primaryBtn: { padding:'8px 14px', background:'#1A1A1A', color:'#FAF8F3', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:0.3, textTransform:'uppercase', fontFamily:'inherit' },

  contextBar: { display:'flex', alignItems:'center', gap:14, padding:'8px 20px', fontSize:12, borderBottom:'2px solid', fontFamily:'"IBM Plex Mono", monospace' },

  weatherBar: { display:'flex', alignItems:'center', gap:12, padding:'8px 20px', background:'#1A1A1A', color:'#FAF8F3', fontSize:12, fontFamily:'"IBM Plex Mono", monospace', border:'none', width:'100%', cursor:'pointer', textAlign:'left' },
  weatherIcon: { color:'#79C0FF', fontSize:14 },
  weatherTemp: { fontWeight:700, fontSize:14 },
  weatherFeel: { color:'#8a7f6a' },
  weatherSep: { color:'#3a3a3a' },
  weatherAlert: { color:'#E85D2F', fontWeight:600 },

  body: { display:'grid', gridTemplateColumns:'240px 1fr 300px', flex:1, minHeight:0 },
  leftRail: { borderRight:'1px solid #D8D0BE', padding:'16px 14px', overflow:'auto', background:'#FAF8F3' },
  railHeader: { display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize:11, textTransform:'uppercase', letterSpacing:1.2, color:'#6B6252', marginBottom:12, fontWeight:700 },
  railCount: { fontFamily:'"IBM Plex Mono", monospace', fontSize:18, color:'#1A1A1A', fontWeight:700 },
  railCountTotal: { color:'#8a7f6a', fontSize:12, fontWeight:400 },
  tradeGroup: { marginBottom:18 },
  tradeHead: { display:'flex', justifyContent:'space-between', fontSize:10, textTransform:'uppercase', letterSpacing:1.1, color:'#8a7f6a', marginBottom:6, paddingBottom:4, borderBottom:'1px solid #E8DFCB', fontWeight:700 },
  tradeCount: { fontFamily:'"IBM Plex Mono", monospace' },
  crewRow: { display:'flex', alignItems:'center', gap:8, width:'100%', padding:'4px 6px', border:'none', background:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'inherit' },
  crewRowOff: { opacity:0.45 },
  crewDot: { width:8, height:8, borderRadius:4, flexShrink:0 },
  crewName: { fontSize:12 },
  addRoster: { width:'100%', padding:'6px', border:'1px dashed #C9BFA9', background:'transparent', cursor:'pointer', fontSize:11, color:'#6B6252', fontFamily:'inherit', marginTop:10 },

  center: { overflow:'auto', padding:'12px 18px' },
  centerTopbar: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:'1px solid #D8D0BE' },
  totals: { display:'flex', gap:22 },
  totalCell: { lineHeight:1.1 },
  totalValue: { fontSize:22, fontWeight:700, fontFamily:'"IBM Plex Mono", monospace' },
  totalLabel: { fontSize:10, textTransform:'uppercase', letterSpacing:1.2, color:'#6B6252', fontWeight:700 },
  ghostBtn: { padding:'6px 12px', fontSize:12, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer', fontFamily:'inherit' },
  addBtn: { padding:'6px 12px', fontSize:12, background:'#E85D2F', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontFamily:'inherit' },

  facility: { marginBottom:20, background:'#fff', border:'1px solid #E8DFCB' },
  facHead: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #E8DFCB', background:'#FAF8F3' },
  facBar: { width:3, height:14, background:'#E85D2F' },
  facTitle: { fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:1, margin:0 },
  facMeta: { marginLeft:'auto', fontSize:11, color:'#6B6252', fontFamily:'"IBM Plex Mono", monospace' },
  emptyFac: { padding:'14px', textAlign:'center', color:'#8a7f6a', fontSize:12 },
  tableHead: { display:'flex', gap:10, padding:'8px 14px', borderBottom:'1px solid #E8DFCB', fontSize:10, textTransform:'uppercase', letterSpacing:1.1, color:'#8a7f6a', fontWeight:700, background:'#FAF8F3' },

  jobRowWrap: { borderLeft:'3px solid', borderBottom:'1px solid #F0E9D7' },
  photoStrip: { display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid #E8DFCB', flexWrap:'wrap' },
  photoTile: { width:120, background:'#fff', border:'1px solid #E8DFCB' },
  photoImg: { width:'100%', height:90, objectFit:'cover', display:'block' },
  photoCaption: { fontSize:10, color:'#6B6252', padding:'4px 6px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:'"IBM Plex Mono", monospace' },
  jobRow: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px' },
  statusPill: { width:40, padding:'2px 0', fontSize:9, fontWeight:700, letterSpacing:0.5, border:'1px solid', cursor:'pointer', fontFamily:'"IBM Plex Mono", monospace', textAlign:'center' },
  pctBar: { position:'relative', height:16, background:'#F0E9D7', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  pctFill: { position:'absolute', left:0, top:0, height:'100%', opacity:0.35 },
  pctText: { position:'relative', fontSize:10, fontWeight:700, fontFamily:'"IBM Plex Mono", monospace' },
  jobName: { fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  jobNote: { fontSize:11, color:'#6B6252', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 },
  mono: { fontFamily:'"IBM Plex Mono", monospace', fontSize:11, color:'#1A1A1A' },
  crewChips: { display:'flex', gap:3, flexWrap:'wrap' },
  chip: { width:22, height:22, borderRadius:11, background:'#1A1A1A', color:'#FAF8F3', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"IBM Plex Mono", monospace' },
  chipMore: { height:22, padding:'0 6px', borderRadius:11, background:'#E8DFCB', color:'#6B6252', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', fontFamily:'"IBM Plex Mono", monospace' },
  hoursNum: { fontSize:15, fontWeight:700, fontFamily:'"IBM Plex Mono", monospace' },
  hoursUnit: { fontSize:10, color:'#8a7f6a', marginLeft:2 },
  hoursInput: { width:'100%', padding:'2px 6px', border:'1px solid #D8D0BE', fontFamily:'"IBM Plex Mono", monospace', fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },

  jobExpand: { padding:'12px 14px 14px 24px', background:'#FAF8F3', borderTop:'1px solid #E8DFCB' },
  crewTable: { fontSize:12, background:'#fff', border:'1px solid #E8DFCB' },
  crewTHead: { display:'flex', gap:10, padding:'6px 10px', background:'#F0E9D7', fontSize:10, textTransform:'uppercase', letterSpacing:1, color:'#6B6252', fontWeight:700 },
  crewTRow: { display:'flex', gap:10, padding:'6px 10px', borderTop:'1px solid #F0E9D7', alignItems:'center' },
  expandActions: { display:'flex', gap:8, marginTop:10, alignItems:'center', flexWrap:'wrap' },
  noteBox: { marginTop:8, padding:'8px 10px', background:'#FEF8F0', border:'1px solid #E8DFCB', fontSize:12, color:'#6B6252', fontStyle:'italic' },
  trashBtn: { width:24, height:24, border:'none', background:'transparent', cursor:'pointer', color:'#8a7f6a', fontSize:12, fontFamily:'inherit' },

  rightRail: { borderLeft:'1px solid #D8D0BE', padding:'14px', overflow:'auto', background:'#FAF8F3' },
  panel: { marginBottom:16, background:'#fff', border:'1px solid #E8DFCB' },
  panelHead: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderBottom:'1px solid #E8DFCB', fontSize:10, textTransform:'uppercase', letterSpacing:1.2, color:'#1A1A1A', fontWeight:700, background:'#FAF8F3' },
  emptyPanel: { padding:'12px', color:'#8a7f6a', fontSize:12, textAlign:'center' },
  miniAdd: { width:20, height:20, border:'1px solid #D8D0BE', background:'#fff', cursor:'pointer' },
  todoRow: { display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderBottom:'1px solid #F0E9D7' },
  check: { marginTop:2 },
  todoText: { flex:1, fontSize:12, lineHeight:1.4 },
  todoDone: { textDecoration:'line-through', color:'#8a7f6a' },
  priHigh: { fontSize:9, fontWeight:700, color:'#E85D2F', border:'1px solid #E85D2F', padding:'1px 4px', fontFamily:'"IBM Plex Mono", monospace' },
  meetRow: { display:'flex', gap:10, padding:'8px 10px', borderBottom:'1px solid #F0E9D7', alignItems:'flex-start' },
  meetTime: { fontFamily:'"IBM Plex Mono", monospace', fontSize:12, fontWeight:700, color:'#E85D2F', minWidth:48 },
  meetWhat: { fontSize:12, fontWeight:600 },
  meetMeta: { fontSize:11, color:'#6B6252', marginTop:2 },
  attGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#E8DFCB' },
  attCell: { padding:'10px', background:'#fff' },
  attNum: { fontSize:18, fontWeight:700, fontFamily:'"IBM Plex Mono", monospace' },
  attSlash: { fontSize:11, color:'#8a7f6a', fontWeight:400 },
  attLabel: { fontSize:10, textTransform:'uppercase', letterSpacing:1, color:'#6B6252', fontWeight:700 },
};

Object.assign(window, { JobRow, HoursRow, AssignCrewPicker, AddJobModal, AddTodoModal, AddMeetingModal, AddCrewModal, WeatherModal, Total, CalendarIcon, dlS });
