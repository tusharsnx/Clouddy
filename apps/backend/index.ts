import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.ts";
import { ApplicationErrorServiceMiddleware } from "./services/application-error-service/middleware.ts";
import { LoggingMiddlware } from "./services/logging-service/middleware.ts";

const app = express();

// Request parsers
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Logging
app.use(LoggingMiddlware);

// Cors
app.use(
  cors({
    credentials: true,
    origin: true,
  }),
);

// Routes
app.use("/api/auth", authRouter);

// Error handler
app.use(ApplicationErrorServiceMiddleware);

app.listen(3500, () => {
  console.log("Server is running on port 3500");
});
