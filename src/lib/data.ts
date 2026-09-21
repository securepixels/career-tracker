import { supabase } from './supabase'
import { Cert, Training, Win } from './types'

const DEMO_CERTS: Cert[] = [
  {id:'1',name:'CompTIA CySA+',issuer:'CompTIA',earned:'2025-03',expires:'2028-03',status:'active'},
  {id:'2',name:'CompTIA PenTest+',issuer:'CompTIA',earned:'2026-05',expires:'2029-05',status:'active',score:'815'},
  {id:'3',name:'(ISC)² CC',issuer:'(ISC)²',earned:'2025-01',expires:'2028-01',status:'active'},
  {id:'4',name:'GIAC GFACT',issuer:'GIAC',earned:'2025-02',expires:'2029-02',status:'active'},
  {id:'5',name:'SC-500',issuer:'Microsoft',earned:'',expires:'',status:'scheduled',note:'Oct 17, 2026'},
]
const DEMO_TRAINING: Training[] = [
  {id:'1',name:'D488 - Cybersecurity Architecture and Engineering',provider:'WGU',completed:'2026-03',type:'course'},
  {id:'2',name:'D485 - Cybersecurity Management',provider:'WGU',completed:'2026-06',type:'course'},
  {id:'3',name:'CertMaster Labs - Advanced Exploitation',provider:'CompTIA',completed:'2026-03',type:'lab'},
  {id:'4',name:'MS Cybersecurity Capstone',provider:'WGU',completed:'',type:'course',note:'In progress'},
]
const DEMO_WINS: Win[] = [
  {id:'1',title:'Passed PenTest+ with 815',date:'2026-05',desc:'First attempt, no extensions needed.'},
  {id:'2',title:'Built SourceSecured site',date:'2026-01',desc:'Next.js, TypeScript, and Tailwind.'},
  {id:'3',title:'Nucleus Security coding challenge',date:'2026-03',desc:'Most technical candidate interviewed.'},
  {id:'4',title:'SecurePixels portfolio launch',date:'2026-02',desc:'Jekyll, Chirpy theme, custom pixel branding.'},
]

// If Supabase is connected, use it. Otherwise fall back to localStorage with demo seed.
export async function loadCerts(): Promise<Cert[]> {
  if (supabase) {
    const { data } = await supabase.from('certs').select('*').order('earned', { ascending: false })
    return (data as Cert[]) || []
  }
  const stored = localStorage.getItem('ct_c')
  if (!stored) { localStorage.setItem('ct_c', JSON.stringify(DEMO_CERTS)); return DEMO_CERTS }
  return JSON.parse(stored)
}

export async function loadTraining(): Promise<Training[]> {
  if (supabase) {
    const { data } = await supabase.from('training').select('*')
    return (data as Training[]) || []
  }
  const stored = localStorage.getItem('ct_t')
  if (!stored) { localStorage.setItem('ct_t', JSON.stringify(DEMO_TRAINING)); return DEMO_TRAINING }
  return JSON.parse(stored)
}

export async function loadWins(): Promise<Win[]> {
  if (supabase) {
    const { data } = await supabase.from('accomplishments').select('*').order('date', { ascending: false })
    return (data as Win[]) || []
  }
  const stored = localStorage.getItem('ct_w')
  if (!stored) { localStorage.setItem('ct_w', JSON.stringify(DEMO_WINS)); return DEMO_WINS }
  return JSON.parse(stored)
}

export async function addCert(c: Omit<Cert, 'id'>) {
  if (supabase) { await supabase.from('certs').insert(c); return }
  const all = await loadCerts()
  all.push({ ...c, id: Date.now().toString(36) })
  localStorage.setItem('ct_c', JSON.stringify(all))
}

export async function addTraining(t: Omit<Training, 'id'>) {
  if (supabase) { await supabase.from('training').insert(t); return }
  const all = await loadTraining()
  all.push({ ...t, id: Date.now().toString(36) })
  localStorage.setItem('ct_t', JSON.stringify(all))
}

export async function addWin(w: Omit<Win, 'id'>) {
  if (supabase) { await supabase.from('accomplishments').insert({ title: w.title, date: w.date, description: w.desc }); return }
  const all = await loadWins()
  all.push({ ...w, id: Date.now().toString(36) })
  localStorage.setItem('ct_w', JSON.stringify(all))
}

export async function deleteCert(id: string) {
  if (supabase) { await supabase.from('certs').delete().eq('id', id); return }
  const all = (await loadCerts()).filter(c => c.id !== id)
  localStorage.setItem('ct_c', JSON.stringify(all))
}

export async function deleteTraining(id: string) {
  if (supabase) { await supabase.from('training').delete().eq('id', id); return }
  const all = (await loadTraining()).filter(t => t.id !== id)
  localStorage.setItem('ct_t', JSON.stringify(all))
}

export async function deleteWin(id: string) {
  if (supabase) { await supabase.from('accomplishments').delete().eq('id', id); return }
  const all = (await loadWins()).filter(w => w.id !== id)
  localStorage.setItem('ct_w', JSON.stringify(all))
}
