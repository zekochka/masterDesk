// MasterDesk LZ11. API routes/body are configurable; update to match actual OpenAPI.
// Never run POST scenario on production; only a disposable test database.
import http from 'k6/http';
import { check } from 'k6';

const mode = __ENV.TEST_SCENARIO || 'list';
const base = (__ENV.API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const path = __ENV.ORDERS_PATH || '/api/orders'; // verify route with Swagger
const token = __ENV.AUTH_TOKEN || '';
const headers = {'Content-Type': 'application/json'};
if (token) headers.Authorization = `Bearer ${token}`;

const listOptions = {scenarios: {list: {executor:'shared-iterations', vus:5, iterations:100, maxDuration:'2m'}},
  thresholds:{'http_req_duration{scenario:list}':['p(95)<=2000'], 'http_req_failed{scenario:list}':['rate<=0.01']}};
const createOptions = {scenarios: {create: {executor:'shared-iterations', vus:5, iterations:50, maxDuration:'2m'}},
  thresholds:{'http_req_duration{scenario:create}':['p(95)<=1500'],'http_req_failed{scenario:create}':['rate<=0.01']}};
const scaleOptions = {scenarios: {scale: {executor:'constant-vus', vus:10, duration:'5m'}},
  thresholds:{'http_req_failed{scenario:scale}':['rate<=0.01']}};
export const options = mode === 'create' ? createOptions : (mode === 'scale' ? scaleOptions : listOptions);

export default function () {
  if (mode === 'create') {
    // The JSON body below is only a placeholder. Match field names to the backend's OpenAPI schema.
    const payload = __ENV.CREATE_ORDER_BODY || JSON.stringify({
      clientName:'TEST CLIENT', clientPhone:'0000000000', deviceType:'Ноутбук',
      issueDescription:'TEST: Экран ақауы', isSynthetic:true
    });
    const res = http.post(base + path, payload, {headers});
    check(res, {'NFR-02: creation response 200/201':r=>[200,201].includes(r.status)});
  } else {
    const res = http.get(base + path, {headers});
    check(res, {'NFR-01/03: orders list status 200':r=>r.status===200});
  }
}
