/**
 * Code block copy button.
 * Backported from upstream Chirpy clipboard feature, rewritten in vanilla JS
 * (no clipboard.js / Bootstrap Tooltip dependencies).
 */

(function () {
  'use strict';

  var TIMEOUT = 2000; // ms

  function getCodeText(btn) {
    var header = btn.closest('.code-header');
    if (!header) return '';
    var codeBlock = header.nextElementSibling; // <div class="highlight"><code>...</code></div>
    if (!codeBlock) return '';

    // blocks with line numbers: <td class="rouge-code"><pre>...</pre></td>
    var code = codeBlock.querySelector('.rouge-code pre');
    // blocks without line numbers: <pre> directly
    if (!code) {
      code = codeBlock.querySelector('pre:not(.lineno)');
    }
    if (!code) {
      return '';
    }
    /* innerText keeps visual line breaks; textContent as fallback */
    return code.innerText || code.textContent || '';
  }

  function init() {
    var buttons = document.querySelectorAll('.code-header > button');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.hasAttribute('timeout')) {
          return;
        }

        var text = getCodeText(btn);
        if (!text) {
          return;
        }

        var done = function () {
          var icon = btn.querySelector('i');
          if (!icon) return;
          icon.setAttribute('class', 'fas fa-check');
          btn.setAttribute('timeout', '');

          setTimeout(function () {
            icon.setAttribute('class', 'far fa-clipboard');
            btn.removeAttribute('timeout');
          }, TIMEOUT);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            fallbackCopy(text, done);
          });
        } else {
          fallbackCopy(text, done);
        }
      });
    });
  }

  /* fallback for non-secure contexts (http://localhost etc.) */
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      /* copy failed silently */
    }
    document.body.removeChild(ta);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
