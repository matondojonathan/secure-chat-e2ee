# Secure Chat E2EE

Messagerie web chiffrée de bout en bout

Projet réalisé dans le cadre du cours Protocoles de sécurité.

# Présentation

Secure Chat E2EE est une application web de messagerie instantanée permettant à deux utilisateurs de communiquer en temps réel tout en protégeant cryptographiquement le contenu des messages.

## Le projet met en œuvre :

- authentification des utilisateurs ;

- hashage des mots de passe avec bcrypt ;

- authentification JWT ;

- communication temps réel avec WebSocket ;

- échange de clés ECDH ;

- chiffrement AES-256-GCM ;

- signatures numériques ECDSA ;

- protection contre les attaques par rejeu ;

- persistance PostgreSQL ;

- validation des données avec Zod ;

- limitation de taille des messages ;

- rate limiting ;

- protections HTTP avec Helmet.

Le principe central est le chiffrement de bout en bout (E2EE) : le message est chiffré dans le navigateur de l'expéditeur avant son envoi au serveur. Le serveur transporte et stocke les données chiffrées sans avoir besoin du texte en clair.

## Problématique

Une messagerie sécurisée doit répondre à plusieurs problématiques :

Confidentialité : le contenu ne doit pas être transmis au serveur en clair.

Protection du transport : les communications doivent être protégées contre l'observation et la modification du trafic.

Protection des données stockées : les messages ne doivent pas être conservés en clair.

Authentification : seules les sessions authentifiées doivent accéder aux ressources protégées.

Protection contre le rejeu : un ancien message valide ne doit pas pouvoir être simplement réutilisé.

## Objectifs

- développer une messagerie web temps réel ;

- permettre l'inscription et la connexion ;

- gérer les utilisateurs et conversations avec PostgreSQL ;

- établir une clé partagée avec ECDH ;

- chiffrer les messages avec AES-GCM ;

- signer les messages avec ECDSA ;

- détecter les tentatives de rejeu ;

- stocker uniquement les données chiffrées côté serveur ;

- restaurer la session et le contexte de conversation ;

- démontrer les mécanismes étudiés dans le cours.

## Architecture

                         SECURE CHAT E2EE

       CLIENT A                                      CLIENT B
          |                                             |
          | clés publiques ECDH + ECDSA                 |
          |-------------------------------------------->|
          |                                             |
          |                  ECDH                       |
          |<------------------------------------------->|
          |                                             |
          |              clé partagée                   |
          |                                             |
          | plaintext                                   |
          |     |                                       |
          |     v                                       |
          |  AES-GCM                                    |
          |     |                                       |
          |     +----> ciphertext + nonce               |
          |                                             |
          |  ECDSA                                      |
          |     |                                       |
          |     +----> signature                        |
          |                                             |
          |              WebSocket / WSS                |
          |                     |                        |
          |                     v                        |
          |          +---------------------+             |
          |          |       SERVEUR       |             |
          |          |                     |             |
          |          | Authentification    |             |
          |          | Autorisation        |             |
          |          | Routage             |             |
          |          | Persistance         |             |
          |          |                     |             |
          |          | Pas de plaintext    |             |
          |          +----------+----------+             |
          |                     |                        |
          |                     v                        |
          |              anti-rejeu                     |
          |                     |                        |
          |                  ECDSA                       |
          |                     |                        |
          |                 AES-GCM                      |
          |                     |                        |
          |                     v                        |
          |                  plaintext                   |

## Technologies utilisées

* Technologie / mécanisme

- Rôle

- React

- Interface utilisateur

- Node.js

- Exécution du serveur

- Express

- API HTTP

- WebSocket

- Communication temps réel

- PostgreSQL

- Persistance

- JWT

- Authentification des sessions

- bcrypt

- Protection des mots de passe

- Zod

- Validation des données

- Helmet

- Protection des headers HTTP

- express-rate-limit

- Limitation des requêtes

- ECDH P-256

- Établissement d'une clé partagée

- AES-256-GCM

- Chiffrement des messages

- ECDSA P-256

- Signature numérique

- SHA-256

- Hachage utilisé par ECDSA

- Sequence Number

- Protection anti-rejeu

- Web Crypto API

- Primitives cryptographiques côté navigateur

## Structure du projet

secure-chat-e2ee/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── authApi.js
│   │   │   ├── keyApi.js
│   │   │   ├── messageApi.js
│   │   │   ├── passwordResetApi.js
│   │   │   └── chatSession.js
│   │   ├── crypto/
│   │   │   ├── ecdh.js
│   │   │   ├── aes-gcm.js
│   │   │   ├── signature.js
│   │   │   ├── replay.js
│   │   │   ├── encoding.js
│   │   │   └── e2ee.js
│   │   ├── websocket/
│   │   │   └── websocketClient.js
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   │   └── schema.sql
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── websocket/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md

## Fonctionnement de la sécurité

1. Authentification

Lors de l'inscription, le mot de passe est transformé en hash avec bcrypt avant stockage.

Mot de passe
     |
     v
   bcrypt
     |
     v
password_hash
     |
     v
 PostgreSQL

Lors de la connexion, le serveur compare le mot de passe fourni avec le hash enregistré.

Après authentification, le serveur génère un JWT utilisé pour accéder aux ressources protégées.

2. WebSocket

La connexion locale est :

ws://localhost:3000/ws

Le serveur authentifie la connexion avec le JWT et relaie les messages chiffrés.

Pour un déploiement sécurisé :

WebSocket + TLS = WSS

TLS/WSS protège le transport entre navigateur et serveur, tandis que l'E2EE protège le contenu du message contre sa lecture par le serveur.

3. Échange de clés ECDH

Chaque utilisateur possède :

- Clé privée ECDH
- Clé publique ECDH

La clé privée reste dans le navigateur.

Alice utilise sa clé privée et la clé publique de Bob.

Bob utilise sa clé privée et la clé publique d'Alice.

Les deux calculs produisent la même clé partagée, utilisée ensuite par AES-GCM.

4. Chiffrement AES-GCM

Le navigateur chiffre le plaintext avec la clé partagée et un nonce aléatoire.

Message en clair
      |
      v
   AES-GCM
      |
  +---+---+
  |       |
  v       v
ciphertext nonce

Le projet utilise une clé AES de 256 bits et un nonce de 12 octets.

Un nonce ne doit pas être réutilisé avec la même clé AES-GCM.

5. Signature ECDSA

Chaque utilisateur possède une paire de clés ECDSA.

La signature couvre notamment :

- conversationId
- senderId
- sequenceNumber
- nonce
- ciphertext

Le destinataire vérifie la signature avec la clé publique ECDSA de l'expéditeur.

Si la signature est invalide, le message est rejeté.

6. Protection anti-rejeu

Chaque message possède un sequenceNumber.

sequence 1 -> accepté
sequence 2 -> accepté
rejeu 1    -> rejeté
rejeu 2    -> rejeté
sequence 3 -> accepté

La règle actuelle est :

nouvelle séquence > dernière séquence acceptée

Cette implémentation est volontairement simplifiée pour le TP et peut rejeter des messages arrivant hors ordre.

## Flux complet d'un message

Message en clair
      |
      v
Sequence Number
      |
      v
AES-GCM
      |
      +----> ciphertext
      +----> nonce
      |
      v
ECDSA
      |
      +----> signature
      |
      v
WebSocket
      |
      v
+---------------------------+
|          SERVEUR          |
|                           |
| JWT                       |
| Validation                |
| Autorisation              |
| Stockage ciphertext       |
| Relais                    |
|                           |
| Aucun plaintext requis    |
+-------------+-------------+
              |
              v
          Destinataire
              |
              v
          Anti-rejeu
              |
              v
        Vérification ECDSA
              |
              v
           AES-GCM
              |
              v
       Message en clair

### Base de données

* Base utilisée :

secure_chat

* Port PostgreSQL local :

5433

* users

id
username
email
password_hash
ecdh_public_key
signing_public_key
created_at

* conversations

Contient les conversations.

* conversation_members

Associe les utilisateurs aux conversations.

* messages

id
conversation_id
sender_id
ciphertext
nonce
signature
sequence_number
created_at

Le plaintext n'est pas enregistré.

* password_reset_tokens

user_id
token_hash
expires_at
used_at
created_at

Le token de récupération est stocké sous forme de hash.

### Sécurité côté serveur

Zod valide les données reçues par l'API et le WebSocket.

JWT protège les routes nécessitant une authentification.

L'appartenance à la conversation est vérifiée avant l'acceptation d'un message.

Le WebSocket possède une taille maximale de payload.

Les champs des messages E2EE possèdent des limites de taille.

express-rate-limit limite la fréquence des requêtes HTTP sensibles.

Helmet ajoute des protections HTTP.

### Installation

* Prérequis

- Node.js

- npm

- PostgreSQL

### Serveur

cd server
npm install

### Client

cd client
npm install

### Configuration

Créer :

server/.env

Exemple :

PORT=3000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=secure_chat
DB_USER=postgres
DB_PASSWORD=TON_MOT_DE_PASSE

JWT_SECRET=secure_chat_jwt_secret_change_later

Le fichier .env contient des informations sensibles et ne doit pas être versionné.

Le schéma SQL se trouve dans :

server/src/database/schema.sql

### Lancement

* Serveur

cd server
npm run dev

* Résultat attendu :

HTTP server running on http://localhost:3000
WebSocket server running on ws://localhost:3000/ws
PostgreSQL configured on port 5433

* Client

Dans un deuxième terminal :

cd client
npm run dev

Ouvrir ensuite l'adresse locale fournie par Vite.

### Tests réalisés

* PostgreSQL

status : ok
database : connected

* Anti-rejeu

=== TEST ANTI-REJEU ===

Alice → sequence 1 : true
Alice → sequence 2 : true
Replay → sequence 1 : false
Replay → sequence 2 : false
Alice → sequence 3 : true

ANTI-REPLAY TEST PASSED

E2EE complet

* Pipeline :

Alice
  -> ECDH
  -> AES-GCM
  -> ECDSA
  -> Bob
  -> anti-rejeu
  -> déchiffrement

* Résultat :

E2EE complet réussi

Message testé :

Bonjour Bob

* Navigateur

Clé partagée Alice ↔ Bob établie
Message E2EE envoyé par Alice
Message déchiffré par Bob: Bonjour Bob
Anti-rejeu : rejeu correctement refusé

E2EE TEST COMPLET : RÉUSSI

ECDH : OK
AES-GCM : OK
ECDSA : OK
Anti-rejeu : OK

### Persistance

La table messages contient le ciphertext, le nonce, la signature et le numéro de séquence, et non le plaintext.

### Résultats

* Fonctionnalité

* État

Inscription

OK

Connexion

OK

bcrypt

OK

JWT

OK

PostgreSQL

OK

WebSocket

OK

ECDH

OK

AES-GCM

OK

ECDSA

OK

Anti-rejeu

OK

Persistance du ciphertext

OK

Conversations existantes

OK

Restauration de session

OK

Réinitialisation du mot de passe

OK

### Limites

Le projet est une démonstration pédagogique et non une messagerie destinée à la production.

* WSS

L'environnement local utilise ws://. Un déploiement réel doit utiliser wss:// avec TLS.

* Session

La version actuelle utilise le stockage local du navigateur pour restaurer la session. Une application de production nécessiterait une stratégie de gestion des sessions plus robuste.

* Vérification des clés

Le projet ne met pas en place un système complet de vérification d'empreinte ou de mécanisme de confiance comparable à une messagerie de production.

* Anti-rejeu

La protection actuelle exige une progression strictement croissante des numéros de séquence et peut rejeter des messages hors ordre.

* Récupération du mot de passe

Le devToken est destiné à la démonstration locale du TP. En production, il devrait être remplacé par une véritable procédure de récupération sécurisée.

* Gestion des clés

Les clés privées sont conservées côté navigateur pour la session courante. Une application réelle devrait définir une stratégie complète de cycle de vie des clés.

* Améliorations possibles

activation de TLS ;

passage de ws:// à wss:// ;

amélioration de la gestion des tokens ;

vérification d'empreinte des clés publiques ;

gestion avancée des messages hors ordre ;

reconnexion automatique du WebSocket ;

véritable système d'e-mails pour la récupération de compte ;

rotation des clés cryptographiques ;

renforcement des protections XSS ;

ajout de tests automatisés supplémentaires ;

amélioration des journaux de sécurité sans enregistrer de plaintext.

### Scénario de démonstration

1. Démarrer le serveur

cd server
npm run dev

Montrer :

HTTP server running on http://localhost:3000
WebSocket server running on ws://localhost:3000/ws
PostgreSQL configured on port 5433

2. Démarrer le client

cd client
npm run dev

3. Se connecter

Utiliser un utilisateur existant.

Le serveur vérifie le mot de passe avec bcrypt puis génère un JWT permettant d'authentifier la session.

4. Sélectionner le destinataire

Choisir un utilisateur existant.

L'application retrouve ou crée automatiquement la conversation directe.

5. Préparer E2EE

Ouvrir la conversation.

Le navigateur génère les clés ECDH et ECDSA. Les clés privées restent côté client et ECDH permet d'établir une clé partagée.

6. Envoyer un message

Bonjour Bob

Le message est chiffré localement avec AES-GCM. Un nonce et un numéro de séquence sont générés, puis le message est signé avec ECDSA.

7. Montrer le serveur

Le serveur authentifie l'expéditeur, vérifie son appartenance à la conversation, stocke le ciphertext puis le relaie au destinataire.

8. Montrer PostgreSQL

La base contient le ciphertext, le nonce, la signature et le numéro de séquence, mais pas le texte en clair.

9. Montrer la réception

Le destinataire contrôle le numéro de séquence, vérifie la signature ECDSA puis déchiffre le message avec AES-GCM et la clé partagée obtenue avec ECDH.

10. Montrer l'anti-rejeu

Un ancien numéro de séquence est refusé afin d'empêcher la réutilisation d'un ancien message valide.

11. Actualiser la page

La session et le contexte de conversation sont restaurés, puis l'historique chiffré est récupéré et traité côté client.

#### Conclusion

Secure Chat E2EE montre comment plusieurs mécanismes de sécurité peuvent être combinés dans une même application web.

ECDH
→ établissement d'une clé partagée

AES-GCM
→ chiffrement du contenu

ECDSA
→ signature et vérification

Anti-rejeu
→ rejet des anciennes séquences

WebSocket
→ communication temps réel

WSS / TLS
→ protection du transport réseau

JWT
→ authentification des sessions

bcrypt
→ protection des mots de passe

PostgreSQL
→ persistance des données

Le point essentiel de l'architecture est la séparation entre le transport et la protection cryptographique du contenu.

Le serveur reste nécessaire pour l'authentification, l'autorisation, le routage et la persistance.

Cependant, le contenu du message suit le chemin :

Message en clair
      |
      v
Chiffrement côté client
      |
      v
Transport chiffré
      |
      v
Stockage chiffré
      |
      v
Réception par le destinataire
      |
      v
Vérification
      |
      v
Déchiffrement côté client
      |
      v
Message en clair

Le projet constitue ainsi une démonstration pratique de plusieurs mécanismes fondamentaux de sécurité appliqués à une messagerie web temps réel.