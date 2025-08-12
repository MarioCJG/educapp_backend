import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db.js'; // asegura conexión
import authRoutes from './routes/auth.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import actividadesRoutes from './routes/actividades.routes.js';
import intentosRoutes from './routes/intentos.routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/catalogo', catalogoRoutes);
app.use('/actividades', actividadesRoutes);
app.use('/intentos', intentosRoutes);

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
