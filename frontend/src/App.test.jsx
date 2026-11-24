import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }) => <canvas aria-label="Código QR de invitación" data-value={value} />,
}));

it.each([
  ['/legal/privacidad', 'Política de privacidad'],
  ['/legal/cookies', 'Política de cookies'],
  ['/legal/terminos', 'Términos de uso'],
])('abre %s sin consultar la sesión', (path, title) => {
  window.history.replaceState({}, '', path);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  expect(screen.getByRole('heading', { name: title, level: 1 })).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it('recuerda la aceptación del aviso de cookies al volver a abrir la aplicación', () => {
  window.history.replaceState({}, '', '/legal/cookies');
  const firstVisit = render(<App />);
  expect(screen.getByRole('link', { name: 'Más información' }).getAttribute('href')).toBe(
    '/legal/cookies',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Aceptar técnicas' }));
  expect(screen.queryByRole('button', { name: 'Aceptar técnicas' })).toBeNull();
  firstVisit.unmount();
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Aceptar técnicas' })).toBeNull();
});

it('exige el checkbox al crear una cuenta desde la pantalla de acceso', async () => {
  const fetch = vi.fn(async (url) => {
    if (url.endsWith('/me')) return { ok: false, status: 401, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: 'csrf', user: { name: 'Eva' } }),
    };
  });
  vi.stubGlobal('fetch', fetch);
  fireEvent.click(await render(<App />).findByRole('button', { name: /Regístrate/ }));
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Eva' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'eva@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  expect(fetch.mock.calls.some(([url]) => url.endsWith('/register'))).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: /Acepto los términos/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  await screen.findByRole('heading', { name: 'Panel de comunidad' });
  const [, options] = fetch.mock.calls.find(([url]) => url.endsWith('/register'));
  expect(JSON.parse(options.body).acceptPolicies).toBe(true);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
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
      else if (url.endsWith('/membership-requests')) body = { requests: [] };
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
  expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).toBeNull();
});

it('solicita una vivienda desde el enlace y muestra el estado pendiente', async () => {
  window.history.replaceState({}, '', '/unirse?token=token-de-prueba');
  const requests = vi.fn(async (url) => {
    const data = url.endsWith('/validate')
      ? { community: { name: 'Los Olivos' }, dwellings: [{ id: 'dwelling', label: '2º B' }] }
      : url.endsWith('/register')
        ? { user: { name: 'Eva', role: 'resident', communityId: 'c', membershipStatus: 'pending' } }
        : { csrfToken: 'csrf' };
    return { ok: true, status: 200, json: async () => data };
  });
  vi.stubGlobal('fetch', requests);
  render(<App />);
  fireEvent.change(await screen.findByLabelText('Nombre completo'), { target: { value: 'Eva' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'eva@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
  fireEvent.change(screen.getByLabelText('Vivienda'), { target: { value: 'dwelling' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(requests.mock.calls.some(([url]) => url.endsWith('/register'))).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: /Acepto los términos/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(await screen.findByRole('heading', { name: 'Pendiente de validación' })).toBeTruthy();
  const [, options] = requests.mock.calls.find(([url]) => url.endsWith('/register'));
  expect(JSON.parse(options.body)).toMatchObject({
    token: 'token-de-prueba',
    acceptPolicies: true,
    dwellingId: 'dwelling',
  });
  expect(window.location.pathname).toBe('/');
});

it('permite al presidente denegar una solicitud y la retira del listado', async () => {
  const requests = vi.fn(async (url) => {
    if (url.endsWith('/vecino')) return { ok: true, status: 204 };
    const data = url.endsWith('/membership-requests')
      ? { requests: [{ id: 'vecino', name: 'Eva', dwelling: '2º B' }] }
      : url.endsWith('/me')
        ? { user: { name: 'Pablo', role: 'president', communityId: 'c' } }
        : { csrfToken: 'csrf' };
    return { ok: true, status: 200, json: async () => data };
  });
  vi.stubGlobal('fetch', requests);
  render(<App />);
  expect(await screen.findByText('Eva · 2º B')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Denegar a Eva' }));
  expect(await screen.findByText('Solicitud denegada.')).toBeTruthy();
  expect(screen.queryByText('Eva · 2º B')).toBeNull();
  const [, options] = requests.mock.calls.find(([url]) => url.endsWith('/vecino'));
  expect(options.method).toBe('PATCH');
  expect(JSON.parse(options.body)).toEqual({ decision: 'reject' });
});
