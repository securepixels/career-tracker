'use client'
import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { loadCerts, loadTraining, loadWins, addCert, addTraining, addWin, deleteCert, deleteTraining, deleteWin } from '@/lib/data'
import { Cert, Training, Win } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(d: string) { if (!d) return ''; const [y, m] = d.split('-'); return months[parseInt(m) - 1] + ' ' + y }
function daysTo(d: string) { if (!d) return null; const [y, m] = d.split('-'); return Math.ceil((new Date(parseInt(y), parseInt(m) - 1, 28).getTime() - Date.now()) / 864e5) }

function CertTag({ c }: { c: Cert }) {
  if (c.status === 'scheduled') return <span className="tag tag-sched">SCHED</span>
  if (!c.expires) return <span className="tag tag-active">ACTIVE</span>
  const d = daysTo(c.expires)
  if (d !== null && d < 0) return <span className="tag tag-exp">EXPIRED</span>
  if (d !== null && d < 90) return <span className="tag tag-warn">{d}d</span>
  return <span className="tag tag-active">ACTIVE</span>
}

export function Tracker() {
  const { toggle } = useTheme()
  const [page, setPage] = useState('dash')
  const [certs, setCerts] = useState<Cert[]>([])
  const [training, setTraining] = useState<Training[]>([])
  const [wins, setWins] = useState<Win[]>([])
  const [modal, setModal] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [session, setSession] = useState<any>(null)

  // Login form state
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authError, setAuthError] = useState('')

  async function refresh() {
    setCerts(await loadCerts())
    setTraining(await loadTraining())
    setWins(await loadWins())
  }

  useEffect(() => {
    refresh()

    // 1. Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // 2. Secret keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A) to open Admin login
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        setModal('login')
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setModal(null)
      setAdminEmail('')
      setAdminPassword('')
      setPage('admin')
      showToast('Logged in as admin')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setPage('dash')
    showToast('Logged out')
  }

  async function handleAddCert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await addCert({ name: fd.get('name') as string, issuer: fd.get('issuer') as string, earned: fd.get('earned') as string, expires: fd.get('expires') as string, status: fd.get('status') as string, score: fd.get('score') as string, note: fd.get('note') as string })
    setModal(null); await refresh(); showToast('Cert added')
  }
  async function handleAddTraining(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await addTraining({ name: fd.get('name') as string, provider: fd.get('provider') as string, type: fd.get('type') as string, completed: fd.get('completed') as string, note: fd.get('note') as string })
    setModal(null); await refresh(); showToast('Training added')
  }
  async function handleAddWin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await addWin({ title: fd.get('title') as string, date: fd.get('date') as string, desc: fd.get('desc') as string })
    setModal(null); await refresh(); showToast('Win logged')
  }
  async function handleDelete(type: string, id: string) {
    if (!confirm('Delete this?')) return
    if (type === 'certs') await deleteCert(id)
    else if (type === 'training') await deleteTraining(id)
    else await deleteWin(id)
    await refresh(); showToast('Deleted')
  }

  // Base pages visible to everyone
  const basePages = [
    { id: 'dash', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'certs', label: 'Certs', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-2 5 2-1 2 1-2-5z"/><circle cx="12" cy="9" r="6"/></svg> },
    { id: 'training', label: 'Training', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
    { id: 'wins', label: 'Wins', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  ]

  // Only include Admin if an active session exists
  const activePages = session
    ? [...basePages, { id: 'admin', label: 'Admin', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> }]
    : basePages

  const active = certs.filter(c => c.status === 'active').length
  const sched = certs.filter(c => c.status === 'scheduled').length
  const done = training.filter(t => t.completed).length
  const expiring = certs.filter(c => { const d = daysTo(c.expires); return d !== null && d > 0 && d < 180 })
  const recentWins = [...wins].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3)

  return (
    <div className="app">
      <nav className="rail">
        <div className="rail-logo">CT</div>
        {activePages.map((p) => (
          <button key={p.id} className={`rail-btn ${page === p.id ? 'active' : ''}`} onClick={() => setPage(p.id)}>
            {p.icon}<span className="tooltip">{p.label}</span>
          </button>
        ))}
        <div className="rail-bottom">
          {session && (
            <button className="rail-theme" title="Logout" onClick={handleLogout} style={{ color: 'var(--amber)', fontSize: 13 }}>
              &larr;
            </button>
          )}
          <button className="rail-theme" onClick={toggle}>&#9684;</button>
        </div>
      </nav>

      <main className="main">
        <div className="mobile-nav">
          {activePages.map((p) => (
            <button key={p.id} className={`mob-btn ${page === p.id ? 'active' : ''}`} onClick={() => setPage(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {page === 'dash' && <>
          <div className="page-header"><div className="page-title">Dashboard</div><div className="page-sub">The big picture.</div></div>
          <div className="stats">
            <div className="stat"><div className="stat-num">{active}</div><div className="stat-label">Active certs{sched > 0 && ` \u00B7 ${sched} scheduled`}</div></div>
            <div className="stat"><div className="stat-num">{done}<span style={{fontSize:14,color:'var(--t3)'}}>/{training.length}</span></div><div className="stat-label">Courses done</div></div>
            <div className="stat"><div className="stat-num">{wins.length}</div><div className="stat-label">Wins logged</div></div>
            <div className="stat"><div className="stat-num" style={{color:expiring.length?'var(--amber)':'var(--green)'}}>{expiring.length}</div><div className="stat-label">Expiring within 6mo</div></div>
          </div>
          {recentWins.length > 0 && <div className="section"><div className="section-head"><div className="section-title">Recent wins</div></div><div className="timeline">{recentWins.map(w => <div key={w.id} className="tl-item"><div className="tl-dot"/><div className="tl-date">{fmt(w.date)}</div><div className="tl-title">{w.title}</div><div className="tl-desc">{w.desc}</div></div>)}</div></div>}
          <div className="section"><div className="section-head"><div className="section-title">Certifications</div></div><div className="tbl-wrap"><table><thead><tr><th>Cert</th><th>Issuer</th><th>Status</th><th>Expires</th></tr></thead><tbody>{certs.map(c => <tr key={c.id}><td>{c.name}{c.score && <span style={{color:'var(--t3)',fontSize:11}}> ({c.score})</span>}</td><td>{c.issuer}</td><td><CertTag c={c}/></td><td style={{fontFamily:'var(--mono)',fontSize:12}}>{c.note || fmt(c.expires)}</td></tr>)}</tbody></table></div></div>
        </>}

        {page === 'certs' && <>
          <div className="page-header"><div className="page-title">Certifications</div><div className="page-sub">Every cert earned and what is coming next.</div></div>
          <div className="tbl-wrap"><table><thead><tr><th>Cert</th><th>Issuer</th><th>Earned</th><th>Expires</th><th>Status</th></tr></thead><tbody>{certs.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.issuer}</td><td>{fmt(c.earned)}</td><td>{c.note || fmt(c.expires)}</td><td><CertTag c={c}/></td></tr>)}</tbody></table></div>
        </>}

        {page === 'training' && <>
          <div className="page-header"><div className="page-title">Training</div><div className="page-sub">Courses, labs, everything worked through.</div></div>
          <div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Provider</th><th>Type</th><th>Completed</th></tr></thead><tbody>{training.map(t => <tr key={t.id}><td>{t.name}</td><td>{t.provider}</td><td><span className={`tag ${t.type==='lab'?'tag-lab':'tag-course'}`}>{t.type.toUpperCase()}</span></td><td>{t.completed ? fmt(t.completed) : <span style={{color:'var(--amber)'}}>In progress</span>}</td></tr>)}</tbody></table></div>
        </>}

        {page === 'wins' && <>
          <div className="page-header"><div className="page-title">Wins</div><div className="page-sub">Big or small, they all go here.</div></div>
          <div className="timeline">{[...wins].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(w => <div key={w.id} className="tl-item"><div className="tl-dot"/><div className="tl-date">{fmt(w.date)}</div><div className="tl-title">{w.title}</div><div className="tl-desc">{w.desc}</div></div>)}</div>
        </>}

        {page === 'admin' && session && <>
          <div className="page-header"><div className="page-title">Admin</div><div className="page-sub">Add, edit, or remove entries.</div></div>
          <div className="section"><div className="section-head"><div className="section-title">Certifications</div><button className="add-btn" onClick={()=>setModal('cert')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</button></div><div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Issuer</th><th>Earned</th><th></th></tr></thead><tbody>{certs.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.issuer}</td><td>{fmt(c.earned)}</td><td><button className="del-btn" onClick={()=>handleDelete('certs',c.id)}>&times;</button></td></tr>)}</tbody></table></div></div>
          <div className="section"><div className="section-head"><div className="section-title">Training</div><button className="add-btn" onClick={()=>setModal('training')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</button></div><div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Provider</th><th></th></tr></thead><tbody>{training.map(t=><tr key={t.id}><td>{t.name}</td><td>{t.provider}</td><td><button className="del-btn" onClick={()=>handleDelete('training',t.id)}>&times;</button></td></tr>)}</tbody></table></div></div>
          <div className="section"><div className="section-head"><div className="section-title">Wins</div><button className="add-btn" onClick={()=>setModal('win')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</button></div><div className="tbl-wrap"><table><thead><tr><th>Title</th><th>Date</th><th></th></tr></thead><tbody>{wins.map(w=><tr key={w.id}><td>{w.title}</td><td>{fmt(w.date)}</td><td><button className="del-btn" onClick={()=>handleDelete('wins',w.id)}>&times;</button></td></tr>)}</tbody></table></div></div>
        </>}

        <div className="footer">
          <span>built by chrissy</span>
          {/* Clicking this version tag secretly opens the admin sign-in modal */}
          <span 
            onClick={() => !session && setModal('login')} 
            style={{ cursor: !session ? 'pointer' : 'default', opacity: !session ? 0.7 : 1 }}
            title={!session ? "Admin Login" : "Logged in"}
          >
            career tracker v1.0
          </span>
        </div>
      </main>

      {/* Secret Admin Login Modal */}
      {modal === 'login' && (
        <div className="modal-bg open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-head">
              <span className="modal-title">Admin Access</span>
              <button className="modal-x" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="modal-body">
                {authError && <div style={{ color: 'var(--red, #ef4444)', fontSize: 12, marginBottom: 8 }}>{authError}</div>}
                <div className="fg">
                  <label>Email</label>
                  <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
                </div>
                <div className="fg">
                  <label>Password</label>
                  <input type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="cancel-btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="save-btn">Log In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal && modal !== 'login' && <div className="modal-bg open" onClick={e => e.target === e.currentTarget && setModal(null)}>
        <div className="modal">
          <div className="modal-head"><span className="modal-title">{modal === 'cert' ? 'Add Cert' : modal === 'training' ? 'Add Training' : 'Log a Win'}</span><button className="modal-x" onClick={() => setModal(null)}>&times;</button></div>
          {modal === 'cert' && <form onSubmit={handleAddCert}><div className="modal-body"><div className="fg"><label>Name</label><input name="name" required placeholder="e.g. CompTIA Security+"/></div><div className="fg"><label>Issuer</label><input name="issuer" placeholder="e.g. CompTIA"/></div><div className="fg-row"><div className="fg"><label>Earned</label><input name="earned" type="month"/></div><div className="fg"><label>Expires</label><input name="expires" type="month"/></div></div><div className="fg-row"><div className="fg"><label>Status</label><select name="status"><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option></select></div><div className="fg"><label>Score</label><input name="score" placeholder="Optional"/></div></div><div className="fg"><label>Note</label><input name="note" placeholder="Optional"/></div></div><div className="modal-foot"><button type="button" className="cancel-btn" onClick={()=>setModal(null)}>Cancel</button><button type="submit" className="save-btn">Save</button></div></form>}
          {modal === 'training' && <form onSubmit={handleAddTraining}><div className="modal-body"><div className="fg"><label>Name</label><input name="name" required placeholder="e.g. D488 - Cybersecurity Architecture"/></div><div className="fg"><label>Provider</label><input name="provider" placeholder="e.g. WGU"/></div><div className="fg-row"><div className="fg"><label>Type</label><select name="type"><option value="course">Course</option><option value="lab">Lab</option><option value="workshop">Workshop</option></select></div><div className="fg"><label>Completed</label><input name="completed" type="month"/></div></div><div className="fg"><label>Note</label><input name="note" placeholder="Optional"/></div></div><div className="modal-foot"><button type="button" className="cancel-btn" onClick={()=>setModal(null)}>Cancel</button><button type="submit" className="save-btn">Save</button></div></form>}
          {modal === 'win' && <form onSubmit={handleAddWin}><div className="modal-body"><div className="fg"><label>What happened?</label><input name="title" required placeholder="e.g. Passed CySA+ first attempt"/></div><div className="fg"><label>When</label><input name="date" type="month"/></div><div className="fg"><label>Tell the story</label><textarea name="desc" placeholder="Keep it real."/></div></div><div className="modal-foot"><button type="button" className="cancel-btn" onClick={()=>setModal(null)}>Cancel</button><button type="submit" className="save-btn">Save</button></div></form>}
        </div>
      </div>}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}