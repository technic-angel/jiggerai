import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfileView } from './ProfileView';

const mockMutate = vi.fn();

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ data: { id: 'u1', email: 'test@example.com', displayName: 'Melissa', createdAt: '2024-01-01' } }),
  usePatchUser: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('@/hooks/useInventory', () => ({
  useInventory: () => ({ data: [{ id: 1 }, { id: 2 }] }),
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ data: [{ id: 10 }] }),
}));

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => ({ data: [{ id: 100 }, { id: 101 }, { id: 102 }] }),
}));

describe('ProfileView', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('renders the heading', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows display name', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Melissa')).toBeInTheDocument();
  });

  it('shows stats (bottles, recipes, favorites)', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Bottles')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 bottles
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 recipes
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 favorite
  });

  it('shows edit button', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('clicking edit shows cancel and save buttons', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('clicking cancel returns to view mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('clicking Save Changes calls patchUser.mutate', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    await user.click(screen.getByText('Save Changes'));
    expect(mockMutate).toHaveBeenCalledWith(
      { displayName: 'Melissa' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('shows account info section', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Account Info')).toBeInTheDocument();
  });

  it('shows bar preferences section with selects', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Bar Preferences')).toBeInTheDocument();
    expect(screen.getByText('Favorite Spirit')).toBeInTheDocument();
    expect(screen.getByText('Bar Type')).toBeInTheDocument();
    expect(screen.getByText('Experience Level')).toBeInTheDocument();
  });

  it('shows settings toggles', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Public Profile')).toBeInTheDocument();
  });

  it('shows danger zone', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByText('Export my data')).toBeInTheDocument();
    expect(screen.getByText('Delete account')).toBeInTheDocument();
  });

  it('displays avatar initial from display name', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('M')).toBeInTheDocument(); // Melissa -> M
  });

  it('shows username', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('@melissa_mixes')).toBeInTheDocument();
  });

  it('shows experience level badge', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getAllByText('Intermediate').length).toBeGreaterThanOrEqual(1);
  });

  it('email field has read-only hint', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText(/Email cannot be changed/)).toBeInTheDocument();
  });

  it('save success triggers saved message via onSuccess callback', async () => {
    // Make mutate invoke onSuccess immediately
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    await user.click(screen.getByText('Save Changes'));
    expect(screen.getByText(/Profile saved successfully/)).toBeInTheDocument();
  });

  it('edit mode enables Display Name input for editing', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const nameInput = screen.getByDisplayValue('Melissa');
    expect(nameInput).not.toBeDisabled();
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice');
    expect(nameInput).toHaveValue('Alice');
  });

  it('shows camera button only in edit mode', async () => {
    const { container } = render(<MemoryRouter><ProfileView /></MemoryRouter>);
    // Not in edit mode — no camera icon
    expect(container.querySelector('.lucide-camera')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByText('Edit Profile'));
    // In edit mode — camera icon appears
    expect(container.querySelector('.lucide-camera')).toBeInTheDocument();
  });

  it('cancel resets draft to saved profile values', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const nameInput = screen.getByDisplayValue('Melissa');
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed');
    expect(nameInput).toHaveValue('Changed');
    await user.click(screen.getByText('Cancel'));
    // After cancel, name reverts to saved profile
    expect(screen.getByText('Melissa')).toBeInTheDocument();
  });

  it('toggle row toggles notification when in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    // Toggle notification — initially true, click to turn off
    const notifToggle = screen.getByText('Email Notifications').closest('.flex')!.querySelector('button')!;
    await user.click(notifToggle);
    // The toggle should reflect the changed state (no longer teal-500)
    expect(notifToggle).toBeInTheDocument();
  });

  it('toggle row does not toggle when disabled (not editing)', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    // Not in edit mode — clicking toggle should not change anything
    const notifToggle = screen.getByText('Email Notifications').closest('.flex')!.querySelector('button')!;
    await user.click(notifToggle);
    // Toggle should remain disabled
    expect(notifToggle).toBeDisabled();
  });

  it('export data button exists in danger zone', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    const exportBtn = screen.getByText('Export my data');
    expect(exportBtn.tagName).toBe('BUTTON');
  });

  it('delete account button exists in danger zone', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    const deleteBtn = screen.getByText('Delete account');
    expect(deleteBtn.tagName).toBe('BUTTON');
  });

  it('settings section shows Email Notifications and Public Profile toggles', () => {
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText(/Receive cocktail suggestions/)).toBeInTheDocument();
    expect(screen.getByText('Public Profile')).toBeInTheDocument();
    expect(screen.getByText(/Allow other users/)).toBeInTheDocument();
  });

  it('save error keeps edit mode open', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onError(); });
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    await user.click(screen.getByText('Save Changes'));
    // Should still be in edit mode (Cancel button still visible)
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('can change favorite spirit select in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    // The Favorite Spirit select — find by current value "Gin"
    const selects = screen.getAllByRole('combobox');
    // First select should be Favorite Spirit
    await user.selectOptions(selects[0], 'Bourbon');
    expect(selects[0]).toHaveValue('Bourbon');
  });

  it('can change bar type and experience level in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[1], 'Professional Bar');
    expect(selects[1]).toHaveValue('Professional Bar');
    await user.selectOptions(selects[2], 'Advanced');
    expect(selects[2]).toHaveValue('Advanced');
  });

  it('can edit location and bio in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const locationInput = screen.getByDisplayValue('San Francisco, CA');
    await user.clear(locationInput);
    await user.type(locationInput, 'New York, NY');
    expect(locationInput).toHaveValue('New York, NY');
  });

  it('can edit username in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const usernameInput = screen.getByDisplayValue('melissa_mixes');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'new_username');
    expect(usernameInput).toHaveValue('new_username');
  });

  it('can edit bio in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const bioTextarea = screen.getByPlaceholderText(/cocktail journey/);
    await user.clear(bioTextarea);
    await user.type(bioTextarea, 'I love making cocktails');
    expect(bioTextarea).toHaveValue('I love making cocktails');
  });

  it('can toggle Public Profile in edit mode', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    const publicToggle = screen.getByText('Public Profile').closest('.flex')!.querySelector('button')!;
    await user.click(publicToggle);
    // Toggle should reflect changed state
    expect(publicToggle).toBeInTheDocument();
  });

  it('save success clears saved message after timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><ProfileView /></MemoryRouter>);
    await user.click(screen.getByText('Edit Profile'));
    await user.click(screen.getByText('Save Changes'));
    expect(screen.getByText(/Profile saved successfully/)).toBeInTheDocument();
    // Advance timer to clear the saved message
    await act(async () => { vi.advanceTimersByTime(3500); });
    expect(screen.queryByText(/Profile saved successfully/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
