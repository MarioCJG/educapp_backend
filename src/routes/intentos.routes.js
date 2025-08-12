import { Router } from 'express';
import { pool } from '../db.js';
const r = Router();

// Estado de intento para una actividad dada
// GET /intentos/estado?estudiante_id=1&actividad_id=2
r.get('/estado', async (req, res) => {
  const { estudiante_id, actividad_id } = req.query;
  if (!estudiante_id || !actividad_id) return res.status(400).json({ error: 'Faltan params' });

  const [rows] = await pool.query(
    `SELECT id, estado, score, correctas, total_preguntas, started_at, finished_at
     FROM edu_intento
     WHERE estudiante_id=? AND actividad_id=?
     ORDER BY intento_num DESC
     LIMIT 1`,
    [estudiante_id, actividad_id]
  );

  if (!rows.length) return res.json({ existe: false });
  return res.json({ existe: true, intento: rows[0] });
});

// Historial del alumno
// GET /intentos/mios?estudiante_id=1
r.get('/mios', async (req, res) => {
  const { estudiante_id } = req.query;
  if (!estudiante_id) return res.status(400).json({ error: 'Faltan params' });
  const [rows] = await pool.query(
    `SELECT i.id, i.actividad_id, i.estado, i.score, i.correctas, i.total_preguntas,
            i.started_at, i.finished_at, a.titulo, a.nivel, a.asignatura_id
     FROM edu_intento i
     JOIN edu_actividad a ON a.id = i.actividad_id
     WHERE i.estudiante_id=?
     ORDER BY i.started_at DESC
     LIMIT 50`,
    [estudiante_id]
  );
  res.json(rows);
});

// Iniciar intento respetando intentos_max
r.post('/start', async (req, res) => {
  const { estudiante_id, actividad_id } = req.body;
  if (!estudiante_id || !actividad_id) return res.status(400).json({ error: 'Faltan campos' });

  const [[act]] = await pool.query(
    `SELECT intentos_max FROM edu_actividad WHERE id=? AND activo=1`,
    [actividad_id]
  );
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada o inactiva' });

  const [ya] = await pool.query(
    `SELECT COUNT(*) AS n FROM edu_intento WHERE estudiante_id=? AND actividad_id=?`,
    [estudiante_id, actividad_id]
  );
  if (ya[0].n >= act.intentos_max) {
    return res.status(409).json({ error: 'Se alcanzó el máximo de intentos' });
  }

  const [ins] = await pool.query(
    `INSERT INTO edu_intento (estudiante_id, actividad_id, intento_num, estado, score, correctas, total_preguntas)
     VALUES (?,?,?, 'pendiente', 0,0,0)`,
    [estudiante_id, actividad_id, ya[0].n + 1]
  );
  res.json({ ok: true, intento_id: ins.insertId });
});

// Finalizar intento (igual que antes)
r.post('/finish', async (req, res) => {
  const { intento_id, score, correctas, total_preguntas, duracion_seg, data } = req.body;

  await pool.query(
    `UPDATE edu_intento SET estado='completado', score=?, correctas=?, total_preguntas=?, duracion_seg=?, data=?, finished_at=NOW()
     WHERE id=?`,
    [score || 0, correctas || 0, total_preguntas || 0, duracion_seg || null, data ? JSON.stringify(data) : null, intento_id]
  );

  const [[it]] = await pool.query('SELECT estudiante_id FROM edu_intento WHERE id=?', [intento_id]);
  const delta = Number(score || 0);
  await pool.query('UPDATE edu_estudiante SET puntos = puntos + ? WHERE id=?', [delta, it.estudiante_id]);
  await pool.query(
    `INSERT INTO edu_puntos_ledger (estudiante_id, origen, referencia_id, delta, descripcion)
     VALUES (?,?,?,?,?)`,
    [it.estudiante_id, 'actividad', intento_id, delta, 'Puntos por actividad']
  );

  res.json({ ok: true });
});

export default r;
