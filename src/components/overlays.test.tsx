import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeData } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { Modal } from './Modal';
import { OfflineBanner } from './OfflineBanner';
import { PrivacyDialog } from './PrivacyDialog';
import { SoundToggle } from './SoundToggle';

test('Modal shows its content and closes from the close button', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const { rerender } = render(
    <Modal open title="Aviso" onClose={onClose}>
      <p>Contenido del aviso</p>
    </Modal>,
  );
  expect(screen.getByRole('dialog')).toHaveTextContent('Aviso');
  expect(screen.getByText('Contenido del aviso')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(onClose).toHaveBeenCalledTimes(1);

  rerender(
    <Modal open={false} title="Aviso" onClose={onClose}>
      <p>Contenido del aviso</p>
    </Modal>,
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('PrivacyDialog carries the approved notice and consent version', () => {
  render(<PrivacyDialog open onClose={() => undefined} />);
  expect(screen.getByText(/No solicitamos nombre, teléfono, correo ni DNI/)).toBeInTheDocument();
  expect(screen.getByText(/2026-11-demo-v1/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
});

test('OfflineBanner reacts to browser connectivity', () => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  render(<OfflineBanner />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  act(() => window.dispatchEvent(new Event('offline')));
  expect(screen.getByRole('status')).toHaveTextContent(/Sin conexión/);

  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  act(() => window.dispatchEvent(new Event('online')));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('SoundToggle toggles and persists the preference', async () => {
  const user = userEvent.setup();
  renderWithFormix(<SoundToggle />, { data: makeData([]) });
  const on = screen.getByRole('button', { name: 'Silenciar' });
  expect(on).toHaveAttribute('aria-pressed', 'true');
  await user.click(on);
  const off = screen.getByRole('button', { name: 'Activar sonido' });
  expect(off).toHaveAttribute('aria-pressed', 'false');
  expect(localStorage.getItem('formix.sound.v1')).toBe('false');
});
