import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const r = Router();

// Registrar estudiante: crea auth_user + edu_estudiante
r.post('/register-student', async (req, res) => {
  try {
    const { email, password, nombre, curso_id } = req.body;
    if (!email || !password || !nombre || !curso_id) {
      return res.status(400).json({ error: 'Faltan campos' });
    }
    const [exists] = await pool.query('SELECT id FROM auth_user WHERE email=?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email ya existe' });

    const hash = await bcrypt.hash(password, 10);
    const [ins] = await pool.query(
      'INSERT INTO auth_user (email, password_hash, role) VALUES (?,?,?)',
      [email, hash, 'estudiante']
    );
    const authId = ins.insertId;

    await pool.query(
      `INSERT INTO edu_estudiante (strapi_user_id, nombre, curso_id, puntos, primer_login, activo)
       VALUES (?,?,?,?,1,1)`,
      [authId, nombre, curso_id, 0]
    );

    return res.json({ ok: true, auth_user_id: authId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error servidor' });
  }
});

// Login (devuelve token y si es primer_login cuando es estudiante)
r.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body; // role opcional (admin/profesor/estudiante)
    const params = role ? [email, role] : [email];
    const where = role ? 'email=? AND role=?' : 'email=?';

    const [rows] = await pool.query(`SELECT * FROM auth_user WHERE ${where} LIMIT 1`, params);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales' });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    let primer_login;
    if (user.role === 'estudiante') {
      const [eRows] = await pool.query(
        'SELECT primer_login FROM edu_estudiante WHERE strapi_user_id=? LIMIT 1',
        [user.id]
      );
      primer_login = eRows.length ? !!eRows[0].primer_login : null;
    }

    res.json({ token, role: user.role, primer_login });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error servidor' });
  }
});

// Marcar fin de primer login (tras cambiar contraseña en app)
r.post('/first-login/done', async (req, res) => {
  try {
    const { auth_user_id } = req.body;
    await pool.query('UPDATE edu_estudiante SET primer_login=0 WHERE strapi_user_id=?', [auth_user_id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error servidor' });
  }
});

export default r;
