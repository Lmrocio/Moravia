import { FormError, ValidatedForm } from './components/common/Feedback.jsx';
import { useEffect, useState } from 'react';

function rejectedToken(error) {
  return error.status === 400 || error.status === 404;
}

export function Join({ api, onRegistered, user }) {
  const token = new URLSearchParams(window.location.search).get('token');
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    api('/api/invitations/validate', { method: 'POST', body: { token } })
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch((err) => {
        if (!ignore) setFailure(rejectedToken(err) ? 'invalid' : 'connection');
      });
    return () => {
      ignore = true;
    };
  }, [api, token, attempt]);

  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setSending(true);
    setError('');
    try {
      const response = await api(user ? '/api/invitations/accept' : '/api/invitations/register', {
        method: 'POST',
        body: { ...body, token },
      });
      onRegistered(response.user);
    } catch (err) {
      // Un 400 también puede ser un campo del formulario. Solo un 404 invalida un enlace ya comprobado.
      if (err.status === 404) setFailure('invalid');
      else setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function retry() {
    setFailure(null);
    setResult(null);
    setError('');
    setAttempt((value) => value + 1);
  }

  if (!token || failure === 'invalid')
    return (
      <section className="card auth-card">
        <h1>Esta invitación no está disponible</h1>
        <p className="muted">
          Puede haber caducado o haber sido revocada. Pide una nueva al presidente de tu comunidad.
        </p>
        <a className="text-button" href="/">
          Volver al inicio
        </a>
      </section>
    );

  if (failure === 'connection')
    return (
      <section className="card auth-card">
        <h1>No hemos podido comprobar la invitación</h1>
        <button className="secondary" onClick={retry}>
          Volver a intentar
        </button>
      </section>
    );
  if (!result) return <p role="status">Comprobando invitación…</p>;

  return (
    <section className="card auth-card">
      <h1>Únete a {result.community?.name ?? 'tu comunidad'}</h1>
      {result.demo ? (
        <p className="muted">La invitación de demostración es válida.</p>
      ) : !result.dwellings.length ? (
        <p className="muted">
          No quedan viviendas disponibles. Contacta con el presidente de tu comunidad.
        </p>
      ) : (
        <>
          <p className="muted">Selecciona tu vivienda. El presidente revisará tu solicitud.</p>
          <ValidatedForm className="form" onSubmit={submit}>
            {!user && (
              <>
                <label>
                  Nombre completo
                  <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
                </label>
                <label>
                  Correo electrónico
                  <input type="email" name="email" autoComplete="email" maxLength={254} required />
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              </>
            )}
            <label>
              Vivienda
              <select name="dwellingId" defaultValue="" required>
                <option value="" disabled>
                  Selecciona tu planta y puerta
                </option>
                {result.dwellings.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <FormError>{error}</FormError>
            <button className="primary" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            {error && (
              <button type="button" className="text-button" onClick={retry}>
                Actualizar viviendas disponibles
              </button>
            )}
          </ValidatedForm>
        </>
      )}
    </section>
  );
}

export function MembershipRequests({ api, communityId }) {
  const url = `/api/communities/${communityId}/membership-requests`;
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let ignore = false;
    api(url)
      .then((data) => {
        if (!ignore) setRequests(data.requests);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [api, url, refresh]);

  async function decide(id, decision) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`${url}/${id}`, { method: 'PATCH', body: { decision } });
      setRequests((current) => current.filter((request) => request.id !== id));
      setMessage(decision === 'approve' ? 'Solicitud aprobada.' : 'Solicitud denegada.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card membership-card">
      <h2>Solicitudes de vinculación</h2>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => {
          setRequests(null);
          setError('');
          setRefresh((value) => value + 1);
        }}
      >
        Actualizar solicitudes
      </button>
      {requests === null && !error && <p role="status">Cargando solicitudes…</p>}
      {requests?.length === 0 && <p className="muted">No hay solicitudes pendientes.</p>}
      {requests?.length > 0 && (
        <ul className="membership-list">
          {requests.map(({ id, name, dwelling }) => (
            <li key={id}>
              <strong>
                {name} · {dwelling}
              </strong>
              <div className="actions">
                <button
                  className="primary"
                  disabled={busy}
                  aria-label={`Aprobar a ${name}`}
                  onClick={() => decide(id, 'approve')}
                >
                  Aprobar
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  aria-label={`Denegar a ${name}`}
                  onClick={() => decide(id, 'reject')}
                >
                  Denegar
                </button>
              </div>
            </li>
          ))}
        </ul>
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
