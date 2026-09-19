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

export async function getConversationMessages(
  token,
  conversationId
) {
  const response =
    await fetch(
      `${API_URL}/api/messages/${conversationId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return parseResponse(
    response
  );
}
