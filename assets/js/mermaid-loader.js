/**
 * Mermaid.js loader (backport from upstream Chirpy _javascript/modules/components/mermaid.js)
 * Adapted to this theme's html[mode] color-scheme switching (no Theme util dependency).
 *
 * Renders ```mermaid code blocks as SVG diagrams, re-renders on mode toggle.
 * mermaid.min.js (self-hosted IIFE build) must be loaded before this script.
 */

(function () {
  'use strict';

  if (typeof mermaid === 'undefined' || typeof mermaid.initialize !== 'function') {
    return;
  }

  function currentTheme() {
    var mode = document.documentElement.getAttribute('mode');
    if (mode === 'dark') { return 'dark'; }
    if (mode === 'light') { return 'default'; }
    return (typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'default';
  }

  /* transform <pre><code class="language-mermaid"> into <div class="mermaid"> */
  function transformNodes() {
    var codes = document.querySelectorAll('code.language-mermaid');
    Array.prototype.forEach.call(codes, function (code) {
      var pre = code.parentElement;
      if (!pre || pre.tagName !== 'PRE' || pre.dataset.mermaidDone) {
        return;
      }
      pre.dataset.mermaidDone = '1';

      var div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      pre.parentNode.insertBefore(div, pre.nextSibling);
      pre.style.display = 'none';
    });
  }

  function render() {
    mermaid.initialize({ theme: currentTheme(), startOnLoad: false });
    mermaid.run({ nodes: document.querySelectorAll('div.mermaid') });
  }

  /* re-render diagrams when the color mode toggles */
  new MutationObserver(function (mutations) {
    var modeChanged = mutations.some(function (m) { return m.attributeName === 'mode'; });
    if (!modeChanged) { return; }

    var nodes = document.querySelectorAll('div.mermaid');
    Array.prototype.forEach.call(nodes, function (div) {
      /* restore the raw definition and drop the rendered SVG */
      var svg = div.querySelector('svg');
      if (svg) { svg.remove(); }
      div.removeAttribute('data-processed');
    });

    mermaid.initialize({ theme: currentTheme(), startOnLoad: false });
    mermaid.run({ nodes: nodes });
  }).observe(document.documentElement, { attributes: true });

  transformNodes();
  render();
})();
