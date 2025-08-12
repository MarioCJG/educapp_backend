import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

// GET /ranking/curso/:cursoId
r.get('/curso/:cursoId', async (req, res) => {
  const { cursoId } = req.params;
  const [rows] = await pool.query(
    `SELECT * FROM v_leaderboard_por_curso WHERE curso_id=? ORDER BY posicion ASC`,
    [cursoId]
  );
  res.json(rows);
});

// GET /ranking/puntos/:estudianteId
r.get('/puntos/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;
  const [[row]] = await pool.query(`SELECT puntos FROM edu_estudiante WHERE id=?`, [estudianteId]);
  if (!row) return res.status(404).json({ error: 'No encontrado' });
  res.json(row);
});

export default r;
