import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { ErrorBox, Loading } from '../ui';
import { addCase } from '../history';

const IDEAS = [
  'A priceless violin vanishes backstage before a concert',
  'A scientist is found locked in a lab on a research ship',
  'The winning cake is sabotaged at a village baking contest',
  'A diamond goes missing during a masquerade on a night train',
];

const LEVELS = [
  { id: 'easy', label: 'Easy', note: '3 suspects, 5 clues, 2 hints' },
  { id: 'medium', label: 'Medium', note: '4 suspects, 7 clues, 3 hints' },
  { id: 'hard', label: 'Hard', note: '5 suspects, 9 clues, 3 hints' },
];

export default function Create() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [premise, setPremise] = useState(params.get('premise') || '');
  const [difficulty, setDifficulty] = useState(['easy', 'medium', 'hard'].includes(params.get('difficulty')) ? params.get('difficulty') : 'easy');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (premise.trim().length < 3) return setErr('Describe your mystery in at least 3 characters.');
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.post('/cases', { premise, difficulty });
      addCase({ id: data.id, title: data.title, difficulty, premise });
      nav(`/case/${data.id}`);
    } catch (e2) {
      setErr(errMsg(e2));
      setLoading(false);
    }
  };

  if (loading) return <Loading>Writing your case file… this can take up to 30 seconds.</Loading>;

  return (
    <form onSubmit={submit} className="card mx-auto mt-4 max-w-2xl">
      <h1 className="font-type text-3xl">Open a new case</h1>
      <label htmlFor="premise" className="mt-5 block font-semibold">What is the mystery about?</label>
      <textarea
        id="premise" rows={3} maxLength={300} value={premise} onChange={(e) => setPremise(e.target.value)}
        placeholder="A jewel goes missing during a masquerade on a night train"
        className="mt-2 w-full rounded-sm border border-ink/30 bg-white/60 p-3 focus:outline focus:outline-2 focus:outline-brass"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((i) => (
          <button type="button" key={i} onClick={() => setPremise(i)} className="rounded-sm border border-ink/30 px-2.5 py-1 text-left text-xs hover:bg-ink/10">{i}</button>
        ))}
      </div>
      <fieldset className="mt-5">
        <legend className="font-semibold">Difficulty</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.id} className={`cursor-pointer rounded-sm border p-3 ${difficulty === l.id ? 'border-string bg-string/10' : 'border-ink/30'}`}>
              <input type="radio" name="difficulty" value={l.id} checked={difficulty === l.id} onChange={() => setDifficulty(l.id)} className="mr-2 accent-[#b23a35]" />
              <span className="font-semibold">{l.label}</span>
              <span className="mt-1 block text-sm text-ink/70">{l.note}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <ErrorBox>{err}</ErrorBox>
      <button type="submit" className="btn mt-6">Generate mystery</button>
    </form>
  );
}
