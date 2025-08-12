import { Router } from 'express';
import { pool } from '../db.js';
const r = Router();

r.get('/asignaturas', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, codigo FROM edu_asignatura WHERE activo=1 ORDER BY id');
  res.json(rows);
});

r.get('/cursos', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, nivel, letra FROM edu_curso ORDER BY nivel, letra');
  res.json(rows);
});

export default r;
