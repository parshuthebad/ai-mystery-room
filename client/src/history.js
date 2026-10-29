const KEY = 'mr-history';
export const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};
const save = (h) => { try { localStorage.setItem(KEY, JSON.stringify(h.slice(0, 20))); } catch { /* storage unavailable */ } };
export const addCase = (c) => save([c, ...getHistory().filter((x) => x.id !== c.id)]);
export const updateCase = (id, patch) => save(getHistory().map((x) => (x.id === id ? { ...x, ...patch } : x)));
