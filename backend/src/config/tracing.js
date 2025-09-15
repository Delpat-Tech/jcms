// src/config/tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');

// Configure exporter - use console for development
const traceExporter = new ConsoleSpanExporter();

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || 'jcms-api',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation to reduce noise
      },
    }),
  ],
});

// Start tracing
sdk.start();

module.exports = sdk;