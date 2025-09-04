# AGENTS.md - Development Guidelines

This document provides a set of guidelines for AI software engineers working on this repository. Please adhere to these rules to ensure code quality, consistency, and maintainability.

## 1. 沟通语言 (Communication Language)
- All communication with the user, including pull request descriptions and in-chat messages, should be in **Simplified Chinese**.
- Code comments should also be written in **Simplified Chinese** to maintain consistency with the existing codebase.

## 2. 提交信息规范 (Commit Message Convention)
- All Git commit messages **must** follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification.
- The commit message should be structured as follows:
  ```
  type(scope): subject
  <blank line>
  body
  <blank line>
  footer
  ```
- **Examples:**
  - `feat(settings): add new background source option`
  - `fix(weather): correct API endpoint for weather data`
  - `docs(readme): update setup instructions`

## 3. 代码风格 (Code Style)
- All new JavaScript functions must be accompanied by comprehensive **JSDoc comments**. The comment should describe the function's purpose, all its parameters (`@param`), and its return value (`@returns`).
- While this project does not have a linter or formatter like Prettier configured, please make a best effort to maintain a clean and consistent code style, paying attention to indentation, spacing, and naming conventions.

## 4. 分支管理 (Branching Strategy)
- **`main`** is the primary branch and should always be stable. Direct pushes to `main` are not allowed. All changes must be made through pull requests.
- New features should be developed on branches prefixed with `feature/`.
  - Example: `feature/add-user-profiles`
- Bug fixes should be on branches prefixed with `fix/`.
  - Example: `fix/incorrect-time-display`
- Documentation changes should be on branches prefixed with `docs/`.
  - Example: `docs/update-readme`

## 5. 依赖管理 (Dependency Management)
- This project aims to be lightweight and dependency-free. **Do not add any new external libraries or dependencies** without explicit prior approval from the user.
- If you believe a new dependency is essential, you must propose it in your plan, along with a clear justification for why it is needed.

## 6. 测试与验证 (Testing and Verification)
- For every code change, your plan **must** include a verification step to confirm that the changes work as expected and have not introduced any regressions.
- For any change that affects the user interface (UI), you **must** use the `frontend_verification_instructions` tool to perform visual verification and generate a screenshot before submitting your work.

## 7. 文档维护 (Documentation Maintenance)
- When adding or modifying any features, the `README.md` file **must** be updated accordingly to reflect the latest changes.
