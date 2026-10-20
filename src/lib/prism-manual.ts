// Must run before Prism loads: without it Prism highlights every
// code[class*="language-"] on the page by itself once the DOM is ready.
const scope = globalThis as { Prism?: { manual?: boolean } }
scope.Prism = { ...scope.Prism, manual: true }
