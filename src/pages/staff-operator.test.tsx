import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, makeData, prefs } from '../test/fixtures';
import type { StaffSession } from '../domain/types';
import { renderWithFormix } from '../test/render';
import { OperatorPage } from './OperatorPage';
import { StaffLoginPage } from './StaffLoginPage';

const staff: StaffSession = {
  role: 'operator',
  initials: 'AM',
  loggedAt: '2026-11-22T10:00:00.000Z',
};

function operatorSession(overrides = {}) {
  return completedSession({
    id: 'op-1',
    code: 'FX-ABC234',
    preferences: prefs(),
    ...overrides,
  });
}

test('staff login shows roles, fields and the demo hint', () => {
  renderWithFormix(<StaffLoginPage />, { data: makeData([]) });
  expect(screen.getByRole('button', { name: 'Operador' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Administrador' })).toBeInTheDocument();
  expect(screen.getByLabelText('PIN')).toBeInTheDocument();
  expect(screen.getByLabelText('Iniciales (opcional)')).toBeInTheDocument();
  expect(screen.getByText('Demo: Operador 2468 · Administrador 1357')).toBeInTheDocument();
});

test('staff login rejects a wrong PIN', async () => {
  const user = userEvent.setup();
  renderWithFormix(<StaffLoginPage />, { data: makeData([]) });
  await user.type(screen.getByLabelText('PIN'), '0000');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByText('PIN incorrecto.')).toBeInTheDocument();
  expect(sessionStorage.getItem('formix.staff.v1')).toBeNull();
});

test('staff login navigates by role and defaults blank initials', async () => {
  const user = userEvent.setup();
  renderWithFormix(<StaffLoginPage />, { data: makeData([]) });
  await user.type(screen.getByLabelText('PIN'), '2468');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(window.location.hash).toBe('#/operador');
  const stored = JSON.parse(sessionStorage.getItem('formix.staff.v1') ?? '{}') as StaffSession;
  expect(stored.initials).toBe('Operador');
});

test('admin login navigates to the admin area', async () => {
  const user = userEvent.setup();
  renderWithFormix(<StaffLoginPage />, { data: makeData([]) });
  await user.click(screen.getByRole('button', { name: 'Administrador' }));
  await user.type(screen.getByLabelText('PIN'), '1357');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(window.location.hash).toBe('#/admin');
});

test('operator finds a code and validates the first challenge', async () => {
  const user = userEvent.setup();
  renderWithFormix(<OperatorPage />, {
    data: makeData([operatorSession()]),
    staff,
  });
  await user.type(screen.getByLabelText('Código de participación'), 'abc234');
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(screen.getAllByText('FX-ABC234').length).toBeGreaterThan(0);
  expect(screen.getByText('Se emite al validar el primer reto.')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Ganó en Derriba las bacterias' }));
  expect(screen.getByRole('dialog')).toHaveTextContent(
    '¿Registrar Derriba las bacterias como ganado? Esta acción no se puede deshacer.',
  );
  await user.click(screen.getByRole('button', { name: 'Sí, registrar' }));
  expect(screen.getAllByText('Foto con la mascota').length).toBeGreaterThan(0);
  expect(screen.getByText('Superado')).toBeInTheDocument();
});

test('operator upgrades the prize with the second win and redeems once', async () => {
  const user = userEvent.setup();
  const session = operatorSession({
    games: {
      bacteria: {
        gameType: 'bacteria',
        result: 'WIN',
        validatedAt: '2026-11-22T12:05:00.000Z',
        operatorInitials: 'AM',
      },
    },
    reward: {
      type: 'photo',
      issuedAt: '2026-11-22T12:06:00.000Z',
      redeemedAt: null,
      redeemedBy: null,
    },
  });
  renderWithFormix(<OperatorPage />, { data: makeData([session]), staff });

  await user.type(screen.getByLabelText('Código de participación'), 'FX-ABC234');
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  await user.click(screen.getByRole('button', { name: 'Ganó en Adivina el aroma' }));
  await user.click(screen.getByRole('button', { name: 'Sí, registrar' }));
  expect(screen.getAllByText('Baile + foto con la mascota').length).toBeGreaterThan(0);

  await user.click(screen.getByRole('button', { name: 'Marcar premio como entregado' }));
  expect(screen.getByRole('dialog')).toHaveTextContent(
    '¿Marcar el premio como entregado? Esta acción no se puede deshacer.',
  );
  await user.click(screen.getByRole('button', { name: 'Sí, entregar' }));
  expect(screen.getByText(/Entregado por AM/)).toBeInTheDocument();
  expect(screen.getByText('Este premio ya fue entregado.')).toBeInTheDocument();
});

test('operator reports the locked prize after a late second win', async () => {
  const user = userEvent.setup();
  const session = operatorSession({
    games: {
      bacteria: {
        gameType: 'bacteria',
        result: 'WIN',
        validatedAt: '2026-11-22T12:05:00.000Z',
        operatorInitials: 'AM',
      },
    },
    reward: {
      type: 'photo',
      issuedAt: '2026-11-22T12:06:00.000Z',
      redeemedAt: '2026-11-22T12:10:00.000Z',
      redeemedBy: 'AM',
    },
  });
  renderWithFormix(<OperatorPage />, { data: makeData([session]), staff });
  await user.type(screen.getByLabelText('Código de participación'), 'FX-ABC234');
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  await user.click(screen.getByRole('button', { name: 'Ganó en Adivina el aroma' }));
  await user.click(screen.getByRole('button', { name: 'Sí, registrar' }));
  expect(
    screen.getByText(
      'El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.',
    ),
  ).toBeInTheDocument();
});

test('operator shows a clear error for an unknown code', async () => {
  const user = userEvent.setup();
  renderWithFormix(<OperatorPage />, { data: makeData([operatorSession()]), staff });
  await user.type(screen.getByLabelText('Código de participación'), 'FX-NOPE23');
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(screen.getByText('No encontramos ese código.')).toBeInTheDocument();
});
