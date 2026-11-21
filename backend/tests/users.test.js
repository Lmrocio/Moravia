import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Community } from '../src/models/Community.js';
import { Dwelling } from '../src/models/Dwelling.js';
import { User } from '../src/models/User.js';

const password = 'contraseña-segura';

// Registra un usuario y devuelve su "navegador" (agent) con la sesión y el token CSRF.
async function signUp(email = 'carmen@example.com') {
  const agent = request.agent(app);
  const { body } = await agent.get('/api/auth/csrf').expect(200);
  const csrf = body.csrfToken;
  const res = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Carmen López', email, password })
    .expect(201);
  const sessionCookie = res.headers['set-cookie'].find((c) => c.startsWith('moravia_token='));
  return { agent, csrf, user: res.body.user, sessionCookie: sessionCookie.split(';')[0] };
}

// Sin async: así devuelve la petición de Supertest y se puede encadenar .expect().
function deleteAccount(session, body = { password }) {
  return session.agent.delete('/api/users/me').set('X-CSRF-Token', session.csrf).send(body);
}

beforeAll(async () => {
  await Promise.all([User.init(), Community.init(), Dwelling.init()]);
});

describe('GET /api/users/me/export', () => {
  it('exige iniciar sesión (401)', async () => {
    await request(app).get('/api/users/me/export').expect(401);
  });

  it('descarga un JSON con el perfil y sin la contraseña', async () => {
    const carmen = await signUp();
    const res = await carmen.agent.get('/api/users/me/export').expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toMatch(
           /attachment; filename="?moravia-mis-datos-\d{4}-\d{2}-\d{2}\.json"?/,
    );
    expect(res.body.profile).toMatchObject({ name: 'Carmen López', email: 'carmen@example.com' });
    expect(res.body.profile).not.toHaveProperty('passwordHash');
    expect(res.body).toMatchObject({ community: null, dwelling: null, incidents: [] });
    expect(new Date(res.body.exportedAt).toString()).not.toBe('Invalid Date');
  });

  it('incluye la comunidad y la vivienda vinculadas', async () => {
    const carmen = await signUp();
    const community = await Community.create({
      name: 'Comunidad Los Olivos',
      address: 'Calle Larga 10, Jerez',
      presidentId: carmen.user.id,
    });
    const dwelling = await Dwelling.create({
      communityId: community._id,
      floor: 1,
      door: 'B',
      label: '1º B',
    });
    await User.updateOne(
      { _id: carmen.user.id },
      { communityId: community._id, dwellingId: dwelling._id, membershipStatus: 'validated' },
    );

    const res = await carmen.agent.get('/api/users/me/export').expect(200);

    expect(res.body.community).toEqual({
      id: community.id,
      name: 'Comunidad Los Olivos',
      address: 'Calle Larga 10, Jerez',
      isPresident: true,
    });
    expect(res.body.dwelling).toEqual({ id: dwelling.id, label: '1º B' });
  });
});

describe('DELETE /api/users/me', () => {
  it('pide la contraseña (400) y la comprueba (403)', async () => {
    const carmen = await signUp();

    await deleteAccount(carmen, {}).expect(400);
    const res = await deleteAccount(carmen, { password: 'otra-contraseña' }).expect(403);
    expect(res.body.error).toMatch(/contraseña no es correcta/);

    expect((await User.findById(carmen.user.id)).deletedAt).toBeNull();
  });

  it('no deja eliminar la cuenta al presidente de una comunidad (409)', async () => {
    const president = await signUp();
    await president.agent
      .post('/api/communities')
      .set('X-CSRF-Token', president.csrf)
      .send({ name: 'Comunidad', address: 'Calle 1', floors: 1, doorsPerFloor: 2 })
      .expect(201);

    const res = await deleteAccount(president).expect(409);
    expect(res.body.error).toMatch(/transfiere la presidencia/);
  });

  it('anonimiza los datos personales pero conserva el documento', async () => {
    const carmen = await signUp();
    const community = await Community.create({
      name: 'Comunidad',
      address: 'Calle 1',
      presidentId: carmen.user.id,
    });
    await User.updateOne(
      { _id: carmen.user.id },
      { communityId: community._id, membershipStatus: 'validated' },
    );
    const before = await User.findById(carmen.user.id).select('+passwordHash');

    await deleteAccount(carmen).expect(204);

    // El documento sigue existiendo con el mismo id: las referencias no se rompen.
    const after = await User.findById(carmen.user.id).select('+passwordHash');
    expect(after).not.toBeNull();
    expect(after.name).toBe('Usuario eliminado');
    expect(after.email).toBe(`eliminado-${carmen.user.id}@moravia.invalid`);
    expect(after.passwordHash).not.toBe(before.passwordHash);
    expect(after.communityId).toBeNull();
    expect(after.dwellingId).toBeNull();
    expect(after.membershipStatus).toBe('none');
    expect(after.deletedAt).toBeInstanceOf(Date);
  });

  it('revoca el acceso: cierra la sesión y no se puede volver a entrar', async () => {
    const carmen = await signUp();

    const res = await deleteAccount(carmen).expect(204);
    expect(res.headers['set-cookie'].join()).toMatch(/moravia_token=;/);

    // La sesión del navegador ya no vale.
    await carmen.agent.get('/api/auth/me').expect(401);
    // Ni siquiera reutilizando el JWT anterior al borrado.
    await request(app).get('/api/auth/me').set('Cookie', carmen.sessionCookie).expect(401);
    // Y las credenciales antiguas ya no sirven para iniciar sesión.
    await carmen.agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', carmen.csrf)
      .send({ email: 'carmen@example.com', password })
      .expect(401);
  });

  it('el correo queda libre para registrarse de nuevo', async () => {
    const carmen = await signUp();
    await deleteAccount(carmen).expect(204);

    const again = await signUp('carmen@example.com');
    expect(again.user.id).not.toBe(carmen.user.id);
  });

  it('exige iniciar sesión (401)', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    await agent
      .delete('/api/users/me')
      .set('X-CSRF-Token', body.csrfToken)
      .send({ password })
      .expect(401);
  });
});