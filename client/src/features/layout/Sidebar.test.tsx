import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Sidebar', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders logo text', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Jigger.ai')).toBeInTheDocument();
  });

  it('renders nav items', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Bar')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });

  it('renders profile link', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('has collapse toggle button', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('collapses on toggle click', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    expect(screen.queryByText('Jigger.ai')).not.toBeInTheDocument();
  });

  it('expands back on double toggle', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    await user.click(screen.getByLabelText('Expand sidebar'));
    expect(screen.getByText('Jigger.ai')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('renders add buttons for My Bar and Recipes', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByLabelText('Add item to bar')).toBeInTheDocument();
    expect(screen.getByLabelText('Add recipe')).toBeInTheDocument();
  });

  it('clicking Add item to bar navigates to /my-bar/add', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Add item to bar'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar/add');
  });

  it('clicking Add recipe navigates to /recipes/add', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Add recipe'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/add');
  });

  it('clicking Log out navigates to /', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByText('Log out'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('collapsed state hides nav labels', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('My Bar')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipes')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('collapsed state still has add buttons', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    expect(screen.getByLabelText('Add item to bar')).toBeInTheDocument();
    expect(screen.getByLabelText('Add recipe')).toBeInTheDocument();
  });

  it('renders logo image', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByAltText('Jigger AI logo')).toBeInTheDocument();
  });

  it('collapsed nav links are still clickable for navigation', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/"]}><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    // In collapsed mode, nav links still exist with icons; click one
    const navLinks = screen.getAllByRole('link');
    // Find the My Bar link — has /my-bar href
    const myBarLink = navLinks.find((l) => l.getAttribute('href') === '/my-bar');
    expect(myBarLink).toBeTruthy();
  });

  it('collapsed profile link renders', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    // Profile link exists as collapsed icon-only link
    const profileLink = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/profile');
    expect(profileLink).toBeTruthy();
  });

  it('collapsed logout button works', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    // In collapsed state, the logout button is icon-only
    const buttons = screen.getAllByRole('button');
    // Find the LogOut button (it's in the bottom section)
    const logoutBtn = buttons.find((b) => b.querySelector('.lucide-log-out'));
    expect(logoutBtn).toBeTruthy();
    await user.click(logoutBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('collapsed profile link is active when on /profile route', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/profile"]}><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    // Profile NavLink should have active styling
    const profileLink = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/profile');
    expect(profileLink).toBeTruthy();
    expect(profileLink!.className).toContain('bg-sidebar-accent');
  });

  it('collapsed add button navigates for My Bar', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    await user.click(screen.getByLabelText('Add item to bar'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar/add');
  });

  it('collapsed add button navigates for Recipes', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    await user.click(screen.getByLabelText('Add recipe'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/add');
  });

  it('collapsed Home NavLink has active styling at / route', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/"]}><Sidebar /></MemoryRouter>);
    await user.click(screen.getByLabelText('Collapse sidebar'));
    // Find nav links inside <nav> element — the Home link should be active
    const nav = document.querySelector('nav')!;
    const navLinks = Array.from(nav.querySelectorAll('a'));
    const homeLink = navLinks.find((l) => l.getAttribute('href') === '/');
    expect(homeLink).toBeTruthy();
    expect(homeLink!.className).toContain('bg-sidebar-accent');
  });
});
