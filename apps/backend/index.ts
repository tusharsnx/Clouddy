import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.ts";
import { filesRouter } from "./routes/files.ts";
import { usersRouter } from "./routes/users.ts";
import { ApplicationErrorServiceMiddleware } from "./services/application-error-service/middleware.ts";
import { LoggingMiddlware } from "./services/logging-service/middleware.ts";

const app = express();

// Disable x-powered-by header
app.disable("x-powered-by");

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
app.use("/api/users", usersRouter);
app.use("/api/files", filesRouter);

// Error handler
app.use(ApplicationErrorServiceMiddleware);

app.listen(3500, () => {
  console.log("Server is running on port 3500");
});
