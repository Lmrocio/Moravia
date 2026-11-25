import { useEffect, useRef, useState } from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { FormError } from '../common/Feedback.jsx';
import { DialogHeader, Modal } from './AccessDialog.jsx';

export function invitationToken(value) {
  let token = value.trim();
  try {
    if (/^https?:\/\//i.test(token)) token = new URL(token).searchParams.get('token') || '';
  } catch {
    return '';
  }
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : '';
}

function CameraScanner({ onScan }) {
  const video = useRef(null);
  const callback = useRef(onScan);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  callback.current = onScan;
  useEffect(() => {
    let stream,
      frame,
      stopped = false,
      reading = false;
    const canvas = document.createElement('canvas');
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('La cámara no está disponible. Usa HTTPS o introduce el código manualmente.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        const scan = () => {
          if (stopped || reading) return;
          const v = video.current;
          if (v && v.readyState >= 2 && v.videoWidth && v.videoHeight) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: 'dontInvert',
              });
              if (result) {
                const token = invitationToken(result.data);
                if (token) {
                  reading = true;
                  callback.current(token);
                  return;
                }
                setError('Este QR no contiene una invitación válida de Moravía.');
              }
            }
          }
          frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch (err) {
        if (!stopped)
          setError(
            err.name === 'NotAllowedError'
              ? 'No se ha permitido el acceso a la cámara. Revisa los permisos o introduce el código manualmente.'
              : 'No se ha podido iniciar la cámara. Inténtalo de nuevo o introduce el código manualmente.',
          );
      }
    }
    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (video.current) video.current.srcObject = null;
    };
  }, [retry]);
  return (
    <>
      <div className="invitation-camera">
        <video ref={video} playsInline muted aria-label="Vista de la cámara" />
        <ScanLine size={112} aria-hidden="true" />
      </div>
      {error && (
        <>
          <FormError>{error}</FormError>
          <button
            type="button"
            className="invitation-retry"
            onClick={() => {
              setError('');
              setRetry((value) => value + 1);
            }}
          >
            Reintentar cámara
          </button>
        </>
      )}
    </>
  );
}

export default function InvitationDialog({ onClose, onContinue }) {
  const [mode, setMode] = useState('manual');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const token = invitationToken(new FormData(event.currentTarget).get('invitation'));
    if (!token) {
      setError('Introduce un código o enlace de invitación válido.');
      return;
    }
    onContinue(token);
  }
  return (
    <Modal
      onClose={onClose}
      titleId="invitation-title"
      variant="access-dialog--welcome invitation-dialog"
    >
      <DialogHeader onClose={onClose} />
      <div className="invitation-intro">
        <h1 id="invitation-title">
          {mode === 'manual' ? 'Únete a tu comunidad' : 'Escanea el código QR'}
        </h1>
        <p>
          {mode === 'manual'
            ? 'Introduce el código de invitación o escanea el código QR de tu comunidad.'
            : 'Apunta la cámara al código QR de invitación para unirte a tu comunidad.'}
        </p>
      </div>
      {mode === 'manual' ? (
        <>
          <form className="access-invitation" onSubmit={submit} noValidate>
            <label className="access-field">
              Código de invitación
              <input
                name="invitation"
                placeholder="Tu código de invitación"
                aria-invalid={!!error}
                aria-describedby={error ? 'invitation-error' : undefined}
                onChange={() => setError('')}
                required
              />
            </label>
            <FormError id="invitation-error">{error}</FormError>
            <button className="access-primary">Unirme a la comunidad</button>
          </form>
          <div className="invitation-separator">
            <span />o<span />
          </div>
          <button
            type="button"
            className="invitation-outline"
            onClick={() => {
              setError('');
              setMode('camera');
            }}
          >
            <QrCode size={20} />
            Escanear código QR
          </button>
        </>
      ) : (
        <>
          <CameraScanner onScan={onContinue} />
          <button type="button" className="invitation-outline" onClick={() => setMode('manual')}>
            Introducir código manualmente
          </button>
        </>
      )}
    </Modal>
  );
}
