import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

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

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('muestra la página de inicio y abre el registro al comenzar', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
  );
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Tu comunidad, más conectada/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Comenzar ahora' }));
  expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeTruthy();
  const submit = screen.getByRole('button', { name: 'Crear cuenta' });
  expect(submit.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(submit.disabled).toBe(false);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(submit.disabled).toBe(true);
});

it('permite acceder al formulario de inicio de sesión desde la portada', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
  );
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));
  expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
  expect(screen.getByLabelText('Contraseña')).toBeTruthy();
});

it('muestra el error reutilizable y señala el campo de correo no válido', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })));
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));
  const email = screen.getByLabelText('Correo electrónico');
  fireEvent.change(email, { target: { value: 'nombre@' } });
  fireEvent.invalid(email);
  expect(email.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('alert').textContent).toContain('correo electrónico válido');
  fireEvent.input(email, { target: { value: 'nombre@example.com' } });
  expect(email.getAttribute('aria-invalid')).not.toBe('true');
});

it('muestra el error de credenciales sin cerrar el modal de acceso', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (url.endsWith('/api/auth/csrf'))
        return { ok: true, status: 200, json: async () => ({ csrfToken: 'csrf' }) };
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Correo o contraseña incorrectos' }),
      };
    }),
  );
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'rocio@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
  fireEvent.submit(screen.getByLabelText('Contraseña').closest('form'));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Correo o contraseña incorrectos',
  );
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('registra la cuenta y muestra la bienvenida antes de crear la comunidad', async () => {
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      calls.push({ url, ...options });
      if (url.endsWith('/api/auth/me')) return { ok: false, status: 401, json: async () => ({}) };
      if (url.endsWith('/api/auth/csrf'))
        return { ok: true, status: 200, json: async () => ({ csrfToken: 'token-csrf' }) };
      return {
        ok: true,
        status: 201,
        json: async () => ({ user: { name: 'Rocío', role: 'resident', communityId: null } }),
      };
    }),
  );
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Comenzar ahora' }));
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Rocío' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'rocio@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
  fireEvent.change(screen.getByLabelText('Repetir contraseña'), {
    target: { value: 'clave-segura' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  expect(
    await screen.findByRole('heading', { name: /Todo empieza con tu comunidad/ }),
  ).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('Tu cuenta se ha creado correctamente.');
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('button', { name: 'Ahora no' })).toBeTruthy();
  const register = calls.find((call) => call.url.endsWith('/api/auth/register'));
  expect(register.headers['X-CSRF-Token']).toBeTruthy();
  expect(JSON.parse(register.body)).toEqual({
    name: 'Rocío',
    email: 'rocio@example.com',
    password: 'clave-segura',
  });
  fireEvent.click(screen.getByRole('button', { name: /Crear una comunidad/ }));
  expect(await screen.findByLabelText('Nombre de la comunidad')).toBeTruthy();
});

it('no envía el registro cuando las contraseñas no coinciden', async () => {
  const fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
  vi.stubGlobal('fetch', fetchMock);
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Comenzar ahora' }));
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Rocío' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'rocio@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
  fireEvent.change(screen.getByLabelText('Repetir contraseña'), {
    target: { value: 'clave-distinta' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  expect(screen.getByRole('alert').textContent).toContain('no coinciden');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('una cuenta existente solicita una vivienda sin registrarse otra vez', async () => {
  const token = 'a'.repeat(43);
  window.history.replaceState({}, '', `/unirse?token=${token}`);
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      calls.push({ url, ...options });
      if (url.endsWith('/api/auth/me'))
        return {
          ok: true,
          status: 200,
          json: async () => ({ user: { id: '1', name: 'Rocío', communityId: null } }),
        };
      if (url.endsWith('/api/auth/csrf'))
        return { ok: true, status: 200, json: async () => ({ csrfToken: 'token-csrf' }) };
      if (url.endsWith('/api/invitations/validate'))
        return {
          ok: true,
          status: 200,
          json: async () => ({
            community: { name: 'Los Olivos' },
            dwellings: [{ id: '507f1f77bcf86cd799439011', label: '1º A' }],
          }),
        };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: '1', name: 'Rocío', membershipStatus: 'pending', communityId: '2' },
        }),
      };
    }),
  );
  render(<App />);
  fireEvent.change(await screen.findByLabelText('Vivienda'), {
    target: { value: '507f1f77bcf86cd799439011' },
  });
  expect(screen.queryByLabelText('Correo electrónico')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(await screen.findByRole('heading', { name: 'Pendiente de validación' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('pendiente de validación');
  const accept = calls.find((call) => call.url.endsWith('/api/invitations/accept'));
  expect(JSON.parse(accept.body)).toEqual({ token, dwellingId: '507f1f77bcf86cd799439011' });
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
  fireEvent.change(await screen.findByLabelText('Nombre de la comunidad'), {
    target: { value: 'Los Olivos' },
  });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle 1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  for (let i = 0; i < 2; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar número de plantas superiores' }));
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar viviendas por planta' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('6')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Crear comunidad/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ir a mis comunidades' }));
  fireEvent.click(await screen.findByRole('button', { name: /Generar invitación/ }));

  const qr = await screen.findByLabelText('Código QR de invitación');
  expect(qr.dataset.value).toBe(joinUrl);
  confirm.mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: /Generar una nueva/ }));
  expect(screen.getByLabelText('Código QR de invitación').dataset.value).toBe(joinUrl);
  expect(
    requests.filter((request) => request.url.endsWith('/invitation') && request.method === 'POST'),
  ).toHaveLength(2);
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
  expect(await screen.findByRole('heading', { name: 'Pendiente de validación' })).toBeTruthy();
  const [, options] = requests.mock.calls.find(([url]) => url.endsWith('/register'));
  expect(JSON.parse(options.body)).toMatchObject({
    token: 'token-de-prueba',
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
