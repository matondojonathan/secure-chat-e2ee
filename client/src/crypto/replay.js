// Gère les numéros de séquence déjà reçus
// pour chaque expéditeur.
export class ReplayProtection {
  constructor() {
    this.lastSequenceBySender = new Map();
  }

  // Vérifie si un message peut être accepté.
  //
  // Un numéro de séquence doit être strictement
  // supérieur au dernier numéro accepté pour cet expéditeur.
  accept(senderId, sequenceNumber) {
    const sequence = Number(sequenceNumber);

    if (!Number.isInteger(sequence) || sequence < 0) {
      return false;
    }

    const lastSequence =
      this.lastSequenceBySender.get(senderId);

    // Premier message de cet expéditeur.
    if (lastSequence === undefined) {
      this.lastSequenceBySender.set(
        senderId,
        sequence
      );

      return true;
    }

    // Message ancien ou déjà reçu.
    if (sequence <= lastSequence) {
      return false;
    }

    // Nouveau message.
    this.lastSequenceBySender.set(
      senderId,
      sequence
    );

    return true;
  }

  // Permet de connaître le dernier numéro accepté.
  getLastSequence(senderId) {
    return this.lastSequenceBySender.get(senderId);
  }

  // Réinitialise l'état pour un nouvel utilisateur/session.
  reset(senderId) {
    this.lastSequenceBySender.delete(senderId);
  }
}