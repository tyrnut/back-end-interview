import http from 'k6/http';
import { sleep } from 'k6';
import { HOST, PORT } from './config.js';

export const options = {
  vus: 10,
  duration: '30s',
}

export default function() {
  http.get(`http://${HOST}:${PORT}/value/histogram`);
  sleep(1);
}
