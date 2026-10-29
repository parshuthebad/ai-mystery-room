import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { ErrorBox, Loading } from '../ui';

export default function Accuse() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [pick, setPick] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then((r) => (r.data.status !== 'active' ? nav(`/case/${id}/result`, { replace: true }) : setC(r.data)))
      .catch((e) => setErr(errMsg(e)));
  }, [id, nav]);

  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.post(`/cases/${id}/accuse`, { suspectId: pick });
      nav(`/case/${id}/result`);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  if (!c) return err ? <ErrorBox>{err}</ErrorBox> : <Loading />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-type text-3xl">Who did it?</h1>
      <p className="mt-2 text-paper/85">You get one accusation. Once you submit, the case closes.</p>
      <div role="radiogroup" aria-label="Suspects" className="mt-6 space-y-3">
        {c.suspects.map((s) => (
          <label key={s.id} className={`card flex cursor-pointer items-start gap-3 ${pick === s.id ? 'outline outline-2 outline-string' : ''}`}>
            <input type="radio" name="suspect" className="mt-1.5 accent-[#b23a35]" checked={pick === s.id} onChange={() => setPick(s.id)} />
            <span><span className="font-type text-xl">{s.name}</span><span className="block text-sm text-ink/70">{s.role}</span></span>
          </label>
        ))}
      </div>
      <ErrorBox>{err}</ErrorBox>
      <div className="mt-6 flex gap-3">
        <button className="btn" disabled={!pick || busy} onClick={submit}>{busy ? 'Submitting…' : 'Accuse this suspect'}</button>
        <Link to={`/case/${id}`} className="btn-ghost">Back to the case</Link>
      </div>
    </div>
  );
}
