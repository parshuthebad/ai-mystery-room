import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { ErrorBox, Loading } from '../ui';
import Interrogation from '../components/Interrogation.jsx';

const MARKS = ['', 'suspicious', 'cleared'];
const readMarks = (id) => { try { return JSON.parse(localStorage.getItem(`mr-marks-${id}`)) || {}; } catch { return {}; } };

export default function Room() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [marks, setMarks] = useState(() => readMarks(id));
  const cycle = (sid) => {
    const next = { ...marks, [sid]: MARKS[(MARKS.indexOf(marks[sid] || '') + 1) % MARKS.length] };
    setMarks(next);
    try { localStorage.setItem(`mr-marks-${id}`, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then((r) => (r.data.status !== 'active' ? nav(`/case/${id}/result`, { replace: true }) : setC(r.data)))
      .catch((e) => setErr(errMsg(e)));
  }, [id, nav]);

  const act = async (key, url) => {
    setBusy(key);
    setErr('');
    try {
      setC((await api.post(url)).data);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  if (!c) return err ? <div className="py-10"><ErrorBox>{err}</ErrorBox><Link to="/create" className="btn">Start a new case</Link></div> : <Loading>Opening the case file…</Loading>;

  const found = c.clues.filter((x) => x.discovered).length;
  const hintsLeft = c.hintsTotal - c.hintsUsed;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div>
        <p className="text-sm text-brass">Difficulty: {c.difficulty}</p>
        <h1 className="mt-1 font-type text-3xl sm:text-4xl">{c.title}</h1>
        <div className="mt-4 max-w-prose space-y-3 text-paper/90">
          {c.story.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <h2 className="mt-10 font-type text-2xl">Suspects</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {c.suspects.map((s) => (
            <article key={s.id} className={`card ${marks[s.id] === 'cleared' ? 'opacity-60' : ''} ${marks[s.id] === 'suspicious' ? 'outline outline-2 outline-string' : ''}`}>
              <h3 className={`font-type text-xl ${marks[s.id] === 'cleared' ? 'line-through' : ''}`}>{s.name}</h3>
              <p className="text-sm text-string">{s.role}</p>
              <p className="mt-2 text-sm">{s.description}</p>
              <p className="mt-2 text-sm"><span className="font-semibold">Alibi:</span> {s.alibi}</p>
              <button onClick={() => cycle(s.id)} className="mt-3 rounded-sm border border-ink/40 px-2.5 py-1 text-xs font-semibold hover:bg-ink/10" aria-label={`Change note for ${s.name}`}>
                Note: {marks[s.id] || 'none'}
              </button>
            </article>
          ))}
        </div>

        <Interrogation c={c} id={id} setC={setC} />

        <h2 className="mt-10 font-type text-2xl">Evidence</h2>
        <ErrorBox>{err}</ErrorBox>
        <ul className="mt-3 space-y-3">
          {c.clues.map((cl) => (
            <li key={cl.id} className={`card flex flex-wrap items-center justify-between gap-3 ${cl.discovered ? '' : 'opacity-80'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{cl.title}</p>
                {cl.discovered ? <p className="mt-1 text-sm">{cl.text}</p> : <p className="mt-1 text-sm text-ink/60">Not examined yet.</p>}
              </div>
              {!cl.discovered && (
                <button className="btn" disabled={!!busy} onClick={() => act(cl.id, `/cases/${id}/clues/${cl.id}/discover`)}>
                  {busy === cl.id ? 'Examining…' : 'Examine'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card">
          <h2 className="font-type text-xl">Progress</h2>
          <p className="mt-2 text-sm">Clues found: {found} of {c.clues.length}</p>
          <p className="text-sm">Hints used: {c.hintsUsed} of {c.hintsTotal}</p>
          <button className="btn mt-4 w-full" disabled={!!busy || hintsLeft === 0} onClick={() => act('hint', `/cases/${id}/hints`)}>
            {busy === 'hint' ? 'Thinking…' : hintsLeft === 0 ? 'No hints left' : 'Get a hint (−10 points)'}
          </button>
          {c.hints.length > 0 && (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              {c.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          )}
        </div>
        <Link to={`/case/${id}/accuse`} className="btn-ghost mt-4 block w-full text-center">Make an accusation</Link>
      </aside>
    </div>
  );
}
