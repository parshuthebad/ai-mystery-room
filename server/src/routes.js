import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Case from './models/Case.js';
import rateLimit from 'express-rate-limit';
import { askSuspect, generateMystery } from './gemini.js';
import { CLUE_POINTS, QUESTIONS_PER_SUSPECT, RULES, computeScore } from './rules.js';

const router = Router();
const genLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: 'Too many cases created. Wait a few minutes and try again.' } });
const askLimit = rateLimit({ windowMs: 10 * 60 * 1000, limit: 40, message: { error: 'Too many questions. Wait a few minutes and try again.' } });
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const fail = (status, message) => Object.assign(new Error(message), { status });

// Public view: never includes the solution; clue text and hints stay hidden until earned.
const publicCase = (c) => ({
  id: c.id,
  title: c.title,
  story: c.story,
  difficulty: c.difficulty,
  suspects: c.suspects,
  clues: c.clues.map((cl) => ({ id: cl.id, title: cl.title, discovered: cl.discovered, text: cl.discovered ? cl.text : null })),
  hints: c.hints.slice(0, c.hintsUsed).map((h) => h.text),
  hintsUsed: c.hintsUsed,
  hintsTotal: c.hints.length,
  interrogations: (c.interrogations || []).map(({ suspectId, question, answer }) => ({ suspectId, question, answer })),
  questionsPerSuspect: QUESTIONS_PER_SUSPECT,
  status: c.status,
});

async function load(id, withSolution = false) {
  if (!mongoose.isValidObjectId(id)) throw fail(404, 'Case not found.');
  const q = Case.findById(id);
  const c = await (withSolution ? q.select('+solution') : q);
  if (!c) throw fail(404, 'Case not found.');
  return c;
}
const requireActive = (c) => {
  if (c.status !== 'active') throw fail(409, 'This case is already closed.');
};

const createSchema = z.object({
  premise: z.string().trim().min(3, 'Describe your mystery in at least 3 characters.').max(300, 'Keep the premise under 300 characters.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

router.post('/', genLimit, wrap(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw fail(400, parsed.error.issues[0].message);
  const { premise, difficulty } = parsed.data;
  const mystery = await generateMystery(premise, difficulty);
  const c = await Case.create({ ...mystery, premise, difficulty });
  res.status(201).json(publicCase(c));
}));

router.get('/:id', wrap(async (req, res) => res.json(publicCase(await load(req.params.id)))));

router.post('/:id/clues/:clueId/discover', wrap(async (req, res) => {
  const c = await load(req.params.id);
  requireActive(c);
  const clue = c.clues.find((x) => x.id === req.params.clueId);
  if (!clue) throw fail(404, 'Clue not found.');
  clue.discovered = true;
  await c.save();
  res.json(publicCase(c));
}));

router.post('/:id/hints', wrap(async (req, res) => {
  const c = await load(req.params.id);
  requireActive(c);
  if (c.hintsUsed >= c.hints.length) throw fail(409, 'No hints left for this case.');
  c.hintsUsed += 1;
  await c.save();
  res.json(publicCase(c));
}));

router.post('/:id/interrogate', askLimit, wrap(async (req, res) => {
  const parsed = z.object({ suspectId: z.string(), question: z.string().trim().min(3, 'Ask a question of at least 3 characters.').max(200, 'Keep the question under 200 characters.') }).safeParse(req.body);
  if (!parsed.success) throw fail(400, parsed.error.issues[0].message);
  const c = await load(req.params.id, true);
  requireActive(c);
  const suspect = c.suspects.find((s) => s.id === parsed.data.suspectId);
  if (!suspect) throw fail(400, 'That suspect is not part of this case.');
  const history = c.interrogations.filter((i) => i.suspectId === suspect.id);
  if (history.length >= QUESTIONS_PER_SUSPECT) throw fail(409, `You have used all ${QUESTIONS_PER_SUSPECT} questions for ${suspect.name}.`);
  const answer = await askSuspect({ c, suspect, isCulprit: suspect.id === c.solution.culpritId, question: parsed.data.question, history });
  c.interrogations.push({ suspectId: suspect.id, question: parsed.data.question, answer });
  await c.save();
  res.json(publicCase(c));
}));

router.post('/:id/accuse', wrap(async (req, res) => {
  const parsed = z.object({ suspectId: z.string() }).safeParse(req.body);
  if (!parsed.success) throw fail(400, 'Choose a suspect to accuse.');
  const c = await load(req.params.id, true);
  requireActive(c);
  if (!c.suspects.some((s) => s.id === parsed.data.suspectId)) throw fail(400, 'That suspect is not part of this case.');
  const correct = parsed.data.suspectId === c.solution.culpritId;
  c.accusation = { suspectId: parsed.data.suspectId, correct };
  c.status = correct ? 'solved' : 'failed';
  c.score = computeScore({
    difficulty: c.difficulty,
    correct,
    cluesFound: c.clues.filter((x) => x.discovered).length,
    hintsUsed: c.hintsUsed,
  });
  await c.save();
  res.json({ correct, score: c.score });
}));

router.get('/:id/result', wrap(async (req, res) => {
  const c = await load(req.params.id, true);
  if (c.status === 'active') throw fail(403, 'Submit an accusation to see the result.');
  res.json({
    title: c.title,
    premise: c.premise,
    difficulty: c.difficulty,
    maxScore: RULES[c.difficulty].base + c.clues.length * CLUE_POINTS,
    correct: c.accusation.correct,
    score: c.score,
    accused: c.suspects.find((s) => s.id === c.accusation.suspectId)?.name,
    culprit: c.suspects.find((s) => s.id === c.solution.culpritId),
    explanation: c.solution.explanation,
    supportingClues: c.clues.filter((x) => c.solution.supportingClueIds.includes(x.id)).map(({ title, text }) => ({ title, text })),
    cluesFound: c.clues.filter((x) => x.discovered).length,
    cluesTotal: c.clues.length,
    hintsUsed: c.hintsUsed,
  });
}));

export default router;
