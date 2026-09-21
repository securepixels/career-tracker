export interface Cert { id: string; name: string; issuer: string; earned: string; expires: string; status: string; score?: string; note?: string }
export interface Training { id: string; name: string; provider: string; type: string; completed: string; note?: string }
export interface Win { id: string; title: string; date: string; desc?: string }
