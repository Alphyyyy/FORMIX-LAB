import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeData, makeSession } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { FoamPage } from './FoamPage';
import { ShapePage } from './ShapePage';

vi.mock('../lib/audio', () => ({ playSound: vi.fn() }));
const { playSound } = await import('../lib/audio');

test('foam page guides the challenge and completes with the fallback', async () => {
  const user = userEvent.setup();
  localStorage.setItem('formix.sound.v1', 'false');
  const session = makeSession({ id: 'foam-1' });
  renderWithFormix(<FoamPage />, { data: makeData([session]), currentSessionId: 'foam-1' });

  expect(screen.getByText('Desafío de espuma')).toBeInTheDocument();
  expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Toca aquí para llevarla' }));
  expect(screen.getByText('Los moldes están listos')).toBeInTheDocument();
  expect(playSound).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Ver los moldes' }));
  expect(window.location.hash).toBe('#/crear/molde');
});

test('foam page opens completed when the step is already done', () => {
  const session = makeSession({ id: 'foam-2', foamDone: true });
  renderWithFormix(<FoamPage />, { data: makeData([session]), currentSessionId: 'foam-2' });
  expect(screen.getByText('Los moldes están listos')).toBeInTheDocument();
});

test('shape page shows visible shapes, proposed labels, and selection state', async () => {
  const user = userEvent.setup();
  const session = makeSession({ id: 'shape-1', foamDone: true });
  const data = {
    ...makeData([session]),
    catalogOverrides: { 'shape-rosa': 'inactive' as const },
  };
  renderWithFormix(<ShapePage />, { data, currentSessionId: 'shape-1' });

  expect(screen.getByText('Elige tu molde')).toBeInTheDocument();
  expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
  expect(screen.queryByText('Rosa')).not.toBeInTheDocument();
  expect(screen.getAllByText('Concepto').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

  const patita = screen.getByRole('button', { name: /Patita/ });
  await user.click(patita);
  expect(patita).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(window.location.hash).toBe('#/crear/color');
});
