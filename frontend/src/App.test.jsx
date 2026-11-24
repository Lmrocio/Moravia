import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }) => <canvas aria-label="Código QR de invitación" data-value={value} />,
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('crea una comunidad, muestra el QR y permite copiar, descargar y revocar', async () => {
  const joinUrl = 'https://moravia.example/unirse?token=abc';
  const resident = { id: 'user', name: 'Pablo', role: 'resident', communityId: null };
  const president = { ...resident, role: 'president', communityId: 'community' };
  const requests = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      requests.push({ url, ...options });
      let body;
      let status = 200;
      if (url.endsWith('/api/auth/me')) body = { user: resident };
      else if (url.endsWith('/api/auth/csrf')) body = { csrfToken: 'csrf' };
      else if (url.endsWith('/api/communities')) body = { user: president };
      else if (options.method === 'DELETE') status = 204;
      else
        body = { invitation: { joinUrl, expiresAt: new Date(Date.now() + 60000).toISOString() } };
      return { ok: true, status, json: async () => body };
    }),
  );
  const writeText = vi.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);
  fireEvent.change(await screen.findByLabelText('Nombre de la finca'), {
    target: { value: 'Los Olivos' },
  });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle 1' } });
  fireEvent.change(screen.getByLabelText(/Plantas superiores/), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText(/Puertas por planta/), { target: { value: '3' } });
  expect(screen.getByText('6')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Crear comunidad/ }));
  fireEvent.click(await screen.findByRole('button', { name: /Generar invitación/ }));

  const qr = await screen.findByLabelText('Código QR de invitación');
  expect(qr.dataset.value).toBe(joinUrl);
  confirm.mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: /Generar una nueva/ }));
  expect(screen.getByLabelText('Código QR de invitación').dataset.value).toBe(joinUrl);
  expect(
    requests.filter((request) => request.url.endsWith('/invitation') && request.method === 'POST'),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: /Copiar enlace/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(joinUrl));
  expect((await screen.findByRole('status')).textContent).toContain('Enlace copiado');
  fireEvent.click(screen.getByRole('button', { name: /Descargar QR/ }));
  expect(click).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Revocar invitación/ }));
  await waitFor(() => expect(screen.queryByLabelText('Código QR de invitación')).toBeNull());
  expect(requests.some((request) => request.method === 'DELETE')).toBe(true);
});

it('muestra el rechazo del servidor al abrir una invitación caducada o revocada', async () => {
  window.history.replaceState({}, '', '/unirse?token=abcdefghijk');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (url.endsWith('/api/auth/csrf'))
        return { ok: true, status: 200, json: async () => ({ csrfToken: 'csrf' }) };
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'La invitación no es válida o ha caducado' }),
      };
    }),
  );
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'Esta invitación no está disponible' }),
  ).toBeTruthy();
  expect(screen.getByText(/Puede haber caducado o haber sido revocada/)).toBeTruthy();
});
