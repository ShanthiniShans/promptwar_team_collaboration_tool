# Promptwar Team Collaboration Tool

A professional AI-driven team collaboration platform utilizing a modern stack: **React** for the frontend, **FastAPI** with **Pydantic v2** for the backend, and **Vertex AI** for advanced generative capabilities.

## Architecture

- **Asynchronous FastAPI backend with Pydantic v2 data validation.**
- **Modular React frontend with TypeScript.**
- **Vertex AI for AI-powered task and project generation.**
- **Implements Least-Privilege IAM roles for Vertex AI access.**

## Security

- Endpoints protected by Bearer token security.
- Principle of least-privilege: service accounts have only minimal permissions needed to interact with Vertex AI.
- Input validation is enforced via Pydantic schemas.

## Accessibility

- **WCAG 2.1 compliant frontend components** for maximum inclusivity.
- Keyboard navigation and screen reader support implemented in the UI.

## Development

- Pytest-based test suite, including strategy for mocking AI responses when offline.
- See `backend/tests/conftest.py` for mock strategy.

## Health & Monitoring

- `/health` FastAPI endpoint for status and region.

---
