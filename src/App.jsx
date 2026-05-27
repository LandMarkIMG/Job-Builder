import { useMemo, useState } from 'react'
import './App.css'

const phasesSeed = [
  { id: 'survey', label: 'Survey', start: 0, duration: 1, owner: 'Contractor' },
  { id: 'procurement', label: 'Procurement', start: 1, duration: 3, owner: 'Shared' },
  { id: 'rough', label: 'Rough-in', start: 3, duration: 4, owner: 'Contractor' },
  { id: 'backbone', label: 'Backbone', start: 4, duration: 3, owner: 'Contractor' },
  { id: 'devices', label: 'Devices', start: 6, duration: 3, owner: 'Contractor' },
  { id: 'termination', label: 'Termination', start: 8, duration: 2, owner: 'Contractor' },
  { id: 'testing', label: 'Testing', start: 9, duration: 2, owner: 'Contractor' },
  { id: 'closeout', label: 'Closeout', start: 10, duration: 1, owner: 'Contractor' },
]

const sections = [
  {
    title: 'Site Reality',
    tone: 'navy',
    prompt: 'Walk in. Read the building before counting the work.',
    fields: [
      ['Occupancy', ['Unoccupied', 'Occupied', 'Healthcare / Sensitive', 'Secure / Escort']],
      ['Ceiling', ['Open', 'Drop tile', 'Hard lid', 'Mixed']],
      ['Access', ['Clear', 'Shared trades', 'Limited windows', 'After-hours only']],
      ['Pathway', ['Existing usable', 'Partial', 'Congested', 'Client-provided']],
    ],
  },
  {
    title: 'Scope Modules',
    tone: 'green',
    prompt: 'Select what is real; the builder reveals the hidden burden.',
    fields: [
      ['Cabling', ['Cat6', 'Cat6A', 'Fiber backbone', 'OSP']],
      ['Endpoints', ['Drops', 'WAPs', 'Cameras', 'Access control', 'AV / Paging']],
      ['Closets', ['MDF only', 'MDF + IDF', 'New rack', 'Cleanup / migration']],
      ['Testing', ['Continuity', 'Certification', 'Fiber OLTS', 'OTDR + reports']],
    ],
  },
  {
    title: 'Responsibility Split',
    tone: 'brown',
    prompt: 'Separate price from ownership. Brown means client-carried gravity.',
    fields: [
      ['Pathway owner', ['Contractor', 'Client', 'GC', 'EC', 'Shared']],
      ['Closet prep', ['Contractor', 'Client', 'EC', 'Shared']],
      ['Firestop', ['Contractor', 'GC', 'Client', 'Excluded']],
      ['Lift / access', ['Contractor', 'Client', 'Shared', 'Excluded']],
    ],
  },
  {
    title: 'Proof & Closeout',
    tone: 'amber',
    prompt: 'What evidence must survive the job?',
    fields: [
      ['Documentation', ['Labels', 'Photos', 'Redlines', 'As-builts']],
      ['Meetings', ['None', 'Weekly', 'Twice weekly', 'Daily huddle']],
      ['Punch style', ['Single pass', 'Phased', 'Owner witness', 'High rigor']],
      ['Warranty pack', ['Basic', 'Test reports', 'Full binder', 'Turnover meeting']],
    ],
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)))
}

function App() {
  const [phases, setPhases] = useState(phasesSeed)
  const [choices, setChoices] = useState({
    'Occupancy': 'Occupied',
    'Ceiling': 'Mixed',
    'Access': 'Shared trades',
    'Pathway': 'Partial',
    'Pathway owner': 'Shared',
  })

  const jobRead = useMemo(() => {
    const end = Math.max(...phases.map(p => p.start + p.duration))
    const overlaps = phases.reduce((score, p, i) => {
      const count = phases.filter((q, j) => j !== i && p.start < q.start + q.duration && q.start < p.start + p.duration).length
      return score + count
    }, 0)
    const testing = phases.find(p => p.id === 'testing')
    const termination = phases.find(p => p.id === 'termination')
    const closeout = phases.find(p => p.id === 'closeout')
    const compressed = end <= 10
    const testingPressure = testing.start < termination.start + termination.duration
    const closeoutPressure = closeout.duration <= 1
    const occupied = ['Occupied', 'Healthcare / Sensitive', 'Secure / Escort'].includes(choices.Occupancy)
    const clientPathway = ['Client', 'Shared'].includes(choices['Pathway owner']) || choices.Pathway === 'Client-provided'

    const labor = 1 + overlaps * 0.018 + (compressed ? 0.08 : 0) + (occupied ? 0.06 : 0)
    const pm = 1 + overlaps * 0.02 + (occupied ? 0.08 : 0) + (closeoutPressure ? 0.04 : 0)
    const risk = 1 + (testingPressure ? 0.12 : 0) + (clientPathway ? 0.06 : 0) + (choices.Access === 'After-hours only' ? 0.09 : 0)

    return {
      end,
      overlaps,
      compressed,
      testingPressure,
      closeoutPressure,
      occupied,
      clientPathway,
      labor,
      pm,
      risk,
    }
  }, [phases, choices])

  function updatePhase(id, key, value) {
    setPhases(current => current.map(p => p.id === id ? { ...p, [key]: clamp(value, key === 'start' ? 0 : 1, key === 'start' ? 14 : 8) } : p))
  }

  function choose(field, value) {
    setChoices(current => ({ ...current, [field]: value }))
  }

  const weeks = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">LV Job Builder · framework draft</p>
          <h1>The Gantt bends the estimator.</h1>
          <p className="hero-copy">Build the job in calendar order, survey the field in jobsite order, then let scope, responsibility, risk, and proof speak as one price narrative.</p>
        </div>
        <aside className="score-card">
          <span>Live job read</span>
          <strong>{jobRead.end} week arc</strong>
          <p>{jobRead.overlaps} overlap signals · labor x{jobRead.labor.toFixed(2)} · PM x{jobRead.pm.toFixed(2)} · risk x{jobRead.risk.toFixed(2)}</p>
        </aside>
      </section>

      <section className="panel timeline-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Temporal skeleton</p>
            <h2>Schedule Gravity</h2>
          </div>
          <p>Move phase starts and durations. The survey below should become biased by time pressure, overlap, and proof burden.</p>
        </div>

        <div className="calendar-head">
          <span>Phase</span>
          {weeks.map(w => <span key={w}>W{w}</span>)}
          <span>Start</span><span>Dur.</span>
        </div>
        <div className="gantt">
          {phases.map(phase => (
            <div className="gantt-row" key={phase.id}>
              <strong>{phase.label}</strong>
              <div className="track">
                <span className={`bar owner-${phase.owner.toLowerCase().replaceAll(' ', '-')}`} style={{ left: `${phase.start / 12 * 100}%`, width: `${phase.duration / 12 * 100}%` }}>{phase.owner}</span>
              </div>
              <input aria-label={`${phase.label} start`} type="number" min="0" max="14" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)} />
              <input aria-label={`${phase.label} duration`} type="number" min="1" max="8" value={phase.duration} onChange={e => updatePhase(phase.id, 'duration', e.target.value)} />
            </div>
          ))}
        </div>
      </section>

      <section className="signals">
        <Signal active={jobRead.compressed} title="Compressed arc" body="Short schedule raises crew stacking and labor inefficiency." />
        <Signal active={jobRead.testingPressure} title="Testing pressure" body="Testing overlaps termination; certification and retest risk should surface." />
        <Signal active={jobRead.clientPathway} title="Client-carried pathway" body="Brown scope: price may reduce, but coordination and assumptions rise." />
        <Signal active={jobRead.occupied} title="Occupied environment" body="Access, protection, escort, and PM cadence become stronger questions." />
      </section>

      <section className="builder-grid">
        {sections.map(section => (
          <article className={`panel module ${section.tone}`} key={section.title}>
            <div className="module-title">
              <h2>{section.title}</h2>
              <p>{section.prompt}</p>
            </div>
            {section.fields.map(([field, options]) => (
              <div className="field" key={field}>
                <div className="field-title">{field}</div>
                <div className="chips">
                  {options.map(option => (
                    <button className={choices[field] === option ? 'chip active' : 'chip'} key={option} onClick={() => choose(field, option)}>{option}</button>
                  ))}
                </div>
              </div>
            ))}
          </article>
        ))}
      </section>

      <section className="panel narrative">
        <p className="eyebrow">Export seed</p>
        <h2>Field Narrative</h2>
        <p>This project is presently modeled as a {choices.Occupancy?.toLowerCase() || 'surveyed'} LV deployment with {choices.Ceiling?.toLowerCase() || 'mixed'} ceiling conditions, {choices.Pathway?.toLowerCase() || 'unknown'} pathway status, and {choices['Pathway owner']?.toLowerCase() || 'shared'} pathway responsibility. Schedule logic indicates labor x{jobRead.labor.toFixed(2)}, management x{jobRead.pm.toFixed(2)}, and risk x{jobRead.risk.toFixed(2)}.</p>
      </section>
    </main>
  )
}

function Signal({ active, title, body }) {
  return <article className={active ? 'signal active' : 'signal'}><strong>{title}</strong><p>{body}</p></article>
}

export default App
