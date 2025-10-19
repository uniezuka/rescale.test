import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Reset localStorage mock
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.localStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const toggleButton = screen.getByRole('button', { name: /switch to dark mode/i });
    
    act(() => {
      toggleButton.click();
    });
    
    // Check if localStorage.setItem was called with 'dark'
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    
    // Check if button text changes
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('loads saved theme from localStorage', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
    
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    // Should show dark mode toggle
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('applies dark mode classes to document', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to dark mode/i });
    
    act(() => {
      toggleButton.click();
    });
    
    // Check if document has dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects system preference when no saved theme', () => {
    // Mock system preference for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    // Should show dark mode toggle based on system preference
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button');
    
    expect(toggleButton).toHaveAttribute('aria-label');
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringMatching(/switch to (light|dark) mode/i));
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ThemeToggle className="custom-class" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveClass('custom-class');
  });
});
