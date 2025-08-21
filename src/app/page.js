'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function Home() {
  const [logs, setLogs] = useState([]);
  const [drugName, setDrugName] = useState('');
  const [reaction, setReaction] = useState('');
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAdvice('');
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugName, reaction, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdvice(data.advice);
        setDrugName(''); setReaction(''); setNotes('');
        fetchLogs();
      } else {
        setAdvice('Something went wrong. Try again.');
      }
    } catch {
      setAdvice('Network error. Try again.');
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this log?')) return;
    await fetch('/api/logs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchLogs();
  }

  return (
      <div>
        {/* for home card sec */}
        <section className="card" style={{ marginTop: 12 }}>
          <div className="h1">Drug Reaction Logger</div>
          <p className="sub">Log what you felt after taking a medication. We’ll compare the reaction
            against reported events and give you a quick, human-readable hint.</p>

          <form onSubmit={handleSubmit} className="row row--2">
            <div className="col">
              <label className="label">Drug name</label>
              <input className="input" value={drugName} onChange={e => setDrugName(e.target.value)} required />
            </div>
            <div className="col">
              <label className="label">Reaction</label>
              <input className="input" value={reaction} onChange={e => setReaction(e.target.value)} required />
            </div>
            <div className="col" style={{ gridColumn: '1 / 3' }}>
              <label className="label">Notes</label>
              <textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="col" style={{ gridColumn: '1 / 3' }}>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save log'}
              </button>
              <Link href="/meds" className="btn btn--ghost" style={{ marginLeft: 10 }}>Medication Schedule →</Link>
            </div>
          </form>

          {advice && (
              <div className="card" style={{
                marginTop: 14,
                borderColor: advice.startsWith('✅') ? 'rgba(74,222,128,.35)' : 'rgba(245,158,11,.35)',
                background: advice.startsWith('✅')
                    ? 'linear-gradient(180deg, rgba(74,222,128,.08), rgba(74,222,128,.03))'
                    : 'linear-gradient(180deg, rgba(245,158,11,.10), rgba(245,158,11,.04))'
              }}>
                {advice}
              </div>
          )}
        </section>

        {/* logs */}
        <section className="card" style={{ marginTop: 14 }}>
          <div className="between center">
            <div className="h1" style={{ fontSize: 22, margin: 0 }}>Previous Logs</div>
            <span className="badge badge--muted">{logs.length} total</span>
          </div>
          <hr className="hr" />

          {logs.length === 0 && <div className="small">No logs yet.</div>}

          <div className="col" style={{ gap: 10 }}>
            {logs.map(log => (
                <div key={log.id} className="card" style={{ padding: 16 }}>
                  <div className="between center">
                    <div style={{ lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700 }}>
                        {log.drugName} <span style={{ opacity: .6, fontWeight: 500 }}>— Reaction:</span> <b>{log.reaction}</b>
                      </div>
                      <div className="small">Date: {new Date(log.date).toLocaleString()}</div>
                      {log.notes && <div className="small" style={{ marginTop: 6 }}>Notes: {log.notes}</div>}
                    </div>
                    <button className="btn btn--danger" onClick={() => handleDelete(log.id)}>Delete</button>
                  </div>
                </div>
            ))}
          </div>
        </section>
      </div>
  );
}
