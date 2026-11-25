import { Megaphone, ClipboardList, BarChart3, ShieldCheck, Plus } from 'lucide-react';
import logo from '../../assets/images/Moravia.png';
import isotipo from '../../assets/images/Isotipo.png';
import sunset from '../../assets/images/Atardecer urbano en tonos Moravía.png';
import skyline from '../../assets/images/Horizonte urbano en dos capas.png';
import community from '../../assets/images/comunidad.svg';
import accessibility from '../../assets/images/accesibilidad.svg';
import pin from '../../assets/images/chincheta.svg';
import './home.css';

const features = [
  {
    old: 'Averías sin resolver',
    badge: 'EN MORAVÍA',
    title: 'Gestiona incidencias',
    description:
      'Notifica averías con foto y consulta su evolución sin papelitos en el cuadro de luces.',
    icon: ClipboardList,
    color: 'yellow',
    decoration: 'tape',
  },
  {
    old: 'Avisos que se pierden',
    badge: 'TABLÓN DIGITAL',
    title: 'Mantente al día',
    description: 'Comunicados oficiales siempre accesibles desde tu móvil.',
    icon: Megaphone,
    color: 'white',
    decoration: 'pin',
  },
  {
    old: 'Decisiones sin voz',
    badge: 'PARTICIPACIÓN',
    title: 'Haz oír tu opinión',
    description: 'Participa en las consultas de tu comunidad de forma clara y sencilla.',
    icon: BarChart3,
    color: 'purple',
    decoration: 'tape',
  },
  {
    old: 'Grupos de WhatsApp',
    badge: 'PRIVACIDAD',
    title: 'Privacidad para tu comunidad',
    description: 'La información de tu comunidad, organizada en un espacio privado.',
    icon: ShieldCheck,
    color: 'orange',
    decoration: 'pin',
  },
];

const devices = [
  {
    name: 'Android',
    browser: 'CHROME',
    steps: [
      'Abre Moravía en Chrome y toca el menú de tres puntos.',
      'Elige «Instalar y crear acceso directo» y después «Crear acceso directo».',
      'Confirma con «Añadir».',
    ],
  },
  {
    name: 'iPhone',
    browser: 'SAFARI',
    steps: [
      'Abre Moravía en Safari y toca «Compartir».',
      'Selecciona «Añadir a pantalla de inicio».',
      'Toca «Añadir» para confirmar.',
    ],
  },
];

function Button({ children, onClick, secondary = false, type = 'button' }) {
  return (
    <button
      type={type}
      className={`home-button${secondary ? ' home-button--outline' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  return (
    <article className={`feature-card feature-card--${feature.color}`}>
      {feature.decoration === 'pin' ? (
        <img className="feature-pin" src={pin} alt="" />
      ) : (
        <span className="feature-tape" aria-hidden="true" />
      )}
      <div className="feature-card__top">
        <span>{feature.old}</span>
        <b>{feature.badge}</b>
      </div>
      <div className="feature-card__body">
        <span className="feature-card__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      </div>
    </article>
  );
}

function DeviceCard({ device }) {
  return (
    <article className="device-card">
      <div className="device-card__heading">
        <h3>{device.name}</h3>
        <b>{device.browser}</b>
      </div>
      <ol>
        {device.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </article>
  );
}

function FaqItem({ question, children }) {
  return (
    <details className="home-faq__item">
      <summary>
        {question}
        <Plus size={18} aria-hidden="true" />
      </summary>
      <p>{children}</p>
    </details>
  );
}

export default function HomePage({ onLogin, onRegister, onInvite }) {
  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header__inner">
          <a href="/" aria-label="Moravía, inicio">
            <img src={logo} alt="Moravía" />
          </a>
          <button type="button" onClick={onLogin}>
            Iniciar sesión
          </button>
        </div>
      </header>
      <main>
        <section className="home-hero" style={{ '--hero-image': `url("${sunset}")` }}>
          <div className="home-wrap home-hero__content">
            <p className="home-eyebrow">UNA NUEVA FORMA DE HACER COMUNIDAD</p>
            <h1>
              Tu comunidad, <br />
              más conectada.
            </h1>
            <p>Incidencias, avisos y consultas de tu comunidad, en un mismo lugar.</p>
            <Button onClick={onRegister}>Comenzar ahora</Button>
          </div>
        </section>
        <section className="home-start">
          <div className="home-wrap">
            <div className="home-start__intro">
              <div>
                <p className="home-eyebrow">PRIMER PASO</p>
                <h2>Empieza en tu comunidad</h2>
                <p>¿Presides tu comunidad o ya tienes una invitación?</p>
              </div>
              <img src={community} alt="" width="104" height="100" />
            </div>
            <span className="home-accent" />
            <div className="home-start__actions">
              <Button onClick={onRegister}>Crear mi comunidad</Button>
              <Button secondary onClick={onInvite}>
                Tengo una invitación
              </Button>
            </div>
            <p className="home-start__note">Acceso para vecinos de tu comunidad</p>
          </div>
        </section>
        <section className="home-features">
          <div className="home-wrap">
            <p className="home-eyebrow">DEL TABLÓN DE ANUNCIOS AL MÓVIL</p>
            <h2>Menos ruido. Más comunidad.</h2>
            <p className="home-features__intro">
              Deja atrás los carteles pegados y los mensajes perdidos en el portal.
            </p>
            <div className="home-features__grid">
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </section>
        <section className="home-mobile">
          <div className="home-wrap">
            <div className="home-mobile__heading">
              <span className="home-mobile__logo">
                <img src={isotipo} alt="" />
              </span>
              <div>
                <p className="home-eyebrow">LLÉVALA EN TU MÓVIL</p>
                <h2>Tu comunidad, siempre contigo.</h2>
              </div>
            </div>
            <p>
              Accede desde el navegador de tu móvil. Añade Moravía a tu pantalla de inicio para
              tenerla siempre a mano.
            </p>
            <div
              className="device-list"
              tabIndex="0"
              aria-label="Instrucciones para Android y iPhone"
            >
              {devices.map((device) => (
                <DeviceCard key={device.name} device={device} />
              ))}
            </div>
            <p className="home-mobile__hint">Desliza para ver Android y iPhone</p>
            <p className="home-mobile__note">
              Los nombres pueden variar según la versión del navegador.
            </p>
          </div>
        </section>
        <section className="home-accessibility">
          <div className="home-wrap">
            <h2>Diseñada para todos</h2>
            <div>
              <img src={accessibility} width="72" height="50" alt="" />
              <p>Navegación sencilla, diseño adaptable e información organizada.</p>
            </div>
          </div>
        </section>
        <section className="home-faq">
          <div className="home-wrap">
            <p className="home-eyebrow">PREGUNTAS HABITUALES</p>
            <h2>Transparencia entre vecinos</h2>
            <FaqItem question="¿Sustituye al administrador de fincas?">
              Moravía facilita la comunicación de comunidades autogestionadas; no sustituye las
              funciones de un administrador de fincas.
            </FaqItem>
            <FaqItem question="¿Pueden ver mi número de teléfono?">
              No necesitas compartir tu número de teléfono para utilizar Moravía.
            </FaqItem>
          </div>
        </section>
        <section className="home-project">
          <div className="home-wrap">
            <div className="home-project__card">
              <h2>Conoce Moravía</h2>
              <p>
                Un proyecto de Desarrollo de Aplicaciones Web para mejorar la comunicación vecinal.
              </p>
              <p>Rocío Luque Montes · Pablo Sanz Aznar</p>
            </div>
          </div>
          <img className="home-project__skyline" src={skyline} alt="" />
        </section>
      </main>
      <footer className="home-footer">
        <div className="home-wrap">
          <h2>Moravía</h2>
          <p>Tu comunidad, más conectada.</p>
          <p>Privacidad · Cookies · Términos de uso</p>
          <p>© 2026 Moravía</p>
        </div>
      </footer>
    </div>
  );
}
