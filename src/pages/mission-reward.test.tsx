import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, makeData, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { MissionPage } from './MissionPage';
import { RewardPage } from './RewardPage';
import { ThanksPage } from './ThanksPage';

function game(type: 'bacteria' | 'aroma', result: 'WIN' | 'LOSE', validatedAt: string) {
  return { gameType: type, result, validatedAt, operatorInitials: 'AM' };
}

const pending = completedSession({ id: 'pending' });
const validated = completedSession({
  id: 'validated',
  games: {
    bacteria: game('bacteria', 'WIN', '2026-11-22T12:05:00.000Z'),
    aroma: game('aroma', 'LOSE', '2026-11-22T12:08:00.000Z'),
  },
  reward: {
    type: 'photo',
    issuedAt: '2026-11-22T12:09:00.000Z',
    redeemedAt: null,
    redeemedBy: null,
  },
});

test('mission shows the code, challenges, ladder and copy action', async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  renderWithFormix(<MissionPage />, { data: makeData([pending]), currentSessionId: 'pending' });

  expect(screen.getByText('FX-ABC234')).toBeInTheDocument();
  expect(screen.getAllByText('Pendiente de validación')).toHaveLength(2);
  expect(screen.getByText(/Los resultados solo puede registrarlos el equipo FORMIX/)).toBeInTheDocument();
  expect(screen.getByText('Saludo de la mascota')).toBeInTheDocument();
  expect(screen.getByText('Foto con la mascota')).toBeInTheDocument();
  expect(screen.getByText('Baile + foto con la mascota')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Copiar código' }));
  expect(writeText).toHaveBeenCalledWith('FX-ABC234');
});

test('mission shows validated challenge states and links to the reward', async () => {
  const user = userEvent.setup();
  renderWithFormix(<MissionPage />, { data: makeData([validated]), currentSessionId: 'validated' });
  expect(screen.getByText('Superado')).toBeInTheDocument();
  expect(screen.getByText('No superado')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ver mi premio' }));
  expect(window.location.hash).toBe('#/premio');
});

test('reward page shows pending, unlocked and redeemed states', () => {
  renderWithFormix(<RewardPage />, {
    data: makeData([pending]),
    currentSessionId: 'pending',
  });
  expect(screen.getByText('Aún no validado')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver a la misión' })).toHaveAttribute('href', '#/mision');
});

test('reward page shows the unlocked prize and its upgrade note', () => {
  renderWithFormix(<RewardPage />, { data: makeData([validated]), currentSessionId: 'validated' });
  expect(screen.getByText('Foto con la mascota')).toBeInTheDocument();
  expect(screen.getByText('Muéstralo al equipo FORMIX')).toBeInTheDocument();
  expect(
    screen.getByText('Puedes completar los dos retos antes de reclamar para subir de nivel.'),
  ).toBeInTheDocument();
});

test('reward page shows a redeemed prize and locks a late upgrade', () => {
  const locked = completedSession({
    id: 'locked',
    games: {
      bacteria: game('bacteria', 'WIN', '2026-11-22T12:05:00.000Z'),
      aroma: game('aroma', 'WIN', '2026-11-22T12:15:00.000Z'),
    },
    reward: {
      type: 'photo',
      issuedAt: '2026-11-22T12:06:00.000Z',
      redeemedAt: '2026-11-22T12:10:00.000Z',
      redeemedBy: 'AM',
    },
  });
  renderWithFormix(<RewardPage />, { data: makeData([locked]), currentSessionId: 'locked' });
  expect(screen.getByText('Entregado')).toBeInTheDocument();
  expect(screen.getByText(/AM/)).toBeInTheDocument();
  expect(
    screen.getByText(
      'El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.',
    ),
  ).toBeInTheDocument();
});

test('thanks summarizes the creation and starts a new session', async () => {
  const user = userEvent.setup();
  const session = completedSession({ id: 'done', preferences: prefs() });
  renderWithFormix(<ThanksPage />, { data: makeData([session]), currentSessionId: 'done' });
  expect(screen.getByText('Gracias por crear con nosotros.')).toBeInTheDocument();
  expect(screen.getByText('Patita')).toBeInTheDocument();
  expect(screen.getByText('Rosa')).toBeInTheDocument();
  expect(screen.getByText('Fresa')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Volver a empezar' }));
  expect(window.location.hash).toBe('#/crear/espuma');
});
