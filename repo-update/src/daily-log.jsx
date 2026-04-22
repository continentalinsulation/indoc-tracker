// ────────────────────────────────────────────────────────────────────────────
// Daily Log — the main screen. Connected to Supabase via window.data-layer fns.
// ────────────────────────────────────────────────────────────────────────────

function DailyLog({ date, onChangeDate, onOpenHistory, onSignOut, userEmail }) {
  const dateStr = window.ymd(date);
  const [data, setData] = React.useState(null);
  const [expanded, setExpanded] = React.useState(null);
  const [calOpen, setCalOpen] = React.useState(false);
  const [newJobOpen, setNewJobOpen] = React.useState(false);
  const [newTodoFor, setNewTodoFor] = React.useState(false);
  const [newMeetOpen, setNewMeetOpen] = React.useState(false);
  const [addCrewOpen, setAddCrewOpen] = React.useState(false);
  const [weatherOpen, setWeatherOpen] = React.useState(false);

  // Reload on date change
  React.useEffect(() => {
    let cancelled = false;
    setData(null); setExpanded(null);
    window.loadDay(dateStr).then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [dateStr]);

  if (!data) return <div style={dlS.loading}>Loading {window.formatLong(date)}…</div>;

  const isTodayDate = window.isToday(date);
  const isPast = date < new Date(new Date().toDateString());
  const isFuture = date > new Date(new Date().toDateString());

  const crew = window.getCrew();
  const facilities = window.getFacilities();

  // ─── Mutations ───────────────────────────────────────────────────────────
  const toggleCrew = async (id) => {
    const on = !data.crewOn.includes(id);
    setData(d => ({...d, crewOn: on ? [...d.crewOn, id] : d.crewOn.filter(x => x !== id)}));
    await window.toggleCrewPresence(dateStr, id, on);
  };
  const cycleStatus = async (job) => {
    const order = ['active','hold','deferred','complete','planned','visit'];
    const next = order[(order.indexOf(job.status)+1) % order.length];
    setData(d => ({...d, jobs: d.jobs.map(j => j.id === job.id ? {...j, status: next} : j)}));
    await window.saveJobEntry(dateStr, job.id, { status: next });
  };
  const changePct = async (job, pct) => {
    const p = Math.max(0, Math.min(100, Math.round(pct)));
    setData(d => ({...d, jobs: d.jobs.map(j => j.id === job.id ? {...j, pct: p} : j)}));
    await window.saveJobEntry(dateStr, job.id, { pct: p });
  };
  const editNotes = async (job, notes) => {
    setData(d => ({...d, jobs: d.jobs.map(j => j.id === job.id ? {...j, notes} : j)}));
    await window.saveJobEntry(dateStr, job.id, { notes });
  };
  const saveHours = async (jobId, crewId, reg, ot) => {
    setData(d => ({...d, jobs: d.jobs.map(j => {
      if (j.id !== jobId) return j;
      const existing = (j.crew || []).find(c => c.id === crewId);
      let newCrew;
      if (reg === 0 && ot === 0) newCrew = (j.crew || []).filter(c => c.id !== crewId);
      else if (existing) newCrew = j.crew.map(c => c.id === crewId ? {...c, reg, ot} : c);
      else newCrew = [...(j.crew || []), { id: crewId, reg, ot }];
      return {...j, crew: newCrew};
    })}));
    await window.saveJobHours(dateStr, jobId, crewId, reg, ot);
  };
  const addPhotos = async (jobId, files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    for (const f of arr) {
      try {
        const photo = await window.uploadPhoto(dateStr, jobId, f);
        setData(d => ({...d, jobs: d.jobs.map(j =>
          j.id === jobId ? {...j, photos: [...(j.photos || []), photo]} : j
        )}));
      } catch (e) { alert('Photo upload failed: ' + e.message); }
    }
  };
  const onSign = async (v) => {
    setData(d => ({...d, signoff: v}));
    await window.saveSignoff(dateStr, v);
  };
  const submit = async () => {
    if (!data.signoff.trim()) { alert('Enter a name in "Completed by" before submitting.'); return; }
    setData(d => ({...d, submitted: true, submittedAt: new Date().toISOString()}));
    await window.submitDay(dateStr);
  };
  const toggleTodoH = async (id, cur) => {
    setData(d => ({...d, todos: d.todos.map(t => t.id === id ? {...t, done: !cur} : t)}));
    await window.toggleTodo(id, !cur);
  };
  const deleteTodoH = async (id) => {
    setData(d => ({...d, todos: d.todos.filter(t => t.id !== id)}));
    await window.deleteTodo(id);
  };
  const addTodoH = async (text, pri) => {
    const t = await window.addTodo(dateStr, text, pri);
    setData(d => ({...d, todos: [...d.todos, t]}));
  };
  const addMeetingH = async (m) => {
    const saved = await window.addMeeting(dateStr, m);
    setData(d => ({...d, meetings: [...d.meetings, saved]}));
  };
  const deleteMeetingH = async (id) => {
    setData(d => ({...d, meetings: d.meetings.filter(m => m.id !== id)}));
    await window.deleteMeeting(id);
  };
  const addJobH = async (job) => {
    const saved = await window.addJob(job);
    await window.saveJobEntry(dateStr, saved.id, { status: saved.status, pct: saved.pct });
    const fac = facilities.find(f => f.id === saved.facility_id);
    setData(d => ({...d, jobs: [...d.jobs, {
      id: saved.id, wo: saved.wo, jonas: saved.jonas, facility_id: saved.facility_id,
      facility: fac?.name || 'Other', name: saved.name, status: saved.status,
      pct: saved.pct, notes: saved.notes || '', crew: [], photos: [],
    }]}));
  };
  const addCrewH = async (c) => {
    const saved = await window.addCrew(c);
    // force re-render by touching state
    setData(d => ({...d}));
    return saved;
  };
  const saveWeather = async (w) => {
    setData(d => ({...d, weather: w}));
    await window.saveWeather(dateStr, w);
  };

  // ─── Computed ────────────────────────────────────────────────────────────
  const onRoster = crew.filter(c => data.crewOn.includes(c.id));
  const totalHrs = data.jobs.reduce((s, j) => s + window.hoursTotal(j), 0);
  const totalOT = data.jobs.reduce((s, j) => s + (j.crew || []).reduce((a, c) => a + (c.ot || 0), 0), 0);
  const byTrade = crew.reduce((acc, c) => {
    acc[c.trade] = acc[c.trade] || { total: 0, on: 0 };
    acc[c.trade].total++; if (data.crewOn.includes(c.id)) acc[c.trade].on++;
    return acc;
  }, {});

  return (
    <div style={dlS.root}>
      <header style={dlS.header}>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <div style={dlS.logo}>CI</div>
          <div>
            <div style={dlS.brand}>Continental Insulation · Operations</div>
            <div style={dlS.breadcrumb}>
              <button style={dlS.linkBtn} onClick={onOpenHistory}>Index</button>
              <span style={{color:'#C9BFA9'}}> › </span>Daily Log
            </div>
          </div>
        </div>

        <div style={dlS.dateNav}>
          <button style={dlS.navBtn} title="Previous day (←)" onClick={() => onChangeDate(window.addDays(date, -1))}>‹</button>
          <div style={{position:'relative'}}>
            <button style={{...dlS.date, border:'none', cursor:'pointer', fontFamily:'inherit'}} onClick={() => setCalOpen(o => !o)}>
              <span style={dlS.dow}>{window.DOW[date.getDay()]}</span>
              <span style={dlS.day}>{window.MON[date.getMonth()]} {date.getDate()}</span>
              <span style={dlS.year}>{date.getFullYear()}</span>
            </button>
            {calOpen && <window.MiniCalendar value={date} onPick={onChangeDate} onClose={() => setCalOpen(false)}/>}
          </div>
          <button style={dlS.navBtn} title="Next day (→)" onClick={() => onChangeDate(window.addDays(date, 1))}>›</button>
          <div style={{width:1, height:22, background:'#D8D0BE', margin:'0 4px'}}/>
          <button style={{...dlS.todayBtn, ...(isTodayDate ? {background:'#1A1A1A', color:'#FAF8F3'} : {})}}
            onClick={() => onChangeDate(new Date())} title="T">Today</button>
          <button style={dlS.todayBtn} onClick={onOpenHistory} title="⌘K"><span style={{marginRight:6}}>☰</span>Index</button>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={dlS.userBox}>
            <span style={dlS.userEmail}>{userEmail}</span>
            <button onClick={onSignOut} style={dlS.signOutBtn}>Sign out</button>
          </div>
          <button style={{...dlS.primaryBtn, ...(data.submitted ? {background:'#16a34a'} : {})}} onClick={submit}>
            {data.submitted ? '✓ Submitted' : 'Submit day'}
          </button>
        </div>
      </header>

      {(isPast || isFuture) && (
        <div style={{...dlS.contextBar, background: isFuture ? '#FEF8F0' : '#F0E9D7', borderColor: isFuture ? '#E85D2F' : '#8a7f6a'}}>
          <span style={{fontWeight:700, color: isFuture ? '#E85D2F' : '#6B6252'}}>
            {isFuture ? '◆ PLANNING' : '◆ AUDIT'}
          </span>
          <span>{window.formatLong(date)}</span>
          {isPast && data.submitted && <span style={{marginLeft:'auto', fontFamily:'"IBM Plex Mono", monospace'}}>Submitted {(data.submittedAt || '').slice(0, 16).replace('T', ' ')}</span>}
          {isFuture && <span style={{marginLeft:'auto'}}>Schedule crew and jobs ahead of time.</span>}
        </div>
      )}

      <button style={dlS.weatherBar} onClick={() => setWeatherOpen(true)}>
        <span style={dlS.weatherIcon}>❄</span>
        <span style={dlS.weatherTemp}>{data.weather.temp ?? '—'}°C</span>
        <span style={dlS.weatherFeel}>feels {data.weather.feelsLike ?? '—'}°C · {data.weather.cond || 'set weather'}</span>
        {data.weather.alert && <><span style={dlS.weatherSep}>│</span><span style={dlS.weatherAlert}>⚠ {data.weather.alert}</span></>}
        <span style={{marginLeft:'auto', fontSize:10, color:'#8a7f6a', textTransform:'uppercase', letterSpacing:1}}>click to edit</span>
      </button>

      <div style={dlS.body}>
        <aside style={dlS.leftRail}>
          <div style={dlS.railHeader}>
            <span>Crew on site</span>
            <span style={dlS.railCount}>{onRoster.length}<span style={dlS.railCountTotal}>/{crew.length}</span></span>
          </div>
          {['Mechanic','Apprentice','Asbestos','Labour','Ops'].map(trade => {
            const list = crew.filter(c => c.trade === trade);
            if (!list.length) return null;
            return (
              <div key={trade} style={dlS.tradeGroup}>
                <div style={dlS.tradeHead}>
                  <span>{trade === 'Asbestos' ? 'Asbestos Removers' : trade === 'Mechanic' ? 'Mechanics / Insulators' : trade}</span>
                  <span style={dlS.tradeCount}>{byTrade[trade].on}/{byTrade[trade].total}</span>
                </div>
                {list.map(c => {
                  const on = data.crewOn.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleCrew(c.id)}
                      style={{...dlS.crewRow, ...(on ? {} : dlS.crewRowOff)}}>
                      <span style={{...dlS.crewDot, background: on ? '#16a34a' : 'transparent', border: on ? 'none' : '1px solid #c9bfa9'}}/>
                      <span style={dlS.crewName}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          <button style={dlS.addRoster} onClick={() => setAddCrewOpen(true)}>+ Add crew member</button>
        </aside>

        <main style={dlS.center}>
          <div style={dlS.centerTopbar}>
            <div style={dlS.totals}>
              <Total label="Active jobs" value={data.jobs.filter(j => j.status === 'active').length}/>
              <Total label="Deferred" value={data.jobs.filter(j => j.status === 'deferred').length} warn/>
              <Total label="Total hrs" value={totalHrs.toFixed(1)}/>
              <Total label="OT hrs" value={totalOT.toFixed(1)} warn={totalOT > 0}/>
              <Total label="On site" value={onRoster.length}/>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button style={dlS.addBtn} onClick={() => setNewJobOpen(true)}>+ Add job</button>
            </div>
          </div>

          {facilities.map(fac => {
            const list = data.jobs.filter(j => j.facility_id === fac.id);
            return (
              <section key={fac.id} style={dlS.facility}>
                <header style={dlS.facHead}>
                  <span style={dlS.facBar}/>
                  <h3 style={dlS.facTitle}>{fac.name}</h3>
                  <span style={dlS.facMeta}>{list.length} jobs · {list.reduce((s,j) => s + window.hoursTotal(j), 0).toFixed(1)} hrs</span>
                </header>
                {list.length === 0 && <div style={dlS.emptyFac}>No jobs. <button style={dlS.linkBtn} onClick={() => setNewJobOpen(true)}>+ Add job</button></div>}
                {list.length > 0 && <>
                  <div style={dlS.tableHead}>
                    <div style={{width:40}}>Status</div>
                    <div style={{width:50}}>%</div>
                    <div style={{flex:1}}>Job</div>
                    <div style={{width:70}}>Jonas</div>
                    <div style={{width:130}}>W/O</div>
                    <div style={{flex:1.1}}>Crew</div>
                    <div style={{width:88, textAlign:'right'}}>Reg / OT</div>
                    <div style={{width:28}}/>
                  </div>
                  {list.map(job => (
                    <JobRow key={job.id} job={job}
                      crewLookup={crew}
                      expanded={expanded === job.id}
                      onToggle={() => setExpanded(expanded === job.id ? null : job.id)}
                      onCycleStatus={() => cycleStatus(job)}
                      onChangePct={pct => changePct(job, pct)}
                      onEditNotes={notes => editNotes(job, notes)}
                      onSaveHours={(crewId, reg, ot) => saveHours(job.id, crewId, reg, ot)}
                      onAddPhotos={files => addPhotos(job.id, files)}
                    />
                  ))}
                </>}
              </section>
            );
          })}
        </main>

        <aside style={dlS.rightRail}>
          <section style={dlS.panel}>
            <header style={dlS.panelHead}><span>To-Do Reminders</span><button style={dlS.miniAdd} onClick={() => setNewTodoFor(true)}>+</button></header>
            {data.todos.length === 0 && <div style={dlS.emptyPanel}>No reminders.</div>}
            {data.todos.map(t => (
              <div key={t.id} style={dlS.todoRow}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTodoH(t.id, t.done)} style={dlS.check}/>
                <span style={{...dlS.todoText, ...(t.done ? dlS.todoDone : {})}}>{t.text}</span>
                {t.pri === 'high' && <span style={dlS.priHigh}>HI</span>}
                <button onClick={() => deleteTodoH(t.id)} style={dlS.trashBtn}>✕</button>
              </div>
            ))}
          </section>

          <section style={dlS.panel}>
            <header style={dlS.panelHead}><span>Meetings & Site Visits</span><button style={dlS.miniAdd} onClick={() => setNewMeetOpen(true)}>+</button></header>
            {data.meetings.length === 0 && <div style={dlS.emptyPanel}>Nothing scheduled.</div>}
            {data.meetings.map(m => (
              <div key={m.id} style={dlS.meetRow}>
                <div style={dlS.meetTime}>{m.time || '—'}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={dlS.meetWhat}>{m.what}</div>
                  <div style={dlS.meetMeta}>{[m.where, m.who].filter(Boolean).join(' · ')}</div>
                </div>
                <button onClick={() => deleteMeetingH(m.id)} style={dlS.trashBtn}>✕</button>
              </div>
            ))}
          </section>

          <section style={dlS.panel}>
            <header style={dlS.panelHead}><span>Attendance</span></header>
            <div style={dlS.attGrid}>
              {Object.entries(byTrade).map(([k, v]) => (
                <div key={k} style={dlS.attCell}>
                  <div style={dlS.attNum}>{v.on}<span style={dlS.attSlash}>/{v.total}</span></div>
                  <div style={dlS.attLabel}>{k}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={dlS.panel}>
            <header style={dlS.panelHead}><span>Sign-off</span></header>
            <div style={{padding:'10px 12px'}}>
              <input value={data.signoff} onChange={e => onSign(e.target.value)} placeholder="Name"
                style={{width:'100%', padding:'6px 8px', border:'1px solid #D8D0BE', fontFamily:'inherit', fontSize:12, outline:'none'}}/>
              <div style={{fontSize:10, color:'#8a7f6a', marginTop:6, fontFamily:'"IBM Plex Mono", monospace'}}>
                {data.submitted ? `Submitted ${(data.submittedAt || '').slice(0, 16).replace('T', ' ')}` : 'Draft — not submitted'}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {newJobOpen && <AddJobModal onClose={() => setNewJobOpen(false)} onAdd={addJobH} facilities={facilities}/>}
      {newTodoFor && <AddTodoModal onClose={() => setNewTodoFor(false)} onAdd={addTodoH}/>}
      {newMeetOpen && <AddMeetingModal onClose={() => setNewMeetOpen(false)} onAdd={addMeetingH}/>}
      {addCrewOpen && <AddCrewModal onClose={() => setAddCrewOpen(false)} onAdd={addCrewH}/>}
      {weatherOpen && <WeatherModal initial={data.weather} onClose={() => setWeatherOpen(false)} onSave={saveWeather}/>}
    </div>
  );
}

Object.assign(window, { DailyLog });
