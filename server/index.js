const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routen
const authRoute = require("./routes/auth");
const changePasswordRoute = require("./routes/changePassword");

app.use("/api/auth", authRoute);
app.use("/api/change-password", changePasswordRoute);

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
