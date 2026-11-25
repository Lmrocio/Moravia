import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useId, useState } from 'react';
import './feedback.css';

export function FormError({ children, id }) {
  if (!children) return null;
  return (
    <p className="form-error" role="alert" id={id}>
      <CircleAlert size={16} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function SuccessToast({ title, message, onClose }) {
  return (
    <div className="success-toast" role="status">
      <CircleCheck size={22} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar aviso">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ValidatedForm({ children, ...props }) {
  const [message, setMessage] = useState('');
  const id = useId();
  function invalid(event) {
    event.preventDefault();
    const input = event.target;
    const first = event.currentTarget.querySelector('[aria-invalid="true"]');
    if (first && first !== input) return;
    if (!first) input.focus();
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', id);
    let text = 'Revisa este campo.';
    if (input.validity.valueMissing) text = 'Este campo es obligatorio.';
    else if (input.validity.typeMismatch) text = 'Introduce un correo electrónico válido.';
    else if (input.validity.tooShort) text = `Introduce al menos ${input.minLength} caracteres.`;
    else if (input.validity.rangeOverflow || input.validity.rangeUnderflow)
      text = 'Introduce un valor dentro del intervalo permitido.';
    setMessage((previous) => previous || text);
  }
  function clear(event) {
    event.target.removeAttribute('aria-invalid');
    if (event.target.getAttribute('aria-describedby') === id)
      event.target.removeAttribute('aria-describedby');
    setMessage('');
  }
  return (
    <form {...props} onInvalid={invalid} onInput={clear}>
      {children}
      <FormError id={id}>{message}</FormError>
    </form>
  );
}
