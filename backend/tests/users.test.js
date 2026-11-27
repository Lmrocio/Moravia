import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Community } from '../src/models/Community.js';
import { Dwelling } from '../src/models/Dwelling.js';
import { Invitation } from '../src/models/Invitation.js';
import { Ticket } from '../src/models/Ticket.js';
import { User } from '../src/models/User.js';

const password = 'contraseña-segura';
const building = { name: 'Comunidad', address: 'Calle 1', floors: 1, doorsPerFloor: 2 };
const closedTicket = {
  title: 'Luz de la escalera',
  description: 'La bombilla no enciende',
  category: 'electricidad',
  status: 'resuelta',
};

// Registra un usuario y devuelve su "navegador" (agent) con la sesión y el token CSRF.
async function signUp(email = 'carmen@example.com') {
  const agent = request.agent(app);
  const { body } = await agent.get('/api/auth/csrf').expect(200);
  const csrf = body.csrfToken;
  const res = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Carmen López', email, password, acceptPolicies: true })
    .expect(201);
  const sessionCookie = res.headers['set-cookie'].find((c) => c.startsWith('moravia_token='));
  return { agent, csrf, user: res.body.user, sessionCookie: sessionCookie.split(';')[0] };
}

// Sin async: así devuelven la petición de Supertest y se puede encadenar .expect().
function deleteAccount(session, body = { password }) {
  return session.agent.delete('/api/users/me').set('X-CSRF-Token', session.csrf).send(body);
}

function createCommunity(session) {
  return session.agent.post('/api/communities').set('X-CSRF-Token', session.csrf).send(building);
}

function transferPresidency(session, userId) {
  return session.agent
    .post('/api/users/me/presidency/transfer')
    .set('X-CSRF-Token', session.csrf)
    .send({ userId });
}

// Crea una comunidad con su presidente y un vecino validado.
async function communityWithResident() {
  const president = await signUp('presidente@example.com');
  const { body } = await createCommunity(president).expect(201);
  const resident = await signUp('vecino@example.com');
  await User.updateOne(
    { _id: resident.user.id },
    { communityId: body.community.id, membershipStatus: 'validated' },
  );
  return { president, resident, communityId: body.community.id };
}

beforeAll(async () => {
  await Promise.all([User.init(), Community.init(), Dwelling.init(), Invitation.init(), Ticket.init()]);
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

  it('exporta el historial propio y excluye el contenido de incidencias ajenas', async () => {
    const { president, resident, communityId } = await communityWithResident();
    const other = await signUp('otro@example.com');
    const own = await Ticket.create({
      ...closedTicket,
      communityId,
      authorId: president.user.id,
      messages: [{ authorId: resident.user.id, body: 'Aviso recibido' }],
    });
    const replied = await Ticket.create({
      ...closedTicket,
      communityId,
      authorId: resident.user.id,
      messages: [
        { authorId: resident.user.id, body: 'Consulta privada' },
        { authorId: president.user.id, body: 'Ya se ha arreglado' },
      ],
    });
    await Ticket.create({ ...closedTicket, communityId, authorId: other.user.id });

    const res = await president.agent.get('/api/users/me/export').expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.incidents).toHaveLength(2);
    expect(res.body.incidents).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: own.id, ...closedTicket, messages: [
        expect.objectContaining({ body: 'Aviso recibido', sentByMe: false }),
      ] }),
      { id: replied.id, messages: [
        expect.objectContaining({ body: 'Ya se ha arreglado', sentByMe: true }),
      ] },
    ]));
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
    expect(after.passwordHash).not.toBe(before.passwordHash);
    expect(after.communityId).toBeNull();
    expect(after.dwellingId).toBeNull();
    expect(after.membershipStatus).toBe('none');
    expect(after.deletedAt).toBeInstanceOf(Date);
  });

  it('usa un correo aleatorio que no se puede adivinar a partir del id', async () => {
    const carmen = await signUp();
    await deleteAccount(carmen).expect(204);

    const { email } = await User.findById(carmen.user.id);
    expect(email).toMatch(/^eliminado-[a-f0-9]{24}@moravia\.invalid$/);
    expect(email).not.toContain(carmen.user.id);
  });

  it('no deja registrarse con el dominio reservado para cuentas eliminadas', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    const res = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', body.csrfToken)
      .send({
        name: 'Intruso',
        email: 'eliminado-algo@moravia.invalid',
        password,
        acceptPolicies: true,
      })
      .expect(400);
    expect(res.body.details[0].field).toBe('email');
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

describe('Baja del presidente', () => {
  it('si tiene vecinos, no puede darse de baja sin transferir la presidencia (409)', async () => {
    const { president, communityId } = await communityWithResident();

    const res = await deleteAccount(president).expect(409);
    expect(res.body.error).toMatch(/transfiere la presidencia/);
    expect(await Community.exists({ _id: communityId })).not.toBeNull();
  });

  it('si está solo, se da de baja y la comunidad desaparece con él', async () => {
    const president = await signUp('presidente@example.com');
    const { body } = await createCommunity(president).expect(201);
    const communityId = body.community.id;
    await president.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', president.csrf)
      .expect(201);

    await deleteAccount(president).expect(204);

    expect(await Community.exists({ _id: communityId })).toBeNull();
    expect(await Dwelling.countDocuments({ communityId })).toBe(0);
    expect(await Invitation.countDocuments({ communityId })).toBe(0);
    expect((await User.findById(president.user.id)).deletedAt).toBeInstanceOf(Date);
  });

  it('tras transferir la presidencia, puede darse de baja', async () => {
    const { president, resident, communityId } = await communityWithResident();

    await transferPresidency(president, resident.user.id).expect(200);
    await deleteAccount(president).expect(204);

    const community = await Community.findById(communityId);
    expect(community.presidentId.toString()).toBe(resident.user.id);
  });

  it('permite la baja con solo solicitudes pendientes y conserva los tickets cerrados', async () => {
    const { president, resident, communityId } = await communityWithResident();
    const dwelling = await Dwelling.findOne({ communityId });
    await User.updateOne(
      { _id: resident.user.id },
      { membershipStatus: 'pending', dwellingId: dwelling._id },
    );
    await president.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', president.csrf)
      .expect(201);
    const ticket = await Ticket.create({
      ...closedTicket,
      communityId,
      authorId: president.user.id,
      messages: [{ authorId: president.user.id, body: 'Ticket cerrado' }],
    });

    await deleteAccount(president).expect(204);

    const saved = await Ticket.findById(ticket._id).populate('authorId communityId messages.authorId');
    expect(saved.status).toBe('resuelta');
    expect(saved.authorId.name).toBe('Usuario eliminado');
    expect(saved.messages[0].authorId.id).toBe(president.user.id);
    expect(saved.communityId.archivedAt).toBeInstanceOf(Date);
    expect(await Dwelling.exists({ _id: dwelling._id })).not.toBeNull();
    expect(await Invitation.countDocuments({ communityId })).toBe(0);
    expect(await User.findById(resident.user.id)).toMatchObject({
      communityId: null,
      dwellingId: null,
      membershipStatus: 'none',
      deletedAt: null,
    });
  });
});

describe('POST /api/users/me/presidency/transfer', () => {
  it('cede la presidencia a un vecino validado de la comunidad', async () => {
    const { president, resident, communityId } = await communityWithResident();

    const res = await transferPresidency(president, resident.user.id).expect(200);
    expect(res.body.president).toEqual({ id: resident.user.id, name: 'Carmen López' });

    expect((await User.findById(resident.user.id)).role).toBe('president');
    expect((await User.findById(president.user.id)).role).toBe('resident');
    expect((await Community.findById(communityId)).presidentId.toString()).toBe(resident.user.id);

    // El nuevo presidente ya puede generar invitaciones y el antiguo ya no.
    await resident.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', resident.csrf)
      .expect(201);
    await president.agent
      .post(`/api/communities/${communityId}/invitation`)
      .set('X-CSRF-Token', president.csrf)
      .expect(403);
  });

  it('no se puede ceder a uno mismo (400) ni con un id no válido (400)', async () => {
    const { president } = await communityWithResident();
    await transferPresidency(president, president.user.id).expect(400);
    await transferPresidency(president, 'no-es-un-id').expect(400);
  });

  it('solo se puede ceder a un vecino validado de la misma comunidad (404)', async () => {
    const { president, resident } = await communityWithResident();
    const outsider = await signUp('otro@example.com');
    await transferPresidency(president, outsider.user.id).expect(404);

    await User.updateOne({ _id: resident.user.id }, { membershipStatus: 'pending' });
    await transferPresidency(president, resident.user.id).expect(404);
  });

  it('un vecino no puede transferir la presidencia (403)', async () => {
    const { president, resident } = await communityWithResident();
    await transferPresidency(resident, president.user.id).expect(403);
  });
});

describe('Concurrencia entre la baja y la creación de comunidades', () => {
  it('nunca queda una comunidad cuyo presidente ha eliminado su cuenta', async () => {
    for (let i = 0; i < 5; i++) {
      const user = await signUp(`concurrente${i}@example.com`);

      // Las dos peticiones salen a la vez; el orden en que terminan varía.
      await Promise.all([deleteAccount(user), createCommunity(user)]);

      const deleted = await User.find({ deletedAt: { $ne: null } }).select('_id');
      const orphan = await Community.exists({ presidentId: { $in: deleted.map((u) => u._id) } });
      expect(orphan).toBeNull();
      expect((await User.findById(user.user.id)).deletedAt).toBeInstanceOf(Date);
    }
  });
});
