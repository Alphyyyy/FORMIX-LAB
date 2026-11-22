import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, makeData, makeSession } from '../test/fixtures';
import type { AppData } from '../domain/types';
import { FormixProvider, useFormix } from './FormixProvider';
import { STORAGE_KEYS, saveData } from './storage';

function Probe() {
  const formix = useFormix();
  return (
    <div>
      <span data-testid="current">{formix.currentSession?.id ?? 'none'}</span>
      <span data-testid="count">{formix.data.sessions.length}</span>
      <span data-testid="pref">{formix.currentSession?.preferences?.shapeId ?? ''}</span>
      <span data-testid="code">{formix.currentSession?.code ?? ''}</span>
      <span data-testid="reward">{formix.currentSession?.reward?.type ?? ''}</span>
      <span data-testid="redeemed">{formix.currentSession?.reward?.redeemedAt ?? ''}</span>
      <span data-testid="staff">{formix.staff?.initials ?? ''}</span>
      <button onClick={() => formix.startNewSession()}>start</button>
      <button onClick={() => formix.setPreference({ shapeId: 'shape-patita' })}>shape</button>
      <button onClick={() => formix.setPreference({ colorId: 'color-rosa' })}>color</button>
      <button onClick={() => formix.setPreference({ scentId: 'scent-fresa' })}>scent</button>
      <button onClick={() => formix.completeCreation()}>complete</button>
      <button onClick={() => formix.validateGame(formix.currentSession?.code ?? '', 'bacteria', 'WIN', 'am')}>
        validate
      </button>
      <button onClick={() => formix.redeemReward(formix.currentSession?.code ?? '', 'am')}>redeem</button>
      <button onClick={() => formix.login('operator', '2468', 'am')}>login-op</button>
      <button onClick={() => formix.login('operator', '0000', 'am')}>bad-pin</button>
      <button onClick={() => formix.login('admin', '1357', '')}>login-admin</button>
      <button onClick={() => formix.prepareFair()}>prepare</button>
      <button onClick={() => formix.resetDemo()}>reset</button>
      <button onClick={() => formix.clearSessions()}>clear</button>
    </div>
  );
}

function renderProvider(data: AppData, currentSessionId: string | null = null) {
  return render(
    <FormixProvider initialData={data} initialCurrentSessionId={currentSessionId}>
      <Probe />
    </FormixProvider>,
  );
}

test('starts a session and persists its id', async () => {
  const user = userEvent.setup();
  renderProvider(makeData([]));
  await user.click(screen.getByRole('button', { name: 'start' }));
  expect(screen.getByTestId('current')).not.toHaveTextContent('none');
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  expect(localStorage.getItem(STORAGE_KEYS.currentSession)).toBeTruthy();
});

test('updates preferences and completes a creation', async () => {
  const user = userEvent.setup();
  renderProvider(makeData([]));
  await user.click(screen.getByRole('button', { name: 'start' }));
  await user.click(screen.getByRole('button', { name: 'shape' }));
  await user.click(screen.getByRole('button', { name: 'color' }));
  await user.click(screen.getByRole('button', { name: 'scent' }));
  expect(screen.getByTestId('pref')).toHaveTextContent('shape-patita');
  await user.click(screen.getByRole('button', { name: 'complete' }));
  expect(screen.getByTestId('code')).toHaveTextContent(/^FX-/);
});

test('validates a game, redeems once, and rejects a second redemption', async () => {
  const user = userEvent.setup();
  const session = completedSession({ id: 'real-1', code: 'FX-ABC234' });
  renderProvider(makeData([session]), 'real-1');
  await user.click(screen.getByRole('button', { name: 'validate' }));
  expect(screen.getByTestId('reward')).toHaveTextContent('photo');
  await user.click(screen.getByRole('button', { name: 'redeem' }));
  const redeemedAt = screen.getByTestId('redeemed').textContent;
  expect(redeemedAt).not.toBe('');
  await user.click(screen.getByRole('button', { name: 'redeem' }));
  expect(screen.getByTestId('redeemed')).toHaveTextContent(redeemedAt!);
});

test('logs in with the correct roles and rejects a wrong pin', async () => {
  const user = userEvent.setup();
  renderProvider(makeData([]));
  await user.click(screen.getByRole('button', { name: 'login-op' }));
  expect(screen.getByTestId('staff')).toHaveTextContent('AM');
  await user.click(screen.getByRole('button', { name: 'bad-pin' }));
  expect(screen.getByTestId('staff')).toHaveTextContent('AM');
  await user.click(screen.getByRole('button', { name: 'login-admin' }));
  expect(screen.getByTestId('staff')).toHaveTextContent('Operador');
});

test('prepares the fair, resets the demo and clears sessions', async () => {
  const user = userEvent.setup();
  renderProvider(
    makeData([
      makeSession({ id: 'seed-1', isSeed: true }),
      makeSession({ id: 'real-1' }),
    ]),
  );
  await user.click(screen.getByRole('button', { name: 'prepare' }));
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  await user.click(screen.getByRole('button', { name: 'reset' }));
  expect(screen.getByTestId('count')).toHaveTextContent('19');
  await user.click(screen.getByRole('button', { name: 'clear' }));
  expect(screen.getByTestId('count')).toHaveTextContent('0');
});

test('refreshes when another tab writes data', async () => {
  renderProvider(makeData([]));
  const next = makeData([completedSession({ id: 'other', isSeed: true })]);
  saveData(next);
  window.dispatchEvent(
    new StorageEvent('storage', { key: STORAGE_KEYS.data, newValue: JSON.stringify(next) }),
  );
  await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
});
