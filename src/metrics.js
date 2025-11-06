const config = require('./config');
const os = require('os');

// Create data structures to hold metrics
const requests = {};
const authAttempts = {};

// Create functions to expose in middleware that update metrics data structures

// HTTP request metric
function requestTracker(req, res, next) {
  const method = `${req.method}`;
  requests[method] = (requests[method] || 0) + 1;
  next();
}

// Active user metric
const activeUsers = new Map();
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function markUserActive(userId) {
  if (activeUsers.has(userId)) {
    clearTimeout(activeUsers.get(userId));
  }
  const timer = setTimeout(() => activeUsers.delete(userId), ACTIVE_WINDOW_MS);
  activeUsers.set(userId, timer);
}

function trackLogin(req, res, next) {
  let user = req.user;
  if (user) {
    markUserActive(user.id);
  }

  next();
}

function getActiveUserCount() {
  return activeUsers.size;
}
// Authentication Attempts
function authenticationTracker(authStatus) {
  authAttempts[authStatus] = (authAttempts[authStatus] || 0) + 1
}
// CPU and Memory
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}
// Pizzas Sold

let revenue = 0;
let pizzaSales = 0;
let pizzaFails = 0;

function trackOrder(order, status) {
  if (status === "success") {
    order.items.forEach((item) => {
      pizzaSales++;
      revenue += item.price;
    });
  } else if (status === "failure") {
    pizzaFails += order.items.length;
  }
}

// Latency
const latencies = [];

function latencyTracker(req, res, next) {
  const start = process.hrtime.bigint(); // high-resolution time

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000; // convert to ms
    latencies.push(durationMs);
  });

  next();
}

function getAverageLatency(latenciesArray) {
  if (latenciesArray.length === 0) return 0;
  const sum = latenciesArray.reduce((a, b) => a + b, 0);
  return sum / latenciesArray.length;
}

const pizzaLatency = [];

function pizzaLatencyTracker(latency) {
  pizzaLatency.push(latency);
}

// Build OTel request body

setInterval(() => {
  const metrics = [];
  Object.keys(requests).forEach((method) => {
    metrics.push(createMetric('requests', requests[method], '1', 'sum', 'asInt', { method }));
  });
  Object.keys(authAttempts).forEach((status) => {
    metrics.push(createMetric('authentications', authAttempts[status], '1', 'sum', 'asInt', { status }));
  });
  metrics.push(createMetric('cpu', getCpuUsagePercentage(), '%', 'gauge', 'asDouble', { }));
  metrics.push(createMetric('memoryUsage', getMemoryUsagePercentage(), '%', 'gauge', 'asDouble', { }));
  metrics.push(createMetric('activeUsers', getActiveUserCount(), '1', 'gauge', 'asInt', { }));
  metrics.push(createMetric('requestLatency', getAverageLatency(latencies), 'ms', 'gauge', 'asDouble', {}));
  metrics.push(createMetric('pizzaLatency', getAverageLatency(pizzaLatency), 'ms', 'gauge', 'asDouble', {}));
  metrics.push(createMetric('pizzasSold', pizzaSales, '1', 'sum', 'asInt', { saleStatus: "success" })); // We could track this by franchise in the future
  metrics.push(createMetric('pizzasSold', pizzaFails, '1', 'sum', 'asInt', { saleStatus: "fail" })); // We could track this by franchise in the future
  metrics.push(createMetric('revenue', revenue, '1', 'sum', 'asDouble', {}));

  sendMetricToGrafana(metrics);
  latencies.length = 0;
  pizzaLatency.length = 0;
}, 10000);

function createMetric(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === 'sum') {
    metric[metricType].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
    metric[metricType].isMonotonic = true;
  }

  return metric;
}

function sendMetricToGrafana(metrics) {
  const body = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics,
          },
        ],
      },
    ],
  };

  fetch(`${config.metrics.url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}
// Send metrics to Grafana periodically

module.exports = {
  requestTracker,
  authenticationTracker,
  markUserActive,
  trackLogin,
  latencyTracker,
  pizzaLatencyTracker,
  trackOrder,
};