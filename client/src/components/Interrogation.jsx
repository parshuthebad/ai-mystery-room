import { useState } from 'react';
import { api, errMsg } from '../api';
import { ErrorBox } from '../ui';

export default function Interrogation({ c, id, setC }) {
  const [sel, setSel] = useState(c.suspects[0].id);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const suspect = c.suspects.find((s) => s.id === sel);
  const log = c.interrogations.filter((i) => i.suspectId === sel);
  const left = c.questionsPerSuspect - log.length;

  const ask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      setC((await api.post(`/cases/${id}/interrogate`, { suspectId: sel, question: q })).data);
      setQ('');
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="font-type text-2xl">Interrogation</h2>
      <p className="mt-1 text-sm text-paper/80">Question each suspect, up to {c.questionsPerSuspect} questions each. The guilty one will lie.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Choose a suspect to question">
        {c.suspects.map((s) => (
          <button key={s.id} role="tab" aria-selected={sel === s.id} onClick={() => { setSel(s.id); setErr(''); }}
            className={`rounded-sm px-3 py-1.5 text-sm font-semibold ${sel === s.id ? 'bg-paper text-ink' : 'border border-paper/40 text-paper hover:bg-paper/10'}`}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="card mt-3">
        {log.length === 0 && <p className="text-sm text-ink/60">No questions asked yet. Try asking {suspect.name} where they were, or what they saw.</p>}
        <ul className="space-y-3">
          {log.map((i, k) => (
            <li key={k} className="text-sm">
              <p className="font-semibold">You: {i.question}</p>
              <p className="mt-1 border-l-2 border-string pl-3">{suspect.name}: {i.answer}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={ask} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="q" className="sr-only">Your question</label>
          <input id="q" value={q} maxLength={200} onChange={(e) => setQ(e.target.value)} disabled={busy || left === 0}
            placeholder={left === 0 ? 'No questions left for this suspect' : `Ask ${suspect.name} a question`}
            className="flex-1 rounded-sm border border-ink/30 bg-white/60 p-2.5 focus:outline focus:outline-2 focus:outline-brass" />
          <button className="btn" disabled={busy || left === 0 || q.trim().length < 3}>{busy ? 'Waiting…' : `Ask (${left} left)`}</button>
        </form>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </section>
  );
}
