# Back-end Developer Interview

## Expectations:

1. Using Typescript with any framework(s) you enjoy
2. Feel free to be creative, but the result NEED NOT BE COMPLEX or excessively time-consuming
3. We will review your work together during the in-person interview
4. Send a link to the source, a repository URL or a zip file of your project the day before your interview day

## Exercise:

Start with the included `Projection2021.csv` file. Ignore `FeedGrains.csv` for now.

Create an API service that provides a GET histogram route for each column in the table. For example, the following URLs should be successfully resolved by the service:

* http://localhost/Commodity/histogram
* http://localhost/CommodityType/histogram
* Etc.

A GET request on any of these URLs should return JSON with the count of how many times each unique value appears in that column of the data. For example in the Commodity column, “Rice” appears 216 times, “Corn” 240, etc.

This service should be runnable using one of:
* AWS lambda
* In Docker using `docker-compose up` or `docker run` command you provide
* A simple readme describing how to start the service
* http://repl.it or similar

Be prepared to talk about one aspect of this exercise you found interesting, or feel free to add (or not) any optimization or feature you find interesting and would like to talk about. For example:
* Visualizations
* Testing strategies
* Persisting data
* Data modeling / analytics
* API structure / versioning
* ???

## Data source notes
1. `Projection2021.csv` - sourced from the "USDA Agricultural Baseline Database" for the current year projections https://www.ers.usda.gov/media/u55iwexw/projection2021.zip
2. `FeedGrains.csv` - sourced from the “USDA Feed Grains: Yearbook Tables” available at https://www.ers.usda.gov/data-products/feed-grains-database/feed-grains-yearbook-tables/



