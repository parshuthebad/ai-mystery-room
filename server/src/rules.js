export const RULES = {
  easy: { suspects: 3, clues: 5, hints: 2, base: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, base: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, base: 200 },
};
export const CLUE_POINTS = 5;
export const HINT_PENALTY = 10;

export const computeScore = ({ difficulty, correct, cluesFound, hintsUsed }) =>
  Math.max(0, (correct ? RULES[difficulty].base : 0) + cluesFound * CLUE_POINTS - hintsUsed * HINT_PENALTY);
export const QUESTIONS_PER_SUSPECT = 3;
