import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { demoApi } from './demo.js';
import './styles.css';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === '1';
let csrfPromise;

function csrfToken() {
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_URL}/api/auth/csrf`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('No se ha podido iniciar la solicitud.');
        return response.json();
      })
      .then((data) => data.csrfToken)
      .catch((error) => {
        csrfPromise = null;
        throw error;
      });
  }
  return csrfPromise;
}

async function api(path, { method = 'GET', body, csrfRetry = true } = {}) {
  if (DEMO) return demoApi(path, { method, body });
  const headers = {};
  if (method !== 'GET') {
    headers['X-CSRF-Token'] = await csrfToken();
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (method !== 'GET' && csrfRetry && response.status === 403 && data.code === 'CSRF_INVALID') {
      csrfPromise = null;
      return api(path, { method, body, csrfRetry: false });
    }
    const error = new Error(data.error || 'No se ha podido completar la solicitud.');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setLoading(true);
    try {
      const body = { email: form.get('email'), password: form.get('password') };
      if (register) body.name = form.get('name');
      const data = await api(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body,
      });
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card auth-card">
      <p className="eyebrow">BIENVENIDO A MORAVÍA</p>
      <h1>{register ? 'Crea tu cuenta' : 'Tu comunidad, más cerca'}</h1>
      <p className="muted">
        {register
          ? 'Empieza creando tu cuenta para configurar tu comunidad.'
          : 'Inicia sesión para gestionar tu comunidad.'}
      </p>
      <form onSubmit={submit} className="form">
        {register && (
          <label>
            Nombre completo
            <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
          </label>
        )}
        <label>
          Correo electrónico
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={register ? 8 : 1}
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={loading}>
          {loading ? 'Un momento…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      <button
        className="text-button"
        onClick={() => {
          setRegister(!register);
          setError('');
        }}
      >
        {register ? '¿Ya tienes cuenta? Inicia sesión' : '¿Todavía no tienes cuenta? Regístrate'}
      </button>
    </section>
  );
}

function CreateCommunity({ onCreated }) {
  const [fields, setFields] = useState({
    name: '',
    address: '',
    floors: '',
    doorsPerFloor: '',
    groundFloorDoors: '0',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const total =
    Number(fields.floors) * Number(fields.doorsPerFloor) + Number(fields.groundFloorDoors);
  const update = (event) => setFields({ ...fields, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const name = fields.name.trim();
    const address = fields.address.trim();
    if (name.length < 2 || address.length < 2) {
      setError('El nombre de la finca y la dirección deben tener al menos dos caracteres.');
      return;
    }
    if (total < 1) {
      setError('Añade al menos una vivienda.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/communities', {
        method: 'POST',
        body: {
          name,
          address,
          floors: Number(fields.floors),
          doorsPerFloor: Number(fields.doorsPerFloor),
          groundFloorDoors: Number(fields.groundFloorDoors),
        },
      });
      onCreated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card setup">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PRIMEROS PASOS</p>
          <h2>Empecemos por tu comunidad</h2>
        </div>
        <span className="step">01 / 02</span>
      </div>
      <p className="muted">
        Cuéntanos cómo es el edificio. Crearemos sus viviendas automáticamente.
      </p>
      <form className="form" onSubmit={submit}>
        <label>
          Nombre de la finca
          <input
            name="name"
            value={fields.name}
            onChange={update}
            placeholder="Ej. Comunidad Los Olivos"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label>
          Dirección
          <input
            name="address"
            value={fields.address}
            onChange={update}
            placeholder="Calle, número y localidad"
            minLength={2}
            maxLength={200}
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Plantas superiores
            <input
              type="number"
              name="floors"
              value={fields.floors}
              onChange={update}
              min="0"
              max="50"
              step="1"
              required
            />
            <span className="hint">Sin contar la planta baja</span>
          </label>
          <label>
            Puertas por planta
            <input
              type="number"
              name="doorsPerFloor"
              value={fields.doorsPerFloor}
              onChange={update}
              min="0"
              max="26"
              step="1"
              required
            />
            <span className="hint">Mismo número en cada planta</span>
          </label>
          <label>
            Puertas en planta baja
            <input
              type="number"
              name="groundFloorDoors"
              value={fields.groundFloorDoors}
              onChange={update}
              min="0"
              max="26"
              step="1"
              required
            />
            <span className="hint">Pon 0 si no hay viviendas</span>
          </label>
        </div>
        <div className="total">
          <span>Número de viviendas</span>
          <strong>{total}</strong>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={loading}>
          {loading ? 'Creando comunidad…' : 'Crear comunidad →'}
        </button>
      </form>
    </section>
  );
}

function Invitations({ communityId }) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!invitation) return undefined;
    const timeout = setTimeout(
      () => {
        setInvitation(null);
        setMessage('La invitación ha caducado. Genera una nueva.');
      },
      Math.max(0, new Date(invitation.expiresAt).getTime() - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [invitation]);

  async function updateInvitation(method) {
    if (
      method === 'POST' &&
      invitation &&
      !window.confirm(
        'Crear una nueva invitación invalidará el enlace anterior. ¿Quieres continuar?',
      )
    )
      return;
    if (
      method === 'DELETE' &&
      !window.confirm('El enlace de invitación dejará de funcionar. ¿Quieres revocarlo?')
    )
      return;
    setLoading(true);
    setError('');
    setMessage('');
    // Si la respuesta se pierde, el servidor puede haber cambiado igualmente el token.
    setInvitation(null);
    try {
      const data = await api(`/api/communities/${communityId}/invitation`, { method });
      setInvitation(data?.invitation || null);
      setMessage(
        method === 'DELETE'
          ? 'Invitación revocada. El enlace anterior ya no es válido.'
          : 'Invitación creada. Puedes compartirla durante 48 horas.',
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(invitation.joinUrl);
      setError('');
      setMessage('Enlace copiado al portapapeles.');
    } catch {
      setError('No se ha podido copiar. Selecciona y copia el enlace manualmente.');
    }
  }

  function download() {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'moravia-invitacion.png';
    link.click();
  }

  return (
    <section className="card invitation-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">INVITACIONES</p>
          <h2>Haz sitio a tus vecinos</h2>
        </div>
        <span className="step">02 / 02</span>
      </div>
      <p className="muted">
        Comparte el código o el enlace para invitar a los vecinos de tu comunidad.
      </p>
      {invitation ? (
        <div className="invitation-content">
          <div className="qr-frame" ref={canvasRef}>
            <QRCodeCanvas
              value={invitation.joinUrl}
              size={1024}
              marginSize={4}
              level="M"
              title="Código QR de invitación"
            />
          </div>
          <div className="invitation-details">
            <span className="status">
              <span>●</span> INVITACIÓN ACTIVA
            </span>
            <h3>Tu código está listo</h3>
            <p className="muted">
              Caduca el{' '}
              {new Date(invitation.expiresAt).toLocaleString('es-ES', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
              .
            </p>
            <label>
              Enlace de invitación
              <input
                readOnly
                value={invitation.joinUrl}
                onFocus={(event) => event.target.select()}
              />
            </label>
            <div className="button-row">
              <button className="primary" onClick={copy}>
                Copiar enlace de invitación
              </button>
              <button className="secondary" onClick={download}>
                Descargar QR para imprimir
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            ▦
          </div>
          <div>
            <strong>Una invitación para tu comunidad</strong>
            <p>
              Genera un enlace válido durante 48 horas. Al generar otro, el anterior dejará de
              funcionar.
            </p>
          </div>
        </div>
      )}
      <div className="actions">
        <button
          className={invitation ? 'secondary' : 'primary'}
          disabled={loading}
          onClick={() => updateInvitation('POST')}
        >
          {loading ? 'Un momento…' : invitation ? 'Generar una nueva' : 'Generar invitación →'}
        </button>
        <button
          className="danger-link"
          disabled={loading}
          onClick={() => updateInvitation('DELETE')}
        >
          Revocar invitación
        </button>
      </div>
      {!invitation && (
        <p className="hint">
          Si ya habías creado una invitación, puedes revocarla o generar una nueva. Por seguridad,
          el enlace anterior no se puede recuperar.
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Join() {
  const [state, setState] = useState({ loading: true, valid: false });
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState({ loading: false, valid: false });
      return;
    }
    api('/api/invitations/validate', { method: 'POST', body: { token } })
      .then(() => setState({ loading: false, valid: true }))
      .catch((err) =>
        setState({
          loading: false,
          valid: false,
          unavailable: !err.status || err.status === 403 || err.status >= 500,
        }),
      );
  }, []);
  return (
    <section className="card auth-card">
      <p className="eyebrow">INVITACIÓN A MORAVÍA</p>
      <h1>
        {state.loading
          ? 'Comprobando invitación…'
          : state.valid
            ? 'Tu invitación es válida'
            : state.unavailable
              ? 'No hemos podido comprobar la invitación'
              : 'Esta invitación no está disponible'}
      </h1>
      <p className="muted">
        {state.valid
          ? 'La incorporación de vecinos estará disponible próximamente.'
          : state.loading
            ? 'Un momento, por favor.'
            : state.unavailable
              ? 'Comprueba tu conexión e inténtalo de nuevo.'
              : 'Puede haber caducado o haber sido revocada. Pide una nueva al presidente de tu comunidad.'}
      </p>
      <a className="text-button" href="/">
        Volver al inicio
      </a>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isJoin = window.location.pathname === '/unirse';
  useEffect(() => {
    if (isJoin) {
      setLoading(false);
      return;
    }
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.status !== 401) setError('No se ha podido conectar con el servidor.');
      })
      .finally(() => setLoading(false));
  }, [isJoin]);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      if (DEMO) setUser((await api('/api/auth/me')).user);
      else setUser(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-mark">m</span> moravía<span className="brand-dot">.</span>
        </a>
        {user && (
          <div className="top-actions">
            <span>{user.name}</span>
            <button className="text-button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      {DEMO && (
        <div className="demo-banner" role="status">
          <strong>Modo demostración</strong> · Datos ficticios, sin conexión al servidor. El QR es
          de prueba y no crea invitaciones reales.
        </div>
      )}
      <main className="container">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : isJoin ? (
          <Join />
        ) : user ? (
          <>
            <div className="page-intro">
              <div>
                <p className="eyebrow">TU ESPACIO</p>
                <h1>Panel de comunidad</h1>
                <p className="muted">Un lugar para conectar con tus vecinos.</p>
              </div>
              <span className="role">
                {user.role === 'president' ? 'PRESIDENCIA' : 'MI CUENTA'}
              </span>
            </div>
            {user.role === 'president' && user.communityId ? (
              <Invitations communityId={user.communityId} />
            ) : !user.communityId ? (
              <CreateCommunity onCreated={setUser} />
            ) : (
              <section className="card">
                <h2>Tu comunidad</h2>
                <p className="muted">Ya formas parte de una comunidad.</p>
              </section>
            )}
          </>
        ) : (
          <Auth onLogin={setUser} />
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
      <footer>
        Moravía <span>·</span> Tu comunidad, más cerca.
      </footer>
    </>
  );
}
