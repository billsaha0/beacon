import app from "./app";
import { runUptimeChecks } from "./services/uptimeChecker";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
})

setInterval(() => {
    runUptimeChecks().catch((e) => console.error("Uptime check failed: ", e));
}, 60000)