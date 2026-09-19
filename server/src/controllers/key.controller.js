const { z } = require("zod");

const keyService = require("../services/key.service");

const publicKeysSchema = z.object({
  ecdhPublicKey: z.string().min(1),
  signingPublicKey: z.string().min(1),
});

async function saveKeys(req, res, next) {
  try {
    const data = publicKeysSchema.parse(req.body);

    const user = await keyService.savePublicKeys(
      req.user.sub,
      data.ecdhPublicKey,
      data.signingPublicKey
    );

    res.json({
      status: "ok",
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function getKeys(req, res, next) {
  try {
    const user = await keyService.getPublicKeys(
      req.params.userId
    );

    res.json({
      status: "ok",
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  saveKeys,
  getKeys,
};