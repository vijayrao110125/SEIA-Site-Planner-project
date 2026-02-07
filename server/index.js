import { PORT } from "./config.js";
import { createApp } from "./createApp.js";

const app = createApp();

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
