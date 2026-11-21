import { Community } from '../models/Community.js';
import { Dwelling } from '../models/Dwelling.js';

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