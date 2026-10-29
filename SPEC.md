# SPEC.md: AI Mystery Room

## 1. Project requirements
**Overview.** AI Mystery Room is a web app where a player types a mystery premise, picks a difficulty, and Gemini generates a whodunit (story, suspects, clues, hints). The player investigates, then accuses one suspect and receives a verdict and score.

**Problem.** Mystery games are fixed and replayable only once. Generating a fresh, logically solvable case on demand makes each play new.

**Target users.** Casual players (students, puzzle fans) on phone or desktop. No account needed.

**Core features.** Generate a case at 3 difficulties; reveal clues one by one; request hints; accuse a suspect; see verdict, culprit, explanation and score; start another case.
**Implemented enhancements.** AI suspect interrogation (3 questions per suspect), personal suspect notes, local case history, detective rank, replay with the same premise, rate limiting.
**Future ideas.** Accounts, share link, leaderboard.

**Stack.** React + Vite, Tailwind CSS, React Router, Axios; Node.js, Express, MongoDB with Mongoose, Zod; Gemini API (`@google/genai`).

**Limitations.** One accusation per case. No user accounts. Premise max 300 characters. Content is family-friendly. Generation can take up to about 30 seconds.

**Deliverables.** Public GitHub repo with README, deployed frontend (Vercel), deployed backend, MongoDB Atlas database, this SPEC.md.

## 2. User flow
1. Open the website (Home).
2. Enter a premise and choose Easy, Medium or Hard (Create Mystery).
3. Backend asks Gemini for a mystery, validates it, saves it.
4. Player lands in the Investigation Room and reads the story and suspects.
5. Player examines clues, each reveals its text and adds points.
6. Player requests hints if stuck, each costs points.
7. Player opens the Accusation page, selects a suspect, submits.
8. Results page shows verdict, culprit, explanation, supporting clues, score.
9. Player starts another mystery.

## 3. Pages
| Page | Route | Purpose and elements |
|---|---|---|
| Home | `/` | Intro, how it works, "Start a case" button |
| Create Mystery | `/create` | Premise textarea, difficulty radios, "Generate mystery" button |
| Investigation Room | `/case/:id` | Story, suspect cards (role, description, alibi, personal note), interrogation panel, clue list with "Examine", hint panel, progress (clues found, hints used), link to accuse |
| Accusation | `/case/:id/accuse` | Suspect radio list, submit, back link |
| Results | `/case/:id/result` | Verdict, score and breakdown, culprit, explanation, supporting clues, "Start another case" |

**Loading states.** Create shows "Writing your case file…"; Room, Accuse, Result show a loading message; buttons show a busy label and disable.
**Errors.** Inline alert with the server message (validation, 404, 409, 502) or a network message. Unknown routes show a "page doesn't exist" screen.
**Navigation.** Header links to Home and New case. Closed cases redirect Room and Accuse to Results.
**Responsive.** Single column on mobile; Room uses a two-column layout with a sticky sidebar from the `lg` breakpoint. Visible keyboard focus; reduced motion respected.
**UI direction.** Evidence-table look: felt green background, paper cards, brass buttons, red for verdict emphasis, typewriter headings (Special Elite) with Work Sans body. A Stitch AI mockup can replace this and should map to the table above.

## 4. Backend and database
**Endpoints** (all JSON, prefix `/api`)

| Method and path | Request | Response |
|---|---|---|
| `POST /cases` | `{premise, difficulty}` | 201 public case |
| `GET /cases/:id` | none | public case |
| `POST /cases/:id/clues/:clueId/discover` | none | public case |
| `POST /cases/:id/hints` | none | public case |
| `POST /cases/:id/interrogate` | `{suspectId, question}` | public case with the new answer |
| `POST /cases/:id/accuse` | `{suspectId}` | `{correct, score}` |
| `GET /cases/:id/result` | none | verdict object (only after accusation) |
| `GET /health` | none | `{ok:true}` |

**Interrogation.** Max 3 questions per suspect, question 3 to 200 chars. Innocent suspects never receive the solution in their prompt; the culprit's prompt contains it with orders to deceive and never confess. Answers are stored on the case.
**Rate limits.** 10 case generations per 15 minutes and 40 questions per 10 minutes per IP.
**Public case** = `{id, title, story, difficulty, suspects[{id,name,role,description,alibi}], clues[{id,title,discovered,text|null}], hints[revealed only], hintsUsed, hintsTotal, interrogations[], questionsPerSuspect, status}`. It never contains the solution.

**Validation.** Premise 3 to 300 chars; difficulty in easy/medium/hard; invalid ObjectId gives 404; suspectId must belong to the case.
**Errors.** 400 invalid input, 403 result before accusation, 404 missing case or clue, 409 case closed or no hints left, 502 AI failure, 500 anything else (generic message, details logged).

**Case model.** `title, story, premise, difficulty, suspects[], clues[{id,title,text,discovered}], hints[{text}], hintsUsed, solution{culpritId, explanation, supportingClueIds} (select:false), status (active|solved|failed), accusation{suspectId, correct}, score, timestamps`.

**Security.** The solution field is excluded from queries by default and is only selected in `accuse` and `result`. Clue text and unused hints are stripped by the serializer. API keys live in backend `.env` only. CORS is limited to `CLIENT_URL`.

## 5. AI behavior and scoring
**Gemini output** (JSON only): `title, story, suspects[{name,role,description,alibi}], clues[{title,text}], hints[string], culpritIndex, explanation, supportingClueNumbers[]`.

| Difficulty | Suspects | Clues | Hints |
|---|---|---|---|
| Easy | 3 | 5 | 2 |
| Medium | 4 | 7 | 3 |
| Hard | 5 | 9 | 3 |

**Validation before saving** (Zod plus checks): exact counts per difficulty; culprit index in range; at least 2 supporting clues, all in range; hints must not contain the culprit's name. On failure, retry up to 3 times, then return 502. The premise is wrapped as untrusted inspiration in the prompt.

**Scoring** (backend only, computed once at accusation):
- Correct accusation: Easy 100, Medium 150, Hard 200. Wrong: 0.
- Each discovered clue: +5.
- Each hint used: -10.
- Minimum score 0.

## 6. Acceptance criteria
- [ ] Mysteries generate at Easy, Medium and Hard with the correct counts.
- [ ] Players can examine clues, request hints (up to the limit) and accuse once.
- [ ] No response before the accusation contains the culprit or explanation.
- [ ] Scores are computed and stored by the backend per the rules.
- [ ] Results show the correct culprit, explanation and supporting clues.
- [ ] Suspects can be questioned up to the limit, and the answers never reveal the solution outright.
- [ ] Invalid AI output and API failures show a clear error and never crash the app.
- [ ] The full flow works on the deployed site.
