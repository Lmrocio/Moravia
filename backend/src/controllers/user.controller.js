import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';
import { Invitation } from '../models/Invitation.js';
import { MEMBERSHIP_STATUS, ROLES, User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { clearAuthCookie, hashPassword, verifyPassword } from '../utils/auth.js';
import { DELETED_EMAIL_DOMAIN } from '../validators/auth.schemas.js';

// GET /api/users/me/export
// Derecho de acceso y portabilidad (RGPD): descarga en JSON todos los datos
// personales del usuario.
export async function exportMyData(req, res) {
  const user = req.user;

  const [community, dwelling] = await Promise.all([
    user.communityId ? Community.findById(user.communityId) : null,
    user.dwellingId ? Dwelling.findById(user.dwellingId) : null,
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: user.toJSON(),
    community: community && {
      id: community.id,
      name: community.name,
      address: community.address,
      isPresident: community.presidentId.equals(user._id),
    },
    dwelling: dwelling && { id: dwelling.id, label: dwelling.label },
    // Se rellenará cuando exista el modelo de incidencias.
    incidents: [],
  };

  const date = data.exportedAt.slice(0, 10);
  res.attachment(`moravia-mis-datos-${date}.json`);
  res.json(data);
}

// Si el presidente se da de baja y no queda nadie más en la comunidad, la comunidad
// desaparece con él. Si hay vecinos o solicitudes, primero tiene que transferir la
// presidencia.
async function dissolveCommunityIfAlone(president, session) {
  const community = await Community.findOne({
    _id: president.communityId,
    presidentId: president._id,
  }).session(session);
  if (!community) return;

  const others = await User.countDocuments({
    communityId: community._id,
    _id: { $ne: president._id },
    deletedAt: null,
  }).session(session);
  if (others > 0) {
    throw new AppError(
      409,
      'Eres el presidente de tu comunidad: transfiere la presidencia a otro vecino antes de eliminar tu cuenta',
    );
  }

  // En una transacción las operaciones van una detrás de otra, no en paralelo.
  await Invitation.deleteMany({ communityId: community._id }, { session });
  await Dwelling.deleteMany({ communityId: community._id }, { session });
  await Community.deleteOne({ _id: community._id }, { session });
}

// DELETE /api/users/me
// Derecho de supresión (RGPD): anonimiza la cuenta en lugar de borrarla, para que
// las incidencias y otros registros que apuntan al usuario sigan siendo válidos.
export async function deleteMyAccount(req, res) {
  const current = await User.findById(req.user._id).select('+passwordHash');
  if (!current || !(await verifyPassword(req.body.password, current.passwordHash))) {
    throw new AppError(403, 'La contraseña no es correcta');
  }

  // Datos personales sustituidos por valores genéricos. El correo usa un valor aleatorio
  // (no el id, que es público) en un dominio reservado, así nadie puede ocuparlo antes.
  const anonymized = {
    name: 'Usuario eliminado',
    email: `eliminado-${crypto.randomBytes(12).toString('hex')}@${DELETED_EMAIL_DOMAIN}`,
    passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')),
    role: ROLES.RESIDENT,
    communityId: null,
    dwellingId: null,
    membershipStatus: MEMBERSHIP_STATUS.NONE,
    deletedAt: new Date(),
  };

  // La transacción hace que la baja no se mezcle con otra operación simultánea sobre
  // el mismo usuario (por ejemplo, crear una comunidad): si coinciden, MongoDB repite
  // esta función con los datos ya actualizados.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findOne({ _id: req.user._id, deletedAt: null }).session(session);
      if (!user) {
        throw new AppError(401, 'Sesión no válida o caducada');
      }

      if (user.role === ROLES.PRESIDENT) {
        await dissolveCommunityIfAlone(user, session);
      }

      await User.updateOne({ _id: user._id }, { $set: anonymized }, { session });
    });
  } finally {
    await session.endSession();
  }

  clearAuthCookie(res);
  res.status(204).end();
}

// POST /api/users/me/presidency/transfer
// El presidente cede la presidencia a un vecino validado de su comunidad y pasa a ser
// un vecino más.
export async function transferPresidency(req, res) {
  const { userId } = req.body;
  if (req.user._id.equals(userId)) {
    throw new AppError(400, 'Elige a otro vecino de la comunidad');
  }

  let newPresident;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const president = await User.findOne({
        _id: req.user._id,
        role: ROLES.PRESIDENT,
        deletedAt: null,
      }).session(session);
      const community =
        president &&
        (await Community.findOne({
          _id: president.communityId,
          presidentId: president._id,
        }).session(session));
      if (!community) {
        throw new AppError(
          403,
          'Solo el presidente de una comunidad puede transferir la presidencia',
        );
      }

      newPresident = await User.findOneAndUpdate(
        {
          _id: userId,
          communityId: community._id,
          role: ROLES.RESIDENT,
          membershipStatus: MEMBERSHIP_STATUS.VALIDATED,
          deletedAt: null,
        },
        { $set: { role: ROLES.PRESIDENT } },
        { new: true, session },
      );
      if (!newPresident) {
        throw new AppError(404, 'El nuevo presidente debe ser un vecino validado de tu comunidad');
      }

      await User.updateOne({ _id: president._id }, { $set: { role: ROLES.RESIDENT } }, { session });
      await Community.updateOne(
        { _id: community._id },
        { $set: { presidentId: newPresident._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ president: { id: newPresident.id, name: newPresident.name } });
}