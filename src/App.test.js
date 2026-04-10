import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div style={{ width: 800, height: 240 }}>{children}</div>,
  };
});

test('renders qeeshu ruisi shell', () => {
  render(<App />);
  expect(screen.getByText('QEESHU RUISI')).toBeInTheDocument();
});
