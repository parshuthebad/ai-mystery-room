import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Create from './pages/Create.jsx';
import Room from './pages/Room.jsx';
import Accuse from './pages/Accuse.jsx';
import Result from './pages/Result.jsx';

export default function App() {
  return (
    <>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-type text-2xl text-paper">AI Mystery Room</Link>
        <Link to="/create" className="text-sm text-brass underline-offset-4 hover:underline">New case</Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/case/:id" element={<Room />} />
          <Route path="/case/:id/accuse" element={<Accuse />} />
          <Route path="/case/:id/result" element={<Result />} />
          <Route path="*" element={<div className="py-20 text-center"><p className="font-type text-xl">That page doesn’t exist.</p><Link to="/" className="btn mt-6">Back to start</Link></div>} />
        </Routes>
      </main>
    </>
  );
}
