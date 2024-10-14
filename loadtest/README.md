# Overview
Load tests for the server

## Instructions
### Run in compose
1. From this directory, `docker compose -f ../docker-compose.yaml -f docker-compose.yaml up` or one of the `run.*` scripts
1. A `k6.results` file will house the results

### CI/CD
In CI/CD this can be output to a timeseries DB (like influxdb) or the file can be used to display results

### Future
The approach here can be extended to run on multiple distributed containers in a kube cluster