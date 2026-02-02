# Beacon

Beacon is an API uptime monitoring SaaS.

It allows users to register, add API endpoints, and monitor their availability and response status over time, with plan-based limits and periodic health checks.

---

## Features

- User authentication using JWT
- Plan-based endpoint limits
- API uptime monitoring with configurable intervals
- Immediate health check on endpoint creation
- Periodic background uptime checks
- Live dashboard showing endpoint status (UP / DOWN / UNKNOWN)
- Endpoint creation and deletion
- Secure, per-user data access

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

---

## Project Structure

```
beacon/
├─beacon-backend/
└─beacon-frontend/
```

## Status

MVP complete.  
More features planned (endpoint history, uptime analytics, alerts).
