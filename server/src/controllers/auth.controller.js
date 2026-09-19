const { z } = require("zod");

const authService = require("../services/auth.service");

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const result = await authService.registerUser(data);

    res.status(201).json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await authService.loginUser(data);

    res.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
};