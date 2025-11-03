# Client Service API (Technical Test)

This repository contains a REST API for a client management service, built as a technical challenge for a Pleno/Sênior Developer role.

The project is built using **TypeScript (Node.js)** and **Clean Architecture**, emphasizing **SOLID** principles, Domain-Driven Design (DDD) concepts, and a fully containerized environment using **Docker**.

## 🚀 Core Technologies

* **Back-end:** Node.js, Express.js, TypeScript
* **Database:** MongoDB
* **Caching:** Redis
* **Messaging:** RabbitMQ
* **Containerization:** Docker & Docker Compose
* **Architecture:** Clean Architecture, SOLID, Repository Pattern
* **DI (Dependency Injection):** TSyringe
* **Validation:** Zod

## ✨ Features

* **Full CRUD API** for managing `Client` entities.
* **Cache-Aside Strategy:** `GET /clients/:id` requests are cached in Redis to reduce database load.
* **Cache Invalidation:** `PUT` and `DELETE` operations automatically invalidate (clear) the corresponding cache entry.
* **Event-Driven:** Creating a new client publishes a `client.created` event to a RabbitMQ exchange.
* **Background Consumer:** A RabbitMQ consumer (running as a background worker) listens for `client.created` events and logs them (simulating a "welcome email" or other microservice workflow).
* **Input Validation:** All endpoints are protected by `zod` schemas to ensure data integrity and provide clear error messages.
* **Global Error Handling:** A centralized middleware catches all unhandled errors, including `SyntaxError` (invalid JSON), and prevents the application from crashing.

## Prerequisites

You must have **Docker** and **Docker Compose** installed on your machine.
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, Mac, Linux)

No other dependencies (Node.js, MongoDB, Redis, etc.) need to be installed on your local machine.

## ▶️ How to Run

Running this entire multi-container application (API, Database, Cache, Message Broker) is a one-step process.

1.  Clone this repository:
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  Build and run all services using Docker Compose:
    ```bash
    docker-compose up --build
    ```
    * `--build` forces Docker to build the API image from the `Dockerfile`. You only need to use it the first time or when code changes (e.g., updating `package.json`).
    * To run in the background, use `docker-compose up -d --build`.

3.  The API will be running at `http://localhost:3000`.

To **stop and remove** all containers, networks, and volumes:
```bash
docker-compose down
```

## 🛠️ Service Ports & Management UIs

While the application is running, the following services are exposed on your localhost:

1. Client API: http://localhost:3000

2. MongoDB: mongodb://root:example@localhost:27017 (Connect via MongoDB Compass)

3. Redis: localhost:6379 (Connect via a Redis client)

4. RabbitMQ Management UI: http://localhost:15672

Login: guest

Password: guest

Endpoints (API Reference)
All API endpoints are prefixed with /api.

## POST /api/clients
Creates a new client. This action also publishes a client.created event to the message broker.

Request Body:

JSON

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "999-888-777"
}
(Note: phone is optional)

Success Response:

Code: 201 Created

Body: The newly created client object.

Error Responses:

Code: 400 Bad Request - If validation fails (e.g., missing name, invalid email).

Code: 400 Bad Request - If a client with the same email already exists.

## GET /api/clients
Retrieves a list of all clients.

Success Response:

Code: 200 OK

Body: An array [] of client objects.

## GET /api/clients/:id
Retrieves a single client by its unique ID.

Note: This endpoint is cached. The first request will hit the database, but subsequent requests (within one hour) will be served instantly from Redis.

URL Parameter:

id (string, UUID): The ID of the client.

Success Response:

Code: 200 OK

Body: The requested client object.

Error Responses:

Code: 404 Not Found - If a client with the specified ID does not exist.

## PUT /api/clients/:id
Updates an existing client's information.

Note: This action will invalidate (clear) the client's cache entry in Redis.

URL Parameter:

id (string, UUID): The ID of the client to update.

Request Body: (Send only the fields you want to change)

JSON

{
  "name": "Jane A. Doe",
  "phone": "111-222-333"
}
Success Response:

Code: 200 OK

Body: The fully updated client object.

Error Responses:

Code: 404 Not Found - If a client with the specified ID does not exist.

Code: 400 Bad Request - If the new email is already in use by another client.

## DELETE /api/clients/:id
Deletes a client by its unique ID.

Note: This action will invalidate (clear) the client's cache entry in Redis.

URL Parameter:

id (string, UUID): The ID of the client to delete.

Success Response:

Code: 200 OK

Body: The client object that was just deleted.

Error Responses:

Code: 404 Not Found - If a client with the specified ID does not exist.