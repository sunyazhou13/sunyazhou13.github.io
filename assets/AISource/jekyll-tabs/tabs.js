!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.jekyllTabs=t():e.jekyllTabs=t()}(self,(()=>(()=>{"use strict";var e={296:(e,t,o)=>{o.r(t),o.d(t,{addClass:()=>r,createElementFromHTML:()=>s,findElementsWithTextContent:()=>n,getChildPosition:()=>a});const a=e=>{const t=e.parentNode;for(let o=0;o<t.children.length;o++)if(t.children[o]===e)return o},n=(e,t)=>{const o=document.querySelectorAll(e),a=[];for(let e=0;e<o.length;e++){const n=o[e];n.textContent.trim()===t.trim()&&a.push(n)}return a},s=e=>{const t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstChild},r=(e,t,o)=>{e.className=e.className?`${e.className} ${t}`:t,setTimeout((()=>{e.className=e.className.replace(t,"").trim()}),o)}},928:(e,t,o)=>{o.r(t),o.d(t,{activateTabFromUrl:()=>d,addCopyToClipboardButtons:()=>u,appendToastMessageHTML:()=>b,copyToClipboard:()=>c,handleTabClicked:()=>i,removeActiveClasses:()=>l,syncTabsWithSameLabels:()=>y,updateUrlWithActiveTab:()=>p});const{getChildPosition:a,createElementFromHTML:n,findElementsWithTextContent:s,addClass:r}=o(296),l=e=>{const t=e.querySelectorAll("ul > li");Array.prototype.forEach.call(t,(e=>{e.classList.remove("active")}))},i=e=>{const t=e.parentNode,o=t.parentNode,n=a(t);if(t.className.includes("active"))return;const s=o.getAttribute("data-tab");if(!s)return;const r=document.getElementById(s);l(o),l(r),r.querySelectorAll("ul.tab-content > li")[n].classList.add("active"),t.classList.add("active")},c=(e,t)=>{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(e);else{const t=document.createElement("textarea");t.value=e,t.style.position="absolute",t.style.left="-999999px",document.body.prepend(t),t.select();try{document.execCommand("copy")}catch(e){console.error(e)}finally{t.remove()}}"function"==typeof t&&t()},d=()=>{var e;const t=null===(e=window.location.hash)||void 0===e?void 0:e.substring(1);if(!t)return;const o=document.getElementById(t);if(!o)return;const a=new URLSearchParams(window.location.search).get("active_tab");if(!a)return;const n=o.querySelector("li#"+a+" > a");n&&i(n)},p=e=>{const t=e.parentNode,o=t.parentNode,a=new URLSearchParams(window.location.search);a.set("active_tab",t.id);const n=window.location.pathname+"?"+a.toString()+"#"+o.id;history.replaceState(null,"",n)},u=({buttonHTML:e,showToastMessageOnCopy:t,toastDuration:o})=>{const a=document.querySelectorAll("ul.tab-content > li pre");for(let s=0;s<a.length;s++){const r=a[s],l=r.parentNode,i=n(e);let d;l.style.position="relative",i.style.position="absolute",i.style.top="0px",i.style.right="0px",l.appendChild(i),t&&(d=(()=>{m(o)})),i.addEventListener("click",(()=>{c(r.innerText,d)}))}},b=e=>{const t=document.createElement("div");t.id="jekyll-tabs-copy-to-clipboard-message",t.textContent=e,document.getElementsByTagName("body")[0].appendChild(t)},m=e=>{r(document.getElementById("jekyll-tabs-copy-to-clipboard-message"),"show",e)},y=e=>{const t=s("a",e.textContent);for(let o=0;o<t.length;o++)t[o]!==e&&i(t[o])}}},t={};function o(a){var n=t[a];if(void 0!==n)return n.exports;var s=t[a]={exports:{}};return e[a](s,s.exports,o),s.exports}o.d=(e,t)=>{for(var a in t)o.o(t,a)&&!o.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},o.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var a={};o.r(a),o.d(a,{init:()=>d});const{activateTabFromUrl:n,updateUrlWithActiveTab:s,handleTabClicked:r,addCopyToClipboardButtons:l,syncTabsWithSameLabels:i,appendToastMessageHTML:c}=o(928),d=(e={})=>{const t={syncTabsWithSameLabels:!1,activateTabFromUrl:!1,addCopyToClipboardButtons:!1,copyToClipboardSettings:{buttonHTML:"<button>Copy</button>",showToastMessageOnCopy:!1,toastMessage:"Code copied to clipboard",toastDuration:3e3}},o=Object.assign(Object.assign(Object.assign({},t),e),{copyToClipboardSettings:Object.assign(Object.assign({},t.copyToClipboardSettings),e.copyToClipboardSettings)}),a=document.querySelectorAll("ul.tab > li > a");if(Array.prototype.forEach.call(a,(e=>{e.addEventListener("click",(t=>{t.preventDefault(),r(e),o.activateTabFromUrl&&s(e),o.syncTabsWithSameLabels&&i(e)}),!1)})),o.addCopyToClipboardButtons){const e=o.copyToClipboardSettings;l(e),e.showToastMessageOnCopy&&c(e.toastMessage)}o.activateTabFromUrl&&n()};return a})()));
 
/* 标题栏增强：每组 Tab 只保留一个「复制当前代码」按钮，放在 ul.tab 最右侧。 */
/* 官方只监听 ul.tab > li > a 做切换，这里用 button，二者互不干扰。 */
function jtEnhanceTabs() {
  var bars = document.querySelectorAll('ul.tab[data-tab]');
  Array.prototype.forEach.call(bars, function (bar) {
    if (bar.querySelector('li.tab-copy')) { return; } /* 幂等 */

    var li = document.createElement('li');
    li.className = 'tab-copy';
    li.innerHTML = '<button type="button" class="tab-copy-btn" aria-label="复制当前代码" title="复制当前代码"><i class="far fa-clipboard"></i></button>';
    bar.appendChild(li);

    var btn = li.firstChild;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      /* getElementById 避开 UUID 以数字开头时 CSS 选择器非法的问题 */
      var wrap = document.getElementById(bar.getAttribute('data-tab'));
      if (!wrap) { return; }

      var panel = null;
      for (var i = 0; i < wrap.children.length; i++) {
        if (wrap.children[i].classList.contains('active')) { panel = wrap.children[i]; break; }
      }
      if (!panel) { return; }

      var pre = panel.querySelector('.rouge-code pre') || panel.querySelector('pre:not(.lineno)');
      if (!pre) { return; }
      var text = pre.innerText || pre.textContent || '';
      if (!text) { return; }

      jtCopyText(text, function () {
        var icon = btn.querySelector('i');
        if (icon) { icon.setAttribute('class', 'fas fa-check'); }
        btn.setAttribute('data-copied', '');
        btn.setAttribute('title', '已复制');
        setTimeout(function () {
          if (icon) { icon.setAttribute('class', 'far fa-clipboard'); }
          btn.removeAttribute('data-copied');
          btn.setAttribute('title', '复制当前代码');
        }, 2000);
      });
    });
  });
}

function jtCopyText(text, done) {
  /* 非安全上下文（http / 本地预览）走 execCommand 兜底 */
  function legacy() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(legacy);
  } else {
    legacy();
  }
}

window.addEventListener('load', function () {
  jekyllTabs.init({
    syncTabsWithSameLabels: false,
    activateTabFromUrl: false,
    /* 关闭官方复制按钮：它给每个面板塞 absolute 按钮，既压住行号又与 Chirpy 的重复 */
    addCopyToClipboardButtons: false
  });
  jtEnhanceTabs();
});
