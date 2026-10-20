import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { createUser, createSession } from './lib/localDb';

/**
 * Route integration tests.
 *
 * All app routes are now protected. We seed localStorage with a valid user
 * + session before each test so the ProtectedRoute passes and the page renders.
 */

function seedAuthSession() {
  // Register a test user and create an active session.
  // createUser is idempotent per-test because localStorage is fresh each run
  // (jsdom resets between test files; within this file we rely on beforeEach).
  const user = createUser('test@vas.dev', 'Test User', 'hash:test');
  createSession(user.id);
}

describe('Visual Automata Studio - Route Integration Tests', () => {
  beforeEach(() => {
    // Clear any leftover auth state between tests in this file
    localStorage.clear();
    seedAuthSession();
  });

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

  it('renders Transformation Studio at "/transform"', () => {
    window.history.pushState({}, 'Transform', '/transform');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^Automata Transformation Studio$/i })).toBeDefined();
    expect(screen.getByText(/Subset Construction Table/i)).toBeDefined();
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
    expect(screen.getAllByText(/Deterministic Finite Automata/i).length).toBeGreaterThan(0);
  });

  it('renders Lesson page at "/learn/finite-automata/fa-02-dfa"', () => {
    window.history.pushState({}, 'Lesson', '/learn/finite-automata/fa-02-dfa');
    render(<App />);
    expect(screen.getAllByText(/Deterministic Finite Automata/i).length).toBeGreaterThan(0);
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

  it('redirects unauthenticated users to /login', () => {
    // Clear the session so the user is logged out
    localStorage.clear();
    window.history.pushState({}, 'Dashboard', '/');
    render(<App />);
    // Should see the login page, not the dashboard
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeDefined();
    expect(screen.queryByText(/Continue Learning/i)).toBeNull();
  });
});
