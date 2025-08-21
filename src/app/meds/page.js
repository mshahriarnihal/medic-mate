'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
 

/* adding this part for the CapsuleButton */
function CapsuleButton({ taken, required, onMark }) {
    const [crack, setCrack] = useState(false);
    const completed = taken >= required;

    const handleClick = async () => {
        if (completed) return;
        setCrack(true);                 // it starts crack animation on the capsule button
        setTimeout(async () => {
            await onMark?.();
            setCrack(false);              // it resets animation state
        }, 420);                        // keep in sync with CSS transition duration
    };

    if (completed) {
        return (
            <div className="pill-done" role="status" aria-live="polite" title="All doses taken">
                <span className="box-icon" aria-hidden>➕</span>
                <span className="pill-done-text">All doses taken</span>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`pill ${crack ? 'pill-crack' : ''}`}
            aria-label="Mark dose taken"
        >
            {/* left & right halves */}
            <span className="pill-half pill-left">
        <span className="pill-shine" />
      </span>
            <span className="pill-seam" aria-hidden />
            <span className="pill-half pill-right">
        <span className="pill-shine" />
      </span>

            {/* label */}
            <span className="pill-label">Mark dose taken</span>

            {/* high-contrast small counter (Taken/Required) */}
            <span
                className="pill-counter"
                title="Taken / Required"
                style={{
                    background: 'rgba(0,0,0,0.55)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.28)',
                    fontWeight: 700
                }}
            >
        {taken}/{required}
      </span>
        </button>
    );
}
/* modification for the CapsuleButton part ends here */

export default function MedsPage() {
    const [meds, setMeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const [form, setForm] = useState({
        name: '',
        dosage: '',
        timesPerDay: 1,
        startDate: '',
        expiryDate: '',
        doseTimes: '',   /* this makes it as "comma separated" */
        notes: '',
    });

    async function loadMeds() {
        const res = await fetch('/api/meds');
        const data = await res.json();
        setMeds(Array.isArray(data) ? data : []);
    }

    useEffect(() => { loadMeds(); }, []);

    function onChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function addMed(e) {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const res = await fetch('/api/meds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    dosage: form.dosage || undefined,
                    timesPerDay: Number(form.timesPerDay),
                    startDate: form.startDate || undefined,
                    expiryDate: form.expiryDate || undefined,
                    notes: form.notes || undefined,
                    doseTimes: form.doseTimes
                        ? form.doseTimes.split(',').map(t => t.trim()).filter(Boolean)
                        : [],
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg('Medication added.');
                setForm({
                    name: '',
                    dosage: '',
                    timesPerDay: 1,
                    startDate: '',
                    expiryDate: '',
                    doseTimes: '',
                    notes: '',
                });
                loadMeds();
            } else {
                setMsg(data?.error || 'Error adding medication.');
            }
        } catch {
            setMsg('Network error.');
        } finally {
            setLoading(false);
        }
    }

    async function markTaken(id) {
        setLoading(true);
        try {
            await fetch('/api/meds/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medId: id }),
            });
            await loadMeds();
        } finally {
            setLoading(false);
        }
    }

    async function removeMed(id) {
        if (!confirm('Delete this medication and its logs?')) return;
        setLoading(true);
        try {
            await fetch('/api/meds', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            await loadMeds();
        } finally {
            setLoading(false);
        }
    }

    // Aggregate adherence for today across all meds
    const adherence = (() => {
        const totalReq = meds.reduce((a, m) => a + (m.requiredToday || 0), 0);
        const totalTaken = meds.reduce((a, m) => a + (m.takenToday || 0), 0);
        if (!totalReq) return 0;
        return Math.round((totalTaken / totalReq) * 100);
    })();

    return (
        <div style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
            <Link href="/" className="link-soft">← Back to Reaction Logger</Link>
            <h1 className="title-xl" style={{ marginTop: 8 }}>Medication Schedule & Adherence</h1>
            <p className="muted">Add your meds, planned dose times, and see expiry reminders. </p>

            {/*  Form part */}
            <form
                onSubmit={addMed}
                style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))',
                    margin: '18px 0',
                    background: 'rgba(16,20,28,0.55)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 16
                }}
            >
                <div style={{ gridColumn: '1 / 3' }}>
                    <label className="subtle">Name<br />
                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            required
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div>
                    <label className="subtle">Dosage (e.g., 500mg)<br />
                        <input
                            name="dosage"
                            value={form.dosage}
                            onChange={onChange}
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div>
                    <label className="subtle">Times per day<br />
                        <input
                            type="number"
                            min="1"
                            max="24"
                            name="timesPerDay"
                            value={form.timesPerDay}
                            onChange={onChange}
                            required
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div>
                    <label className="subtle">Start date<br />
                        <input
                            type="date"
                            name="startDate"
                            value={form.startDate}
                            onChange={onChange}
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div>
                    <label className="subtle">Expiry date<br />
                        <input
                            type="date"
                            name="expiryDate"
                            value={form.expiryDate}
                            onChange={onChange}
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div style={{ gridColumn: '1 / 3' }}>
                    <label className="subtle">Dose times (comma separated, e.g., 08:00, 14:00, 20:00)<br />
                        <input
                            name="doseTimes"
                            value={form.doseTimes}
                            onChange={onChange}
                            placeholder="08:00, 14:00"
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div style={{ gridColumn: '1 / 3' }}>
                    <label className="subtle">Notes<br />
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={onChange}
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </label>
                </div>

                <div style={{ gridColumn: '1 / 3' }}>
                    <button type="submit" disabled={loading} className="btn-primary" style={{   height: '50px',
                        fontSize: '21px',
                        fontWeight: 'bold',
                        color: '#FFFFFF',
                        background: '#DA291C' /* strong pantone 485 styled red which is typically used as ambulance's red color. */
                    }}>

                        {loading ? 'Saving…' : 'Add Medication'}
                    </button>
                </div>
            </form>

            {msg && (
                <div style={{
                    marginBottom: 14,
                    color: '#9effb5',
                    background: 'rgba(17,37,22,0.6)',
                    border: '1px solid rgba(97,255,162,0.35)',
                    padding: '10px 12px',
                    borderRadius: 10
                }}>
                    {msg}
                </div>
            )}

            {/*  Summary  */}
            <h3 className="section-title">Today’s Adherence: {adherence}%</h3>
            <div
                aria-hidden
                style={{
                    height: 10, borderRadius: 999, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.06)',
                    marginBottom: 16
                }}
            >
                <div style={{
                    width: `${adherence}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #9AE6B4, #63B3ED)',
                    transition: 'width .4s ease'
                }} />
            </div>

            {/*  List  */}
            <div className="stack-12">
                {meds.length === 0 && <div className="muted">No medications yet.</div>}

                {meds.map(m => (
                    <div key={m.id} className="card-med">
                        <div className="card-med-top">
                            <div>
                                <b>{m.name}</b>{m.dosage ? ` — ${m.dosage}` : ''}<br />
                                <span className="subtle">Times per day: {m.timesPerDay}</span><br />

                                {Array.isArray(m.doseTimes) && m.doseTimes.length > 0 && (
                                    <div className="subtle" style={{ marginTop: 4 }}>
                                        <strong>Planned times:</strong> {m.doseTimes.join(', ')}
                                    </div>
                                )}

                                {m.expiryDate && (
                                    <div className={`subtle ${m.expiringSoon ? 'warn' : ''}`} style={{ marginTop: 4 }}>
                                        Expiry: {new Date(m.expiryDate).toLocaleDateString()}
                                        {typeof m.daysToExpiry === 'number'
                                            ? ` (${m.daysToExpiry} day${m.daysToExpiry === 1 ? '' : 's'} left)`
                                            : ''}
                                        {m.expiringSoon ? ' — ⚠️ expiring soon' : ''}
                                    </div>
                                )}

                                {/* might need this part later for debugging */}
                                <div className="subtle" style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                                    ID #{m.id}
                                </div>
                            </div>

                            <div className="pill-wrap">
                                <div className="subtle" style={{ textAlign: 'right', marginBottom: 6 }}>
                                    Today: <b>{m.takenToday}/{m.requiredToday}</b>
                                </div>
                                <CapsuleButton
                                    taken={m.takenToday}
                                    required={m.requiredToday}
                                    onMark={() => markTaken(m.id)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <button onClick={() => removeMed(m.id)} className="btn-danger">
                                Delete medication
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
