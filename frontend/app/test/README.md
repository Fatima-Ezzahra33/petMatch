# Frontend Testing Setup - Complete Guide

## ✅ What's Been Set Up

A complete, production-ready testing environment for the PetMatch frontend using:
- **Vitest** - Fast unit testing framework (powered by Vite)
- **React Testing Library** - Component testing best practices
- **MSW (Mock Service Worker)** - API mocking
- **Happy DOM** - Lightweight DOM implementation

## 📁 File Structure

```
frontend/
├── vitest.config.ts                     # Vitest configuration
├── app/
│   └── test/
│       ├── setup.ts                     # Global test setup
│       ├── EXAMPLE.test.tsx             # Example test file (can be deleted)
│       ├── mocks/
│       │   ├── handlers.ts              # MSW request handlers
│       │   └── server.ts                # MSW server configuration
│       └── utils/
│           └── test-utils.tsx           # Custom render function with providers
```

## 🚀 Quick Start

### Running Tests

```bash
# Watch mode (re-runs on file changes)
npm test

# UI dashboard
npm run test:ui

# Coverage report
npm run test:coverage
```

### Writing Your First Test

Create a file named `MyComponent.test.tsx` next to your component:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from 'app/test/utils/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/my text/i)).toBeInTheDocument();
  });
});
```

## 🔑 Key Features

### 1. **Automatic Provider Wrapping**
No need to manually wrap your components with providers. The custom `render` function includes:
- ✅ QueryClientProvider (React Query for data fetching)
- ✅ ThemeProvider (dark/light mode)
- ✅ AuthProvider (authentication state)
- ✅ UserProvider (user data and favorites)

```tsx
// Your components have instant access to all contexts!
import { render } from 'app/test/utils/test-utils';

render(<YourComponent />);
```

### 2. **API Mocking (No Backend Required)**
All API calls are automatically mocked by MSW. No backend server needed!

#### Mocked Endpoints:
- **Authentication**: `/api/auth/*` (login, register, logout, etc.)
- **Pets**: `/api/pets/*` (list, get, create, update, delete)
- **Favorites**: `/api/favorites/*` (list, add, remove)
- **Adoption Applications**: `/api/adoption-applications/*` (CRUD operations)

#### Example:
```tsx
it('fetches pets', async () => {
  render(<PetList />);
  
  // MSW automatically returns mocked data
  await waitFor(() => {
    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });
});
```

### 3. **localStorage Mocking**
localStorage is automatically mocked to prevent test pollution:

```tsx
it('persists user preference', () => {
  localStorage.setItem('theme', 'dark');
  expect(localStorage.getItem('theme')).toBe('dark');
});
```

### 4. **Cleanup Between Tests**
Automatic cleanup prevents test pollution:
- ✅ DOM cleanup after each test
- ✅ MSW handlers reset
- ✅ No cross-test contamination

## 📚 Common Testing Patterns

### Testing Async Operations
```tsx
import { waitFor } from 'app/test/utils/test-utils';

it('loads data', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Testing User Interactions
```tsx
import { render, screen } from 'app/test/utils/test-utils';
import userEvent from '@testing-library/user-event';

it('handles click', async () => {
  const user = userEvent.setup();
  render(<Button onClick={vi.fn()} />);
  
  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### Testing API Calls
```tsx
it('submits form to API', async () => {
  render(<LoginForm />);
  const user = userEvent.setup();
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /login/i }));
  
  // MSW automatically mocks the API call
  await waitFor(() => {
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });
});
```

### Testing Context
```tsx
it('accesses auth context', () => {
  const TestComponent = () => {
    const { user, isAuthenticated } = useAuth();
    return <div>{isAuthenticated ? user?.name : 'Not logged in'}</div>;
  };
  
  render(<TestComponent />);
  // The mocked AuthProvider is automatically applied
});
```

## 🛠️ Customizing MSW Handlers

To add or modify mocked API responses, edit `app/test/mocks/handlers.ts`:

```typescript
// app/test/mocks/handlers.ts
http.get('/api/custom-endpoint', () => {
  return HttpResponse.json({
    // Your mock response
  });
}),
```

## 📊 Coverage Reports

Generate detailed coverage reports:

```bash
npm run test:coverage
```

This creates:
- **HTML report** - Open `coverage/index.html` in your browser
- **LCOV format** - For CI/CD integration
- **JSON format** - For programmatic use
- **Text output** - In the terminal

## 🔍 Debugging Tests

### Using the Vitest UI
```bash
npm run test:ui
```
Opens an interactive dashboard with test results, logs, and code coverage.

### Using `screen.debug()`
```tsx
it('debugging', () => {
  render(<MyComponent />);
  screen.debug(); // Prints the entire DOM
});
```

### Using `logRoles()`
```tsx
import { logRoles } from '@testing-library/react';

it('debugging roles', () => {
  const { container } = render(<MyComponent />);
  logRoles(container); // Shows all available accessibility roles
});
```

## 🎯 Best Practices

1. **Test behavior, not implementation**
   ```tsx
   // ✅ Good - tests what user sees
   expect(screen.getByRole('button')).toBeInTheDocument();
   
   // ❌ Avoid - tests implementation
   expect(component.state.isVisible).toBe(true);
   ```

2. **Use semantic queries**
   ```tsx
   // ✅ Good - accessibility-first
   screen.getByRole('button', { name: /submit/i })
   
   // ❌ Avoid - implementation details
   screen.getByTestId('submit-btn')
   ```

3. **Use `waitFor` for async operations**
   ```tsx
   // ✅ Good
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   
   // ❌ Avoid
   setTimeout(() => { /* assertions */ }, 1000);
   ```

4. **Test user interactions realistically**
   ```tsx
   // ✅ Good - simulates real user behavior
   const user = userEvent.setup();
   await user.type(input, 'text');
   
   // ❌ Avoid - bypasses user event handling
   fireEvent.change(input, { target: { value: 'text' } });
   ```

## 🐛 Troubleshooting

### "useAuth must be used within an AuthProvider"
**Solution**: Make sure you're using the custom `render` function from `app/test/utils/test-utils`:
```tsx
import { render } from 'app/test/utils/test-utils'; // ✅ Correct

// NOT:
import { render } from '@testing-library/react'; // ❌ Wrong
```

### API calls not being mocked
**Solution**: Check that:
1. MSW server is started in `setup.ts` ✅
2. Handler URL matches your API call exactly
3. Handler HTTP method matches (GET, POST, etc.)

### localStorage tests failing
**Solution**: localStorage is mocked, so it works but won't persist between test runs. Clear it in tests:
```tsx
afterEach(() => {
  localStorage.clear();
});
```

## 📖 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✨ Example Test File

See `app/test/EXAMPLE.test.tsx` for a complete working example (can be safely deleted after reviewing).

---

**Happy testing! 🎉**
