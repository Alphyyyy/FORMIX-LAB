import { render, screen } from '@testing-library/react';
import { Mascot } from './Mascot';
import { Soap } from './Soap';

test('Soap renders an accessible label from the catalog names', () => {
  render(<Soap shapeId="shape-patita" colorId="color-rosa" />);
  expect(screen.getByRole('img', { name: 'Jabón con molde Patita en color Rosa' })).toBeInTheDocument();
});

test('Soap changes its label with shape and color', () => {
  const { rerender } = render(<Soap shapeId="shape-corazon" colorId="color-malva" />);
  expect(screen.getByRole('img', { name: 'Jabón con molde Corazón en color Malva' })).toBeInTheDocument();
  rerender(<Soap shapeId="shape-esfera" colorId="color-azul" />);
  expect(screen.getByRole('img', { name: 'Jabón con molde Esfera en color Azul' })).toBeInTheDocument();
});

test('Soap falls back to a neutral tone for unknown colors', () => {
  render(<Soap shapeId="shape-luna" colorId="color-inexistente" />);
  expect(screen.getByRole('img', { name: /Jabón con molde Luna/ })).toBeInTheDocument();
});

test('Mascot renders every mood with its accessible name', () => {
  const { rerender } = render(<Mascot mood="hello" />);
  expect(
    screen.getByRole('img', { name: 'Burbuja, la mascota de FORMIX LAB' }),
  ).toBeInTheDocument();
  for (const mood of ['wink', 'celebrate', 'think'] as const) {
    rerender(<Mascot mood={mood} />);
    expect(
      screen.getByRole('img', { name: 'Burbuja, la mascota de FORMIX LAB' }),
    ).toBeInTheDocument();
  }
});
