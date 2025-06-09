const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/login", async (req, res) => {
  const { email } = req.body;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: "User not found" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

module.exports = router;
