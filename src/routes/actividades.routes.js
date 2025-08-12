import { Router } from 'express';
import { pool } from '../db.js';
const r = Router();

// Listar actividades (opcional: filtro asignatura_id y nivel)
r.get('/', async (req, res) => {
  const { asignatura_id, nivel } = req.query;
  const params = [];
  let where = 'activo=1';
  if (asignatura_id) { where += ' AND asignatura_id=?'; params.push(asignatura_id); }
  if (nivel)        { where += ' AND nivel=?';         params.push(nivel); }
  const [rows] = await pool.query(
    `SELECT id, titulo, asignatura_id, nivel, tipo, puntos_base, intentos_max, fecha_publicacion
     FROM edu_actividad WHERE ${where} ORDER BY fecha_publicacion DESC`, params);
  res.json(rows);
});

// Obtener detalle (incluye contenido JSON)
r.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, titulo, asignatura_id, nivel, tipo, contenido, puntos_base, intentos_max
     FROM edu_actividad WHERE id=? AND activo=1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
});

export default r;
