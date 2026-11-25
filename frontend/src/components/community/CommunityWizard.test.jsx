import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityWizard from './CommunityWizard.jsx';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }) => <canvas aria-label="Código QR de invitación" data-value={value} />,
}));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(cleanup);

it('guarda una distribución diferente y muestra el QR de la invitación real', async () => {
  const api = vi.fn(async (path) =>
    path === '/api/communities'
      ? { community: { id: 'comunidad' }, user: { communityId: 'comunidad' } }
      : { invitation: { token: 'a'.repeat(43), joinUrl: 'https://example.com/unirse?token=real' } },
  );
  render(<CommunityWizard api={api} onCreated={vi.fn()} onExit={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Nombre de la comunidad'), {
    target: { value: 'Los Olivos' },
  });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle Mayor' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar número de plantas superiores' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar número de plantas superiores' }));
  fireEvent.click(screen.getByLabelText(/Distribución diferente por planta/));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar planta 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar planta 2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar planta 2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('3')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Crear comunidad' }));
  await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
  expect(api.mock.calls[0][1].body.floorDoorCounts).toEqual([1, 2]);
  fireEvent.click(await screen.findByRole('button', { name: /Mostrar código QR/ }));
  expect(screen.getByLabelText('Código QR de invitación').dataset.value).toBe(
    'https://example.com/unirse?token=real',
  );
});

it('mantiene la comunidad creada y permite reintentar si falla la invitación', async () => {
  const api = vi.fn(async (path) => {
    if (path === '/api/communities')
      return { community: { id: 'comunidad' }, user: { communityId: 'comunidad' } };
    throw new Error('Sin conexión');
  });
  render(<CommunityWizard api={api} onCreated={vi.fn()} onExit={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Nombre de la comunidad'), {
    target: { value: 'Los Olivos' },
  });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle Mayor' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar viviendas en planta baja' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Crear comunidad' }));
  expect((await screen.findByRole('alert')).textContent).toContain('La comunidad se ha creado');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar invitación' }));
  await waitFor(() => expect(api).toHaveBeenCalledTimes(3));
  expect(api.mock.calls.filter(([path]) => path === '/api/communities')).toHaveLength(1);
});
