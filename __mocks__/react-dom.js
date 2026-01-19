/**
 * Mock react-dom to render portals inline in tests
 * This fixes React 19 + Next.js 16 portal components not rendering in testing-library container
 * Source: https://github.com/testing-library/react-testing-library/issues/62
 */

const ReactDOM = jest.requireActual('react-dom');

module.exports = {
  ...ReactDOM,
  // Render portal content inline instead of to document.body
  // This ensures testing-library can find the content in its container
  createPortal: (node) => node,
};
