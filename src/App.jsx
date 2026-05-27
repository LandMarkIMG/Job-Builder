import { useMemo, useState } from 'react'
import './App.css'

const owners = {
  Bidder: { label: 'Bidder', tone: 'bidder', colorName: 'green' },
  Client: { label: 'Client', tone: 'client', colorName: 'brown' },
  Property: { label: 'Property', tone: 'property', colorName: 'purple' },
  Shared: { label: 'Shared', tone: 'shared', colorName: 'split' },
}

const phasesSeed = [
  { id: 'survey', label: 'Survey', start: 0, duration: 1, owner: 'Bidder', link: 'Site Reality' },
  { id: 'procurement', label: 'Procure', start: 1, duration: 3, owner: 'Client', link: 'Responsibility Split' },
  { id: 'rough', label: 'Rough', start: 3, duration: 4, owner: 'Bidder', link: 'Scope Modules' },
  { id: 'backbone', label: 'Backbone', start: 4, duration: 3, owner: 'Property', link: 'Scope Modules' },
  { id: 'devices', label: 'Devices', start: 6, duration: 3, owner: 'Bidder', link: 'Scope Modules' },
  { id: 'termination', label: 'Term', start: 8, duration: 2, owner: 'Bidder', link: 'Proof & Closeout' },
  { id: 'testing', label: 'Test', start: 9, duration: 2, owner: 'Bidder', link: 'Proof & Closeout' },
  { id: 'closeout', label: 'Close', start: 10, duration: 1, owner: 'Client', link: 'Proof & Closeout' },
]

const sectionData = [
  { title: 'Site Reality', plane: 'Job', defaultOwner: 'Property', fields: [
    ['Occupancy', ['Unoccupied', 'Occupied', 'Healthcare', 'Secure']],
    ['Ceiling', ['Open', 'Drop tile', 'Hard lid', 'Mixed']],
    ['Access', ['Clear', 'Shared trades', 'Limited', 'After-hours']],
    ['Pathway', ['Usable', 'Partial', 'Congested', 'Client-provided']],
  ]},
  { title: 'Scope Modules', plane: 'Job', defaultOwner: 'Bidder', fields: [
    ['Cabling', ['Cat6', 'Cat6A', 'Fiber', 'OSP']],
    ['Endpoints', ['Drops', 'WAPs', 'Cameras', 'Access control', 'AV / Paging']],
    ['Closets', ['MDF', 'MDF + IDF', 'New rack', 'Migration']],
    ['Testing', ['Continuity', 'Certification', 'OLTS', 'OTDR']],
  ]},
  { title: 'Responsibility Split', plane: 'Client', defaultOwner: 'Client', fields: [
    ['Pathway owner', ['Contractor', 'Client', 'GC', 'EC', 'Shared']],
    ['Closet prep', ['Contractor', 'Client', 'EC', 'Shared']],
    ['Firestop', ['Contractor', 'GC', 'Client', 'Excluded']],
    ['Lift / access', ['Contractor', 'Client', 'Shared', 'Excluded']],
  ]},
  { title: 'Proof & Closeout', plane: 'Team', defaultOwner: 'Bidder', fields: [
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

const initialChoices = { Occupancy: 'Occupied', Ceiling: 'Mixed', Access: 'Shared trades', Pathway: 'Partial', 'Pathway owner': 'Shared' }
const initialOwners = Object.fromEntries(sectionData.flatMap(s => s.fields.map(([f]) => [f, s.defaultOwner])))

function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value))) }

function App() {
  const [phases, setPhases] = useState(phasesSeed)
  const [selectedField, setSelectedField] = useState('Occupancy')
  const [openSection, setOpenSection] = useState('Site Reality')
  const [topPlane, setTopPlane] = useState('Job')
  const [ownerPlane, setOwnerPlane] = useState('Property')
  const [choices, setChoices] = useState(initialChoices)
  const [fieldOwners, setFieldOwners] = useState(initialOwners)
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
    const clientPathway = ['Client', 'Shared'].includes(choices['Pathway owner']) || choices.Pathway === 'Client-provided' || fieldOwners.Pathway === 'Client'
    const propertyFriction = ['Healthcare', 'Secure', 'Hard lid', 'Mixed', 'Congested'].some(v => Object.values(choices).includes(v))
    const labor = 1 + overlaps * 0.014 + (compressed ? 0.07 : 0) + (occupied ? 0.05 : 0) + Math.min(qtyLoad / 2000, .08)
    const pm = 1 + overlaps * 0.018 + (occupied ? 0.08 : 0) + (closeoutPressure ? 0.04 : 0)
    const risk = 1 + (testingPressure ? 0.12 : 0) + (clientPathway ? 0.06 : 0) + (choices.Access === 'After-hours' ? 0.09 : 0) + (propertyFriction ? 0.03 : 0)
    return { end, overlaps, compressed, testingPressure, closeoutPressure, occupied, clientPathway, propertyFriction, labor, pm, risk, qtyLoad }
  }, [phases, choices, details, fieldOwners])

  function updatePhase(id, key, value) {
    setPhases(current => current.map(p => p.id === id ? { ...p, [key]: clamp(value, key === 'start' ? 0 : 1, key === 'start' ? 14 : 8) } : p))
  }
  function phaseOpen(phase) { setOpenSection(phase.link); setOwnerPlane(phase.owner) }
  function choose(field, value) { setSelectedField(field); setChoices(current => ({ ...current, [field]: value })) }
  function updateDetail(field, key, value) { setSelectedField(field); setDetails(current => ({ ...current, [field]: { ...(current[field] || {}), [key]: value } })) }
  function setOwner(field, owner) { setSelectedField(field); setFieldOwners(current => ({ ...current, [field]: owner })) }
  function selectAll(section) {
    const choicePatch = {}; const ownerPatch = {}
    section.fields.forEach(([field, options]) => { choicePatch[field] = options[0]; ownerPatch[field] = section.defaultOwner })
    setChoices(current => ({ ...current, ...choicePatch }))
    setFieldOwners(current => ({ ...current, ...ownerPatch }))
    setOpenSection(section.title)
  }
  function clearSection(section) {
    const choicePatch = {}; const detailPatch = { ...details }
    section.fields.forEach(([field]) => { delete choicePatch[field]; delete detailPatch[field] })
    setChoices(current => {
      const next = { ...current }
      section.fields.forEach(([field]) => delete next[field])
      return next
    })
    setDetails(detailPatch)
  }

  const visibleSections = sectionData.filter(s => topPlane === 'Job' || s.plane === topPlane || s.title === openSection)
  const selected = { field: selectedField, choice: choices[selectedField] || 'Not set', owner: fieldOwners[selectedField] || 'Property', ...(details[selectedField] || {}), prompt: detailPrompts[selectedField] }

  return (
    <main className="app-shell">
      <header className="commandbar">
        <div className="brand-block"><span className="brand-mark">LV</span><div><p>Branding space</p><h1>LV Job Builder</h1></div></div>
        <nav className="top-tabs">{['Team','Client','Job'].map(t => <button key={t} className={topPlane === t ? 'active' : ''} onClick={() => setTopPlane(t)}>{t}</button>)}</nav>
        <div className="header-summary"><b>{jobRead.end} wk</b><span>Labor x{jobRead.labor.toFixed(2)} · PM x{jobRead.pm.toFixed(2)} · Risk x{jobRead.risk.toFixed(2)}</span></div>
      </header>

      <div className="layout">
        <section className="workstream">
          <section className="card timeline-card">
            <div className="card-head"><h2>Nested Schedule Gravity</h2><span>{jobRead.overlaps} overlaps</span></div>
            <div className="timeline-tabs">{['Weekly','Monthly','Quarterly'].map((t, i) => <button key={t} className={i === 0 ? 'active' : ''}>{t}</button>)}</div>
            <div className="gantt">
              {phases.map(phase => (
                <div className={`gantt-row ${openSection === phase.link ? 'linked' : ''}`} key={phase.id} onClick={() => phaseOpen(phase)}>
                  <b>{phase.label}</b>
                  <div className="track"><span className={`bar owner-${owners[phase.owner].tone}`} style={{ left: `${phase.start / 14 * 100}%`, width: `${phase.duration / 14 * 100}%` }} /></div>
                  <input aria-label={`${phase.label} start`} type="range" min="0" max="14" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)} />
                  <input aria-label={`${phase.label} duration`} type="range" min="1" max="8" value={phase.duration} onChange={e => updatePhase(phase.id, 'duration', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          <section className="signal-strip">
            <Signal active={jobRead.compressed} label="Compressed" />
            <Signal active={jobRead.testingPressure} label="Testing pressure" />
            <Signal active={jobRead.clientPathway} label="Client-owned scope" />
            <Signal active={jobRead.propertyFriction} label="Property friction" />
          </section>

          <section className="owner-tabs">{Object.keys(owners).filter(o => o !== 'Shared').map(o => <button key={o} className={`${ownerPlane === o ? 'active ' : ''}${owners[o].tone}`} onClick={() => setOwnerPlane(o)}>{o}</button>)}</section>

          <section className="subject-grid">
            {visibleSections.map(section => <SubjectCard key={section.title} section={section} open={openSection === section.title} choices={choices} details={details} fieldOwners={fieldOwners} ownerPlane={ownerPlane} choose={choose} setOwner={setOwner} updateDetail={updateDetail} selectAll={selectAll} clearSection={clearSection} setOpenSection={setOpenSection} />)}
          </section>
        </section>

        <aside className="right-rail">
          <div className="rail-card selected-card">
            <p className="eyebrow">Selected selector</p>
            <h2>{selected.field}</h2>
            <strong className={`owner-pill ${owners[selected.owner]?.tone || 'property'}`}>{selected.owner} ownership</strong>
            <dl>
              <div><dt>choice</dt><dd>{selected.choice}</dd></div>
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

          <div className="rail-card summary-card sticky-summary">
            <p className="eyebrow">Floating summary</p>
            <p>{choices.Occupancy || 'Unclassified'} site, {choices.Ceiling || 'unknown'} ceiling, {choices.Pathway || 'unknown'} pathway.</p>
            <p><b className="green-text">Bidder</b> = green labor/control. <b className="brown-text">Client</b> = brown carried scope. <b className="purple-text">Property</b> = purple site conditions.</p>
            <p>Current narrative: labor x{jobRead.labor.toFixed(2)}, management x{jobRead.pm.toFixed(2)}, risk x{jobRead.risk.toFixed(2)}.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}

function SubjectCard({ section, open, choices, details, fieldOwners, ownerPlane, choose, setOwner, updateDetail, selectAll, clearSection, setOpenSection }) {
  return (
    <article className={`card subject ${open ? 'open' : ''}`}>
      <div className="section-title" onClick={() => setOpenSection(section.title)}><h2>{section.title}</h2><span>{section.plane}</span></div>
      <div className="section-actions"><button onClick={() => selectAll(section)}>Select all</button><button onClick={() => clearSection(section)}>Clear</button></div>
      {section.fields.map(([field, options]) => {
        const owner = fieldOwners[field] || section.defaultOwner
        return <div className={`selector-row owner-frame-${owners[owner]?.tone || 'property'}`} key={field}>
          <div className="select-main">
            <label>{field}</label>
            <div className="chips">{options.map(option => <button key={option} className={choices[field] === option ? `chip active ${owners[owner]?.tone}` : 'chip'} onClick={() => choose(field, option)}>{option}</button>)}</div>
            <div className="owner-mini">{['Bidder','Client','Property'].map(o => <button key={o} className={owner === o ? `active ${owners[o].tone}` : ''} onClick={() => setOwner(field, o)}>{o}</button>)}</div>
          </div>
          <div className="select-detail">
            <input type="number" placeholder={detailPrompts[field]?.qty || 'qty'} value={details[field]?.qty || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'qty', e.target.value)} />
            <input placeholder={`${ownerPlane.toLowerCase()} modifier`} value={details[field]?.mod || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'mod', e.target.value)} />
            <textarea placeholder={detailPrompts[field]?.note || 'granular notes'} value={details[field]?.note || ''} onFocus={() => updateDetail(field, 'note', details[field]?.note || '')} onChange={e => updateDetail(field, 'note', e.target.value)} />
          </div>
        </div>
      })}
    </article>
  )
}

function Signal({ active, label }) { return <div className={active ? 'signal active' : 'signal'}>{label}</div> }
function Metric({ label, value, raw }) { return <div className="metric"><span>{label}</span><b>{raw ? value : `x${value.toFixed(2)}`}</b></div> }
export default App
