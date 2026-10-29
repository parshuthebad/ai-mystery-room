import { Link } from 'react-router-dom';
import { getHistory } from '../history';

export default function Home() {
  const history = getHistory();
  return (
    <section className="py-10 sm:py-20">
      <h1 className="max-w-2xl font-type text-4xl leading-tight sm:text-6xl">
        Someone in this room did it.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-paper/85">
        Give the AI a premise. It writes the case, the suspects and the clues. You find the culprit, and the verdict stays sealed until you name them.
      </p>
      <Link to="/create" className="btn mt-8">Start a case</Link>
      <ul className="mt-14 grid gap-4 text-paper/85 sm:grid-cols-3">
        <li className="border-t border-brass pt-3">Pick a setting and a difficulty. Easy cases have 3 suspects, hard ones have 5.</li>
        <li className="border-t border-brass pt-3">Examine clues and ask for hints. Each clue earns points, each hint costs points.</li>
        <li className="border-t border-brass pt-3">Make one accusation. The verdict and the full explanation follow.</li>
      </ul>
      {history.length > 0 && (
        <div className="mt-14">
          <h2 className="font-type text-2xl">Your cases</h2>
          <ul className="mt-3 divide-y divide-paper/20">
            {history.map((h) => (
              <li key={h.id}>
                <Link to={`/case/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brass">
                  <span>{h.title} <span className="text-sm text-paper/60">({h.difficulty})</span></span>
                  <span className="text-sm">{h.score !== undefined ? `${h.score} points` : 'In progress'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
