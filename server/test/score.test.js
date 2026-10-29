import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../src/rules.js';

test('easy, correct, all 5 clues, no hints', () =>
  assert.equal(computeScore({ difficulty: 'easy', correct: true, cluesFound: 5, hintsUsed: 0 }), 125));
test('hard, correct, 9 clues, 3 hints', () =>
  assert.equal(computeScore({ difficulty: 'hard', correct: true, cluesFound: 9, hintsUsed: 3 }), 215));
test('medium, wrong accusation still earns clue points', () =>
  assert.equal(computeScore({ difficulty: 'medium', correct: false, cluesFound: 3, hintsUsed: 1 }), 5));
test('score never drops below zero', () =>
  assert.equal(computeScore({ difficulty: 'easy', correct: false, cluesFound: 0, hintsUsed: 2 }), 0));
