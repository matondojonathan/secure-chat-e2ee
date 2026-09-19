const API_URL =
  "http://localhost:3000";


async function parseResponse(
  response
) {
  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Réponse serveur invalide"
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


export async function createConversation(
  token,
  recipientId
) {
  const response =
    await fetch(
      `${API_URL}/api/conversations`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify({
            recipientId,
          }),
      }
    );

  return parseResponse(
    response
  );
}