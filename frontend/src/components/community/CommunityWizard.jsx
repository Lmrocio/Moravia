import { FormError, ValidatedForm } from '../common/Feedback.jsx';
import { useEffect, useRef, useState } from 'react';
import { Building2, Copy, House, Minus, Pencil, Plus, QrCode, RotateCcw, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../../assets/images/Moravia.png';
import './community.css';

const initial = {
  name: '',
  address: '',
  floors: 0,
  doorsPerFloor: 0,
  groundFloorDoors: 0,
  different: false,
  floorDoorCounts: [],
};

function Dialog({ children, label, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="community-dialog"
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}

function Counter({ label, value, onChange, max = 26 }) {
  return (
    <div className="community-counter">
      <span id={`counter-${label}`}>{label}</span>
      <div className="community-counter__control" role="group" aria-labelledby={`counter-${label}`}>
        <button
          type="button"
          aria-label={`Disminuir ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          <Minus size={18} />
        </button>
        <output aria-live="polite">{value}</output>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value === max}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function Buttons({ onBack, next = 'Continuar', disabled = false }) {
  return (
    <div className="community-actions">
      {onBack && (
        <button
          type="button"
          className="community-button community-button--outline"
          onClick={onBack}
        >
          Volver
        </button>
      )}
      <button className="community-button" type="submit" disabled={disabled}>
        {next}
      </button>
    </div>
  );
}

function SummaryCard({ title, icon, editing, onEdit, onCancel, onReset, children, onSave }) {
  return (
    <section className={`community-summary${editing ? ' community-summary--editing' : ''}`}>
      <div className="community-summary__heading">
        <h2>
          {!editing && icon}
          {title}
        </h2>
        {editing ? (
          <div className="community-summary__controls">
            <button
              type="button"
              onClick={onReset}
              aria-label={`Restablecer ${title.toLowerCase()}`}
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label={`Cancelar edición de ${title.toLowerCase()}`}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onEdit} aria-label={`Editar ${title.toLowerCase()}`}>
            <Pencil size={18} />
          </button>
        )}
      </div>
      {children}
      {editing && (
        <button type="button" className="community-button community-summary__save" onClick={onSave}>
          Guardar cambios
        </button>
      )}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="community-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function CommunityWizard({ api, onCreated, onExit }) {
  const [data, setData] = useState(initial);
  const [step, setStep] = useState(1);
  const [exit, setExit] = useState(false);
  const [edit, setEdit] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [qr, setQr] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const total =
    data.groundFloorDoors +
    (data.different
      ? data.floorDoorCounts.reduce((sum, n) => sum + n, 0)
      : data.floors * data.doorsPerFloor);
  function changeFloors(value, setter = setData) {
    setter((old) => ({
      ...old,
      floors: value,
      floorDoorCounts: Array.from(
        { length: value },
        (_, i) => old.floorDoorCounts[i] ?? old.doorsPerFloor,
      ),
    }));
  }
  function update(key, value, setter = setData) {
    setter((old) => ({ ...old, [key]: value }));
  }
  function startEdit(section) {
    setDraft({ ...data, floorDoorCounts: [...data.floorDoorCounts] });
    setError('');
    setEdit(section);
  }
  function saveEdit() {
    if (edit === 'basic' && (draft.name.trim().length < 2 || draft.address.trim().length < 2)) {
      setError('Introduce un nombre y una dirección de al menos 2 caracteres.');
      return;
    }
    const draftTotal =
      draft.groundFloorDoors +
      (draft.different
        ? draft.floorDoorCounts.reduce((sum, n) => sum + n, 0)
        : draft.floors * draft.doorsPerFloor);
    if (edit === 'homes' && draftTotal < 1) {
      setError('Añade al menos una vivienda.');
      return;
    }
    setData(draft);
    setEdit(null);
    setError('');
  }
  async function makeInvitation(communityId) {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/api/communities/${communityId}/invitation`, { method: 'POST' });
      setInvitation(response.invitation);
    } catch (err) {
      setError(
        `La comunidad se ha creado, pero no se ha podido generar la invitación: ${err.message}`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function create(event) {
    event.preventDefault();
    if (edit) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        name: data.name.trim(),
        address: data.address.trim(),
        floors: data.floors,
        doorsPerFloor: data.doorsPerFloor,
        groundFloorDoors: data.groundFloorDoors,
        ...(data.different && { floorDoorCounts: data.floorDoorCounts }),
      };
      const response = await api('/api/communities', { method: 'POST', body });
      const communityId = response.community?.id || response.user.communityId;
      setCreated({ user: response.user, communityId });
      await makeInvitation(communityId);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(invitation.token);
      setCopyMessage('Código copiado.');
    } catch {
      setCopyMessage('No se ha podido copiar. Selecciona y copia el código.');
    }
  }
  const editingData = edit === 'homes' ? draft : data;
  const homes = (value, setter) => (
    <>
      <Counter
        label="Número de plantas superiores"
        value={value.floors}
        max={50}
        onChange={(n) => changeFloors(n, setter)}
      />
      <label className="community-switch">
        <span>
          <strong>Distribución diferente por planta</strong>
          <small>Actívalo si las plantas tienen distinto número de viviendas.</small>
        </span>
        <input
          type="checkbox"
          checked={value.different}
          onChange={(event) =>
            setter((old) => ({
              ...old,
              different: event.target.checked,
              floorDoorCounts: Array.from(
                { length: old.floors },
                (_, i) => old.floorDoorCounts[i] ?? old.doorsPerFloor,
              ),
            }))
          }
        />
        <span className="community-switch__track" aria-hidden="true" />
      </label>
      {!value.different && (
        <Counter
          label="Viviendas por planta"
          value={value.doorsPerFloor}
          onChange={(n) => update('doorsPerFloor', n, setter)}
        />
      )}
      <Counter
        label={value.different ? 'Planta baja' : 'Viviendas en planta baja'}
        value={value.groundFloorDoors}
        onChange={(n) => update('groundFloorDoors', n, setter)}
      />
      {value.different &&
        value.floorDoorCounts.map((count, index) => (
          <Counter
            key={index}
            label={`Planta ${index + 1}`}
            value={count}
            onChange={(n) =>
              setter((old) => ({
                ...old,
                floorDoorCounts: old.floorDoorCounts.map((v, i) => (i === index ? n : v)),
              }))
            }
          />
        ))}
    </>
  );
  return (
    <div className="community-wizard">
      <header className="community-header">
        <div>
          <img src={logo} alt="Moravía" />
          <button type="button" onClick={() => (created ? onCreated(created.user) : setExit(true))}>
            Salir
          </button>
        </div>
      </header>
      <main className="community-content">
        <div
          className="community-progress"
          role="progressbar"
          aria-label="Progreso de creación"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
        >
          {[1, 2, 3].map((n) => (
            <span key={n} className={n < step ? 'completed' : n === step ? 'current' : ''} />
          ))}
        </div>
        <div className="community-intro">
          <p>
            PASO {step} · {step === 1 ? 'DATOS BÁSICOS' : step === 2 ? 'VIVIENDAS' : 'CONFIRMACIÓN'}
          </p>
          <h1>
            {step === 1
              ? 'Crea tu comunidad'
              : step === 2
                ? data.different
                  ? 'Viviendas por planta'
                  : 'Configura las viviendas'
                : 'Revisa los datos'}
          </h1>
          <span>
            {step === 1
              ? 'Cuéntanos un poco sobre el lugar en el que vives.'
              : step === 2
                ? data.different
                  ? 'Indica cuántas viviendas hay en cada planta del edificio.'
                  : 'Indicaremos cuántas viviendas hay en cada planta. Puedes ajustar las plantas de forma individual.'
                : 'Comprueba la información antes de crear tu comunidad.'}
          </span>
        </div>
        {step === 1 && (
          <ValidatedForm
            className="community-form"
            onSubmit={(event) => {
              event.preventDefault();
              setError('');
              setStep(2);
            }}
          >
            <label>
              Nombre de la comunidad
              <input
                value={data.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Residencial Los Olivos"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              Dirección
              <input
                value={data.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Calle Mayor, 12"
                minLength={2}
                maxLength={200}
                required
              />
            </label>
            <Buttons />
          </ValidatedForm>
        )}
        {step === 2 && (
          <ValidatedForm
            className="community-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!total) {
                setError('Añade al menos una vivienda.');
                return;
              }
              setError('');
              setStep(3);
            }}
          >
            <div className="community-homes">{homes(data, setData)}</div>
            <FormError>{error}</FormError>
            <Buttons
              onBack={() => {
                setError('');
                setStep(1);
              }}
            />
          </ValidatedForm>
        )}
        {step === 3 && (
          <ValidatedForm className="community-form" onSubmit={create}>
            <SummaryCard
              title="Datos básicos"
              icon={<Building2 size={20} aria-hidden="true" />}
              editing={edit === 'basic'}
              onEdit={() => startEdit('basic')}
              onCancel={() => {
                setEdit(null);
                setError('');
              }}
              onReset={() => setDraft({ ...data, floorDoorCounts: [...data.floorDoorCounts] })}
              onSave={saveEdit}
            >
              {edit === 'basic' ? (
                <div className="community-edit">
                  <label>
                    Nombre de la comunidad
                    <input
                      value={draft.name}
                      maxLength={100}
                      onChange={(e) => update('name', e.target.value, setDraft)}
                    />
                  </label>
                  <label>
                    Dirección
                    <input
                      value={draft.address}
                      maxLength={200}
                      onChange={(e) => update('address', e.target.value, setDraft)}
                    />
                  </label>
                </div>
              ) : (
                <dl>
                  <Row label="Nombre" value={data.name} />
                  <Row label="Dirección" value={data.address} />
                </dl>
              )}
            </SummaryCard>
            <SummaryCard
              title="Viviendas"
              icon={<House size={20} aria-hidden="true" />}
              editing={edit === 'homes'}
              onEdit={() => startEdit('homes')}
              onCancel={() => {
                setEdit(null);
                setError('');
              }}
              onReset={() => setDraft({ ...data, floorDoorCounts: [...data.floorDoorCounts] })}
              onSave={saveEdit}
            >
              {edit === 'homes' ? (
                <div className="community-homes community-homes--editing">
                  {homes(editingData, setDraft)}
                </div>
              ) : (
                <dl>
                  <Row label="Plantas superiores" value={data.floors} />
                  {data.different ? (
                    data.floorDoorCounts.map((n, i) => (
                      <Row key={i} label={`Planta ${i + 1}`} value={n} />
                    ))
                  ) : (
                    <Row label="Viviendas por planta" value={data.doorsPerFloor} />
                  )}
                  <Row label="Viviendas en planta baja" value={data.groundFloorDoors} />
                  <div className="community-total">
                    <Row label="Total de viviendas" value={total} />
                  </div>
                </dl>
              )}
            </SummaryCard>
            <p className="community-notice">
              Al crear la comunidad, pasarás a ser su presidente dentro de Moravía.
            </p>
            <FormError>{error}</FormError>
            <Buttons
              onBack={() => {
                setEdit(null);
                setError('');
                setStep(2);
              }}
              next={busy ? 'Creando comunidad…' : 'Crear comunidad'}
              disabled={busy || Boolean(edit)}
            />
          </ValidatedForm>
        )}
      </main>
      {exit && (
        <Dialog label="exit-title" onClose={() => setExit(false)}>
          <h2 id="exit-title">¿Quieres abandonar?</h2>
          <p>
            Si abandonas ahora, perderás los datos que has rellenado y tendrás que empezar de nuevo.
          </p>
          <div className="community-dialog__actions">
            <button className="community-button" onClick={() => setExit(false)}>
              Mantenerme aquí
            </button>
            <button className="community-button community-button--outline" onClick={onExit}>
              Abandonar proceso
            </button>
          </div>
        </Dialog>
      )}
      {created && (
        <Dialog label="created-title" onClose={() => onCreated(created.user)}>
          <div className="community-dialog__header">
            <img src={logo} alt="Moravía" />
            <button type="button" onClick={() => onCreated(created.user)}>
              Ahora no
            </button>
          </div>
          <h2 id="created-title">¡Comunidad creada!</h2>
          <p>{data.name} ya está lista para gestionarse.</p>
          <p>Comparte este código con tus vecinos para que puedan unirse a la comunidad.</p>
          {invitation ? (
            <>
              <div className="community-code">
                <span>CÓDIGO DE LA COMUNIDAD</span>
                <div>
                  <strong>{invitation.token}</strong>
                  <button type="button" onClick={copy}>
                    <Copy size={16} /> Copiar
                  </button>
                </div>
              </div>
              {copyMessage && <p role="status">{copyMessage}</p>}
              <button type="button" className="community-qr-toggle" onClick={() => setQr(!qr)}>
                <QrCode size={18} /> {qr ? 'Ocultar código QR' : 'Mostrar código QR'}{' '}
                <span>{qr ? '−' : '+'}</span>
              </button>
              {qr && (
                <div className="community-qr">
                  <QRCodeCanvas
                    value={invitation.joinUrl}
                    size={150}
                    aria-label="Código QR de invitación"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {busy && <p role="status">Generando invitación…</p>}
              <FormError>{error}</FormError>
              <button
                type="button"
                className="community-button community-button--outline"
                disabled={busy}
                onClick={() => makeInvitation(created.communityId)}
              >
                Reintentar invitación
              </button>
            </>
          )}
          <button className="community-button" onClick={() => onCreated(created.user)}>
            Ir a mis comunidades
          </button>
        </Dialog>
      )}
    </div>
  );
}
