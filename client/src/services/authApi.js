import { API_URL } from "./apiConfig.js";

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("RÃ©ponse serveur invalide");
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Erreur API"
    );
  }

  return data;
}

export async function login(email, password) {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  return parseResponse(response);
}
