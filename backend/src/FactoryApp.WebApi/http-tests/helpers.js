// ============================================================================
// HTTP CLIENT TEST HELPERS
// JavaScript module for JetBrains HTTP Client
// Import: import { tokenManager, errorValidator, ... } from "./helpers.js"
//
// Phase 1 Backend Integration (issue #91):
// - queryCounter.assertN1Free(maxQueries, label)
//   Verifies query count via response.body.extensions.queryCount
//   Backend must have QueryDiagnosticsMiddleware enabled
// - queryCounter.assertCount(expectedCount, label)
//   Assert exact query count match
// - queryCounter.getMetrics()
//   Extract queryCount + responseTimeMs from extensions
//
// Usage Example:
//   > {%
//     queryCounter.assertN1Free(2, "Build + parts");
//     queryCounter.logTiming();
//   %}
// ============================================================================

// Initialize global caches if not present
if (!client.global.get("_helpers_initialized")) {
  client.global.set("_tokenCache", JSON.stringify({}));
  client.global.set("_expirations", JSON.stringify({}));
  client.global.set("_baselines", JSON.stringify({}));
  client.global.set("_helpers_initialized", "true");
}

// ============================================================================
// TOKEN MANAGER
// Persistent JWT token management across requests
// ============================================================================

export var tokenManager = {
  saveToken: function (env, token) {
    if (!env) env = "dev";

    // Persist to global state
    var cache = JSON.parse(client.global.get("_tokenCache"));
    cache[env] = token;
    client.global.set("_tokenCache", JSON.stringify(cache));

    // Extract and save expiration
    try {
      var parts = token.split(".");
      if (parts.length === 3) {
        var payload = JSON.parse(atob(parts[1]));
        var expirations = JSON.parse(client.global.get("_expirations"));
        expirations[env] = payload.exp * 1000; // Convert to milliseconds
        client.global.set("_expirations", JSON.stringify(expirations));

        var expDate = new Date(expirations[env]);
        client.log("✓ Token saved for " + env + " (expires " + expDate.toISOString() + ")");
      }
    } catch (e) {
      client.log("⚠ Token saved (expiration parse failed)");
    }

    return token;
  },

  getCurrentToken: function (env) {
    if (!env) env = "dev";
    var cache = JSON.parse(client.global.get("_tokenCache"));
    return cache[env] || null;
  },

  isExpired: function (env) {
    if (!env) env = "dev";
    var expirations = JSON.parse(client.global.get("_expirations"));
    var expTime = expirations[env];
    if (!expTime) return null;
    return new Date().getTime() >= expTime;
  },

  getTimeRemaining: function (env) {
    if (!env) env = "dev";
    var expirations = JSON.parse(client.global.get("_expirations"));
    var expTime = expirations[env];
    if (!expTime) return null;
    var remaining = (expTime - new Date().getTime()) / 1000 / 60; // minutes
    return remaining > 0 ? remaining : 0;
  },

  assertNotExpired: function (env) {
    if (!env) env = "dev";
    var expired = this.isExpired(env);
    if (expired === true) {
      client.assert(
        false,
        "Token expired for " + env + ". Re-run login to refresh."
      );
    }
  },

  getAuthHeader: function (env) {
    if (!env) env = "dev";
    var token = this.getCurrentToken(env);
    return token ? "Bearer " + token : null;
  },

  logStatus: function (env) {
    if (!env) env = "dev";
    var token = this.getCurrentToken(env);
    if (!token) {
      client.log("⚠ No token for " + env);
      return;
    }
    var remaining = this.getTimeRemaining(env);
    if (remaining === null) {
      client.log("ℹ Token for " + env + ": saved (expiration unknown)");
    } else {
      client.log(
        "✓ Token for " + env + ": " + remaining.toFixed(1) + " min remaining"
      );
    }
  },

  clearToken: function (env) {
    if (!env) env = "dev";
    var cache = JSON.parse(client.global.get("_tokenCache"));
    delete cache[env];
    client.global.set("_tokenCache", JSON.stringify(cache));
    client.log("✓ Token cleared for " + env);
  },
};

// ============================================================================
// ERROR VALIDATOR
// Validate GraphQL error responses
// ============================================================================

export var errorValidator = {
  assertError: function (response, options) {
    client.test("GraphQL error present", function () {
      client.assert(
        response.body.errors && response.body.errors.length > 0,
        "Expected errors array in response"
      );
    });

    if (!options || !response.body.errors) return;

    var error = response.body.errors[0];

    if (options.message) {
      client.test("Error message matches", function () {
        var pattern =
          typeof options.message === "string"
            ? new RegExp(options.message)
            : options.message;
        client.assert(
          pattern.test(error.message),
          "Message mismatch: " + error.message
        );
      });
    }

    if (options.code) {
      client.test("Error code matches", function () {
        var actualCode = error.extensions ? error.extensions.code : null;
        client.assert(
          actualCode === options.code,
          "Code mismatch: expected " + options.code + ", got " + actualCode
        );
      });
    }
  },

  assertValidationError: function (response, fieldHint) {
    this.assertError(response, {
      message: fieldHint ? ".*" + fieldHint + ".*" : ".*",
    });
  },

  assertUnauthorized: function (response) {
    client.test("Auth error (401 or GraphQL)", function () {
      var is401 = response.status === 401;
      var isAuthError =
        response.body.errors &&
        response.body.errors.some(function (e) {
          return (
            e.message.toLowerCase().includes("unauthorized") ||
            e.message.toLowerCase().includes("invalid")
          );
        });
      client.assert(is401 || isAuthError, "Expected auth error");
    });
  },

  assertNoErrors: function (response) {
    client.test("No GraphQL errors", function () {
      client.assert(
        !response.body.errors || response.body.errors.length === 0,
        "Unexpected errors: " + JSON.stringify(response.body.errors)
      );
    });
  },
};

// ============================================================================
// QUERY COUNTER
// DataLoader N+1 detection via response extensions queryCount (Phase 1 backend)
// Also supports response time heuristics for backward compatibility
// ============================================================================

export var queryCounter = {
  recordBaseline: function (name) {
    var responseTime = parseFloat(response.responseTime) || 0;
    var baselines = JSON.parse(client.global.get("_baselines"));
    baselines[name] = responseTime;
    client.global.set("_baselines", JSON.stringify(baselines));
    client.log("ℹ Baseline: " + name + " (" + responseTime.toFixed(0) + "ms)");
  },

  assertUnder: function (maxTime, message) {
    var responseTime = parseFloat(response.responseTime) || 0;
    client.test("Query time < " + maxTime + "ms", function () {
      client.assert(
        responseTime < maxTime,
        (message || "Query slow") + ": " + responseTime.toFixed(0) + "ms"
      );
    });
  },

  assertBatchLoading: function (itemCount, expectedQueryCount) {
    // Heuristic: N+1 is linear O(N), batched is constant O(1)
    // Typical: 2 queries = ~20ms, N=10 queries = ~100ms
    var responseTime = parseFloat(response.responseTime) || 0;
    var threshold = (expectedQueryCount || 2) * 15; // ~15ms per query

    client.test("DataLoader batching check", function () {
      client.assert(
        responseTime < threshold,
        "Possible N+1: " +
          responseTime.toFixed(0) +
          "ms (threshold: " +
          threshold.toFixed(0) +
          "ms)"
      );
    });
  },

  // Phase 1 backend integration: Automated N+1 detection via queryCount
  assertN1Free: function (maxQueries, label) {
    var queryCount = response.body.extensions?.queryCount;
    label = label || "Query";

    client.test("N+1 prevention: " + label + " (queryCount ≤ " + maxQueries + ")", function () {
      client.assert(
        queryCount !== undefined,
        "Missing queryCount in response.body.extensions (backend query diagnostics not enabled)"
      );
      client.assert(
        queryCount <= maxQueries,
        label +
          " N+1 detected: " +
          queryCount +
          " queries executed (expected ≤" +
          maxQueries +
          ")"
      );
    });

    client.log("✓ " + label + ": " + queryCount + " queries (threshold: " + maxQueries + ")");
  },

  // Compare expected vs actual query count with tolerance
  assertCount: function (expectedCount, label) {
    var queryCount = response.body.extensions?.queryCount;
    label = label || "Query";

    client.test("Query count: " + label + " = " + expectedCount, function () {
      client.assert(
        queryCount !== undefined,
        "Missing queryCount in response.body.extensions"
      );
      client.assert(
        queryCount === expectedCount,
        label +
          " expected " +
          expectedCount +
          " query(ies), got " +
          queryCount
      );
    });
  },

  // Get metrics from response extensions
  getMetrics: function () {
    return {
      queryCount: response.body.extensions?.queryCount || null,
      responseTimeMs: response.body.extensions?.responseTimeMs || null,
      httpResponseTime: parseFloat(response.responseTime) || 0,
    };
  },

  logTiming: function () {
    var metrics = this.getMetrics();
    var msg =
      "ℹ Query count: " +
      (metrics.queryCount !== null ? metrics.queryCount : "unknown") +
      " | Response: " +
      metrics.httpResponseTime.toFixed(0) +
      "ms";
    client.log(msg);
  },
};

// ============================================================================
// PERFORMANCE TRACKER
// Response time tracking and regression detection
// ============================================================================

export var perfTracker = {
  recordBaseline: function (testName, responseTime) {
    if (!responseTime) responseTime = parseFloat(response.responseTime) || 0;
    var baselines = JSON.parse(client.global.get("_baselines"));
    baselines[testName] = responseTime;
    client.global.set("_baselines", JSON.stringify(baselines));
    client.log("⏱ Baseline: " + testName + " = " + responseTime.toFixed(0) + "ms");
  },

  assertUnder: function (maxMs, message) {
    var responseTime = parseFloat(response.responseTime) || 0;
    client.test("Performance: <" + maxMs + "ms", function () {
      client.assert(
        responseTime < maxMs,
        (message || "Slow query") + ": " + responseTime.toFixed(0) + "ms"
      );
    });
  },

  assertNoRegression: function (testName, allowedIncrease) {
    if (!allowedIncrease) allowedIncrease = 0.2; // 20% default

    var baselines = JSON.parse(client.global.get("_baselines"));
    var baseline = baselines[testName];
    if (!baseline) {
      client.log("⚠ No baseline for " + testName);
      return;
    }

    var responseTime = parseFloat(response.responseTime) || 0;
    var threshold = baseline * (1 + allowedIncrease);

    client.test("No regression: " + testName, function () {
      client.assert(
        responseTime < threshold,
        "Regression: " +
          responseTime.toFixed(0) +
          "ms vs baseline " +
          baseline.toFixed(0) +
          "ms"
      );
    });
  },
};

// ============================================================================
// SCHEMA VALIDATOR
// Response structure and type validation
// ============================================================================

export var schemaValidator = {
  assertFieldType: function (response, fieldPath, expectedType) {
    var parts = fieldPath.split(".");
    var value = response.body;

    for (var i = 0; i < parts.length; i++) {
      value = value[parts[i]];
      if (value === undefined) break;
    }

    var actualType = value === null ? "null" : typeof value;
    if (Array.isArray(value)) actualType = "array";

    client.test("Field type: " + fieldPath + " is " + expectedType, function () {
      client.assert(
        actualType === expectedType,
        "Type mismatch at " + fieldPath + ": expected " + expectedType + ", got " + actualType
      );
    });
  },

  assertFieldExists: function (response, fieldPath) {
    var parts = fieldPath.split(".");
    var value = response.body;

    for (var i = 0; i < parts.length; i++) {
      value = value[parts[i]];
      if (value === undefined) {
        client.assert(false, "Field missing: " + fieldPath);
        return;
      }
    }

    client.test("Field exists: " + fieldPath, function () {
      client.assert(
        value !== undefined && value !== null,
        "Field empty: " + fieldPath
      );
    });
  },

  assertEnumValue: function (response, fieldPath, validValues) {
    var parts = fieldPath.split(".");
    var value = response.body;

    for (var i = 0; i < parts.length; i++) {
      value = value[parts[i]];
    }

    client.test("Enum valid: " + fieldPath, function () {
      var isValid = validValues.indexOf(value) >= 0;
      client.assert(
        isValid,
        "Invalid enum at " + fieldPath + ": " + value
      );
    });
  },

  assertUUID: function (response, fieldPath) {
    var parts = fieldPath.split(".");
    var value = response.body;

    for (var i = 0; i < parts.length; i++) {
      value = value[parts[i]];
    }

    var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    client.test("UUID valid: " + fieldPath, function () {
      client.assert(
        uuidPattern.test(value),
        "Invalid UUID at " + fieldPath + ": " + value
      );
    });
  },
};
