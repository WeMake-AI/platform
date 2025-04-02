# WeMake AI frontpage

## Integrations

- Tailwind CSS v4 Beta
- Astro v5
- Astro SEO - Powered by [@astrolib/seo](https://github.com/onwidget/astrolib/tree/main/packages/seo)
- Astro Sitemap - https://docs.astro.build/en/guides/integrations-guide/sitemap/
- TypeScript implementation with functional, declarative programming
- End-to-end testing with Playwright

## Project Structure

This project follows a typical Astro project structure. You'll find the following key directories and files:

```tree
/
├── public/
│   ├── fonts/
│   └── images/
│       └── favicons/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── tests/
│   ├── contact-form.spec.ts
│   ├── api-contact.spec.ts
│   └── d1-integration.spec.ts
├── .github/workflows/
│   ├── test.yml
│   └── deploy.yml
├── package.json
└── playwright.config.ts
```

- `src/pages/`: Contains `.astro` and `.md` files. Each file becomes a route in your project based on its name.
- `src/components/`: Ideal for placing your Astro/React/Vue/Svelte/Preact components.
- `src/layouts/`: Contains layout components for consistent page structure.
- `src/styles/`: Contains global CSS styles.
- `public/`: For static assets such as images and fonts that you want to serve directly.
- `tests/`: Contains Playwright tests for ensuring functionality.
- `.github/workflows/`: Contains GitHub Actions workflows for testing and deployment.

## Versioning Strategy

WeMake uses a modified semantic versioning approach to accommodate continuous growth without a rigid roadmap:

### Version Format: X.Y.Z

- **Major (X)**: Incremented for significant redesigns or breaking changes to user experience
- **Minor (Y)**: Incremented for new features and notable enhancements
- **Patch (Z)**: Incremented for bug fixes, small UI improvements, and content updates

### Automated Versioning

Our versioning system is automated through GitHub Actions and driven by PR labels:

- PRs containing `frontend`, `content`, or `scripts` changes trigger minor version bumps
- PRs with `breaking` in the title trigger major version bumps
- All other changes trigger patch version bumps

Each new version automatically updates:

- The version in `package.json`
- The `CHANGELOG.md` file with PR details
- Creates a Git tag
- Publishes a GitHub Release

### PR Title Format

For best results with our automated versioning:

- Use `breaking:` prefix for breaking changes (major bump)
- Use `feat:` prefix for new features (minor bump)
- Use `fix:`, `docs:`, `chore:`, etc. for other changes (patch bump)

### Testing the Versioning System

Our versioning system includes comprehensive testing tools:

- **Local Tests**: Run `./tests/validate-versioning.sh` to verify versioning logic
- **GitHub Actions**: Use the `Test Versioning` workflow to simulate versioning in CI
- **Test Files**:
  - `tests/version-workflow-test.js`: Tests version bumping logic with different PR scenarios
  - `tests/changelog-test.js`: Tests CHANGELOG generation functionality
  - `tests/validate-versioning.sh`: Orchestrates the full test suite

### Version Test Examples

The test suite validates various scenarios including:

| PR Title & Labels                  | Bump Type | Version Change |
| :--------------------------------- | :-------- | :------------- |
| `breaking: Redesign`               | Major     | 1.0.0 → 2.0.0  |
| `feat: New component` + `frontend` | Minor     | 1.2.3 → 1.3.0  |
| `fix: Bug` + `documentation`       | Patch     | 2.1.3 → 2.1.4  |

### GitHub Actions Workflows

Our versioning system is implemented through these GitHub Actions workflows:

- **PR Labeler** (`.github/workflows/pr-labeler.yml`):

  - Automatically applies labels to PRs based on changed files
  - Adds versioning labels based on PR title prefixes
  - Uses configuration in `.github/labeler.yml`

- **Semantic Versioning** (`.github/workflows/semantic-versioning.yml`):

  - Triggers when PRs are merged to main
  - Determines version bump type based on PR labels
  - Updates package.json and CHANGELOG.md
  - Creates Git tags and GitHub releases

- **Test Versioning** (`.github/workflows/test-versioning.yml`):
  - Manual workflow to test versioning logic
  - Takes PR title, labels, and current version as inputs
  - Simulates the entire versioning process without making changes

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `bun install`          | Installs dependencies                            |
| `bun run dev`          | Starts local dev server at `localhost:1312`      |
| `bun run build`        | Build your production site to `./dist/`          |
| `bun run preview`      | Preview your build locally, before deploying     |
| `bun run deploy`       | Deploy your site to Cloudflare Pages             |
| `bun run format`       | Format code with Prettier                        |
| `bun run check`        | Run type-checking with TypeScript                |
| `bun test`             | Run all Playwright tests                         |
| `bun test:ui`          | Run tests with Playwright UI                     |
| `bun test:debug`       | Run tests in debug mode                          |
| `bun test:ci`          | Run tests in CI mode (includes build step)       |
| `bun test:functional`  | Run functional tests only                        |
| `bun test:security`    | Run security tests only                          |
| `bun run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `bun run astro --help` | Get help using the Astro CLI                     |

Learn more - Explore more through Astro's official [documentation](https://docs.astro.build).

---

## WeMake v1.0.0 Release

We are thrilled to announce the release of **version 1.0.0** for the WeMake website! This release includes:

### Core Updates

- **Complete TypeScript Implementation**:

  - Functional, declarative programming approach
  - Strict error handling and validation principles
  - Comprehensive documentation for complex logic

- **Astro v5 Integration**:

  - Leveraging Astro's partial hydration and multi-framework support
  - File-based routing system with dynamic routes
  - Content collections for organized content management

- **Tailwind CSS v4 Beta**:
  - Updated to the latest beta version
  - All styles now added in the `src/styles/global.css` file
  - Responsive design utilizing Tailwind's utility classes

### Security Enhancements

- **Contact Form API Security**:

  - Input validation and sanitization
  - CSRF protection
  - Rate limiting and bot detection
  - Secure headers implementation

- **Database Integration**:

  - New `contact_submissions` table for managing user communications
  - End-to-end SSL encryption for data transmission

### Testing Framework

- **Comprehensive Testing Suite**:

  - Unit tests for utility functions and helpers
  - Integration tests for complex components
  - End-to-end tests with Playwright for critical user flows
  - Performance profiling and monitoring tools

- **Test Organization**:
  - Contact Form Tests: Test the contact form UI and submission
  - API Endpoint Tests: Test the API endpoints directly
  - D1 Database Integration Tests: Test database interactions

### Performance Optimizations

- Implemented SEO best practices with Astro SEO
- Added sitemap integration for improved discoverability
- Optimized asset loading with properly sized images
- Improved font loading with variable fonts (IBMPlexSans and Inter)

### CI/CD Improvements

- **GitHub Actions Workflows**:
  - Automated testing on push to main branch and pull requests
  - Automated deployment to Cloudflare Pages
  - D1 migration for production database management

### Upcoming Features

- **Image Component from Astro**: The Astro Image component will be added in future updates

- **Reusable Components**:
  - **Text Component**: For consistent typography
  - **Button Component**: Customizable button styles
  - **Wrapper Component**: Flexible layout components

## Testing

This project includes automated tests using Playwright to ensure the contact form and API are working correctly.

### Test Setup

The tests are configured in `playwright.config.ts` and organized in the `tests/` directory.

### Running Tests

You can run the tests using the commands listed in the Commands section above.

### CI/CD Integration

To enable CI/CD, add the following secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
