import { expect, it } from 'vitest';
import { demoApi } from './demo.js';

it('simula la creación y la revocación sin llamar al servidor', async () => {
  await demoApi('/api/communities', {
    method: 'POST',
    body: {
      name: 'Los Olivos',
      address: 'Calle 1',
      floors: 2,
      doorsPerFloor: 2,
      groundFloorDoors: 0,
    },
  });
  const first = (await demoApi('/api/communities/demo-comunidad/invitation', { method: 'POST' }))
    .invitation;
  expect(first.joinUrl).toContain('/unirse?');
  expect(first.token).toHaveLength(43);
  expect((await demoApi('/api/invitations/validate', { body: { token: first.token } })).valid).toBe(
    true,
  );
  const second = (await demoApi('/api/communities/demo-comunidad/invitation', { method: 'POST' }))
    .invitation;
  await expect(
    demoApi('/api/invitations/validate', { body: { token: first.token } }),
  ).rejects.toMatchObject({ status: 404 });
  await demoApi('/api/communities/demo-comunidad/invitation', { method: 'DELETE' });
  await expect(
    demoApi('/api/invitations/validate', { body: { token: second.token } }),
  ).rejects.toMatchObject({ status: 404 });
});
