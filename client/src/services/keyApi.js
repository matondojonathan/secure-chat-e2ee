const API_URL = "http://localhost:3000";

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("Réponse serveur invalide");
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Erreur API"
    );
  }

  return data;
}

export async function savePublicKeys(
  token,
  ecdhPublicKey,
  signingPublicKey
) {
  const response = await fetch(
    `${API_URL}/api/keys`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        /*
         * Les clés publiques sont des objets JWK.
         * Le backend les stocke sous forme TEXT.
         */
        ecdhPublicKey:
          JSON.stringify(ecdhPublicKey),

        signingPublicKey:
          JSON.stringify(signingPublicKey),
      }),
    }
  );

  return parseResponse(response);
}

export async function getPublicKeys(
  token,
  userId
) {
  const response = await fetch(
    `${API_URL}/api/keys/${userId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data =
    await parseResponse(response);

  /*
   * PostgreSQL renvoie les clés sous forme
   * de chaînes JSON.
   *
   * Le navigateur doit retrouver les objets JWK.
   */
  if (data.user) {
    if (
      typeof data.user.ecdh_public_key ===
      "string"
    ) {
      data.user.ecdh_public_key =
        JSON.parse(
          data.user.ecdh_public_key
        );
    }

    if (
      typeof data.user.signing_public_key ===
      "string"
    ) {
      data.user.signing_public_key =
        JSON.parse(
          data.user.signing_public_key
        );
    }
  }

  return data;
}