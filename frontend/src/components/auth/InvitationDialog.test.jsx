import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvitationDialog from './InvitationDialog.jsx';
import jsQR from 'jsqr';

vi.mock('jsqr', () => ({ default: vi.fn(() => null) }));

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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('valida el código e interpreta un enlace sin navegar fuera de la aplicación', () => {
  const onContinue = vi.fn();
  render(<InvitationDialog onClose={vi.fn()} onContinue={onContinue} />);
  const input = screen.getByLabelText('Código de invitación');
  fireEvent.change(input, { target: { value: 'código inválido' } });
  fireEvent.click(screen.getByRole('button', { name: 'Unirme a la comunidad' }));
  expect(screen.getByRole('alert').textContent).toContain('válido');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const token = 'a'.repeat(43);
  fireEvent.change(input, { target: { value: `https://example.com/unirse?token=${token}` } });
  fireEvent.click(screen.getByRole('button', { name: 'Unirme a la comunidad' }));
  expect(onContinue).toHaveBeenCalledWith(token);
});

it('permite volver al código manual si se deniega el permiso de cámara', async () => {
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
    },
  });
  render(<InvitationDialog onClose={vi.fn()} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Escanear código QR' }));
  expect((await screen.findByRole('alert')).textContent).toContain('No se ha permitido');
  fireEvent.click(screen.getByRole('button', { name: 'Introducir código manualmente' }));
  expect(screen.getByLabelText('Código de invitación')).toBeTruthy();
});

it('detiene la cámara cuando se abandona el escáner', async () => {
  const stop = vi.fn();
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  render(<InvitationDialog onClose={vi.fn()} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Escanear código QR' }));
  await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Introducir código manualmente' }));
  await waitFor(() => expect(stop).toHaveBeenCalled());
});

it('extrae el token de un QR leído por la cámara', async () => {
  const stop = vi.fn();
  const token = 'b'.repeat(43);
  const onContinue = vi.fn();
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(2);
  vi.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(2);
  vi.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(2);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 }),
  });
  jsQR.mockReturnValueOnce({ data: `https://example.com/unirse?token=${token}` });
  render(<InvitationDialog onClose={vi.fn()} onContinue={onContinue} />);
  fireEvent.click(screen.getByRole('button', { name: 'Escanear código QR' }));
  await waitFor(() => expect(onContinue).toHaveBeenCalledWith(token));
});
