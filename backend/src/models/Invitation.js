import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    // Una sola invitación activa por comunidad: generar otra sustituye a la anterior.
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      unique: true,
    },
    // Solo se guarda el hash SHA-256 del token, nunca el token en claro.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Índice TTL: MongoDB borra el documento cuando llega esta fecha. El borrado se
    // ejecuta cada minuto aproximadamente, así que al usar la invitación también hay
    // que comprobar que expiresAt no ha pasado.
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true },
);

export const Invitation = mongoose.model('Invitation', invitationSchema);