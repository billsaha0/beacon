import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth"
import endpointRoutes from "./routes/endpoints"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/endpoints", endpointRoutes);

app.get("/health", (_req, res) => {
    return res.status(200).json({
        message: "App is up and running."
    })
})

export default app;