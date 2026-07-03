# Repository Guidelines

## Project Structure & Module Organization

This repository contains a two-part ERP application. `backend/` is a NestJS API using TypeORM and MySQL; application modules live under `backend/src/modules/`, shared decorators, guards, DTOs, and entities under `backend/src/common/`, and seed/database setup under `backend/src/database/`. Backend tests are in `backend/src/**/*.spec.ts` and `backend/test/` for e2e tests.

`frontend/` is a Next.js 16 application. Routes live in `frontend/src/app/`, reusable UI and layout components in `frontend/src/components/`, and feature code in `frontend/src/features/operation/<feature>/` with `api/`, `components/`, and `types/` folders. Static assets belong in `frontend/public/`.

## Build, Test, and Development Commands

Run commands from the relevant package directory.

Backend:
- `npm run start:dev` starts the Nest API in watch mode.
- `npm run build` compiles the API to `backend/dist/`.
- `npm run test` runs Jest unit tests.
- `npm run test:e2e` runs e2e tests from `backend/test/`.
- `npm run lint` runs ESLint with fixes.

Frontend:
- `npm run dev` starts the local Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow the existing NestJS module pattern: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and `entities/`. Prefer explicit DTO validation with `class-validator`. Frontend feature files use kebab-case folders and descriptive names such as `employees.api.ts` and `EmployeesManager.tsx`. Keep formatting consistent with Prettier/ESLint defaults; do not introduce unrelated refactors.

## Testing Guidelines

Backend unit tests use Jest and the `*.spec.ts` naming pattern. Add focused tests for service logic, guards, and API behavior when changing shared backend behavior. Frontend currently relies on TypeScript and build/lint checks; at minimum run `npm run build` after UI or API contract changes.

## Commit & Pull Request Guidelines

The current history uses short feature-style messages such as `feat/first`. Prefer clear Conventional Commit-style subjects, for example `feat: add employee profile fields` or `fix: persist employee address`. PRs should include a concise summary, test/build results, linked issue or task when available, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit `.env` or `.env.local`. Use `backend/.env.example` and `frontend/.env.local.example` as templates. Keep API URLs relative or environment-driven, and avoid logging sensitive employee data such as resident registration numbers.
