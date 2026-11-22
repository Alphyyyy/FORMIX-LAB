import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminCatalog } from '../admin/AdminCatalog';
import { AdminShare } from '../admin/AdminShare';
import { FairPrep } from '../admin/FairPrep';
import { createSeedData } from '../data/seed';
import { visibleItems } from '../domain/catalog';
import { completedSession, makeData, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import type { StaffSession } from '../domain/types';
import { useFormix } from '../state/FormixProvider';
import { downloadText } from '../lib/download';

vi.mock('../lib/download', () => ({ downloadText: vi.fn(), downloadCsv: vi.fn() }));

const admin: StaffSession = {
  role: 'admin',
  initials: 'AM',
  loggedAt: '2026-11-22T10:00:00.000Z',
};

const seedData = createSeedData(new Date('2026-11-22T18:00:00.000Z'));
const real = completedSession({
  id: 'real-1',
  isSeed: false,
  code: 'FX-R3ALM2',
  preferences: prefs({ shapeId: 'shape-corazon', colorId: 'color-malva', scentId: 'scent-vainilla' }),
});

function ShapeCount() {
  const { catalog } = useFormix();
  return <span data-testid="shape-count">{visibleItems(catalog, 'shape').length}</span>;
}

function SessionProbe() {
  const { data } = useFormix();
  return (
    <span data-testid="session-probe">
      {data.sessions.length}:{data.sessions.filter((session) => session.isSeed).length}
    </span>
  );
}

test('catalog lists all items and updates status counts', async () => {
  const user = userEvent.setup();
  renderWithFormix(
    <>
      <AdminCatalog />
      <ShapeCount />
    </>,
    { data: makeData([]), staff: admin },
  );

  expect(screen.getByRole('heading', { name: 'Opciones del laboratorio' })).toBeInTheDocument();
  expect(screen.getByText('Moldes')).toBeInTheDocument();
  expect(screen.getByText('Colores')).toBeInTheDocument();
  expect(screen.getByText('Aromas')).toBeInTheDocument();
  expect(screen.getByText(/Los cambios afectan a las nuevas selecciones/)).toBeInTheDocument();
  expect(screen.getByTestId('shape-count')).toHaveTextContent('8');

  await user.selectOptions(screen.getByLabelText('Estado de Corazón'), 'inactive');
  expect(screen.getByTestId('shape-count')).toHaveTextContent('7');
  expect(screen.getByLabelText('Estado de Corazón')).toHaveValue('inactive');

  await user.selectOptions(screen.getByLabelText('Estado de Osito'), 'available');
  expect(screen.getByLabelText('Estado de Osito')).toHaveValue('available');
  expect(screen.getByTestId('shape-count')).toHaveTextContent('7');
});

test('share shows a QR, warns on localhost and copies the link', async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  vi.mocked(downloadText).mockClear();

  renderWithFormix(<AdminShare />, { data: makeData([]), staff: admin });
  expect(screen.getByText('Escanea para abrir FORMIX LAB')).toBeInTheDocument();
  expect(screen.getByTestId('qr-code').querySelector('svg')).toBeTruthy();
  expect(screen.getByText(/solo funcionará en este equipo/)).toBeInTheDocument();

  const url = `${window.location.origin}${window.location.pathname}`;
  await user.click(screen.getByRole('button', { name: 'Copiar enlace' }));
  expect(writeText).toHaveBeenCalledWith(url);

  await user.click(screen.getByRole('button', { name: 'Descargar QR' }));
  expect(downloadText).toHaveBeenCalledWith(
    'formix-lab-qr.svg',
    expect.stringContaining('<svg'),
    'image/svg+xml',
  );
});

test('fair preparation removes seeds, restores them and can clear everything', async () => {
  const user = userEvent.setup();
  renderWithFormix(
    <>
      <FairPrep />
      <SessionProbe />
    </>,
    { data: makeData([...seedData.sessions, real]), staff: admin },
  );

  await user.click(screen.getByRole('button', { name: 'Preparar feria' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Se quitarán las 18 sesiones de ejemplo');
  await user.click(screen.getByRole('button', { name: 'Quitar ejemplos' }));
  expect(screen.getByTestId('session-probe')).toHaveTextContent('1:0');

  await user.click(screen.getByRole('button', { name: 'Restablecer demo' }));
  await user.click(screen.getByRole('button', { name: 'Restablecer' }));
  expect(screen.getByTestId('session-probe')).toHaveTextContent('19:18');

  await user.click(screen.getByRole('button', { name: 'Borrar todas las sesiones' }));
  await user.type(screen.getByLabelText('Escribe BORRAR para confirmar'), 'BORRAR');
  await user.click(screen.getByRole('button', { name: 'Borrar todo' }));
  expect(screen.getByTestId('session-probe')).toHaveTextContent('0:0');
});
