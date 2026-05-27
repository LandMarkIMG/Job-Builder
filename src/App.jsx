import { useMemo, useState } from 'react'
import './App.css'

const phasesSeed = [
  { id: 'survey', label: 'Survey', start: 0, duration: 1, owner: 'Contractor' },
  { id: 'procurement', label: 'Procure', start: 1, duration: 3, owner: 'Shared' },
  { id: 'rough', label: 'Rough', start: 3, duration: 4, owner: 'Contractor' },
  { id: 'backbone', label: 'Backbone', start: 4, duration: 3, owner: 'Contractor' },
  { id: 'devices', label: 'Devices', start: 6, duration: 3, owner: 'Contractor' },
  { id: 'termination', label: 'Term', start: 8, duration: 2, owner: 'Contractor' },
  { id: 'testing', label: 'Test', start: 9, duration: 2, owner: 'Contractor' },
  { id: 'closeout', label: 'Close', start: 10, duration: 1, owner: 'Contractor' },
]

const sections = [
  { title: 'Site Reality', tone: 'navy', fields: [
    ['Occupancy', ['Unoccupied', 'Occupied', 'Healthcare', 'Secure']],
    ['Ceiling', ['Open', 'Drop tile', 'Hard lid', 'Mixed']],
    ['Access', ['Clear', 'Shared trades', 'Limited', 'After-hours']],
    ['Pathway', ['Usable', 'Partial', 'Congested', 'Client-provided']],
  ]},
  { title: 'Scope Modules', tone: 'green', fields: [
    ['Cabling', ['Cat6', 'Cat6A', 'Fiber', 'OSP']],
    ['Endpoints', ['Drops', 'WAPs', 'Cameras', 'Access control', 'AV / Paging']],
    ['Closets', ['MDF', 'MDF + IDF', 'New rack', 'Migration']],
    ['Testing', ['Continuity', 'Certification', 'OLTS', 'OTDR']],
  ]},
  { title: 'Responsibility Split', tone: 'brown', fields: [
    ['Pathway owner', ['Contractor', 'Client', 'GC', 'EC', 'Shared']],
    ['Closet prep', ['Contractor', 'Client', 'EC', 'Shared']],
    ['Firestop', ['Contractor', 'GC', 'Client', 'Excluded']],
    ['Lift / access', ['Contractor', 'Client', 'Shared', 'Excluded']],
  ]},
  { title: 'Proof & Closeout', tone: 'amber', fields: [
    ['Documentation', ['Labels', 'Photos', 'Redlines', 'As-builts']],
    ['Meetings', ['None', 'Weekly', 'Twice weekly', 'Daily']],
    ['Punch style', ['Single pass', 'Phased', 'Owner witness', 'High rigor']],
    ['Warranty pack', ['Basic', 'Reports', 'Full binder', 'Turnover']],
  ]},
]

const detailPrompts = {
  Occupancy: { qty: 'zones / floors', note: 'escort, infection control, tenant hours' },
  Ceiling: { qty: '% hard lid', note: 'height, grid condition, access panels' },
  Access: { qty: 'windows / wk', note: 'night work, parking, staging, badge delay' },
  Pathway: { qty: 'usable %', note: 'tray, sleeves, cores, congestion' },
  Cabling: { qty: 'drops / strands', note: 'cable type, color, pathway class' },
  Endpoints: { qty: 'device count', note: 'mounting height, PoE, exterior, specialty' },
  Closets: { qty: 'rooms / racks', note: 'power, grounding, cooling, cleanup' },
  Testing: { qty: 'cert count', note: 'tester level, OTDR traces, reports' },
  'Pathway owner': { qty: 'client scope %', note: 'assumptions, exclusions, dependencies' },
  'Closet prep': { qty: 'rooms carried', note: 'plywood, power, rack, ladder rack' },
  Firestop: { qty: 'penetrations', note: 'rating, responsible party, inspection' },
  'Lift / access': { qty: 'lift days', note: 'provided by, shared use, delivery limits' },
  Documentation: { qty: 'deliverables', note: 'photo sets, labels, redline standard' },
  Meetings: { qty: 'hrs / wk', note: 'OAC, coordination, foreman cadence' },
  'Punch style': { qty: 'phases', note: 'witnessing, retest, room turnover' },
  'Warranty pack': { qty: 'copies', note: 'binder, test reports, training, handoff' },
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)))
}

function App() {
  const [phases, setPhases] = useState(phasesSeed)
  const [selectedField, setSelectedField] = useState('Occupancy')
  const [choices, setChoices] = useState({ Occupancy: 'Occupied', Ceiling: 'Mixed', Access: 'Shared trades', Pathway: 'Partial', 'Pathway owner': 'Shared' })
  const [details, setDetails] = useState({})

  const jobRead = useMemo(() => {
    const end = Math.max(...phases.map(p => p.start + p.duration))
    const overlaps = phases.reduce((score, p, i) => score + phases.filter((q, j) => j !== i && p.start < q.start + q.duration && q.start < p.start + p.duration).length, 0)
    const testing = phases.find(p => p.id === 'testing')
    const termination = phases.find(p => p.id === 'termination')
    const closeout = phases.find(p => p.id === 'closeout')
    const qtyLoad = Object.values(details).reduce((sum, d) => sum + (Number(d.qty) || 0), 0)
    const compressed = end <= 10
    const testingPressure = testing.start < termination.start + termination.duration
    const closeoutPressure = closeout.duration <= 1
    const occupied = ['Occupied', 'Healthcare', 'Secure'].includes(choices.Occupancy)
    const clientPathway = ['Client', 'Shared'].includes(choices['Pathway owner']) || choices.Pathway === 'Client-provided'
    const labor = 1 + overlaps * 0.014 + (compressed ? 0.07 : 0) + (occupied ? 0.05 : 0) + Math.min(qtyLoad / 2000, .08)
    const pm = 1 + overlaps * 0.018 + (occupied ? 0.08 : 0) + (closeoutPressure ? 0.04 : 0)
    const risk = 1 + (testingPressure ? 0.12 : 0) + (clientPathway ? 0.06 : 0) + (choices.Access === 'After-hours' ? 0.09 : 0)
    return { end, overlaps, compressed, testingPressure, closeoutPressure, occupied, clientPathway, labor, pm, risk, qtyLoad }
  }, [phases, choices, details])

  function updatePhase(id, key, value) {
    setPhases(current => current.map(p => p.id === id ? { ...p, [key]: clamp(value, key === 'start' ? 0 : 1, key === 'start' ? 14 : 8) } : p))
  }

  function choose(field, value) {
    setSelectedField(field)
    setChoices(current => ({ ...current, [field]: value }))
  }

  function updateDetail(field, key, value) {
    setSelectedField(field)
    setDetails(current => ({ ...current, [field]: { ...(current[field] || {}), [key]: value } }))
  }

  const selected = { field: selectedField, choice: choices[selectedField] || 'Not set', ...(details[selectedField] || {}), prompt: detailPrompts[selectedField] }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><p>LV Job Builder · compact framework</p><h1>Schedule · Survey · Scope · Proof</h1></div>
        <div className="mini-read"><b>{jobRead.end} wk</b><span>Labor x{jobRead.labor.toFixed(2)} · PM x{jobRead.pm.toFixed(2)} · Risk x{jobRead.risk.toFixed(2)}</span></div>
      </header>

      <div className="layout">
        <section className="workstream">
          <section className="card timeline-card">
            <div className="card-head"><h2>Schedule Gravity</h2><span>{jobRead.overlaps} overlaps</span></div>
            <div className="gantt">
              {phases.map(phase => (
                <div className="gantt-row" key={phase.id}>
                  <b>{phase.label}</b>
                  <div className="track"><span className={`bar owner-${phase.owner.toLowerCase()}`} style={{ left: `${phase.start / 12 * 100}%`, width: `${phase.duration / 12 * 100}%` }} /></div>
                  <input type="number" min="0" max="14" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)} />
                  <input type="number" min="1" max="8" value={phase.duration} onChange={e => updatePhase(phase.id, 'duration', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          <section className="signal-strip">
            <Signal active={jobRead.compressed} label="Compressed" />
            <Signal active={jobRead.testingPressure} label="Testing pressure" />
            <Signal active={jobRead.clientPathway} label="Brown pathway" />
            <Signal active={jobRead.occupied} label="Occupied" />
          </section>

          <section className="subject-grid">
            {sections.map(section => <SubjectCard key={section.title} section={section} choices={choices} details={details} choose={choose} updateDetail={updateDetail} />)}
          </section>
        </section>

        <aside className="right-rail">
          <div className="rail-card selected-card">
            <p className="eyebrow">Selected selector</p>
            <h2>{selected.field}</h2>
            <strong>{selected.choice}</strong>
            <dl>
              <div><dt>{selected.prompt?.qty || 'quantity'}</dt><dd>{selected.qty || '—'}</dd></div>
              <div><dt>modifier / adjective</dt><dd>{selected.mod || '—'}</dd></div>
              <div><dt>granular notes</dt><dd>{selected.note || selected.prompt?.note || '—'}</dd></div>
            </dl>
          </div>

          <div className="rail-card stats-card">
            <p className="eyebrow">Live stats</p>
            <Metric label="Labor" value={jobRead.labor} />
            <Metric label="PM" value={jobRead.pm} />
            <Metric label="Risk" value={jobRead.risk} />
            <Metric label="Qty load" value={jobRead.qtyLoad} raw />
          </div>

          <div className="rail-card summary-card">
            <p className="eyebrow">Floating summary</p>
            <p>{choices.Occupancy || 'Unclassified'} site, {choices.Ceiling || 'unknown'} ceiling, {choices.Pathway || 'unknown'} pathway, {choices['Pathway owner'] || 'unassigned'} pathway ownership.</p>
            <p>Current field narrative: labor x{jobRead.labor.toFixed(2)}, management x{jobRead.pm.toFixed(2)}, risk x{jobRead.risk.toFixed(2)}.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}

function SubjectCard({ section, choices, details, choose, updateDetail }) {
  return (
    <article className={`card subject ${section.tone}`}>
      <h2>{section.title}</h2>
      {section.fields.map(([field, options]) => (
        <div className="selector-row" key={field}>
          <div className="select-main">
            <label>{field}</label>
            <div className="chips">{options.map(option => <button key={option} className={choices[field] === option ? 'chip active' : 'chip'} onClick={() => choose(field, option)}>{option}</button>)}</div>
          </div>
          <div className="select-detail">
            <input type="number" placeholder={detailPrompts[field]?.qty || 'qty'} value={details[field]?.qty || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'qty', e.target.value)} />
            <input placeholder="modifier / adjective" value={details[field]?.mod || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'mod', e.target.value)} />
            <textarea placeholder={detailPrompts[field]?.note || 'granular notes'} value={details[field]?.note || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'note', e.target.value)} />
          </div>
        </div>
      ))}
    </article>
  )
}

function Signal({ active, label }) { return <div className={active ? 'signal active' : 'signal'}>{label}</div> }
function Metric({ label, value, raw }) { return <div className="metric"><span>{label}</span><b>{raw ? value : `x${value.toFixed(2)}`}</b></div> }
export default App
