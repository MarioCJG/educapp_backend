import { Router } from 'express';
import { pool } from '../db.js';
const r = Router();

// Iniciar intento (1 intento por actividad para simplificar)
r.post('/start', async (req, res) => {
  const { estudiante_id, actividad_id } = req.body;
  if (!estudiante_id || !actividad_id) return res.status(400).json({ error: 'Faltan campos' });

  const [ya] = await pool.query(
    `SELECT id FROM edu_intento WHERE estudiante_id=? AND actividad_id=?`,
    [estudiante_id, actividad_id]
  );
  if (ya.length) {
    return res.status(409).json({ error: 'Ya existe intento para esta actividad' });
  }

  const [ins] = await pool.query(
    `INSERT INTO edu_intento (estudiante_id, actividad_id, intento_num, estado, score, correctas, total_preguntas)
     VALUES (?,?,1,'pendiente',0,0,0)`,
    [estudiante_id, actividad_id]
  );
  res.json({ ok: true, intento_id: ins.insertId });
});

// Finalizar intento (suma puntos y registra en ledger)
r.post('/finish', async (req, res) => {
  const { intento_id, score, correctas, total_preguntas, duracion_seg, data } = req.body;

  await pool.query(
    `UPDATE edu_intento SET estado='completado', score=?, correctas=?, total_preguntas=?, duracion_seg=?, data=?, finished_at=NOW()
     WHERE id=?`,
    [score||0, correctas||0, total_preguntas||0, duracion_seg||null, data?JSON.stringify(data):null, intento_id]
  );

  const [[it]] = await pool.query('SELECT estudiante_id FROM edu_intento WHERE id=?', [intento_id]);
  const delta = Number(score||0);
  await pool.query('UPDATE edu_estudiante SET puntos = puntos + ? WHERE id=?', [delta, it.estudiante_id]);
  await pool.query(
    `INSERT INTO edu_puntos_ledger (estudiante_id, origen, referencia_id, delta, descripcion)
     VALUES (?,?,?,?,?)`,
    [it.estudiante_id, 'actividad', intento_id, delta, 'Puntos por actividad']
  );

  res.json({ ok: true });
});

export default r;
