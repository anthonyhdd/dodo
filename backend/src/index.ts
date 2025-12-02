import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import voiceRoutes from './routes/voiceRoutes';
import childRoutes from './routes/childRoutes';
import lullabyRoutes from './routes/lullabyRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/voice', voiceRoutes);
app.use('/api/children', childRoutes);
app.use('/api/lullabies', lullabyRoutes);

app.get('/', (req: express.Request, res: express.Response) => {
  res.send({ ok: true, service: 'DODO backend' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`DODO backend listening on port ${port}`);
  console.log(`Accessible at http://localhost:${port} or http://192.168.1.155:${port}`);
});

