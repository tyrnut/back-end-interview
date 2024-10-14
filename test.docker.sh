mkdir tests-output
npm run test  -- --json --outputFile=tests-output/test-results.json
npm run test:int -- --json --outputFile=tests-output/integration-test-results.json 
npm run test:e2e -- --json --outputFile=tests-output/e2e-results.json