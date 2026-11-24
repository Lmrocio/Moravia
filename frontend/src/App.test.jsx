import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }) => <canvas aria-label="Código QR de invitación" data-value={value} />,
}));

afterEach(() => {
  cleanup();
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
  fireEvent.click(screen.getByRole('button', { name: /Copiar enlace/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(joinUrl));
  expect((await screen.findByRole('status')).textContent).toContain('Enlace copiado');
  fireEvent.click(screen.getByRole('button', { name: /Descargar QR/ }));
  expect(click).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Revocar invitación/ }));
  await waitFor(() => expect(screen.queryByLabelText('Código QR de invitación')).toBeNull());
  expect(requests.some((request) => request.method === 'DELETE')).toBe(true);
});
