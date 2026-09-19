const express =
  require("express");

const cors =
  require("cors");

const helmet =
  require("helmet");

const rateLimit =
  require("express-rate-limit");


const healthRoutes =
  require("./routes/health.routes");

const authRoutes =
  require("./routes/auth.routes");

const keyRoutes =
  require("./routes/key.routes");

const userRoutes =
  require("./routes/user.routes");

const conversationRoutes =
  require("./routes/conversation.routes");

const messageRoutes =
  require("./routes/message.routes");

const passwordResetRoutes =
  require("./routes/password-reset.routes");

const errorMiddleware =
  require("./middleware/error.middleware");


const app =
  express();


app.use(
  helmet()
);


app.use(
  cors({
    origin:
      "http://localhost:5173",

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


app.use(
  express.json({
    limit:
      "256kb",
  })
);


/*
 * Protection générale contre
 * les appels excessifs.
 */
const generalLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      300,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      status:
        "error",

      message:
        "Trop de requêtes. Réessaie plus tard.",
    },
  });


app.use(
  generalLimiter
);


/*
 * Protection renforcée de
 * l'authentification.
 */
const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      status:
        "error",

      message:
        "Trop de tentatives d'authentification. Réessaie plus tard.",
    },
  });


app.get(
  "/",
  (req, res) => {
    res.json({
      name:
        "Secure Chat E2EE",

      status:
        "running",
    });
  }
);


app.use(
  "/api/health",
  healthRoutes
);


app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);


app.use(
  "/api/keys",
  keyRoutes
);


app.use(
  "/api/users",
  userRoutes
);


app.use(
  "/api/conversations",
  conversationRoutes
);


app.use(
  "/api/messages",
  messageRoutes
);


/*
 * Le rate limiting général
 * protège déjà cette route.
 */
app.use(
  "/api/password-reset",
  passwordResetRoutes
);


app.use(
  errorMiddleware
);


module.exports =
  app;