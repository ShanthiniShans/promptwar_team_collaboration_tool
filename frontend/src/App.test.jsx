import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TaskCatalyst from './components/TaskCatalyst';

describe('TaskCatalyst Component', () => {
  it('renders the Generate AI Tasks button', () => {
    render(<TaskCatalyst />);
    
    // Check if the button is present using its aria-label
    const generateButton = screen.getByRole('button', { name: /Generate AI Tasks/i });
    expect(generateButton).toBeDefined();
    expect(generateButton.disabled).toBe(true); // Should be disabled initially when prompt is empty
  });
});
