import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { ErrorBox, Loading } from '../ui';
import { updateCase } from '../history';

const rank = (r) => {
  if (!r.correct) return 'The case went cold';
  const pct = r.score / r.maxScore;
  return pct >= 0.9 ? 'Master detective' : pct >= 0.7 ? 'Seasoned detective' : 'Rookie detective';
};

export default function Result() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/cases/${id}/result`).then((x) => { setR(x.data); updateCase(id, { score: x.data.score, correct: x.data.correct }); }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  if (!r) return err ? <div className="py-10"><ErrorBox>{err}</ErrorBox><Link to={`/case/${id}`} className="btn">Back to the case</Link></div> : <Loading>Reading the verdict…</Loading>;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-brass">{r.title}</p>
      <h1 className={`mt-1 font-type text-4xl sm:text-5xl ${r.correct ? '' : 'text-string'}`}>
        {r.correct ? 'Case solved.' : 'Wrong suspect.'}
      </h1>
      <p className="mt-3 text-lg text-paper/90">
        {r.correct ? `You were right: ${r.culprit.name} did it.` : `You accused ${r.accused}. The culprit was ${r.culprit.name}.`}
      </p>

      <div className="card mt-6">
        <p className="font-type text-5xl">{r.score} points</p>
        <p className="mt-1 font-semibold text-string">{rank(r)} (best possible: {r.maxScore})</p>
        <p className="mt-1 text-sm text-ink/70">
          {r.correct ? 'Correct accusation bonus' : 'No accusation bonus'}, {r.cluesFound} of {r.cluesTotal} clues found, {r.hintsUsed} {r.hintsUsed === 1 ? 'hint' : 'hints'} used
        </p>
      </div>

      <div className="card mt-4">
        <h2 className="font-type text-2xl">How it happened</h2>
        <p className="mt-2">{r.explanation}</p>
        <h3 className="mt-5 font-semibold">The clues that prove it</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {r.supportingClues.map((c, i) => <li key={i}><span className="font-semibold">{c.title}:</span> {c.text}</li>)}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/create" className="btn">Start another case</Link>
        <Link to={`/create?premise=${encodeURIComponent(r.premise)}&difficulty=${r.difficulty}`} className="btn-ghost">Same premise, new case</Link>
      </div>
    </div>
  );
}
