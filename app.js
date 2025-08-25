const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.json({ status: "ok", app: "node-ecr", time: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
