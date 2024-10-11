# Report API

## Overview
This is a data API intended to provide data to other teams and external third parties.

## Instructions
### Run in containers
1. Run `docker compose up -d`
1. Run `docker cp db-init.sql rmdb:/`
1. Run `docker exec -it rmdb psql -U postgres -d postgres -f /db-init.sql`

### Run Locally
1. Run `docker run --name postgres_db -e POSTGRES_PASSWORD=root -p 5432:5432 -d postgres postgres`
1. Run `docker cp db-init.sql postgres_db:/`
1. Run `docker exec -it postgres_db psql -U postgres -d postgres -f /db-init.sql`
1. If needed, copy `.env.example` to `.env` and edit it. It will use defaults if not provided
1. Run `npm install`
1. Run `npm run start:dev`

### Call the service

1. Call `http://localhost:3000/PROPERTY/histogram` (or a different port)
    1. `property` is one of the commodity projection fields (Attribute, etc.)
1. Visit `http://localhost:3000/v1/metrics` to see prometheus metrics (Note: the version could be removed at a later time using a Controller)

## Requirements
1. Long term feature growth
2. Teams of up to around 10
3. Prioritize fast development
4. Horizontally scalable
5. Minimizes ramp up time for new developers
6. Flexible design - add new approaches, use different ones, etc.
7. Serves many simultaneous clients and requires efficient processing

## Assumptions
* This service will grow over time to support many different needs beyond USDA commodity data.
* The team will change over time and might have as many as 10 people working on it simultaneously
* Completeness is not a requirement for this project. E.g., I could add caching, rate limiting, etc.
* URIs are case insensitive

## Choices
### Nest
**Requirements Addressed**: 1-6

Nest is a 'batteries included' web project framework that has 
extensive documentation, broad compatibility, a clear structure, and 
built in support for all standard web application features
(filters, auth guards, websockets...).

It is opinionated but flexible about project structure, 
providing sensible defaults, and allowing for the use of other libraries: web, database,
validation, etc.

It also comes with code coverage, e2e, linting, and other capabilities without any extra work.

### Raw SQL
**Requirements Addressed**: 7

I used Raw sql for the histogram queries. I could have used a materialized view, regular view,
or updated a set of tables based on a trigger for changes to the base table.

I could have queried everything and calculated the histogram in memory, which would be slower and
less maintainable, but it would have utilized ORM style data access, which slightly improves
maintainability during refactoring.

Raw sql is slightly less maintainable, but as long as it's only used for operations that don't
cleanly map to an Entity, the use should be rare. It's much faster and requires less
maintenance and troubleshooting of code.

### REST-like
**Requirements Addressed**: 1-5

REST is a widely understood approach. I primarily chose to use a REST-like 
approach for simplicity and in the interest of time.

**NEST** also supports GraphQL, which is useful for 3rd party reporting/analytics 
sources as it allows other teams to adjust the queries to their needs.

### Repository Database design
**Requirements Addressed**: 1-3, 5-6

TypeORM is one of NEST's ORM/Database frameworks. It uses the Repository
design pattern, which maximizes cohesion around Entities and their tables. This
provides a natural way for new developers to know where to look when a query needs
to be added/modified.

Also, Low Representational Gap (LRG) in the models - meaning the Entities, DTOs, and Tables try to match
one to one - is useful to reduce complexity for new and existing developers.

While the repository pattern is prioritized, it isn't exclusive, and database interactions
that don't fit well in any repository can be housed in a database layer alongside the repositories.

Multiple database clients are supported by Nest and libraries, including Cassandra (see `ifaim`).

### Project Structure
**Requirements Addressed**: 1-3, 5

I chose a layered approach to the organization of the code, where each layer is separated into
folders. This keeps concerns separate and keeps each code unit highly focused:
* controllers (entry points, validation)
* services (business logic and DTO mapping)
* middleware
* ...

As the project grows, modules can be used to group layers into folders. For example:

* root module
    * repositories
    * filters
    * commodity module
        * controllers
        * services
        * ...

Or if modules are not a good fit, layers can be subdivided by entity:

* root module
    * controllers
        * commodity-projection
            * controller.ts
        * seed-stock
            * controller.ts

## Other choices
1. I used URL versioning for simplicity
    1. the default behavior without a version in the URL is to use the latest version
    1. I'd choose header versioning long term because it keeps the URLs simpler
1. Normally I'd provide a landing URL to get a payload about provided service URLs and supported versions
1. I used postgres due to time, but it's also a better choice when ALL the fields in a column have to be queried.
1. I run the migrations on startup. The migrations sit next to `src/` and 'ship' with the code
    1. Separating them into a separate deployment step might be needed, depending on regulations/teams
1. I didn't spend time making sure the service starts and stays up and returns 503/etc if the database is inaccessible
    1. Ideally the service and respond whether the database is available or not
1. I incorporated zod to get some 'type safety' assurance from DB models and DTO models. If something is going wrong, it would
   probably be better to be alerted to it and potentially fail a call than to not know about an issue for weeks.
1. I didn't use a mapper of any kind and just mapped DTOs/db models by hand in the service layer. I would definitely consider
    it premature optimization to use a mapping layer or tool at this point.

## Testing
Here's the approach I would like to take, given more time:
1. Component integration tests
    1. Create fakes for the repositories or the database client
    1. Use the fakes in tests that exercise the whole code base
    1. Add integration tests that verify the fake and the real implementation work the same
1. Understand how to use the Nest auto-mocking instead of falling back to mockito
1. Load/performance testing - I prefer to run these within containers to have repeatable results

That said, the services right now are very simple, and testing something that's almost as simple as adding two numbers is sometimes
a waste of time and adds to the maintenance burden.

## Alternative approaches
1. If this is all this service will ever do, there's probably little need for the rigorous framework inspired by Nest, and
    almost everything could be done in a single file of less than 100 lines.
    1. In addition, this could be part of a microservice mesh that handles only projection histogram calls, in which case the short-and-sweet would be justified
1. Instead of querying the table for the data (which probably rarely changes based on the year column), materialized views
    or separate tables could be setup to be updated if the table ever changes using a Trigger or other mechanism.
1. A lambda could be used to insert new projections from an SQS queue