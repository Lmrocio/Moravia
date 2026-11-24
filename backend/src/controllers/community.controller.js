import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';
import { Invitation } from '../models/Invitation.js';
import { MEMBERSHIP_STATUS, ROLES, User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildDwellings } from '../utils/dwellings.js';
import { generateToken, hashToken } from '../utils/tokens.js';

const INVITATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

// POST /api/communities
// Crea la comunidad y sus viviendas, y convierte al usuario en presidente.
// Todo va en una transacción: si algo falla, no se guarda nada.
export async function createCommunity(req, res) {
  const { name, address, floors, doorsPerFloor, groundFloorDoors } = req.body;
  const communityId = new mongoose.Types.ObjectId();
  const dwellingData = buildDwellings({ floors, doorsPerFloor, groundFloorDoors }).map((d) => ({
    ...d,
    communityId,
  }));

  const session = await mongoose.startSession();
  let community;
  let dwellings;
  let user;

  try {
    await session.withTransaction(async () => {
      // Solo se actualiza si el usuario aún no tiene comunidad. Hacerlo en la misma
      // operación evita que dos peticiones a la vez creen dos comunidades.
      user = await User.findOneAndUpdate(
        { _id: req.user._id, communityId: null },
        {
          $set: {
            communityId,
            role: ROLES.PRESIDENT,
            membershipStatus: MEMBERSHIP_STATUS.VALIDATED,
          },
        },
        { new: true, session },
      );
      if (!user) {
        throw new AppError(409, 'Ya perteneces a una comunidad');
      }

      [community] = await Community.create(
        [{ _id: communityId, name, address, presidentId: user._id }],
        { session },
      );
      dwellings = await Dwelling.insertMany(dwellingData, { session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ community, dwellings, user });
}

// POST /api/communities/:id/invitation
// Genera un token de invitación de 48 h. Solo puede hacerlo el presidente de esa
// comunidad. Una invitación nueva sustituye a la anterior, que deja de funcionar.
async function getPresidentCommunity(req) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(404, 'Comunidad no encontrada');
  }

  const community = await Community.findById(id);
  if (!community) {
    throw new AppError(404, 'Comunidad no encontrada');
  }

  const isPresident =
    req.user.role === ROLES.PRESIDENT && community.presidentId.equals(req.user._id);
  if (!isPresident) {
    throw new AppError(403, 'Solo el presidente de la comunidad puede generar invitaciones');
  }

  return community;
}

export async function createInvitation(req, res) {
  const community = await getPresidentCommunity(req);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  await Invitation.findOneAndUpdate(
    { communityId: community._id },
    { tokenHash: hashToken(token), expiresAt, createdBy: req.user._id },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  // El token en claro solo se devuelve aquí, una vez. El frontend dibuja el QR con joinUrl.
  res.status(201).json({
    invitation: {
      token,
      expiresAt,
      joinUrl: `${env.CLIENT_ORIGIN}/unirse?token=${token}`,
    },
  });
}

// La revocación es idempotente: no revela si ya existía una invitación.
export async function revokeInvitation(req, res) {
  const community = await getPresidentCommunity(req);
  await Invitation.deleteOne({ communityId: community._id });
  res.status(204).end();
}
