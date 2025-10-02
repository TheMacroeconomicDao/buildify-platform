# Contributing to Buildify Platform

Thank you for your interest in contributing to Buildify! This document provides guidelines and instructions for contributing.

## 📋 Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PHP 8.2+
- Composer
- PostgreSQL 15
- Redis 7
- Docker (optional)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/TheMacroeconomicDao/buildify-platform.git
cd buildify-platform

# Backend setup
cd apps/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
cd ../..

# Mobile setup
cd apps/mobile
npm install
cp env.local .env
cd ../..
```

## 🌿 Branch Naming Convention

Use the following prefixes for branch names:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Examples:
```
feature/TASK-123-add-wallet-balance
bugfix/TASK-456-fix-auth-crash
hotfix/critical-payment-issue
docs/update-api-reference
```

## 💬 Commit Message Convention

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```
feat(wallet): add AED currency support

Added support for AED currency in wallet transactions
with proper conversion and display formatting.

Closes #123
```

```
fix(auth): resolve token refresh issue

Fixed issue where authentication tokens were not
being properly refreshed, causing users to be
logged out prematurely.

Fixes #456
```

## 🔄 Pull Request Process

1. **Fork the repository** and create your branch from `main`

2. **Make your changes** following the coding standards below

3. **Write tests** for your changes (if applicable)

4. **Run the test suite**
   ```bash
   # Backend
   cd apps/backend && composer test
   
   # Mobile
   cd apps/mobile && npm test
   ```

5. **Lint your code**
   ```bash
   # Backend
   cd apps/backend && ./vendor/bin/pint
   
   # Mobile
   cd apps/mobile && npm run lint
   ```

6. **Update documentation** if needed

7. **Create a Pull Request** with:
   - Clear title following commit convention
   - Detailed description of changes
   - Link to related issues
   - Screenshots (for UI changes)

8. **Wait for review** - At least 2 approvals required

## 📝 Coding Standards

### Backend (PHP/Laravel)

- Follow PSR-12 coding standard
- Use type hints for parameters and return types
- Write DocBlocks for classes and methods
- Keep controllers thin, move logic to services
- Use Eloquent ORM, avoid raw queries
- Follow Laravel best practices

Example:
```php
/**
 * Create a new order.
 *
 * @param  User   $user
 * @param  array  $data
 * @return Order
 */
public function createOrder(User $user, array $data): Order
{
    return DB::transaction(function () use ($user, $data) {
        $order = Order::create($data);
        $user->increment('used_orders_count');
        return $order;
    });
}
```

### Mobile (JavaScript/React Native)

- Use functional components with hooks
- Follow React best practices
- Use PropTypes or TypeScript
- Keep components small and focused
- Use Redux for global state
- Follow Airbnb JavaScript Style Guide

Example:
```javascript
/**
 * Order card component
 */
const OrderCard = ({ order, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(order.id);
  }, [order.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{order.title}</Text>
    </TouchableOpacity>
  );
};

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
};
```

## 🧪 Testing

### Backend Testing

```bash
cd apps/backend

# Run all tests
composer test

# Run specific test
php artisan test --filter=OrderTest

# Generate coverage report
composer test -- --coverage
```

### Mobile Testing

```bash
cd apps/mobile

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 📚 Documentation

- Update README files when adding new features
- Add JSDoc/PHPDoc comments for functions
- Update API documentation
- Add examples for complex features

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the bug
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details** (OS, versions, etc.)
6. **Screenshots/logs** if applicable

## 💡 Suggesting Features

For feature requests, please:

1. **Search existing issues** to avoid duplicates
2. **Clearly describe** the feature and use case
3. **Explain the benefit** to users
4. **Propose implementation** if possible

## 📞 Getting Help

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Search or create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🙏 Thank You!

Thank you for contributing to Buildify Platform. Your efforts help make this project better for everyone!

---

**Happy Coding! 🚀**
