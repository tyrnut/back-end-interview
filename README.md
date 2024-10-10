# Report API

## Overview
This is a data API intended to provide data to other teams and external third parties.

## Instructions
### Run in containers
Unfortunately I couldn't get compose to be flawless on startup, so there are a couple extra steps

1. Open two terminals in the project directory
1. Run `docker compose up` from one
1. Run `docker ps` to get the names or hashes of the two containers
1. In the other, get the postgers container ID/name and run
```
docker cp db-init.sql [CONTAINER_ID]:/
docker exec -it [CONTAINER_ID] psql -U postgres -d postgres -f /db-init.sql
```
### Run Locally
1. Run:
```
docker run --name postgres_db -e POSTGRES_PASSWORD=root -p 5432:5432 -d postgres postgres
docker cp db-init.sql postgres_db:/
```
2. Wait a couple seconds then run:
```
docker exec -it postgres_db psql -U postgres -d postgres -f /db-init.sql
```
3. If needed, copy `.env.example` to `.env` and edit it
4. Run `npm install`
5. Run `npm run start:dev`

### Call the service

1. Call `http://localhost:3000/PROPERTY/histogram` (or a different port)
    1. `property` is one of the commodity projection fields (Attribute, etc.)

## Requirements
1. Long term feature growth
2. Teams of up to around 10
3. Prioritize fast development
4. Horizontally scalable
5. Minimizes ramp up time for new developers
6. Flexible design - add new approaches, use different ones, etc.
7. Serves many clients and requires efficient results

## Assumptions
* This service will grow over time to support many different needs beyond USDA commodity data.
* The team will change over time and might have as many as 10 people working on it simultaneously
* Completeness is not a requirement for this project. E.g., I could add 
    * metrics
    * compression
    * rate limiting
    * caching
    * DB views
    * More tests
    * CI/CD
* URIs are case insensitive
* Will be heavily used

## Choices
### Nest
**Requirements Addressed**: 1-6

Nest is a 'batteries included' web project framework that has 
extensive documentation, broad compatibility, a clear structure, and 
built in support for all standard web application features
(filters, auth guards, websockets...).

It is opinionated but flexible about project structure, 
providing sensible defaults, but allowing for using other libraries for web, database,
runtime type validation, etc.

It also comes with code coverage, e2e, and linting with a single framework.

### Raw SQL
**Requirements Addressed**: 7

I used Raw sql for the histogram queries. I could have used a materialized view, regular view,
or updated a set of tables based on a trigger for changes to the base table.

I used raw sql because it's much more efficient than doing it in the code, and I think
it strikes a good balance between maintainable, fast, and not complex with triggers/views/etc.

### REST-like
**Requirements Addressed**: 1-5

REST is also a widely understood approach. However, I primarily chose to use a REST-like 
approach for simplicity and in the interest of time.

NEST also supports GraphQL, which is useful for reporting/analytics 
sources as it allows other teams to adjust the queries to their needs.

### Repository Database design
**Requirements Addressed**: 1-3, 5-6

TypeORM is one of the NEST's promoted ORM/Database frameworks. It uses the Repository
design pattern, which maximizes cohesion around Entities and their tables. This
provides a natural way for new developers to know where to look when a query needs
to be added/modified.

Also, Low Representational Gap (LRG) in the models - meaning the Entities, DTOs, and Tables try to match
one to one - is useful to reduce complexity for new and existing developers.

While the repository pattern is prioritized, it isn't exclusive, and database interactions
that don't fit well in any repo can be housed in a database layer.

Multiple database clients are supported by Nest and libraries, including Cassandra (ifaim).
Separate repository layers can be created if and when that is needed.

### Project Structure
**Requirements Addressed**: 1-3, 5

I chose a layered approach to the organization of the code, where each layer is separated into
folders. This keeps concerns separate and the keeps each code unit highly focused:
* controllers (entry points, validation)
* services (business logic and DTO mapping)
* filters
* dtos (API models)
* entities (DB ORM models)
* repositories (DB persistence access)
* migrations

As the project grows, modules can be used to group layers into folders. For example:

* root module
    * repositories
    * filters
    * commodity module
        * controllers
        * services
        * ...

Or if modules are not a good fit for everything, layers can be subdivided by entity:

* root module
    * controllers
        * commodity-projection
            * controller.ts
        * seed-stock
            * controller.ts

### Other choices
1. I used URL versioning for simplicity
    1. the default behavior without a version in the URL is to use the latest version
    1. I'd choose header versioning long term because it keeps the URLs simpler
1. Normally I'd provide a landing URL to get a payload about provided service URLs and supported versions
1. I used postgres due to time, but Cassandra would have been more horizontally scalable
1. I run the migrations on startup and the migrations live next to src and 'ship' with the code
    1. Separating them into a separate deployment step might be needed, depending on regulations/teams
1. I didn't spend time making sure the service starts and stays up and returns 503/etc if the database is inaccessible

#### Testing
Here's the approach I would like to take, given more time:
1. Unit tests
1. Component integration tests
    1. Create fakes for the repositories or the database client
    1. Use the fakes in tests that exercise the whole code base
    1. Add integration tests that verify the fake and the real implementation work the same
1. System/e2e tests for basic functionality

That said, the services right now are very simple, and testing something that's almost as simple as adding two numbers is sometimes
a waste of time and adds to the maintenance burden.