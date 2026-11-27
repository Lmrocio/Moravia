// Solo se carga en desarrollo; no crea cuentas ni invitaciones reales.
let user = { id: 'demo', name: 'Álex García', role: 'resident', communityId: null };
let invitation = null;

function saveInvitation(value) {
  invitation = value;
  if (value) sessionStorage.setItem('moravia-demo-invitation', JSON.stringify(value));
  else sessionStorage.removeItem('moravia-demo-invitation');
}

function demoError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export async function demoApi(path, { method = 'GET', body } = {}) {
  if (path === '/api/auth/me') return { user };
  if (path === '/api/auth/logout') {
    user = { id: 'demo', name: 'Álex García', role: 'resident', communityId: null };
    saveInvitation(null);
    return null;
  }
  if (path === '/api/communities' && method === 'POST') {
    if (
      !body.name ||
      !body.address ||
      body.floors * body.doorsPerFloor + body.groundFloorDoors < 1
    ) {
      demoError('Completa los datos de la comunidad.');
    }
    user = { ...user, role: 'president', communityId: 'demo-comunidad' };
    return { user };
  }
  if (path === '/api/communities/demo-comunidad/invitation') {
    if (method === 'DELETE') {
      saveInvitation(null);
      return null;
    }
    const token = crypto.randomUUID().replaceAll('-', '') + 'demodemo123';
    const joinUrl = new URL('/unirse', window.location.origin);
    joinUrl.searchParams.set('token', token);
    joinUrl.searchParams.set('demo', '1');
    saveInvitation({
      token,
      joinUrl: joinUrl.href,
      expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    });
    return { invitation };
  }
  if (path === '/api/invitations/validate') {
    // Solo funciona en esta pestaña: no hay sincronización con otros dispositivos.
    if (!invitation) {
      try {
        invitation = JSON.parse(sessionStorage.getItem('moravia-demo-invitation') || 'null');
      } catch {
        invitation = null;
      }
    }
    if (invitation?.token !== body.token || new Date(invitation.expiresAt) <= new Date())
      demoError('La invitación no es válida o ha caducado', 404);
    return { valid: true, expiresAt: invitation.expiresAt };
  }
  demoError('Acción no disponible en la demostración.', 404);
}
