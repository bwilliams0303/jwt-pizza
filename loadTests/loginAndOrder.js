import { sleep, check, group, fail } from 'k6';
import http from 'k6/http';

const pizzaUrl = 'https://pizza.firelink.click';
const serviceUrl = 'https://pizza-service.firelink.click';
const factoryUrl = 'https://pizza-factory.cs329.click';

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
};

// Ends the iteration when a request does not return the expected status,
// so a failed login does not cascade into failed orders.
function requireStatus(response, name, expectedStatus) {
  if (!check(response, { [`${name} status equals ${expectedStatus}`]: (r) => r.status === expectedStatus })) {
    console.log(response.body);
    fail(`${name} was *not* ${expectedStatus}`);
  }
}

function jsonHeaders(authToken) {
  const headers = {
    accept: '*/*',
    'content-type': 'application/json',
    origin: pizzaUrl,
  };
  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }
  return { headers };
}

export function scenario_1() {
  let response;

  const vars = {};

  group(`Login and order pizza - ${pizzaUrl}/`, function () {
    // Home page
    response = http.get(`${pizzaUrl}/`, { headers: { accept: 'text/html' } });
    sleep(2);

    // Login
    response = http.put(`${serviceUrl}/api/auth`, '{"email":"d@jwt.com","password":"diner"}', jsonHeaders());
    requireStatus(response, 'Login', 200);
    vars.authToken = response.json().token;
    sleep(2);

    // Get menu
    response = http.get(`${serviceUrl}/api/order/menu`, jsonHeaders(vars.authToken));

    // Get franchises
    response = http.get(`${serviceUrl}/api/franchise?page=0&limit=20&name=*`, jsonHeaders(vars.authToken));
    sleep(3);

    // Get current user (payment page)
    response = http.get(`${serviceUrl}/api/user/me`, jsonHeaders(vars.authToken));
    sleep(2);

    // Purchase pizza
    response = http.post(
      `${serviceUrl}/api/order`,
      '{"items":[{"menuId":1,"description":"Veggie","price":0.0038}],"storeId":"1","franchiseId":1}',
      jsonHeaders(vars.authToken)
    );
    requireStatus(response, 'Purchase', 200);
    vars.pizzaJwt = response.json().jwt;
    sleep(2);

    // Verify pizza
    response = http.post(`${factoryUrl}/api/order/verify`, JSON.stringify({ jwt: vars.pizzaJwt }), jsonHeaders(vars.authToken));
    check(response, { 'Verify status equals 200': (r) => r.status === 200 });
    sleep(1);
  });
}
