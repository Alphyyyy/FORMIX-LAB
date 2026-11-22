import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeData, makeSession, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import { ColorPage } from './ColorPage';
import { ScentPage } from './ScentPage';

test('color page previews the selected shape and requires a color', async () => {
  const user = userEvent.setup();
  const session = makeSession({
    id: 'color-1',
    foamDone: true,
    preferences: prefs({ shapeId: 'shape-patita', colorId: '', scentId: '' }),
  });
  const data = { ...makeData([session]), catalogOverrides: { 'color-azul': 'inactive' as const } };
  renderWithFormix(<ColorPage />, { data, currentSessionId: 'color-1' });

  expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Jabón con molde Patita/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Azul' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: 'Malva' }));
  expect(screen.getByRole('button', { name: 'Malva' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: /color Malva/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(window.location.hash).toBe('#/crear/aroma');
});

test('scent page shows proposed labels, safety note and single selection', async () => {
  const user = userEvent.setup();
  const session = makeSession({
    id: 'scent-1',
    foamDone: true,
    preferences: prefs({ shapeId: 'shape-patita', colorId: 'color-rosa', scentId: '' }),
  });
  const data = { ...makeData([session]), catalogOverrides: { 'scent-coco': 'inactive' as const } };
  renderWithFormix(<ScentPage />, { data, currentSessionId: 'scent-1' });

  expect(screen.getByText('Paso 4 de 5')).toBeInTheDocument();
  expect(screen.queryByText('Coco')).not.toBeInTheDocument();
  expect(screen.getAllByText('Concepto')).toHaveLength(2);
  expect(
    screen.getByText('No ingerir. Si tienes sensibilidad a las fragancias, participa con precaución.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: /Fresa/ }));
  expect(screen.getByRole('button', { name: /Fresa/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(window.location.hash).toBe('#/crear/creacion');
});
