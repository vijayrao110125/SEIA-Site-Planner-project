import { HOST, PORT } from "./config.js";
import { createApp } from "./createApp.js";

const app = createApp();
const server = app.listen(PORT, HOST, () => console.log(`Server on http://${HOST}:${PORT}`));
server.on("error", (e) => {
  console.error("Server listen error:", e);
});
