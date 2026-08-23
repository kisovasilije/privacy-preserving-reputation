# Trusted Authority API

A TypeScript, Express, PostgreSQL, and Prisma REST API for storing canonical
BN254 scalar-field shares. The same build is intended to run as three trusted
authorities. Each process selects its database only through `DATABASE_URL`; no
instance-specific database address is present in the application source.

## Prerequisites

- Node.js 20 or newer and npm
- PostgreSQL reachable from each service instance
- A PostgreSQL role allowed to connect, create tables and indexes, and run
  Prisma migrations

The development examples assume a local PostgreSQL role named `postgres` with
password `kiso`, and three existing databases named `ta1`, `ta2`, and `ta3`.
These are example development credentials only. Use secret management and
different credentials outside local development.

If the databases do not exist, create them before migrating. For example:

```sh
createdb -U postgres ta1
createdb -U postgres ta2
createdb -U postgres ta3
```

Depending on the local PostgreSQL authentication configuration, `createdb` may
prompt for the password. Database creation is intentionally outside the API and
its migrations.

## Installation

Install the pinned dependencies:

```sh
npm install
```

Generate the Prisma client explicitly when needed:

```sh
npm run prisma:generate
```

`npm install` and `npm run build` also generate it automatically.
The project uses Prisma 7's `prisma-client` generator, writes the generated
client to `src/generated/prisma`, and connects through `@prisma/adapter-pg`,
matching the main API's Prisma configuration pattern.

## Environment configuration

Copy `.env.example` to `.env` for a single local instance, then adjust its
values. `.env` files are ignored by Git.

```dotenv
DATABASE_URL="postgresql://postgres:kiso@localhost:5432/ta1"
PORT=3001
NODE_ENV=development
```

`DATABASE_URL` is required and must use the `postgresql:` or `postgres:`
protocol. `PORT` is required and must be an integer from 1 through 65535.
`NODE_ENV` is optional and defaults to `development`. Startup validation reports
invalid variable names without printing the connection string or credentials.

Every trusted-authority process must receive a different `DATABASE_URL`. The
code does not inspect the port or an instance number to choose a database.

## Prisma migrations

For schema development against the database configured in the current
environment, run:

```sh
npm run migrate:dev
```

For deployment, apply committed migrations with:

```sh
npm run migrate:deploy
```

Because `ta1`, `ta2`, and `ta3` are independent databases, the committed
migration must be applied separately to all three. In PowerShell:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta1'
npm run migrate:deploy

$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta2'
npm run migrate:deploy

$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta3'
npm run migrate:deploy
```

The equivalent commands in a POSIX shell are:

```sh
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta1' npm run migrate:deploy
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta2' npm run migrate:deploy
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta3' npm run migrate:deploy
```

The initial migration creates one application table, `Shares`, plus Prisma's
own migration metadata table. It also creates database check constraints for
positive identifiers and the BN254 range, and an index on
`("roundId", "targetId")`.

## Development

Run each instance in a separate terminal. PowerShell examples follow.

Trusted Authority 1:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta1'
$env:PORT = '3001'
$env:NODE_ENV = 'development'
npm run dev
```

Trusted Authority 2:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta2'
$env:PORT = '3002'
$env:NODE_ENV = 'development'
npm run dev
```

Trusted Authority 3:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:kiso@localhost:5432/ta3'
$env:PORT = '3003'
$env:NODE_ENV = 'development'
npm run dev
```

For a POSIX shell, each terminal can launch an instance with one command:

```sh
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta1' PORT=3001 npm run dev
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta2' PORT=3002 npm run dev
DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta3' PORT=3003 npm run dev
```

The development script watches TypeScript source files and restarts its process
after changes.

### Run all three instances with the Python helper

Create one ignored environment file per instance from the committed templates:

```powershell
Copy-Item .env.ta1.example .env.ta1
Copy-Item .env.ta2.example .env.ta2
Copy-Item .env.ta3.example .env.ta3
```

Review the copied files before running them. Each must contain a distinct
`DATABASE_URL` and `PORT`. Then start all three development processes:

```sh
python scripts/run_instances.py
```

To apply committed migrations to all three configured databases first and then
start the instances:

```sh
python scripts/run_instances.py --migrate
```

For the compiled application, run `npm run build` once and then:

```sh
python scripts/run_instances.py --mode production
```

The helper uses only Python's standard library, never prints connection URLs,
and stops all child processes together when Ctrl+C is pressed.

## Production build and startup

Build once from the identical source tree:

```sh
npm ci
npm run typecheck
npm run build
```

Apply migrations to every database as shown above. Then start the same `dist`
build three times, giving each process its own environment. For example, in
three POSIX-shell terminals:

```sh
NODE_ENV=production DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta1' PORT=3001 npm start
NODE_ENV=production DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta2' PORT=3002 npm start
NODE_ENV=production DATABASE_URL='postgresql://postgres:kiso@localhost:5432/ta3' PORT=3003 npm start
```

In production, use a process supervisor and inject each process's secrets rather
than storing them in a checked-in file. `SIGINT` and `SIGTERM` stop accepting new
connections, close the HTTP server, and disconnect Prisma. A ten-second guard
terminates a shutdown that cannot complete.

## API

All responses are JSON. Validation failures use HTTP 400 and this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "body.ratingId",
        "message": "Must be greater than zero."
      }
    ]
  }
}
```

Unexpected server errors return a generic HTTP 500 response without internal
details, credentials, or a connection string.

### Create a share

```sh
curl --request POST 'http://localhost:3001/shares' \
  --header 'Content-Type: application/json' \
  --data '{
    "ratingId": 123,
    "share": "123456789012345678901234567890",
    "targetId": 456,
    "roundId": 1
  }'
```

A successful request returns HTTP 201:

```json
{
  "id": 1,
  "ratingId": 123,
  "share": "123456789012345678901234567890",
  "targetId": 456,
  "roundId": 1
}
```

To populate all three development databases, send a request to each instance.
The identifiers can describe the same rating, while each authority receives its
own field share:

```sh
curl --request POST 'http://localhost:3001/shares' --header 'Content-Type: application/json' --data '{"ratingId":123,"share":"111","targetId":456,"roundId":1}'
curl --request POST 'http://localhost:3002/shares' --header 'Content-Type: application/json' --data '{"ratingId":123,"share":"222","targetId":456,"roundId":1}'
curl --request POST 'http://localhost:3003/shares' --header 'Content-Type: application/json' --data '{"ratingId":123,"share":"333","targetId":456,"roundId":1}'
```

Each request is stored only in the database selected by that process's
`DATABASE_URL`.

The body must contain exactly those four fields. Identifiers must be positive
JSON integers within PostgreSQL's signed `INTEGER` range. The share must be a
base-10 integer string in the BN254 scalar field.

### Find shares

```sh
curl 'http://localhost:3001/shares?roundId=1&targetId=456'
```

Both query parameters are required exactly once. Results are ordered by `id`
ascending and returned as an array. No matches produce `[]` with HTTP 200.

### Health check

```sh
curl 'http://localhost:3001/health'
```

The endpoint executes a trivial query against the database configured for that
process. It returns HTTP 200 with `{"status":"ok","database":"reachable"}`
when the database responds, or HTTP 503 with a credential-free response when it
does not.

## Numeric representation and BN254 validation

Circom's BN254 scalar-field modulus is:

```text
21888242871839275222246405745257275088548364400416034343698204186575808495617
```

A canonical field element is an integer `share` satisfying `0 <= share < p`.
The API accepts only ASCII base-10 digit strings, validates the value with
JavaScript `bigint`, and passes an exact decimal string to Prisma. Negative
values, signs, whitespace, decimal points, exponent notation, hexadecimal, and
values at least `p` are rejected. PostgreSQL stores the result in
`DECIMAL(78,0)` and enforces the same range with a check constraint.

Identifiers use PostgreSQL `INTEGER` and are represented as JSON numbers in
request bodies and responses. GET query parameters are textual because they are
part of a URL, but the API validates and converts them to integers before
querying. Only the BN254 `share` uses a base-10 string in JSON, preventing any
precision loss for the field element.

## npm scripts

- `npm run dev` - run the API in watch mode
- `npm run typecheck` - check strict TypeScript without emitting files
- `npm run build` - generate Prisma Client and compile to `dist`
- `npm start` - run the compiled server
- `npm run prisma:generate` - generate Prisma Client
- `npm run migrate:dev` - create/apply migrations during schema development
- `npm run migrate:deploy` - apply committed migrations in deployment
