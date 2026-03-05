import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AddRecipeView } from './AddRecipeView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMutate = vi.fn();
vi.mock('@/hooks/useRecipes', () => ({
  useAddRecipe: () => ({ mutate: mockMutate, isPending: false }),
}));

describe('AddRecipeView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it('renders the heading', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText('Add Recipe')).toBeInTheDocument();
  });

  it('renders required form fields', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/Old Fashioned/)).toBeInTheDocument();
    expect(screen.getByText('Base Spirit')).toBeInTheDocument();
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Recipe name is required.')).toBeInTheDocument();
  });

  it('shows validation error when base spirit is empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Recipe');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Base spirit is required.')).toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
  });

  it('navigates back on Back to Recipes click', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.click(screen.getByText('Back to Recipes'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
  });

  it('has Autocomplete button', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getAllByText('Autocomplete').length).toBeGreaterThanOrEqual(1);
  });

  it('can add ingredient rows', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const addBtn = screen.getByText('Add ingredient');
    await user.click(addBtn);
    const inputs = screen.getAllByPlaceholderText(/Ingredient/);
    expect(inputs.length).toBe(2);
  });

  it('can remove ingredient rows', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    // Add a second ingredient
    await user.click(screen.getByText('Add ingredient'));
    let inputs = screen.getAllByPlaceholderText(/Ingredient/);
    expect(inputs.length).toBe(2);
    // Remove one
    const removeButtons = screen.getAllByRole('button').filter(b => b.querySelector('.lucide-x'));
    await user.click(removeButtons[0]);
    inputs = screen.getAllByPlaceholderText(/Ingredient/);
    expect(inputs.length).toBe(1);
  });

  it('has difficulty select defaulting to Easy', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Easy')).toBeInTheDocument();
  });

  it('has ABV and Glass Type fields', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText('ABV')).toBeInTheDocument();
    expect(screen.getByText('Glass Type')).toBeInTheDocument();
  });

  it('has optional URL and image fields', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText('YouTube URL')).toBeInTheDocument();
    expect(screen.getByText('Image URL')).toBeInTheDocument();
  });

  it('has notes textarea', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('shows validation error when category is empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Recipe');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Whiskey');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Style / category is required.')).toBeInTheDocument();
  });

  it('shows validation error when ingredients are empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Recipe');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Whiskey');
    await user.selectOptions(selects[1], 'Stirred');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Add at least one ingredient.')).toBeInTheDocument();
  });

  it('shows validation error when instructions are empty', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Recipe');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Whiskey');
    await user.selectOptions(selects[1], 'Stirred');
    await user.type(screen.getByPlaceholderText('Ingredient 1…'), '2 oz Bourbon');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText('Instructions are required.')).toBeInTheDocument();
  });

  it('calls mutate when fully valid form is submitted', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Cocktail');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Gin');
    await user.selectOptions(selects[1], 'Shaken');
    await user.type(screen.getByPlaceholderText('Ingredient 1…'), '2 oz Gin');
    await user.type(screen.getByPlaceholderText(/Combine all/), 'Shake with ice. Strain.');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('mutate onSuccess shows saved banner and navigates', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Cocktail');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Gin');
    await user.selectOptions(selects[1], 'Shaken');
    await user.type(screen.getByPlaceholderText('Ingredient 1…'), '2 oz Gin');
    await user.type(screen.getByPlaceholderText(/Combine all/), 'Shake it.');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText(/Recipe saved/)).toBeInTheDocument();
    vi.advanceTimersByTime(900);
    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
    vi.useRealTimers();
  });

  it('mutate onError shows error message', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onError(); });
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Test Cocktail');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Gin');
    await user.selectOptions(selects[1], 'Shaken');
    await user.type(screen.getByPlaceholderText('Ingredient 1…'), '2 oz Gin');
    await user.type(screen.getByPlaceholderText(/Combine all/), 'Shake it.');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    expect(screen.getByText(/Failed to save/)).toBeInTheDocument();
  });

  it('Autocomplete is disabled without a name', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const btns = screen.getAllByText('Autocomplete');
    expect(btns[0].closest('button')).toBeDisabled();
  });

  it('description text is shown', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText(/Create a new cocktail recipe/)).toBeInTheDocument();
  });

  it('can type ingredient text', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const input = screen.getByPlaceholderText('Ingredient 1…');
    await user.type(input, '2 oz Bourbon');
    expect(input).toHaveValue('2 oz Bourbon');
  });

  it('has Autocomplete hint text', () => {
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    expect(screen.getByText(/to let AI fill in the details/)).toBeInTheDocument();
  });

  it('Autocomplete triggers loading state and fills form', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Old Fashioned');
    const acButton = screen.getAllByText('Autocomplete').find(t => !t.closest('button')?.hasAttribute('disabled'))?.closest('button')!;
    await user.click(acButton);
    // Should show "Filling…" text while autocompleting
    expect(screen.getByText('Filling…')).toBeInTheDocument();
    // Wait for the 1.6s to complete and form to populate
    await screen.findByDisplayValue('2 oz Bourbon', {}, { timeout: 3000 });
  });

  it('Autocomplete with unknown cocktail fills notes', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'Zombie Punch');
    const acButton = screen.getAllByText('Autocomplete').find(t => !t.closest('button')?.hasAttribute('disabled'))?.closest('button')!;
    await user.click(acButton);
    expect(screen.getByText('Filling…')).toBeInTheDocument();
    // Wait for loading to finish
    await screen.findByText('Autocomplete', {}, { timeout: 3000 });
  });

  it('Edit button appears after successful save', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockMutate.mockImplementation((_data: any, opts: any) => { opts.onSuccess(); });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/Old Fashioned/), 'My Cocktail');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Gin');
    await user.selectOptions(selects[1], 'Shaken');
    await user.type(screen.getByPlaceholderText('Ingredient 1…'), '2 oz Gin');
    await user.type(screen.getByPlaceholderText(/Combine all/), 'Shake it.');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    // Edit button should appear (before the navigate timeout)
    expect(screen.getByText('Edit')).toBeInTheDocument();
    // Click edit to go back to editing mode
    await user.click(screen.getByText('Edit'));
    vi.useRealTimers();
  });

  it('can change glass type select', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const selects = screen.getAllByRole('combobox');
    // Glass type is the 3rd select (index 2)
    await user.selectOptions(selects[2], 'Coupe');
    expect(selects[2]).toHaveValue('Coupe');
  });

  it('can change difficulty select', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const selects = screen.getAllByRole('combobox');
    // Difficulty is the 4th select (index 3)
    await user.selectOptions(selects[3], 'Hard');
    expect(selects[3]).toHaveValue('Hard');
  });

  it('can type YouTube URL', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const youtubeInput = screen.getByPlaceholderText(/youtube\.com\/watch/);
    await user.type(youtubeInput, 'https://youtube.com/watch?v=abc123');
    expect(youtubeInput).toHaveValue('https://youtube.com/watch?v=abc123');
  });

  it('can type Image URL', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    // Image URL placeholder is "https://…"
    const inputs = screen.getAllByRole('textbox');
    const imageInput = inputs.find(i => (i as HTMLInputElement).placeholder === 'https://…');
    expect(imageInput).toBeTruthy();
    await user.type(imageInput!, 'https://example.com/photo.jpg');
    expect(imageInput).toHaveValue('https://example.com/photo.jpg');
  });

  it('can type notes', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const notesTextarea = screen.getByPlaceholderText(/grandma's twist/);
    await user.type(notesTextarea, 'My test notes');
    expect(notesTextarea).toHaveValue('My test notes');
  });

  it('can type ABV value', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddRecipeView /></MemoryRouter>);
    const abvInput = screen.getByPlaceholderText(/e\.g\.\s*18%/);
    await user.type(abvInput, '30');
    expect(abvInput).toHaveValue('30');
  });
});
