const userService = require("../services/user.service");

async function getUsers(req, res, next) {
  try {
    const users =
      await userService.getUsers(
        req.user.sub
      );

    res.json({
      status: "ok",
      users,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
};