// ────────────────────────────────────────────────────────────────────────────
// Supabase client + data layer for the Operations Daily Log.
// All DB reads/writes live here. UI components only call these functions.
// ────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://shncudhuqspawrvbdrza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobmN1ZGh1cXNwYXdydmJkcnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDQzMDYsImV4cCI6MjA4MzMyMDMwNn0.G5vZeUcse5pHqZy4vUHSsmc0wfeh9KUWMQF87rAynTo';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

// ─── Auth ───────────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
async function signOut() { await sb.auth.signOut(); }
async function getSession() { const { data } = await sb.auth.getSession(); return data.session; }
function onAuthChange(cb) { return sb.auth.onAuthStateChange((_e, session) => cb(session)); }

// ─── Static lookups (cached at login) ──────────────────────────────────────
let _crew = [];
let _facilities = [];
let _jobs = [];

async function loadLookups() {
  const [crew, fac, jobs] = await Promise.all([
    sb.from('ops_crew').select('*').eq('active', true).order('name'),
    sb.from('ops_facilities').select('*').order('sort_order'),
    sb.from('ops_jobs').select('*').order('created_at', { ascending: false }),
  ]);
  if (crew.error) throw crew.error;
  if (fac.error) throw fac.error;
  if (jobs.error) throw jobs.error;
  _crew = crew.data;
  _facilities = fac.data;
  _jobs = jobs.data;
  return { crew: _crew, facilities: _facilities, jobs: _jobs };
}

function getCrew() { return _crew; }
function getFacilities() { return _facilities; }
function getJobsCatalog() { return _jobs; }
function crewName(id) { return (_crew.find(c => c.id === id) || {}).name || id; }

// ─── Per-day load ──────────────────────────────────────────────────────────
// Shape returned matches what the UI expects:
//   { signoff, submitted, submitted_at, weather:{...}, crewOn:[ids],
//     jobs:[{id, wo, jonas, facility, name, status, pct, notes, crew:[{id,reg,ot}], photos:[{url,name}]}],
//     todos:[{id,text,done,pri}], meetings:[{id,time,what,where,who}] }

async function loadDay(dateStr) {
  const [logRes, presRes, entRes, jcRes, todosRes, meetRes, photosRes] = await Promise.all([
    sb.from('ops_daily_logs').select('*').eq('date', dateStr).maybeSingle(),
    sb.from('ops_daily_crew_presence').select('*').eq('date', dateStr),
    sb.from('ops_daily_job_entries').select('*').eq('date', dateStr),
    sb.from('ops_daily_job_crew').select('*').eq('date', dateStr),
    sb.from('ops_todos').select('*').eq('date', dateStr).order('created_at'),
    sb.from('ops_meetings').select('*').eq('date', dateStr).order('time'),
    sb.from('ops_photos').select('*').eq('date', dateStr).order('uploaded_at'),
  ]);

  const log = logRes.data;
  const facMap = Object.fromEntries(_facilities.map(f => [f.id, f.name]));

  // Only show jobs that have a per-day entry OR are active/hold in the catalog
  const activeCatalogJobs = _jobs.filter(j => ['active','hold'].includes(j.status));
  const entryJobIds = new Set((entRes.data || []).map(e => e.job_id));
  const jobsToShow = [
    ..._jobs.filter(j => entryJobIds.has(j.id)),
    ...activeCatalogJobs.filter(j => !entryJobIds.has(j.id)),
  ];

  // Generate signed URLs for photos in parallel
  const photoUrls = await Promise.all((photosRes.data || []).map(async p => {
    const { data } = await sb.storage.from('ops-photos').createSignedUrl(p.storage_path, 3600);
    return { ...p, url: data?.signedUrl };
  }));

  const jobs = jobsToShow.map(j => {
    const entry = (entRes.data || []).find(e => e.job_id === j.id);
    const crew = (jcRes.data || []).filter(jc => jc.job_id === j.id).map(jc => ({
      id: jc.crew_id, reg: Number(jc.reg_hours), ot: Number(jc.ot_hours),
    }));
    const photos = photoUrls.filter(p => p.job_id === j.id);
    return {
      id: j.id,
      wo: j.wo,
      jonas: j.jonas,
      facility: facMap[j.facility_id] || 'Other',
      facility_id: j.facility_id,
      name: j.name,
      status: entry?.status ?? j.status,
      pct: entry?.pct ?? j.pct,
      notes: entry?.notes ?? j.notes ?? '',
      crew,
      photos,
    };
  });

  return {
    signoff: log?.signoff || '',
    submitted: !!log?.submitted,
    submittedAt: log?.submitted_at || null,
    weather: {
      temp: log?.weather_temp ?? null,
      feelsLike: log?.weather_feels ?? null,
      cond: log?.weather_cond || '',
      alert: log?.weather_alert || '',
    },
    crewOn: (presRes.data || []).filter(p => p.on_site).map(p => p.crew_id),
    jobs,
    todos: (todosRes.data || []).map(t => ({ id: t.id, text: t.text, done: t.done, pri: t.priority })),
    meetings: (meetRes.data || []).map(m => ({ id: m.id, time: m.time, what: m.what, where: m.where, who: m.who })),
  };
}

// ─── Writes ────────────────────────────────────────────────────────────────
async function ensureDailyLog(dateStr) {
  await sb.from('ops_daily_logs').upsert({ date: dateStr }, { onConflict: 'date' });
}
async function saveSignoff(dateStr, signoff) {
  await ensureDailyLog(dateStr);
  await sb.from('ops_daily_logs').update({ signoff, updated_at: new Date().toISOString() }).eq('date', dateStr);
}
async function submitDay(dateStr) {
  await ensureDailyLog(dateStr);
  await sb.from('ops_daily_logs').update({
    submitted: true, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).eq('date', dateStr);
}
async function saveWeather(dateStr, weather) {
  await ensureDailyLog(dateStr);
  await sb.from('ops_daily_logs').update({
    weather_temp: weather.temp, weather_feels: weather.feelsLike,
    weather_cond: weather.cond, weather_alert: weather.alert,
    updated_at: new Date().toISOString(),
  }).eq('date', dateStr);
}
async function toggleCrewPresence(dateStr, crewId, onSite) {
  await sb.from('ops_daily_crew_presence').upsert(
    { date: dateStr, crew_id: crewId, on_site: onSite },
    { onConflict: 'date,crew_id' }
  );
}
async function saveJobEntry(dateStr, jobId, fields) {
  await sb.from('ops_daily_job_entries').upsert(
    { date: dateStr, job_id: jobId, ...fields },
    { onConflict: 'date,job_id' }
  );
}
async function saveJobHours(dateStr, jobId, crewId, reg, ot) {
  if ((reg || 0) === 0 && (ot || 0) === 0) {
    await sb.from('ops_daily_job_crew').delete().match({ date: dateStr, job_id: jobId, crew_id: crewId });
  } else {
    await sb.from('ops_daily_job_crew').upsert(
      { date: dateStr, job_id: jobId, crew_id: crewId, reg_hours: reg || 0, ot_hours: ot || 0 },
      { onConflict: 'date,job_id,crew_id' }
    );
  }
  // Ensure the job has a per-day entry so it appears on this day
  await sb.from('ops_daily_job_entries').upsert(
    { date: dateStr, job_id: jobId }, { onConflict: 'date,job_id' }
  );
}
async function addTodo(dateStr, text, priority) {
  const { data, error } = await sb.from('ops_todos').insert({ date: dateStr, text, priority }).select().single();
  if (error) throw error;
  return { id: data.id, text: data.text, done: data.done, pri: data.priority };
}
async function toggleTodo(id, done) {
  await sb.from('ops_todos').update({ done }).eq('id', id);
}
async function deleteTodo(id) { await sb.from('ops_todos').delete().eq('id', id); }
async function addMeeting(dateStr, meeting) {
  const { data, error } = await sb.from('ops_meetings').insert({
    date: dateStr, time: meeting.time, what: meeting.what, where: meeting.where, who: meeting.who
  }).select().single();
  if (error) throw error;
  return { id: data.id, time: data.time, what: data.what, where: data.where, who: data.who };
}
async function deleteMeeting(id) { await sb.from('ops_meetings').delete().eq('id', id); }

async function addJob(job) {
  const { data, error } = await sb.from('ops_jobs').insert({
    wo: job.wo || null, jonas: job.jonas || null,
    facility_id: job.facility_id, name: job.name,
    status: job.status || 'active', pct: job.pct || 0, notes: job.notes || null,
  }).select().single();
  if (error) throw error;
  _jobs.unshift(data);
  return data;
}
async function addCrew(crew) {
  const id = (crew.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    + '-' + Math.random().toString(36).slice(2, 5);
  const { data, error } = await sb.from('ops_crew').insert({
    id, name: crew.name, trade: crew.trade, active: true,
  }).select().single();
  if (error) throw error;
  _crew.push(data); _crew.sort((a,b) => a.name.localeCompare(b.name));
  return data;
}

async function uploadPhoto(dateStr, jobId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${dateStr}/${jobId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await sb.storage.from('ops-photos').upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await sb.from('ops_photos').insert({
    date: dateStr, job_id: jobId, storage_path: path, caption: file.name,
  }).select().single();
  if (error) throw error;
  const { data: urlData } = await sb.storage.from('ops-photos').createSignedUrl(path, 3600);
  return { ...data, url: urlData?.signedUrl, name: file.name };
}

// ─── Index / history ──────────────────────────────────────────────────────
async function listLoggedDays() {
  const { data, error } = await sb.from('ops_daily_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  // For the drawer we need a job count and hours total per day.
  const dates = data.map(d => d.date);
  if (dates.length === 0) return [];
  const [entries, jc] = await Promise.all([
    sb.from('ops_daily_job_entries').select('date, job_id').in('date', dates),
    sb.from('ops_daily_job_crew').select('date, reg_hours, ot_hours').in('date', dates),
  ]);
  const byDate = {};
  data.forEach(d => byDate[d.date] = { ...d, jobCount: 0, hours: 0 });
  (entries.data || []).forEach(e => { if (byDate[e.date]) byDate[e.date].jobCount++; });
  (jc.data || []).forEach(j => { if (byDate[j.date]) byDate[j.date].hours += Number(j.reg_hours) + Number(j.ot_hours); });
  return Object.values(byDate).sort((a,b) => b.date.localeCompare(a.date));
}

async function listSubmittedDateStrings() {
  const { data } = await sb.from('ops_daily_logs').select('date, submitted').eq('submitted', true);
  return new Set((data || []).map(d => d.date));
}

Object.assign(window, {
  sb, signIn, signOut, getSession, onAuthChange,
  loadLookups, getCrew, getFacilities, getJobsCatalog, crewName,
  loadDay, saveSignoff, submitDay, saveWeather,
  toggleCrewPresence, saveJobEntry, saveJobHours,
  addTodo, toggleTodo, deleteTodo, addMeeting, deleteMeeting,
  addJob, addCrew, uploadPhoto,
  listLoggedDays, listSubmittedDateStrings,
});
