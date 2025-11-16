# Contributing to @nodelibraries/ioc

Thank you for your interest in contributing to `@nodelibraries/ioc`! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear title and description
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (Node.js version, TypeScript version, etc.)
- Code examples if applicable

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:
- A clear description of the feature
- Use cases and examples
- Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run tests** (`npm test`)
6. **Ensure all tests pass**
7. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
8. **Push to the branch** (`git push origin feature/amazing-feature`)
9. **Open a Pull Request**

## 📝 Code Style

- Follow existing code style
- Use TypeScript best practices
- Add JSDoc comments for public APIs
- Write clear, descriptive commit messages

## 🧪 Testing

- All new features must include tests
- Run `npm test` before submitting PR
- Aim for high test coverage
- Test edge cases and error scenarios

## 📚 Documentation

- Update README.md if adding new features
- Update API documentation if changing public APIs
- Add examples for new features
- Update CHANGELOG.md

## ✅ Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] Tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No linter errors
- [ ] Commit messages are clear and descriptive

## 🎯 Development Setup

```bash
# Clone the repository
git clone https://github.com/nodelibraries/ioc.git
cd ioc

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run tests in watch mode
npm test -- --watch
```

## 📖 Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## 🙏 Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!

