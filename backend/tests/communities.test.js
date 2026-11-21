import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Community } from '../src/models/Community.js';
import { Dwelling } from '../src/models/Dwelling.js';
import { Invitation } from '../src/models/Invitation.js';
import { User } from '../src/models/User.js';
import { hashToken } from '../src/utils/tokens.js';

const building = {
  name: 'Comunidad Los Olivos',
  address: 'Calle Larga 10, Jerez',
  floors: 4,
  doorsPerFloor: 4,
  groundFloorDoors: 2,
};

// Registra un usuario y devuelve su "navegador" (agent) con la sesión y el token CSRF.
async function signUp(email) {
  const agent = request.agent(app);
  const { body } = await agent.get('/api/auth/csrf').expect(200);
  const csrf = body.csrfToken;
  const res = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Usuario de prueba', email, password: 'contraseña-segura' })
    .expect(201);
  return { agent, csrf, user: res.body.user };
}

// Sin async: así devuelve la petición de Supertest y se puede encadenar .expect().
function createCommunity(session, data = building) {
  return session.agent.post('/api/communities').set('X-CSRF-Token', session.csrf).send(data);
}

beforeAll(async () => {
  await Promise.all([User.init(), Community.init(), Dwelling.init(), Invitation.init()]);
});

describe('POST /api/communities', () => {
  it('exige iniciar sesión (401)', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    await agent
      .post('/api/communities')
      .set('X-CSRF-Token', body.csrfToken)
      .send(building)
      .expect(401);
  });

  it('crea la comunidad, sus viviendas y convierte al creador en presidente', async () => {
    const pablo = await signUp('pablo@example.com');
    const res = await createCommunity(pablo).expect(201);

    expect(res.body.community).toMatchObject({
      name: building.name,
      address: building.address,
      presidentId: pablo.user.id,
    });
    // 2 en la planta baja + 4 plantas × 4 puertas
    expect(res.body.dwellings).toHaveLength(18);
    expect(res.body.dwellings.map((d) => d.label)).toEqual(
      expect.arrayContaining(['Bajo A', 'Bajo B', '1º A', '4º D']),
    );
    expect(res.body.user).toMatchObject({
      role: 'president',
      membershipStatus: 'validated',
      communityId: res.body.community.id,
    });

    // El cambio de rol queda guardado: /me ya lo refleja.
    const me = await pablo.agent.get('/api/auth/me').expect(200);
    expect(me.body.user.role).toBe('president');
    expect(await Dwelling.countDocuments({ communityId: res.body.community.id })).toBe(18);
  });

  it('no deja crear una segunda comunidad al mismo usuario (409)', async () => {
    const pablo = await signUp('pablo@example.com');
    await createCommunity(pablo).expect(201);

    const res = await createCommunity(pablo, { ...building, name: 'Otra comunidad' }).expect(409);
    expect(res.body.error).toMatch(/Ya perteneces/);
    expect(await Community.countDocuments()).toBe(1);
  });

  it('si algo falla, no deja nada a medias (transacción)', async () => {
    const pablo = await signUp('pablo@example.com');
    // Se fuerza un fallo al guardar las viviendas (el último paso de la transacción):
    // un índice único temporal hace que "Bajo A" ya exista.
    await Dwelling.collection.createIndex(
      { label: 1 },
      { unique: true, partialFilterExpression: { label: 'Bajo A' }, name: 'fallo_forzado' },
    );
    try {
      await Dwelling.collection.insertOne({ label: 'Bajo A' });

      await createCommunity(pablo).expect(409);

      // Ni la comunidad ni el cambio de rol del usuario se han guardado.
      expect(await Community.countDocuments()).toBe(0);
      const user = await User.findById(pablo.user.id);
      expect(user.role).toBe('resident');
      expect(user.communityId).toBeNull();
    } finally {
      await Dwelling.collection.dropIndex('fallo_forzado');
    }
  });

  it('valida la estructura del edificio (400)', async () => {
    const pablo = await signUp('pablo@example.com');

    const tooManyDoors = await createCommunity(pablo, { ...building, doorsPerFloor: 27 }).expect(
      400,
    );
    expect(tooManyDoors.body.details[0].field).toBe('doorsPerFloor');

    const noDwellings = await createCommunity(pablo, {
      ...building,
      floors: 0,
      groundFloorDoors: 0,
    }).expect(400);
    expect(noDwellings.body.details[0].message).toMatch(/al menos una vivienda/);

    await createCommunity(pablo, { ...building, floors: '4' }).expect(400);
  });

  it('el índice único impide dos viviendas con el mismo nombre en una comunidad', async () => {
    const pablo = await signUp('pablo@example.com');
    const res = await createCommunity(pablo).expect(201);

    await expect(
      Dwelling.create({ communityId: res.body.community.id, floor: 0, door: 'A', label: 'Bajo A' }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});

describe('POST /api/communities/:id/invitation', () => {
  async function presidentWithCommunity() {
    const president = await signUp('presidente@example.com');
    const res = await createCommunity(president).expect(201);
    return { president, communityId: res.body.community.id };
  }

  it('el presidente genera un token de 48 h y solo se guarda su hash', async () => {
    const { president, communityId } = await presidentWithCommunity();

    const before = Date.now();
    const res = await president.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', president.csrf)
      .expect(201);

    const { token, expiresAt, joinUrl } = res.body.invitation;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes en base64url
    expect(joinUrl).toBe(`http://localhost:5173/unirse?token=${token}`);

    const hours = (new Date(expiresAt).getTime() - before) / 3_600_000;
    expect(hours).toBeGreaterThan(47.9);
    expect(hours).toBeLessThanOrEqual(48.01);

    const saved = await Invitation.findOne({ communityId });
    expect(saved.tokenHash).toBe(hashToken(token));
    expect(saved.tokenHash).not.toContain(token);
  });

  it('una invitación nueva sustituye a la anterior', async () => {
    const { president, communityId } = await presidentWithCommunity();
    const generate = () =>
      president.agent
        .post(`/api/communities/${communityId}/invitation`)
        .set('X-CSRF-Token', president.csrf)
        .expect(201);

    const first = (await generate()).body.invitation.token;
    const second = (await generate()).body.invitation.token;

    expect(second).not.toBe(first);
    expect(await Invitation.countDocuments({ communityId })).toBe(1);
    expect(await Invitation.exists({ tokenHash: hashToken(first) })).toBeNull();
  });

  it('guarda la caducidad con un índice TTL', async () => {
    const indexes = await Invitation.collection.indexes();
    const ttl = indexes.find((index) => index.key.expiresAt === 1);
    expect(ttl.expireAfterSeconds).toBe(0);
  });

  it('un vecino de la comunidad no puede generar invitaciones (403)', async () => {
    const { communityId } = await presidentWithCommunity();
    const vecino = await signUp('vecino@example.com');
    await User.updateOne(
      { _id: vecino.user.id },
      { communityId, membershipStatus: 'validated', role: 'resident' },
    );

    const res = await vecino.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', vecino.csrf)
      .expect(403);
    expect(res.body.error).toMatch(/Solo el presidente/);
  });

  it('el presidente de otra comunidad tampoco puede (403)', async () => {
    const { communityId } = await presidentWithCommunity();
    const otro = await signUp('otro@example.com');
    await createCommunity(otro, { ...building, name: 'Otra comunidad' }).expect(201);

    await otro.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', otro.csrf)
      .expect(403);
  });

  it('responde 404 si la comunidad no existe o el id no es válido', async () => {
    const { president } = await presidentWithCommunity();
    const send = (id) =>
      president.agent.post(`/api/communities/${id}/invitation`).set('X-CSRF-Token', president.csrf);

    await send('6afe2444170a6f73af29af80').expect(404);
    await send('no-es-un-id').expect(404);
  });

  it('exige iniciar sesión (401)', async () => {
    const { communityId } = await presidentWithCommunity();
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    await agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', body.csrfToken)
      .expect(401);
  });
});