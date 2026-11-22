import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, makeData, makeSession, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { CreationPage } from './CreationPage';

function draft() {
  return makeSession({
    id: 'creation-1',
    foamDone: true,
    preferences: prefs(),
  });
}

test('shows the summary, the note and the editable preferences', async () => {
  const user = userEvent.setup();
  renderWithFormix(<CreationPage />, {
    data: makeData([draft()]),
    currentSessionId: 'creation-1',
  });

  expect(screen.getByText('Paso 5 de 5')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Jabón con molde Patita en color Rosa' })).toBeInTheDocument();
  expect(screen.getByText('Patita')).toBeInTheDocument();
  expect(screen.getByText('Rosa')).toBeInTheDocument();
  expect(screen.getByText('Fresa')).toBeInTheDocument();
  expect(
    screen.getByText('Es una preferencia, no un pedido ni una reserva.'),
  ).toBeInTheDocument();

  const purchase = screen.getByRole('checkbox', { name: 'Me interesaría comprarlo' });
  await user.click(purchase);
  expect(purchase).toBeChecked();

  const gift = screen.getByRole('checkbox', { name: 'Sería para regalo' });
  await user.click(gift);
  expect(gift).toBeChecked();
});

test('saves once and navigates to the mission', async () => {
  const user = userEvent.setup();
  renderWithFormix(<CreationPage />, {
    data: makeData([draft()]),
    currentSessionId: 'creation-1',
  });

  const save = screen.getByRole('button', { name: 'Guardar mi creación' });
  await user.click(save);
  expect(window.location.hash).toBe('#/mision');

  const stored = JSON.parse(localStorage.getItem('formix.data.v1') ?? '{}') as {
    sessions: Array<{ code: string | null; completedAt: string | null }>;
  };
  expect(stored.sessions).toHaveLength(1);
  expect(stored.sessions[0].code).toMatch(/^FX-/);
  expect(stored.sessions[0].completedAt).toBeTruthy();
});

test('a completed session redirects to the mission and does not show the form', async () => {
  const session = completedSession({ id: 'done' });
  renderWithFormix(<CreationPage />, { data: makeData([session]), currentSessionId: 'done' });
  await waitFor(() => expect(window.location.hash).toBe('#/mision'));
  expect(screen.queryByRole('button', { name: 'Guardar mi creación' })).not.toBeInTheDocument();
});
