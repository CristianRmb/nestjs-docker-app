# Nest App

This is a NestJS application structured to provide a robust backend solution. The project is organized into modules, common utilities, and configuration files to enhance maintainability and scalability.

## Project Structure

```
nest-app
├── src
│   ├── common
│   │   ├── decorators
│   │   ├── filters
│   │   ├── guards
│   │   ├── interceptors
│   │   └── pipes
│   ├── config
│   ├── modules
│   │   ├── auth
│   │   └── users
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── .env.dev
├── .env.prod
├── .env.test
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- **Modular Architecture**: The application is divided into modules for authentication and user management, promoting separation of concerns.
- **Common Utilities**: Includes decorators, filters, guards, interceptors, and pipes to enhance functionality and maintain clean code.
- **Configuration Management**: Environment variables are managed through configuration files for different environments (development, production, testing).

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd nest-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

Create `.env` files for different environments based on the provided templates:
- `.env.dev` for development
- `.env.prod` for production

## Running the Application

To start the application in development mode, run:
```
docker-compose up --build
```

## License

This project is licensed under the MIT License.
