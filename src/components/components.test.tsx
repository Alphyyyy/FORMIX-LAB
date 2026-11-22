import { render, screen } from '@testing-library/react';
import { Brand } from './Brand';
import { BubbleField } from './BubbleField';
import { Button } from './Button';
import { Progress } from './Progress';
import { StatusChip } from './StatusChip';

test('Brand is a link with the accessible business name', () => {
  render(<Brand />);
  expect(screen.getByRole('link', { name: 'FORMIX LAB' })).toHaveAttribute('href', '#/');
});

test('Button renders its label, variant and disabled state', () => {
  render(
    <Button variant="secondary" disabled>
      Guardar
    </Button>,
  );
  const button = screen.getByRole('button', { name: 'Guardar' });
  expect(button).toBeDisabled();
  expect(button).toHaveClass('btn', 'btn--secondary');
});

test('Progress exposes the current step visually and accessibly', () => {
  render(<Progress step={2} />);
  expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
});

test('StatusChip labels each catalog status', () => {
  const { rerender } = render(<StatusChip status="available" />);
  expect(screen.getByText('Disponible')).toBeInTheDocument();
  rerender(<StatusChip status="proposed" />);
  expect(screen.getByText('Concepto')).toBeInTheDocument();
  rerender(<StatusChip status="inactive" />);
  expect(screen.getByText('Inactivo')).toBeInTheDocument();
});

test('BubbleField is decorative and populated', () => {
  const { container } = render(<BubbleField />);
  const field = container.querySelector('.bubble-field');
  expect(field).toHaveAttribute('aria-hidden', 'true');
  expect(container.querySelectorAll('.bubble').length).toBeGreaterThanOrEqual(8);
});
