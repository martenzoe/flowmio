// server/routes/changePassword.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/", async (req, res) => {
  const { token } = req.headers;
  const { currentPassword, newPassword } = req.body;

  if (!token || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing data" });
  }

  // ✅ JWT prüfen
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // ✅ Login mit aktuellem Passwort prüfen
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: decoded.email, // muss beim JWT-Signieren mitgegeben werden!
    password: currentPassword,
  });

  if (loginError) {
    return res.status(401).json({ error: "Aktuelles Passwort ist falsch." });
  }

  // ✅ Passwort aktualisieren
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.json({ success: true });
});

module.exports = router;
