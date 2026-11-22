import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the FORMIX LAB brand', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /formix lab/i })).toBeInTheDocument();
});
