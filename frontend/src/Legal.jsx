import { useState } from 'react';

const preferenceKey = 'moravia-cookie-notice';
const pages = {
  '/legal/privacidad': {
    title: 'Política de privacidad',
    sections: [
      [
        'Qué datos guardamos',
        'Al darte de alta, guardamos tu nombre, tu correo y un hash de tu contraseña. Si te registras con una invitación, también guardamos tu comunidad, la vivienda que solicitas y el estado de la solicitud.',
      ],
      [
        'Cómo se usan los datos',
        'Usamos estos datos para gestionar tu cuenta y tu acceso a la comunidad. Al revisar una solicitud, el presidente puede ver quién la ha enviado y qué vivienda pide.',
      ],
      [
        'Derechos sobre tus datos',
        'Puedes solicitar acceso, rectificación o supresión de tus datos y, cuando corresponda, ejercer los derechos de limitación, oposición y portabilidad. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos.',
      ],
      [
        'Versión de prueba',
        'Si estás probando Moravía, usa nombres, correos y direcciones ficticios.',
      ],
    ],
  },
  '/legal/cookies': {
    title: 'Política de cookies',
    sections: [
      [
        'Cookies técnicas',
        'La cookie moravia_token mantiene tu sesión iniciada. La cookie moravia_csrf protege el registro, el inicio de sesión y las operaciones que cambian datos. Por defecto, duran 24 horas. Al cerrar sesión, borramos moravia_token.',
      ],
      [
        'Qué pasa al aceptar',
        'Al pulsar «Aceptar técnicas», tu navegador recuerda que ya viste el aviso. Moravía usa cookies técnicas para que funcione la aplicación.',
      ],
      [
        'Cómo gestionar el almacenamiento',
        'Puedes borrar las cookies y el almacenamiento de Moravía desde los ajustes del navegador. El aviso volverá a aparecer y es posible que tengas que iniciar sesión de nuevo. Bloquear las cookies puede impedir el registro o el acceso a tu cuenta.',
      ],
    ],
  },
  '/legal/terminos': {
    title: 'Términos de uso',
    sections: [
      [
        'Acceso a la comunidad',
        'Si te registras con una invitación, el presidente revisará tu solicitud antes de darte acceso a la comunidad. Solicita solo la vivienda a la que perteneces.',
      ],
      [
        'Uso de la cuenta',
        'Guarda tu contraseña y respeta la privacidad de los demás vecinos. Comparte las invitaciones solo con las personas que vayan a incorporarse a tu comunidad.',
      ],
      [
        'Alcance de Moravía',
        'Moravía facilita la gestión cotidiana de la comunidad. Los trámites y acuerdos formales deben seguir los procedimientos que correspondan a la comunidad.',
      ],
    ],
  },
};

export function getLegalPage(path) {
  return Object.hasOwn(pages, path) ? pages[path] : null;
}

export function LegalPage({ page }) {
  return (
    <article className="card legal-page">
      <h1>{page.title}</h1>
      {page.sections.map(([heading, copy]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{copy}</p>
        </section>
      ))}
    </article>
  );
}

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Información legal">
      <a href="/legal/privacidad">Privacidad</a>
      <a href="/legal/cookies">Cookies</a>
      <a href="/legal/terminos">Términos de uso</a>
    </nav>
  );
}

export function PolicyAcceptance() {
  return (
    <div className="policy-acceptance">
      <input id="accept-policies" name="acceptPolicies" type="checkbox" required />
      <label htmlFor="accept-policies">
        Acepto los{' '}
        <a href="/legal/terminos" target="_blank" rel="noopener noreferrer">
          términos de uso
        </a>{' '}
        y confirmo que he leído las políticas de{' '}
        <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer">
          privacidad
        </a>{' '}
        y{' '}
        <a href="/legal/cookies" target="_blank" rel="noopener noreferrer">
          cookies
        </a>
        .
      </label>
    </div>
  );
}

export function CookieNotice() {
  const [accepted, setAccepted] = useState(() => {
    try {
      return window.localStorage.getItem(preferenceKey) === 'accepted';
    } catch {
      return false;
    }
  });

  if (accepted) return null;

  function accept() {
    try {
      window.localStorage.setItem(preferenceKey, 'accepted');
    } catch {
      // Si el navegador bloquea el almacenamiento, se oculta durante esta visita.
    }
    setAccepted(true);
  }

  return (
    <aside className="cookie-notice" aria-labelledby="cookie-title">
      <div>
        <h2 id="cookie-title">Cookies técnicas</h2>
        <p>Usamos cookies necesarias para mantener tu sesión y proteger tus solicitudes.</p>
      </div>
      <div className="cookie-actions">
        <a href="/legal/cookies">Más información</a>
        <button type="button" className="primary" onClick={accept}>
          Aceptar técnicas
        </button>
      </div>
    </aside>
  );
}
