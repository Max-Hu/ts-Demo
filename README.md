# 📦 Scan Orchestration Platform

A lightweight CI/CD orchestration API backend designed to trigger Jenkins pipelines, track build progress, fetch logs, and handle post-build results in a secure and extensible way.

## 🚀 Features

- **Trigger Jenkins pipelines** from a web-based frontend using configurable parameters
- **Support multiple scan types** (SAST, FOSS, DAST)
- **Real-time job status tracking** with Jenkins polling
- **Secure API key authentication** for all endpoints
- **GraphQL support** for efficient data fetching
- **Comprehensive logging** with Winston
- **Docker support** for easy deployment
- **Oracle database** integration with Objection.js ORM

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Objection.js + Knex
- **Database**: Oracle
- **Authentication**: API Key header
- **CI/CD API**: Jenkins HTTP API
- **Logging**: Winston
- **GraphQL**: Apollo Server
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

## 📁 Project Structure

```
📦 scan-orchestration-platform
├── src/
│   ├── api/               # REST and GraphQL route handlers
│   │   └── routes/
│   │       └── scanRoutes.ts
│   ├── services/          # Jenkins, DB interaction logic
│   │   └── jenkinsService.ts
│   ├── db/                # Knex / Objection models
│   │   ├── connection.ts
│   │   ├── models/
│   │   │   └── ScanJob.ts
│   │   └── migrations/
│   │       └── 001_create_scan_jobs_table.ts
│   ├── middleware/        # Express middleware
│   │   ├── apiKeyAuth.ts
│   │   └── errorHandler.ts
│   ├── graphql/           # GraphQL schema and resolvers
│   │   ├── schema.ts
│   │   └── resolvers.ts
│   ├── utils/             # Utility functions
│   │   └── logger.ts
│   ├── __tests__/         # Test files
│   │   ├── jenkinsService.test.ts
│   │   └── api.test.ts
│   └── index.ts           # Server entry point
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Oracle Database (or use Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scan-orchestration-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations**
   ```bash
   npm run build
   # The app will automatically run migrations on startup
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

### API Endpoints

#### REST API

- `POST /api/scan/trigger` - Trigger a new scan
- `POST /api/scan/callback` - Jenkins callback with results
- `GET /api/scan/status/:id` - Get scan job status
- `GET /health` - Health check

#### GraphQL

- Endpoint: `http://localhost:3000/graphql`
- Playground: `http://localhost:3000/graphql` (in development)

### Example Usage

#### Trigger a Scan (REST)

```bash
curl -X POST http://localhost:3000/api/scan/trigger \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secure_api_key_here" \
  -d '{
    "scanType": "SAST",
    "parameters": {
      "repo": "https://github.com/example/repo",
      "branch": "main"
    },
    "metadata": {
      "project": "example-project"
    }
  }'
```

#### Query Scan Status (GraphQL)

```graphql
query {
  scanJob(id: "scan-job-id") {
    id
    scanType
    status
    jenkinsJobId
    reportUrl
    summary
    log
    createdAt
    completedAt
  }
}
```

## 🧪 Testing

### Run Tests

#### Using Docker Compose (Recommended)

```bash
# Run all tests
docker-compose exec api npm test

# Run tests in watch mode
docker-compose exec api npm run test:watch

# Run tests with coverage
docker-compose exec api npm run test:coverage

# Run specific test file
docker-compose exec api npm test -- jenkinsService.test.ts

# Run tests with verbose output
docker-compose exec api npm test -- --verbose
```

#### Local Development (requires Node.js)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: `src/__tests__/jenkinsService.test.ts`
- **Integration Tests**: `src/__tests__/api.test.ts`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `1521` |
| `DB_SERVICE` | Database service | `XE` |
| `DB_USER` | Database user | `scan_platform` |
| `DB_PASSWORD` | Database password | - |
| `JENKINS_URL` | Jenkins URL | `http://localhost:8080` |
| `JENKINS_USER` | Jenkins username | `admin` |
| `JENKINS_TOKEN` | Jenkins API token | - |
| `API_KEY` | API key for authentication | - |
| `LOG_LEVEL` | Logging level | `info` |

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t scan-orchestration-platform .

# Run with Docker Compose
docker-compose up -d
```

### Production Deployment

1. Update environment variables in `docker-compose.yml`
2. Set `NODE_ENV=production`
3. Configure proper database credentials
4. Set secure API keys

## 🔐 Security

- All API endpoints require API key authentication
- Rate limiting enabled (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS enabled for cross-origin requests
- Input validation with Joi

## 📊 Monitoring

- Structured logging with Winston
- Health check endpoint
- Error tracking and reporting
- Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This is a lightweight orchestration platform designed for small teams. For enterprise use, consider additional security measures and scaling considerations. 