import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/cases', routes);

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.status) return res.status(err.status).json({ error: err.message });
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

await mongoose.connect(process.env.MONGODB_URI);
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on ${port}`));
