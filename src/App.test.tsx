import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Visual Automata Studio - Route Integration Tests', () => {
  it('renders Dashboard at "/"', () => {
    window.history.pushState({}, 'Dashboard', '/');
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(screen.getAllByText(/Visual Automata/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Continue Learning/i)).toBeDefined();
    expect(screen.getByText(/Syllabus Units/i)).toBeDefined();
  });

  it('renders Playground at "/playground"', () => {
    window.history.pushState({}, 'Playground', '/playground');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^Playground$/i })).toBeDefined();
    expect(screen.getByText(/Design, simulate, and explore finite automata/i)).toBeDefined();
  });

  it('renders Learn syllabus at "/learn"', () => {
    window.history.pushState({}, 'Learn', '/learn');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^Learn$/i })).toBeDefined();
    expect(screen.getByText(/Work through the complete Automata Theory syllabus/i)).toBeDefined();
  });

  it('renders Unit overview at "/learn/finite-automata"', () => {
    window.history.pushState({}, 'Unit', '/learn/finite-automata');
    render(<App />);
    expect(screen.getByRole('heading', { name: /Finite Automata/i })).toBeDefined();
    expect(screen.getByText(/Deterministic Finite Automata/i)).toBeDefined();
  });

  it('renders Lesson page at "/learn/finite-automata/fa-02-dfa"', () => {
    window.history.pushState({}, 'Lesson', '/learn/finite-automata/fa-02-dfa');
    render(<App />);
    expect(screen.getByText(/Deterministic Finite Automata/i)).toBeDefined();
    expect(screen.getByText(/Formal Definition/i)).toBeDefined();
  });

  it('renders Challenges at "/challenges"', () => {
    window.history.pushState({}, 'Challenges', '/challenges');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^Challenges$/i })).toBeDefined();
    expect(screen.getByText(/Build a DFA for Strings Ending in "01"/i)).toBeDefined();
  });

  it('renders My Projects at "/projects"', () => {
    window.history.pushState({}, 'Projects', '/projects');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^My Projects$/i })).toBeDefined();
    expect(screen.getByText(/Even Binary Numbers/i)).toBeDefined();
  });

  it('renders About page at "/about"', () => {
    window.history.pushState({}, 'About', '/about');
    render(<App />);
    expect(screen.getByText(/About Visual Automata Studio/i)).toBeDefined();
    expect(screen.getByText(/VIT Pune Syllabus Alignment/i)).toBeDefined();
  });

  it('renders 404 NotFoundPage for unknown routes', () => {
    window.history.pushState({}, '404', '/unknown-route-that-does-not-exist');
    render(<App />);
    expect(screen.getByText(/Non-Accepting State Reached/i)).toBeDefined();
    expect(screen.getByText(/q_dead/i)).toBeDefined();
  });
});
