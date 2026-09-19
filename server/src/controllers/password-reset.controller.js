const { z } =
  require("zod");

const passwordResetService =
  require("../services/password-reset.service");

const requestSchema =
  z.object({
    email:
      z.string()
        .email()
        .max(255),
  });

const resetSchema =
  z.object({
    token:
      z.string()
        .min(32),

    newPassword:
      z.string()
        .min(8)
        .max(128),
  });

async function requestReset(
  req,
  res,
  next
) {
  try {
    const data =
      requestSchema.parse(
        req.body
      );

    const result =
      await passwordResetService
        .createResetToken(
          data.email
        );

    /*
     * Même réponse que l'utilisateur
     * existe ou non.
     */
    const response = {
      status:
        "ok",

      message:
        "Si cette adresse existe, une procédure de réinitialisation a été préparée.",
    };

    /*
     * Uniquement pour le TP local.
     * À supprimer lorsque SMTP sera branché.
     */
    if (result) {
      response.devToken =
        result.token;

      response.expiresAt =
        result.expiresAt;
    }

    res.json(
      response
    );
  } catch (error) {
    next(error);
  }
}

async function resetPassword(
  req,
  res,
  next
) {
  try {
    const data =
      resetSchema.parse(
        req.body
      );

    await passwordResetService
      .resetPassword(
        data.token,
        data.newPassword
      );

    res.json({
      status:
        "ok",

      message:
        "Mot de passe réinitialisé avec succès.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requestReset,
  resetPassword,
};