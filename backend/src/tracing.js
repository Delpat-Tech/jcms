// src/tracing.js
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('jcms-api', '1.0.0');

const createSpan = (name, options = {}) => {
  return tracer.startSpan(name, options);
};

const addSpanAttributes = (span, attributes) => {
  if (span && attributes) {
    span.setAttributes(attributes);
  }
};

module.exports = {
  createSpan,
  addSpanAttributes,
  tracer
};