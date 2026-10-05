'use client';

import {useRef, useState} from 'react';
import {ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, ChevronRight, CircleAlert, ListFilter, Minus, Pill, Plus, Search, X} from 'lucide-react';
import type {Patient, Workspace} from '@/lib/theranetrix';
import {activeMedications, patientSuggestions, priorityReviews} from '@/lib/medications';
import {visitObservations} from '@/lib/visit-observations';
import {dobText} from './patient-identity';
import {formatDate} from './ui';
import type {Context} from './app';
import styles from './doctor-focus.module.css';

const metrics = ['pain', 'function', 'sleep'] as const;
type Filter = 'review' | 'effects' | 'all';
function makeRows(data: Workspace) {
  return data.patients.map(p => {
    const meds = activeMedications(p), reviews = priorityReviews(data, p), suggestions = patientSuggestions(p, data);
    const points = data.features.assessments ? visitObservations(p) : [], latest = points.at(-1), previous = points.at(-2);
    const effects = meds.some(m => m.tolerability === 'Effects reported');
    const attention = p.status === 'Needs review' || reviews.length > 0 || suggestions.some(s => s.attention);
    const next = suggestions.find(s => s.kind !== 'plan') ?? suggestions[0];
    return {p, meds, reviews, latest, previous, effects, attention, focus: reviews[0]?.title ?? next?.title ?? 'Review the patient record', reason: reviews[0]?.detail ?? next?.reason ?? '', rank: reviews.some(r => r.priority === 'High') ? 0 : effects ? 1 : attention ? 2 : 3};
  }).sort((a,b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name));
}
type Row = ReturnType<typeof makeRows>[number];
function Avatar({p}: {p: Patient}) { return <span className={styles.avatar} aria-hidden="true">{p.initials}</span>; }
function Priority({row}: {row: Row}) {
  const label = row.reviews[0] ? row.reviews[0].priority + ' priority' : row.p.status;
  return <span className={`${styles.priority} ${row.reviews[0]?.priority === 'High' ? styles.high : ''}`}>{label}</span>;
}
function Score({row, metric, detailed = false}: {row: Row; metric: typeof metrics[number]; detailed?: boolean}) {
  const value = row.latest?.[metric], before = row.previous?.[metric];
  const delta = value != null && before != null ? value - before : null;
  const better = delta !== null && (metric === 'pain' ? delta < 0 : delta > 0);
  return <div className={styles.score}>
    <span>{metric === 'function' ? 'Function' : metric === 'pain' ? 'Pain' : 'Sleep'}</span>
    <div><strong>{value ?? '—'}</strong><small>/10</small><span className={delta === null || delta === 0 ? styles.neutral : better ? styles.better : styles.worse} aria-label={delta === null ? 'No prior comparison' : delta === 0 ? 'Unchanged from prior report' : `${Math.abs(delta)} ${delta > 0 ? 'higher' : 'lower'} than prior report`}>
      {delta === null ? '—' : delta === 0 ? <Minus size={12}/> : <>{delta > 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}<b>{Math.abs(delta)}</b></>}
    </span></div>
    {!detailed && <span className={`${styles.scoreBar} ${styles[metric]}`} aria-hidden="true"><span style={{width: `${value == null ? 0 : value * 10}%`}}/></span>}
    {detailed && <small>{metric === 'pain' ? 'Lower is better' : 'Higher is better'}</small>}
  </div>;
}

export function DoctorFocus({ctx}: {ctx: Context}) {
  const rows = makeRows(ctx.data);
  const [filter, setFilter] = useState<Filter>('review'), [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(rows.find(r => r.attention)?.p.id ?? null);
  const [clinician, setClinician] = useState('all');
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const scoped = rows.filter(r => clinician === 'all' || r.p.clinician === clinician);
  const counts = {review: scoped.filter(r => r.attention).length, effects: scoped.filter(r => r.effects).length, all: scoped.length};
  const visible = scoped.filter(r => (filter === 'all' || (filter === 'review' ? r.attention : r.effects)) && `${r.p.name} ${r.p.condition} ${r.p.medicalRecordNumber} ${r.meds.map(m => m.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const active = visible.find(r => r.p.id === selected);
  function select(id: string) { setSelected(id); requestAnimationFrame(() => { detailHeading.current?.focus({preventScroll: true}); if (window.innerWidth <= 1100) document.getElementById('focus-detail')?.scrollIntoView({block: 'start'}); }); }
  const next = active ? visible[visible.indexOf(active) + 1] : undefined;
  return <div className={styles.focus}>
    <header className={styles.heading}><div><div className={styles.eyebrow}>YOUR WORKSPACE <span>Focus view</span></div><h1>Care overview</h1><p>A clear view of who needs your attention.</p></div><div className={styles.headerActions}><a href="/schedule"><CalendarDays size={16}/>Schedule</a><button onClick={() => ctx.open('patient')}><Plus size={16}/>Add patient</button></div></header>
    <section className={styles.worklist} aria-label="Patient worklist">
      <div className={styles.filters}>
        <div className={styles.tabs} aria-label="Filter patients">{([{id:'review',label:'Needs review'},{id:'effects',label:'Side effects'},{id:'all',label:'All patients'}] as const).map(t => <button key={t.id} aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}>{t.label}<span>{counts[t.id]}</span></button>)}</div>
        <label className={styles.search}><Search size={16}/><input aria-label="Search clinical overview" placeholder="Find a patient…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14}/></button>}</label>
        <label className={styles.clinician}><ListFilter size={16}/><select aria-label="Filter by clinician" value={clinician} onChange={e => setClinician(e.target.value)}><option value="all">All clinicians</option>{[...new Set(rows.map(r => r.p.clinician))].map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className={styles.listIntro}><span><strong>{visible.length} patients</strong> · Recorded high-priority concerns first</span><span>Latest scores /10 · change vs. prior report</span></div>
      <div className={`${styles.split} ${active ? styles.withDetail : ''}`}>
        <div className={styles.list}>
          <div className={styles.columnHead} aria-hidden="true"><span>Patient</span><span>Review focus</span><span>Latest report</span><span/></div>
          {visible.map(row => <button key={row.p.id} data-patient-row className={`${styles.row} ${active?.p.id === row.p.id ? styles.selected : ''}`} onClick={() => select(row.p.id)} aria-pressed={active?.p.id === row.p.id} aria-controls="focus-detail" aria-label={`Review ${row.p.name}: ${row.focus}`}>
            <span className={styles.identity}><Avatar p={row.p}/><span><strong>{row.p.name}</strong><span>{row.p.condition}</span><small>{row.p.age} years · {row.p.medicalRecordNumber || row.p.id}</small></span></span>
            <span className={styles.reason}><Priority row={row}/><span>{row.focus}</span>{row.reviews.length > 1 && <small>+{row.reviews.length-1} more concerns</small>}</span>
            <span className={styles.report}><span className={styles.scores}>{metrics.map(metric => <Score key={metric} row={row} metric={metric}/>)}</span><small>{row.latest ? `Reported ${formatDate(row.latest.date)}` : ctx.data.features.assessments ? 'No report available' : 'Assessments off'}</small></span>
            <ChevronRight className={styles.rowArrow} size={18}/>
          </button>)}
          {!visible.length && <div className={styles.empty}><Search size={28}/><h2>No matching patients</h2><p>Try another name or adjust your filters.</p><button onClick={() => {setQuery('');setFilter('all');setClinician('all');}}>Clear filters</button></div>}
          <div className={styles.listFoot}><Check size={14}/>Patient reports and recorded concerns. Select a row for details.</div>
        </div>
        {active && <aside id="focus-detail" className={styles.detail} aria-label={`Review details for ${active.p.name}`}>
          <div className={styles.detailTop}><span>QUICK REVIEW</span><button aria-label="Close quick review" onClick={() => {const id = selected;setSelected(null);requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-patient-row][aria-label^="Review ${rows.find(r=>r.p.id===id)?.p.name}"]`)?.focus());}}><X size={18}/></button></div>
          <div className={styles.detailIdentity}><Avatar p={active.p}/><div><h2 ref={detailHeading} tabIndex={-1}>{active.p.name}</h2><p>{active.p.condition}</p></div></div>
          <p className={styles.meta}>{dobText(active.p.dateOfBirth)} · {active.p.age} years<br/>MRN {active.p.medicalRecordNumber || active.p.id}</p>
          <div className={styles.detailActions}><button onClick={() => ctx.open('patient')}>Open full patient record<ArrowRight size={16}/></button><button disabled={!next} onClick={() => next && select(next.p.id)}>Next patient<ChevronRight size={16}/></button><small>Viewing a patient does not mark their review complete.</small></div>
          <section className={styles.concern}><div><CircleAlert size={16}/><h3>Reason for review</h3><Priority row={active}/></div><p>{active.focus}</p>{active.reason && <details><summary>Supporting details</summary><p>{active.reason}</p></details>}{active.reviews.length > 1 && <details><summary>{active.reviews.length - 1} other recorded concerns</summary>{active.reviews.slice(1).map(r => <div key={r.id}><strong>{r.title}</strong><p>{r.detail}</p></div>)}</details>}</section>
          <section className={styles.detailSection}><div className={styles.sectionTitle}><h3>Latest report</h3><span>{active.latest ? formatDate(active.latest.date) : 'Not available'}</span></div><div className={styles.detailScores}>{metrics.map(metric => <Score key={metric} row={active} metric={metric} detailed/>)}</div><p className={styles.note}>{active.previous ? `Changes compared with ${formatDate(active.previous.date)}.` : 'No prior report to compare.'} {active.latest?.source}</p></section>
          <section className={styles.detailSection}><div className={styles.sectionTitle}><h3>Current medication</h3><Pill size={16}/></div>{active.meds.length ? active.meds.map(m => <div className={styles.medication} key={m.id}><strong>{m.name}</strong><span>{m.regimen}</span><span>{m.benefit}</span>{m.tolerability === 'Effects reported' && <p><CircleAlert size={13}/>{m.effects || 'Side effects reported'}</p>}</div>) : <p>{active.p.medicationReconciliation?.none ? 'None reported' : 'Current use not confirmed'}</p>}</section>
          <details className={styles.more}><summary>Patient goal & recorded plan</summary><h3>Patient goal</h3><p>{active.p.goal || 'Not recorded'}</p><h3>Recorded plan</h3><p>{active.p.carePlans[0]?.text || 'No plan recorded'}</p><p>Care team: {active.p.clinician}</p></details>

        </aside>}
      </div>
    </section>
  </div>;
}
