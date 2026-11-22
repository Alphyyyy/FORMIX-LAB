import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, makeData, makeSession, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { WelcomePage } from './WelcomePage';

test('starts a new session from the welcome screen', async () => {
  const user = userEvent.setup();
  renderWithFormix(<WelcomePage />, { data: makeData([]) });
  expect(screen.getByRole('heading', { name: 'Tu jabón. Tu fórmula.' })).toBeInTheDocument();
  expect(screen.getByText('Sin registro')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Entrar al laboratorio' }));
  expect(window.location.hash).toBe('#/crear/espuma');
});

test('offers to continue an in-progress formula at the right step', async () => {
  const user = userEvent.setup();
  const session = makeSession({
    id: 'partial',
    foamDone: true,
    preferences: prefs({ shapeId: 'shape-patita', colorId: '', scentId: '' }),
  });
  renderWithFormix(<WelcomePage />, { data: makeData([session]), currentSessionId: 'partial' });
  await user.click(screen.getByRole('button', { name: 'Continuar mi fórmula' }));
  expect(window.location.hash).toBe('#/crear/color');

  await user.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));
  expect(window.location.hash).toBe('#/crear/espuma');
});

test('shows the mission for a completed formula and can start another', async () => {
  const user = userEvent.setup();
  const session = completedSession({ id: 'done' });
  renderWithFormix(<WelcomePage />, { data: makeData([session]), currentSessionId: 'done' });
  await user.click(screen.getByRole('button', { name: 'Ver mi misión' }));
  expect(window.location.hash).toBe('#/mision');

  await user.click(screen.getByRole('button', { name: 'Crear otra' }));
  expect(window.location.hash).toBe('#/crear/espuma');
});

test('opens the privacy notice', async () => {
  const user = userEvent.setup();
  renderWithFormix(<WelcomePage />, { data: makeData([]) });
  await user.click(screen.getByRole('button', { name: 'Aviso de privacidad' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('No solicitamos nombre, teléfono, correo ni DNI');
});
