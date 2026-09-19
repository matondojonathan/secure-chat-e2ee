import {
  useEffect,
  useState,
} from "react";

import {
  login,
} from "./services/authApi.js";

import {
  getUsers,
} from "./services/userApi.js";

import {
  createConversation,
} from "./services/conversationApi.js";

import {
  ChatSession,
} from "./services/chatSession.js";

import {
  requestPasswordReset,
  resetPassword,
} from "./services/passwordResetApi.js";

import "./App.css";


function EyeIcon() {
  return (
    <span className="eye-icon" />
  );
}


function App() {
  const [
    authMode,
    setAuthMode,
  ] = useState("login");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    registerEmail,
    setRegisterEmail,
  ] = useState("");

  const [
    registerPassword,
    setRegisterPassword,
  ] = useState("");

  const [
    registerPasswordConfirm,
    setRegisterPasswordConfirm,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showRegisterPassword,
    setShowRegisterPassword,
  ] = useState(false);

  const [
    showRegisterPasswordConfirm,
    setShowRegisterPasswordConfirm,
  ] = useState(false);

  const [
    loggedUser,
    setLoggedUser,
  ] = useState(null);

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    token,
    setToken,
  ] = useState(null);

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState(
    localStorage.getItem(
      "secure-chat-recipient"
    ) || ""
  );

  const [
    selectedUserName,
    setSelectedUserName,
  ] = useState(
    localStorage.getItem(
      "secure-chat-recipient-name"
    ) || ""
  );

  const [
    conversationId,
    setConversationId,
  ] = useState(
    localStorage.getItem(
      "secure-chat-conversation"
    ) || ""
  );

  const [
    e2eeReady,
    setE2eeReady,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    receivedMessages,
    setReceivedMessages,
  ] = useState([]);

  const [
    status,
    setStatus,
  ] = useState(
    "Non connecté"
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    loadingSession,
    setLoadingSession,
  ] = useState(true);

  const [
    resetStep,
    setResetStep,
  ] = useState("request");

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    resetToken,
    setResetToken,
  ] = useState("");

  const [
    resetNewPassword,
    setResetNewPassword,
  ] = useState("");

  const [
    resetNewPasswordConfirm,
    setResetNewPasswordConfirm,
  ] = useState("");


  useEffect(() => {
    restoreSession();
  }, []);


  function clearFeedback() {
    setError("");
    setSuccess("");
  }


  function saveSessionData(
    user,
    authToken
  ) {
    localStorage.setItem(
      "secure-chat-auth",
      JSON.stringify({
        user,
        token: authToken,
      })
    );
  }


  function clearSessionData() {
    localStorage.removeItem(
      "secure-chat-auth"
    );

    localStorage.removeItem(
      "secure-chat-recipient"
    );

    localStorage.removeItem(
      "secure-chat-recipient-name"
    );

    localStorage.removeItem(
      "secure-chat-conversation"
    );
  }


  async function createChatSession(
    user,
    authToken
  ) {
    const chatSession =
      new ChatSession({
        userId:
          user.id,

        token:
          authToken,
      });


    chatSession.onStatus =
      (newStatus) => {
        setStatus(
          newStatus
        );
      };


    chatSession.onMessage =
      (incomingMessage) => {
        setReceivedMessages(
          (previous) => [
            ...previous,
            incomingMessage,
          ]
        );
      };


    await chatSession.initialize();

    await chatSession.websocket.connect();


    const usersResponse =
      await getUsers(
        authToken
      );


    setLoggedUser(
      user
    );

    setToken(
      authToken
    );

    setSession(
      chatSession
    );

    setUsers(
      usersResponse.users
    );


    return {
      chatSession,
      users:
        usersResponse.users,
    };
  }


  async function restoreSession() {
    const stored =
      localStorage.getItem(
        "secure-chat-auth"
      );


    if (!stored) {
      setLoadingSession(false);

      return;
    }


    try {
      const data =
        JSON.parse(
          stored
        );


      if (
        !data.user ||
        !data.token
      ) {
        throw new Error(
          "Session locale invalide"
        );
      }


      setStatus(
        "Restauration de la session..."
      );


      const result =
        await createChatSession(
          data.user,
          data.token
        );


      const storedRecipient =
        localStorage.getItem(
          "secure-chat-recipient"
        );


      const storedConversation =
        localStorage.getItem(
          "secure-chat-conversation"
        );


      if (
        storedRecipient &&
        storedConversation
      ) {
        const recipient =
          result.users.find(
            (user) =>
              user.id ===
              storedRecipient
          );


        if (recipient) {
          setSelectedUserId(
            recipient.id
          );

          setSelectedUserName(
            recipient.username
          );

          setConversationId(
            storedConversation
          );


          try {
            await result.chatSession
              .prepareRecipient(
                recipient.id
              );


            const history =
              await result.chatSession
                .loadHistory(
                  storedConversation,
                  recipient.id
                );


            setReceivedMessages(
              history
            );


            setE2eeReady(
              true
            );


            setStatus(
              `Session E2EE restaurée avec ${recipient.username}`
            );

          } catch (historyError) {
            console.warn(
              "Impossible de restaurer l'historique :",
              historyError
            );


            setStatus(
              `Connecté avec ${recipient.username}`
            );
          }
        }

      } else {
        setStatus(
          "Connecté — choisis un destinataire"
        );
      }

    } catch (err) {
      console.error(
        "Restauration session impossible:",
        err
      );


      clearSessionData();


      setStatus(
        "Session expirée — reconnexion nécessaire"
      );

    } finally {
      setLoadingSession(false);
    }
  }


  async function handleLogin(
    event
  ) {
    event.preventDefault();

    clearFeedback();

    setStatus(
      "Authentification..."
    );


    try {
      const result =
        await login(
          email,
          password
        );


      saveSessionData(
        result.user,
        result.token
      );


      await createChatSession(
        result.user,
        result.token
      );


      setPassword("");


      setStatus(
        "Connecté — choisis un destinataire"
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
        "Impossible de se connecter."
      );


      setStatus(
        "Échec de connexion"
      );
    }
  }


  async function handleRegister(
    event
  ) {
    event.preventDefault();

    clearFeedback();


    if (
      registerPassword !==
      registerPasswordConfirm
    ) {
      setError(
        "Les mots de passe ne correspondent pas."
      );

      return;
    }


    if (
      registerPassword.length <
      8
    ) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );

      return;
    }


    setStatus(
      "Création du compte..."
    );


    try {
      const response =
        await fetch(
          "http://localhost:3000/api/auth/register",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                username,
                email:
                  registerEmail,
                password:
                  registerPassword,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Impossible de créer le compte."
        );
      }


      setEmail(
        registerEmail
      );

      setPassword("");

      setUsername("");

      setRegisterEmail("");

      setRegisterPassword("");

      setRegisterPasswordConfirm("");


      setSuccess(
        "Compte créé avec succès. Tu peux maintenant te connecter."
      );


      setAuthMode(
        "login"
      );


      setStatus(
        "Compte créé"
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
        "Erreur lors de la création du compte."
      );


      setStatus(
        "Création du compte impossible"
      );
    }
  }


  async function handlePasswordResetRequest(
    event
  ) {
    event.preventDefault();

    clearFeedback();


    if (!resetEmail) {
      setError(
        "Indique ton adresse e-mail."
      );

      return;
    }


    try {
      setStatus(
        "Préparation de la réinitialisation..."
      );


      const result =
        await requestPasswordReset(
          resetEmail
        );


      /*
       * TP LOCAL UNIQUEMENT.
       *
       * Le serveur peut fournir devToken
       * pour permettre la démonstration
       * sans SMTP.
       */
      if (result.devToken) {
        setResetToken(
          result.devToken
        );

        setResetStep(
          "reset"
        );

        setSuccess(
          "Token de développement généré. Tu peux définir un nouveau mot de passe."
        );

      } else {
        setSuccess(
          result.message
        );
      }


      setStatus(
        "Demande de réinitialisation traitée"
      );

    } catch (err) {
      console.error(
        err
      );

      setError(
        err.message ||
        "Impossible de demander la réinitialisation."
      );
    }
  }


  async function handlePasswordReset(
    event
  ) {
    event.preventDefault();

    clearFeedback();


    if (
      resetNewPassword.length <
      8
    ) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );

      return;
    }


    if (
      resetNewPassword !==
      resetNewPasswordConfirm
    ) {
      setError(
        "Les nouveaux mots de passe ne correspondent pas."
      );

      return;
    }


    if (!resetToken) {
      setError(
        "Le token de réinitialisation est requis."
      );

      return;
    }


    try {
      setStatus(
        "Réinitialisation du mot de passe..."
      );


      await resetPassword(
        resetToken,
        resetNewPassword
      );


      setResetStep(
        "request"
      );

      setResetToken("");

      setResetNewPassword("");

      setResetNewPasswordConfirm("");


      setAuthMode(
        "login"
      );


      setEmail(
        resetEmail
      );


      setPassword("");


      setSuccess(
        "Mot de passe réinitialisé avec succès. Tu peux maintenant te connecter."
      );


      setStatus(
        "Mot de passe réinitialisé"
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
        "Impossible de réinitialiser le mot de passe."
      );
    }
  }


  async function handlePrepareE2EE() {
    if (!session) {
      setError(
        "Aucune session active."
      );

      return;
    }


    if (!selectedUserId) {
      setError(
        "Sélectionne un destinataire."
      );

      return;
    }


    try {
      clearFeedback();


      setStatus(
        "Création ou récupération de la conversation..."
      );


      const response =
        await createConversation(
          token,
          selectedUserId
        );


      const newConversationId =
        response.conversation.id;


      setConversationId(
        newConversationId
      );


      localStorage.setItem(
        "secure-chat-conversation",
        newConversationId
      );


      setStatus(
        "Préparation du chiffrement..."
      );


      const recipient =
        await session.prepareRecipient(
          selectedUserId
        );


      setSelectedUserName(
        recipient.username
      );


      localStorage.setItem(
        "secure-chat-recipient",
        recipient.id
      );


      localStorage.setItem(
        "secure-chat-recipient-name",
        recipient.username
      );


      setStatus(
        "Chargement de l'historique..."
      );


      const history =
        await session.loadHistory(
          newConversationId,
          recipient.id
        );


      setReceivedMessages(
        history
      );


      setE2eeReady(
        true
      );


      setStatus(
        `Session E2EE active avec ${recipient.username}`
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
        "Impossible de préparer la session E2EE."
      );


      setStatus(
        "Préparation E2EE impossible"
      );
    }
  }


  async function handleSend() {
    if (
      !session ||
      !e2eeReady
    ) {
      setError(
        "La session E2EE n'est pas prête."
      );

      return;
    }


    if (!conversationId) {
      setError(
        "Conversation introuvable."
      );

      return;
    }


    if (
      !message.trim()
    ) {
      return;
    }


    try {
      clearFeedback();


      const plaintext =
        message.trim();


      const encryptedMessage =
        await session.sendMessage({
          recipientUserId:
            selectedUserId,

          conversationId:
            conversationId,

          plaintext:
            plaintext,
        });


      setReceivedMessages(
        (previous) => [
          ...previous,
          {
            ...encryptedMessage,
            plaintext,
            own:
              true,
          },
        ]
      );


      setMessage("");


      setStatus(
        "Message chiffré envoyé"
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
        "Impossible d'envoyer le message."
      );
    }
  }


  function handleRecipientChange(
    event
  ) {
    const newRecipientId =
      event.target.value;


    setSelectedUserId(
      newRecipientId
    );

    setSelectedUserName("");

    setConversationId("");

    setE2eeReady(false);

    setReceivedMessages([]);

    clearFeedback();


    localStorage.removeItem(
      "secure-chat-recipient"
    );

    localStorage.removeItem(
      "secure-chat-recipient-name"
    );

    localStorage.removeItem(
      "secure-chat-conversation"
    );
  }


  function handleLogout() {
    if (session) {
      session.close();
    }


    clearSessionData();


    setSession(null);

    setLoggedUser(null);

    setToken(null);

    setUsers([]);

    setSelectedUserId("");

    setSelectedUserName("");

    setConversationId("");

    setE2eeReady(false);

    setReceivedMessages([]);

    setMessage("");

    setPassword("");


    setStatus(
      "Déconnecté volontairement"
    );
  }


  function openLogin() {
    clearFeedback();

    setAuthMode(
      "login"
    );
  }


  function openRegister() {
    clearFeedback();

    setAuthMode(
      "register"
    );
  }


  function openReset() {
    clearFeedback();

    setResetStep(
      "request"
    );

    setResetEmail(
      email
    );

    setAuthMode(
      "reset"
    );
  }


  if (loadingSession) {
    return (
      <div className="app auth-page">
        <div className="loading-screen">

          <h1>
            Secure Chat
          </h1>

          <p>
            Restauration de la session sécurisée...
          </p>

        </div>
      </div>
    );
  }


  if (!loggedUser) {
    return (
      <div className="app auth-page">

        <div className="auth-wrapper">

          <div className="auth-brand">

            <h1>
              Secure Chat
            </h1>

            <p>
              Messagerie web chiffrée de bout en bout
            </p>

          </div>


          <div
            className={`auth-card auth-${authMode}`}
          >

            <div className="auth-switch">

              <button
                type="button"
                className={
                  authMode ===
                  "login"
                    ? "active"
                    : ""
                }
                onClick={
                  openLogin
                }
              >
                Connexion
              </button>


              <button
                type="button"
                className={
                  authMode ===
                  "register"
                    ? "active"
                    : ""
                }
                onClick={
                  openRegister
                }
              >
                Créer un compte
              </button>

            </div>


            {authMode !== "reset" ? (

              <div className="auth-slider">

                <section className="auth-panel">

                  <h2>
                    Connexion
                  </h2>

                  <p className="auth-description">
                    Accède à ta messagerie sécurisée.
                  </p>


                  <form
                    onSubmit={
                      handleLogin
                    }
                  >

                    <div className="form-group">

                      <label className="form-label">
                        Adresse e-mail
                      </label>

                      <input
                        className="form-input"
                        type="email"
                        value={
                          email
                        }
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                        placeholder="nom@example.com"
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label className="form-label">
                        Mot de passe
                      </label>


                      <div className="password-wrapper">

                        <input
                          className="form-input"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            password
                          }
                          onChange={(event) =>
                            setPassword(
                              event.target.value
                            )
                          }
                          placeholder="Votre mot de passe"
                          required
                        />


                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          aria-label={
                            showPassword
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          <EyeIcon />
                        </button>

                      </div>

                    </div>


                    <button
                      type="button"
                      className="forgot-password"
                      onClick={
                        openReset
                      }
                    >
                      Mot de passe oublié ?
                    </button>


                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Se connecter
                    </button>

                  </form>

                </section>


                <section className="auth-panel">

                  <h2>
                    Créer un compte
                  </h2>

                  <p className="auth-description">
                    Crée ton compte Secure Chat.
                  </p>


                  <form
                    onSubmit={
                      handleRegister
                    }
                  >

                    <div className="form-group">

                      <label className="form-label">
                        Nom d'utilisateur
                      </label>

                      <input
                        className="form-input"
                        type="text"
                        value={
                          username
                        }
                        onChange={(event) =>
                          setUsername(
                            event.target.value
                          )
                        }
                        placeholder="Votre nom"
                        minLength={3}
                        maxLength={50}
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label className="form-label">
                        Adresse e-mail
                      </label>

                      <input
                        className="form-input"
                        type="email"
                        value={
                          registerEmail
                        }
                        onChange={(event) =>
                          setRegisterEmail(
                            event.target.value
                          )
                        }
                        placeholder="nom@example.com"
                        maxLength={255}
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label className="form-label">
                        Mot de passe
                      </label>


                      <div className="password-wrapper">

                        <input
                          className="form-input"
                          type={
                            showRegisterPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            registerPassword
                          }
                          onChange={(event) =>
                            setRegisterPassword(
                              event.target.value
                            )
                          }
                          placeholder="8 caractères minimum"
                          minLength={8}
                          maxLength={128}
                          required
                        />


                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowRegisterPassword(
                              !showRegisterPassword
                            )
                          }
                        >
                          <EyeIcon />
                        </button>

                      </div>

                    </div>


                    <div className="form-group">

                      <label className="form-label">
                        Confirmer le mot de passe
                      </label>


                      <div className="password-wrapper">

                        <input
                          className="form-input"
                          type={
                            showRegisterPasswordConfirm
                              ? "text"
                              : "password"
                          }
                          value={
                            registerPasswordConfirm
                          }
                          onChange={(event) =>
                            setRegisterPasswordConfirm(
                              event.target.value
                            )
                          }
                          placeholder="Répéter le mot de passe"
                          minLength={8}
                          maxLength={128}
                          required
                        />


                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowRegisterPasswordConfirm(
                              !showRegisterPasswordConfirm
                            )
                          }
                        >
                          <EyeIcon />
                        </button>

                      </div>

                    </div>


                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Créer mon compte
                    </button>

                  </form>

                </section>

              </div>

            ) : (

              <section className="auth-reset-panel">

                {resetStep === "request" ? (

                  <>
                    <h2>
                      Mot de passe oublié
                    </h2>

                    <p className="auth-description">
                      Indique ton adresse e-mail
                      pour préparer la réinitialisation.
                    </p>


                    <form
                      onSubmit={
                        handlePasswordResetRequest
                      }
                    >

                      <div className="form-group">

                        <label className="form-label">
                          Adresse e-mail
                        </label>

                        <input
                          className="form-input"
                          type="email"
                          value={
                            resetEmail
                          }
                          onChange={(event) =>
                            setResetEmail(
                              event.target.value
                            )
                          }
                          placeholder="nom@example.com"
                          required
                        />

                      </div>


                      <button
                        className="primary-button"
                        type="submit"
                      >
                        Continuer
                      </button>

                    </form>
                  </>

                ) : (

                  <>
                    <h2>
                      Nouveau mot de passe
                    </h2>

                    <p className="auth-description">
                      Utilise le token généré
                      pour définir ton nouveau mot de passe.
                    </p>


                    <form
                      onSubmit={
                        handlePasswordReset
                      }
                    >

                      <div className="form-group">

                        <label className="form-label">
                          Token de réinitialisation
                        </label>

                        <input
                          className="form-input"
                          type="text"
                          value={
                            resetToken
                          }
                          onChange={(event) =>
                            setResetToken(
                              event.target.value
                            )
                          }
                          required
                        />

                      </div>


                      <div className="form-group">

                        <label className="form-label">
                          Nouveau mot de passe
                        </label>

                        <input
                          className="form-input"
                          type="password"
                          value={
                            resetNewPassword
                          }
                          onChange={(event) =>
                            setResetNewPassword(
                              event.target.value
                            )
                          }
                          minLength={8}
                          maxLength={128}
                          required
                        />

                      </div>


                      <div className="form-group">

                        <label className="form-label">
                          Confirmer le nouveau mot de passe
                        </label>

                        <input
                          className="form-input"
                          type="password"
                          value={
                            resetNewPasswordConfirm
                          }
                          onChange={(event) =>
                            setResetNewPasswordConfirm(
                              event.target.value
                            )
                          }
                          minLength={8}
                          maxLength={128}
                          required
                        />

                      </div>


                      <button
                        className="primary-button"
                        type="submit"
                      >
                        Réinitialiser le mot de passe
                      </button>

                    </form>
                  </>
                )}


                <button
                  type="button"
                  className="forgot-password"
                  onClick={
                    openLogin
                  }
                >
                  Retour à la connexion
                </button>

              </section>

            )}


          </div>


          {status !==
            "Non connecté" && (
            <div className="status">

              <strong>
                Statut :
              </strong>{" "}

              {status}

            </div>
          )}


          {error && (
            <div className="error">
              {error}
            </div>
          )}


          {success && (
            <div className="success">
              {success}
            </div>
          )}


          <p className="auth-security">
            Les clés privées E2EE restent dans le navigateur
            et ne sont jamais envoyées au serveur.
          </p>

        </div>
      </div>
    );
  }


  return (
    <div className="app chat-page">

      <div className="chat-container">

        <header className="chat-header">

          <div>

            <h1>
              Secure Chat
            </h1>

            <p>
              Connecté en tant que{" "}

              <strong>
                {
                  loggedUser.username
                }
              </strong>
            </p>

          </div>


          <button
            className="logout-button"
            type="button"
            onClick={
              handleLogout
            }
          >
            Déconnexion
          </button>

        </header>


        <div className="status">

          <strong>
            Statut :
          </strong>{" "}

          {status}

        </div>


        <section className="chat-panel">

          <h2>
            Conversation sécurisée
          </h2>

          <p>
            Sélectionne un utilisateur pour ouvrir
            ou retrouver automatiquement sa conversation.
          </p>


          <div className="form-group">

            <label className="form-label">
              Destinataire
            </label>


            <select
              className="form-input"
              value={
                selectedUserId
              }
              onChange={
                handleRecipientChange
              }
              disabled={
                e2eeReady
              }
            >

              <option value="">
                Sélectionner un utilisateur
              </option>


              {users.map(
                (user) => (
                  <option
                    key={
                      user.id
                    }
                    value={
                      user.id
                    }
                  >
                    {
                      user.username
                    }
                  </option>
                )
              )}

            </select>

          </div>


          {!e2eeReady ? (

            <button
              className="primary-button"
              type="button"
              onClick={
                handlePrepareE2EE
              }
              disabled={
                !selectedUserId
              }
            >
              Ouvrir la conversation sécurisée
            </button>

          ) : (

            <div className="e2ee-ready">

              <strong>
                Session E2EE active
              </strong>

              {" avec "}

              <strong>
                {
                  selectedUserName
                }
              </strong>

            </div>

          )}

        </section>


        {e2eeReady && (

          <section className="chat-panel">

            <div className="conversation-heading">

              <div>

                <h2>
                  Conversation avec{" "}

                  {
                    selectedUserName
                  }
                </h2>

                <p>
                  Les messages sont chiffrés
                  côté navigateur.
                </p>

              </div>

            </div>


            <div className="message-area">

              {receivedMessages.length ===
                0 ? (

                <p className="empty-message">
                  Aucun message dans cette conversation.
                </p>

              ) : (

                receivedMessages.map(
                  (
                    currentMessage,
                    index
                  ) => (

                    <div
                      className={
                        currentMessage.own
                          ? "message-bubble own"
                          : "message-bubble"
                      }
                      key={
                        currentMessage.id ||
                        `${currentMessage.sequenceNumber}-${index}`
                      }
                    >

                      <strong>
                        {
                          currentMessage.own
                            ? "Vous"
                            : selectedUserName
                        }
                      </strong>


                      <p>
                        {
                          currentMessage.plaintext
                        }
                      </p>

                    </div>

                  )
                )

              )}

            </div>


            <textarea
              className="message-textarea"
              value={
                message
              }
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              placeholder="Écrire un message..."
            />


            <button
              className="primary-button"
              type="button"
              onClick={
                handleSend
              }
            >
              Envoyer le message
            </button>

          </section>

        )}


        {error && (
          <div className="error">
            {error}
          </div>
        )}

      </div>

    </div>
  );
}


export default App;