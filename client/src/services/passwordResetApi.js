import { API_URL } from "./apiConfig.js";


async function parseResponse(
  response
) {
  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "RÃ©ponse serveur invalide"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Erreur API"
    );
  }

  return data;
}


export async function requestPasswordReset(
  email
) {
  const response =
    await fetch(
      `${API_URL}/api/password-reset/request`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email,
          }),
      }
    );

  return parseResponse(
    response
  );
}


export async function resetPassword(
  token,
  newPassword
) {
  const response =
    await fetch(
      `${API_URL}/api/password-reset/reset`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            token,
            newPassword,
          }),
      }
    );

  return parseResponse(
    response
  );
}
