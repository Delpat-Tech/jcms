// src/utils/tracing.js
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('jcms-api', '1.0.0');

/**
 * Create a custom span for database operations
 */
const createDatabaseSpan = (operation, collection) => {
  return tracer.startSpan(`db.${operation}`, {
    attributes: {
      'db.system': 'mongodb',
      'db.operation': operation,
      'db.collection.name': collection,
    },
  });
};

/**
 * Create a custom span for image processing operations
 */
const createImageProcessingSpan = (operation, format) => {
  return tracer.startSpan(`image.${operation}`, {
    attributes: {
      'image.operation': operation,
      'image.format': format,
    },
  });
};

/**
 * Create a custom span for authentication operations
 */
const createAuthSpan = (operation) => {
  return tracer.startSpan(`auth.${operation}`, {
    attributes: {
      'auth.operation': operation,
    },
  });
};

/**
 * Wrap async function with tracing
 */
const traceAsyncFunction = async (spanName, fn, attributes = {}) => {
  const span = tracer.startSpan(spanName, { attributes });
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
};

module.exports = {
  tracer,
  createDatabaseSpan,
  createImageProcessingSpan,
  createAuthSpan,
  traceAsyncFunction,
};