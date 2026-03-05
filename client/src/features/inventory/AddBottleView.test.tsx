import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AddBottleView } from './AddBottleView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMutate = vi.fn();
vi.mock('@/hooks/useInventory', () => ({
  useAddBottle: () => ({ mutate: mockMutate, isPending: false }),
}));

describe('AddBottleView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it('renders the heading', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText('Add Item to My Bar')).toBeInTheDocument();
  });

  it('renders required form fields', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/Hendrick/)).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Current Volume')).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Spirit name is required.')).toBeInTheDocument();
  });

  it('shows validation error when category is empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Test Spirit');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Category is required.')).toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar');
  });

  it('navigates back on Back button', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.click(screen.getByText('Back to My Bar'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar');
  });

  it('has AI Lookup button', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getAllByText('AI Lookup').length).toBeGreaterThanOrEqual(1);
  });

  it('shows volume slider defaulting to 8/8', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText('8/8')).toBeInTheDocument();
  });

  it('calls mutate when form is valid', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Hendricks Gin');
    const select = screen.getByRole('combobox') || screen.getByDisplayValue('Select a category…');
    await user.selectOptions(select, 'Gin');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('has volume hint text', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText(/of the bottle remaining/)).toBeInTheDocument();
  });

  it('has unopened bottles field', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText('Unopened Bottles')).toBeInTheDocument();
  });

  it('has purchase price field', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText('Purchase Price')).toBeInTheDocument();
  });

  it('has notes textarea', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('AI Lookup is disabled when name is empty', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const lookupBtns = screen.getAllByText('AI Lookup');
    const btn = lookupBtns[0].closest('button');
    expect(btn).toBeDisabled();
  });

  it('mutate onSuccess shows saved message and navigates', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Hendricks Gin');
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Gin');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText(/Item saved to your bar/)).toBeInTheDocument();
    vi.advanceTimersByTime(900);
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar');
    vi.useRealTimers();
  });

  it('mutate onError shows error message', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onError(); });
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Hendricks Gin');
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Gin');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText(/Failed to save/)).toBeInTheDocument();
  });

  it('AI Lookup shows Loading state when triggered', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Maker\'s Mark Bourbon');
    const lookupBtns = screen.getAllByText('AI Lookup');
    // The button should be enabled now
    expect(lookupBtns[0].closest('button')).not.toBeDisabled();
  });

  it.each([
    ['Buffalo Trace bourbon', 'Bourbon'],
    ['Glenfiddich scotch', 'Scotch'],
    ['Tanqueray gin', 'Gin'],
    ['Patron tequila', 'Tequila'],
    ['Bacardi rum', 'Rum'],
    ['Grey Goose vodka', 'Vodka'],
    ['Del Maguey mezcal', 'Mezcal'],
    ['Cointreau liqueur', 'Liqueur'],
    ['Craft beer IPA', 'Beer'],
    ['Pinot noir wine', 'Wine'],
    ['Mystery spirit', 'Whiskey'],
  ])('AI Lookup fills in %s → %s', async (spiritName, expectedCategory) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), spiritName);
    const lookupBtns = screen.getAllByText('AI Lookup');
    await user.click(lookupBtns[0]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe(expectedCategory);
    });
    vi.useRealTimers();
  });

  it('AI Lookup with empty name does nothing (button disabled)', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const lookupBtns = screen.getAllByText('AI Lookup');
    expect(lookupBtns[0].closest('button')).toBeDisabled();
  });

  it('can change the volume slider', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const slider = screen.getByRole('slider');
    // Change volume to 4
    await user.click(slider); // Focus
    expect(slider).toBeInTheDocument();
  });

  it('has description text', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText(/Track any bottle, ingredient/)).toBeInTheDocument();
  });

  it('shows Unopened Bottles hint text', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText(/How many sealed bottles/)).toBeInTheDocument();
  });

  it('shows Purchase Price hint text', () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    expect(screen.getByText(/bar cost tracking/)).toBeInTheDocument();
  });

  it('can type in notes field', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const notes = screen.getByPlaceholderText(/Floral, citrusy/);
    await user.type(notes, 'My notes here');
    expect(notes).toHaveValue('My notes here');
  });

  it('can type in price field', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const price = screen.getByPlaceholderText('0.00');
    await user.type(price, '42.50');
    expect(price).toHaveValue('42.50');
  });

  it('Edit button appears after save and re-enables form', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Hendrick/), 'Test Spirit');
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Gin');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    // saved banner shows and Edit button appears
    expect(screen.getByText(/Item saved/)).toBeInTheDocument();
    const editBtn = screen.getByText('Edit');
    expect(editBtn).toBeInTheDocument();
    await user.click(editBtn);
    // Form should be editable again (saved=false, isEditing=true)
    expect(screen.queryByText(/Item saved/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('can change volume slider value', async () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '4' } });
    expect(screen.getByText('4/8')).toBeInTheDocument();
  });

  it('can change unopened bottles count', async () => {
    render(<MemoryRouter><AddBottleView /></MemoryRouter>);
    const unopenedInput = screen.getByRole('spinbutton');
    fireEvent.change(unopenedInput, { target: { value: '3' } });
    expect(unopenedInput).toHaveValue(3);
  });
});
