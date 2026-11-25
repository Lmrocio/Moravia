import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { demoApi } from './demo.js';
import { Join, MembershipRequests } from './Membership.jsx';
import HomePage from './components/home/HomePage.jsx';
import CommunityWizard from './components/community/CommunityWizard.jsx';
import { AccessDialog, WelcomeDialog } from './components/auth/AccessDialog.jsx';
import InvitationDialog from './components/auth/InvitationDialog.jsx';
import { FormError, SuccessToast } from './components/common/Feedback.jsx';
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
    if (
      method !== 'GET' &&
      csrfRetry &&
      response.status === 403 &&
      data.error === 'Token CSRF ausente o no válido'
    ) {
      csrfPromise = null;
      return api(path, { method, body, csrfRetry: false });
    }
    const error = new Error(data.error || 'No se ha podido completar la solicitud.');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
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
      <FormError>{error}</FormError>
    </section>
  );
}

export default function App() {
  const skipSessionLookup = useRef(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isJoin = window.location.pathname === '/unirse';
  const [authMode, setAuthMode] = useState(null);
  const [welcome, setWelcome] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [invitation, setInvitation] = useState(false);
  useEffect(() => {
    if (!registrationSuccess) return undefined;
    const timer = setTimeout(() => setRegistrationSuccess(false), 6000);
    return () => clearTimeout(timer);
  }, [registrationSuccess]);
  useEffect(() => {
    if (!joinSuccess) return undefined;
    const timer = setTimeout(() => setJoinSuccess(false), 6000);
    return () => clearTimeout(timer);
  }, [joinSuccess]);
  useEffect(() => {
    if (skipSessionLookup.current) return;
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
      setAuthMode(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!loading && !isJoin && (!user || welcome || invitation)) {
    return (
      <>
        <HomePage
          onLogin={() => setAuthMode('login')}
          onRegister={() => setAuthMode('register')}
          onInvite={() => setInvitation(true)}
        />
        {authMode && (
          <AccessDialog
            initialMode={authMode}
            api={api}
            onClose={() => setAuthMode(null)}
            onSuccess={(account, registered) => {
              setUser(account);
              setAuthMode(null);
              setError('');
              setWelcome(registered);
              setRegistrationSuccess(registered);
            }}
          />
        )}
        {welcome && (
          <WelcomeDialog
            showSuccess={registrationSuccess}
            onDismissSuccess={() => setRegistrationSuccess(false)}
            onClose={() => setWelcome(false)}
            onCreate={() => setWelcome(false)}
            onJoin={() => {
              setWelcome(false);
              setInvitation(true);
            }}
          />
        )}
        {invitation && (
          <InvitationDialog
            onClose={() => {
              setInvitation(false);
              if (user) setWelcome(true);
            }}
            onContinue={(token) => {
              window.location.href = `/unirse?token=${encodeURIComponent(token)}`;
            }}
          />
        )}
      </>
    );
  }

  if (
    !loading &&
    !isJoin &&
    user &&
    !user.communityId &&
    user.membershipStatus !== 'pending' &&
    user.membershipStatus !== 'rejected'
  ) {
    return <CommunityWizard api={api} onCreated={setUser} onExit={() => setWelcome(true)} />;
  }

  return (
    <>
      {joinSuccess && (
        <SuccessToast
          title="Comunidad establecida"
          message="Tu solicitud se ha guardado y está pendiente de validación."
          onClose={() => setJoinSuccess(false)}
        />
      )}
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
          <Join
            api={api}
            user={user}
            onRegistered={(resident) => {
              skipSessionLookup.current = true;
              window.history.replaceState(null, '', '/');
              setUser(resident);
              setJoinSuccess(true);
            }}
          />
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
              <>
                {!DEMO && <MembershipRequests api={api} communityId={user.communityId} />}
                <Invitations communityId={user.communityId} />
              </>
            ) : user.membershipStatus === 'pending' ? (
              <section className="card">
                <h2>Pendiente de validación</h2>
                <p>
                  El presidente revisará tu solicitud. Vuelve a cargar el panel para consultar su
                  estado.
                </p>
              </section>
            ) : user.membershipStatus === 'rejected' ? (
              <section className="card">
                <h2>Solicitud denegada</h2>
                <p>Contacta con el presidente de tu comunidad si necesitas ayuda.</p>
              </section>
            ) : !user.communityId ? null : (
              <section className="card">
                <h2>Tu comunidad</h2>
                <p className="muted">Ya formas parte de una comunidad.</p>
              </section>
            )}
          </>
        ) : (
          <p className="muted">Cargando?</p>
        )}
        <FormError>{error}</FormError>
      </main>
      <footer>
        Moravía <span>·</span> Tu comunidad, más cerca.
      </footer>
    </>
  );
}
