import { useEffect, useRef, useState } from 'react';
import { Building2, Eye, EyeOff, Users, X } from 'lucide-react';
import logo from '../../assets/images/Moravia.png';
import { FormError, SuccessToast, ValidatedForm } from '../common/Feedback.jsx';
import './access.css';

export function Modal({ children, onClose, titleId, variant = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`access-dialog ${variant}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

export function DialogHeader({ onClose, defer = false }) {
  return (
    <div className="access-header">
      <img src={logo} alt="Moravía" />
      {defer ? (
        <button type="button" className="access-later" onClick={onClose}>
          Ahora no
        </button>
      ) : (
        <button type="button" className="access-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function PasswordField({ label, name, placeholder, autoComplete, minLength, error, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="access-field">
      {label}
      <span className="access-password">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          onChange={onChange}
          required
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
      <FormError id={`${name}-error`}>{error}</FormError>
    </label>
  );
}

export function AccessDialog({ initialMode, api, onSuccess, onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const register = mode === 'register';
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    setError('');
    setPasswordError('');
    setConfirmError('');
    if (register && password !== form.get('confirmPassword')) {
      setConfirmError('Las contraseñas no coinciden.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setPasswordError('La contraseña no puede superar 72 bytes.');
      return;
    }
    setBusy(true);
    try {
      const body = { email: form.get('email'), password };
      if (register) body.name = form.get('name');
      const data = await api(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body,
      });
      onSuccess(data.user, register);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      onClose={onClose}
      titleId="access-title"
      variant={`access-dialog--sheet ${register ? 'access-dialog--register' : ''}`}
    >
      <DialogHeader onClose={onClose} />
      <div className="access-tabs" aria-label="Opciones de acceso">
        <button
          type="button"
          aria-pressed={!register}
          onClick={() => {
            setMode('login');
            setError('');
            setPasswordError('');
            setConfirmError('');
            setTermsAccepted(false);
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          aria-pressed={register}
          onClick={() => {
            setMode('register');
            setError('');
            setPasswordError('');
            setConfirmError('');
            setTermsAccepted(false);
          }}
        >
          Registrarse
        </button>
      </div>
      <div className="access-intro">
        <p className="access-eyebrow">{register ? 'ÚNETE A MORAVÍA' : 'ACCESO A TU CUENTA'}</p>
        <h1 id="access-title">{register ? 'Crea tu cuenta' : '¡Bienvenido de nuevo!'}</h1>
        <p>
          {register
            ? 'Empieza a conectar con tu comunidad.'
            : 'Inicia sesión para acceder a tu comunidad.'}
        </p>
      </div>
      <ValidatedForm className="access-form" onSubmit={submit} key={mode}>
        <div className="access-fields">
          {register && (
            <label className="access-field">
              Nombre completo
              <input
                name="name"
                placeholder="Tu nombre"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
          )}
          <label className="access-field">
            Correo electrónico
            <input
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <PasswordField
            name="password"
            label="Contraseña"
            placeholder={register ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={register ? 8 : 1}
            error={passwordError}
            onChange={() => setPasswordError('')}
          />
          {register && (
            <PasswordField
              name="confirmPassword"
              label="Repetir contraseña"
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
              minLength={8}
              error={confirmError}
              onChange={() => setConfirmError('')}
            />
          )}
          {register && (
            <label className="access-terms">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                required
              />{' '}
              <span>
                Acepto los términos de uso y confirmo haber leído la política de privacidad.
              </span>
            </label>
          )}
          <FormError>{error}</FormError>
        </div>
        <div className="access-form__footer">
          <button
            className="access-primary"
            type="submit"
            disabled={busy || (register && !termsAccepted)}
          >
            {busy ? 'Un momento…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
          {!register && <p>Privacidad · Términos de uso</p>}
        </div>
      </ValidatedForm>
    </Modal>
  );
}

export function WelcomeDialog({ onClose, onCreate, onJoin, showSuccess, onDismissSuccess }) {
  return (
    <Modal onClose={onClose} titleId="welcome-title" variant="access-dialog--welcome">
      {showSuccess && (
        <SuccessToast
          title="Cuenta creada"
          message="Tu cuenta se ha creado correctamente."
          onClose={onDismissSuccess}
        />
      )}
      <DialogHeader onClose={onClose} defer />
      <div className="access-intro">
        <p className="access-eyebrow">BIENVENIDA</p>
        <h1 id="welcome-title">Todo empieza con tu comunidad.</h1>
        <p>Elige cómo quieres comenzar en Moravía.</p>
      </div>
      <button className="welcome-card" type="button" onClick={onCreate}>
        <span className="welcome-card__top">
          <span className="welcome-card__icon">
            <Building2 size={20} />
          </span>
        </span>
        <strong>Crear una comunidad</strong>
        <span>Soy presidente y quiero gestionar mi comunidad de vecinos.</span>
      </button>
      <button className="welcome-card" type="button" onClick={onJoin}>
        <span className="welcome-card__top">
          <span className="welcome-card__icon welcome-card__icon--orange">
            <Users size={20} />
          </span>
        </span>
        <strong>Unirme a una comunidad</strong>
        <span>Tengo una invitación y quiero acceder como residente.</span>
      </button>
    </Modal>
  );
}
