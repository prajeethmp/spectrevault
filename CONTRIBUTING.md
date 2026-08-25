# Contributing to SpectreVault

Thank you for your interest in contributing.

## Local Development Workflow

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/your-username/spectrevault.git
   cd spectrevault
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run the test suite:
   ```bash
   npm run test
   ```

4. Verify production build:
   ```bash
   npm run build
   ```

## Contribution Guidelines

- **Cryptographic Changes:** Any modifications to `lib/crypto.ts` must include corresponding test cases in `lib/crypto.test.ts` and maintain compatibility with the offline recovery tool `scripts/combine_offline.py`.
- **TypeScript:** Strict type checking is enforced across the entire codebase.
- **Pull Requests:** Ensure all tests pass (`npm run test`) and the production build completes cleanly (`npm run build`) before opening a pull request.
