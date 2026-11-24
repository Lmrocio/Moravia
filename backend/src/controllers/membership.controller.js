import mongoose from 'mongoose';
import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';
import { Invitation } from '../models/Invitation.js';
import { MEMBERSHIP_STATUS, ROLES, User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, setAuthCookie } from '../utils/auth.js';
import { hashToken } from '../utils/tokens.js';
import { getPresidentCommunity } from './community.controller.js';

function activeToken(token) {
  return { tokenHash: hashToken(token), expiresAt: { $gt: new Date() } };
}

function invalidInvitation() {
  return new AppError(404, 'La invitación no es válida o ha caducado');
}

export async function validateInvitation(req, res) {
  const invitation = await Invitation.findOne(activeToken(req.body.token));
  if (!invitation) throw invalidInvitation();

  const [community, reserved] = await Promise.all([
    Community.findById(invitation.communityId).select('name'),
    User.distinct('dwellingId', { communityId: invitation.communityId, dwellingId: { $ne: null } }),
  ]);
  if (!community) throw invalidInvitation();

  const available = await Dwelling.find({
    communityId: community._id,
    _id: { $nin: reserved },
  })
    .select('label')
    .sort({ floor: 1, door: 1 });

  res.set('Cache-Control', 'no-store').json({
    valid: true,
    expiresAt: invitation.expiresAt,
    community: { name: community.name },
    dwellings: available.map(({ id, label }) => ({ id, label })),
  });
}

export async function registerResident(req, res) {
  const { token, dwellingId, name, email, password } = req.body;
  const passwordHash = await hashPassword(password);
  await User.init();
  let user;

  try {
    await mongoose.connection.transaction(async (session) => {
      // Escribir en la invitación serializa el alta con su revocación o sustitución.
      const invitation = await Invitation.findOneAndUpdate(
        activeToken(token),
        { $inc: { registrationCount: 1 } },
        { session },
      );
      if (!invitation) throw invalidInvitation();

      const dwelling = await Dwelling.exists({
        _id: dwellingId,
        communityId: invitation.communityId,
      }).session(session);
      if (!dwelling) throw new AppError(400, 'Selecciona una vivienda de esta comunidad');

      [user] = await User.create(
        [
          {
            name,
            email,
            passwordHash,
            dwellingId,
            communityId: invitation.communityId,
            role: ROLES.RESIDENT,
            membershipStatus: MEMBERSHIP_STATUS.PENDING,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.dwellingId) {
      throw new AppError(409, 'La vivienda ya no está disponible. Vuelve a cargar la invitación.');
    }
    throw error;
  }

  setAuthCookie(res, user._id);
  res.status(201).json({ user });
}

export async function listMembershipRequests(req, res) {
  const community = await getPresidentCommunity(req);
  const requests = await User.find({
    communityId: community._id,
    role: ROLES.RESIDENT,
    membershipStatus: MEMBERSHIP_STATUS.PENDING,
  })
    .select('name dwellingId')
    .populate('dwellingId', 'label')
    .sort({ createdAt: 1 });

  res.set('Cache-Control', 'no-store').json({
    requests: requests.map((user) => ({
      id: user.id,
      name: user.name,
      dwelling: user.dwellingId?.label ?? 'Vivienda no disponible',
    })),
  });
}

export async function decideMembershipRequest(req, res) {
  const community = await getPresidentCommunity(req);
  if (!mongoose.isObjectIdOrHexString(req.params.userId)) {
    throw new AppError(404, 'Solicitud no encontrada');
  }
  const update =
    req.body.decision === 'approve'
      ? { membershipStatus: MEMBERSHIP_STATUS.VALIDATED }
      : { membershipStatus: MEMBERSHIP_STATUS.REJECTED, communityId: null, dwellingId: null };
  const result = await User.updateOne(
    {
      _id: req.params.userId,
      communityId: community._id,
      role: ROLES.RESIDENT,
      membershipStatus: MEMBERSHIP_STATUS.PENDING,
    },
    { $set: update },
  );
  if (!result.matchedCount)
    throw new AppError(404, 'No hay una solicitud pendiente para este vecino');
  res.status(204).end();
}
