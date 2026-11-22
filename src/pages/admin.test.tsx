import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { createSeedData } from '../data/seed';
import { completedSession, makeData, prefs } from '../test/fixtures';
import { renderWithFormix } from '../test/render';
import type { StaffSession } from '../domain/types';
import { AdminPage } from './AdminPage';
import { downloadCsv } from '../lib/download';

vi.mock('../lib/download', () => ({ downloadCsv: vi.fn() }));

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
const mixedData = makeData([...seedData.sessions, real]);

test('admin requires an admin session', async () => {
  window.location.hash = '#/admin';
  render(<App />);
  await waitFor(() => expect(window.location.hash).toBe('#/equipo'));
});

test('summary shows KPIs, preference sections and the methodological note', () => {
  window.location.hash = '#/admin';
  renderWithFormix(<AdminPage />, { data: seedData, staff: admin });

  const started = screen.getByText('Sesiones iniciadas').closest('.kpi');
  expect(started).not.toBeNull();
  expect(within(started as HTMLElement).getByText('18')).toBeInTheDocument();
  const completed = screen.getByText('Completadas').closest('.kpi');
  expect(within(completed as HTMLElement).getByText('14')).toBeInTheDocument();
  expect(screen.getByText('Moldes')).toBeInTheDocument();
  expect(screen.getByText('Colores')).toBeInTheDocument();
  expect(screen.getByText('Aromas')).toBeInTheDocument();
  expect(screen.getByText('Combinaciones más elegidas')).toBeInTheDocument();
  expect(screen.getByText(/Muestra por conveniencia de la feria/)).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: 'Incluir datos de ejemplo' }),
  ).toBeChecked();
});

test('unchecking demo changes the summary to real-only data', async () => {
  const user = userEvent.setup();
  window.location.hash = '#/admin';
  renderWithFormix(<AdminPage />, { data: seedData, staff: admin });
  await user.click(screen.getByRole('checkbox', { name: 'Incluir datos de ejemplo' }));
  const started = screen.getByText('Sesiones iniciadas').closest('.kpi');
  expect(within(started as HTMLElement).getByText('0')).toBeInTheDocument();
});

test('sessions table filters by code and shows origin', async () => {
  const user = userEvent.setup();
  window.location.hash = '#/admin/sesiones';
  renderWithFormix(<AdminPage />, { data: mixedData, staff: admin });
  await user.click(screen.getByRole('checkbox', { name: 'Incluir datos de ejemplo' }));
  expect(screen.getByText('FX-R3ALM2')).toBeInTheDocument();
  expect(screen.getByText('FX-K7M2Q9')).toBeInTheDocument();
  expect(screen.getByText('Real')).toBeInTheDocument();
  expect(screen.getAllByText('Demo').length).toBeGreaterThan(0);

  await user.type(screen.getByLabelText('Buscar por código'), 'R3AL');
  expect(screen.getByText('FX-R3ALM2')).toBeInTheDocument();
  expect(screen.queryByText('FX-K7M2Q9')).not.toBeInTheDocument();
});

test('export panel downloads real and demo CSVs with the expected names', async () => {
  const user = userEvent.setup();
  window.location.hash = '#/admin/sesiones';
  vi.mocked(downloadCsv).mockClear();
  renderWithFormix(<AdminPage />, { data: mixedData, staff: admin });

  expect(screen.getByRole('button', { name: 'Sesiones CSV' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Preferencias CSV' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Juegos CSV' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Premios CSV' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Sesiones CSV' }));
  expect(downloadCsv).toHaveBeenCalledWith(expect.stringMatching(/^formix-sesiones-\d{4}-\d{2}-\d{2}\.csv$/), expect.any(String));

  await user.click(screen.getByRole('checkbox', { name: 'Incluir demo en el archivo' }));
  await user.click(screen.getByRole('button', { name: 'Preferencias CSV' }));
  expect(downloadCsv).toHaveBeenCalledWith(expect.stringMatching(/-demo\.csv$/), expect.any(String));
});
