import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { makeData, makeSession } from './test/fixtures';
import { saveCurrentSessionId, saveData } from './state/storage';

test('renders the FORMIX LAB brand', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'FORMIX LAB' })).toBeInTheDocument();
});

test('resumes a partially filled session from a deep link', async () => {
  const session = makeSession({ id: 'partial', foamDone: true });
  saveData(makeData([session]));
  saveCurrentSessionId('partial');
  window.location.hash = '#/crear/color';

  render(<App />);

  await waitFor(() => expect(window.location.hash).toBe('#/crear/molde'));
});
