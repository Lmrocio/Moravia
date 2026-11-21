import crypto from 'node:crypto';
import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';
import { MEMBERSHIP_STATUS, ROLES, User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { clearAuthCookie, hashPassword, verifyPassword } from '../utils/auth.js';

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

// DELETE /api/users/me
// Derecho de supresión (RGPD): anonimiza la cuenta en lugar de borrarla, para que
// las incidencias y otros registros que apuntan al usuario sigan siendo válidos.
export async function deleteMyAccount(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await verifyPassword(req.body.password, user.passwordHash))) {
    throw new AppError(403, 'La contraseña no es correcta');
  }

  if (user.role === ROLES.PRESIDENT) {
    throw new AppError(
      409,
      'Eres el presidente de tu comunidad: transfiere la presidencia antes de eliminar tu cuenta',
    );
  }

  // Datos personales sustituidos por valores genéricos. El correo queda libre para
  // volver a registrarse y la contraseña pasa a ser un valor aleatorio que nadie conoce.
  user.name = 'Usuario eliminado';
  user.email = `eliminado-${user.id}@moravia.invalid`;
  user.passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
  user.role = ROLES.RESIDENT;
  user.communityId = null;
  user.dwellingId = null;
  user.membershipStatus = MEMBERSHIP_STATUS.NONE;
  user.deletedAt = new Date();
  await user.save();

  clearAuthCookie(res);
  res.status(204).end();
}