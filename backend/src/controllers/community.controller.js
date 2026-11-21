import mongoose from 'mongoose';
import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';
import { MEMBERSHIP_STATUS, ROLES, User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildDwellings } from '../utils/dwellings.js';

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