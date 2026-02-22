# Jigger AI

This is a monorepo for the Jigger AI project, a cocktail inventory and recommendation system powered by AI.

## Architecture

- **Client:** React + Vite
- **Server:** Node.js + Express (with Google ADK for AI agents)
- **Database:** PostgreSQL (Supabase)

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    cd client && npm install
    cd ../server && npm install
    ```
3.  Run the development environment:
    ```bash
    docker-compose up
    ```

## Structure

- `client/`: Frontend application code.
- `server/`: Backend API and AI agent logic.
- `docker-compose.yml`: Local development environment configuration.

## License

ISC
