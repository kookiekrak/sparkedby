(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_components_SafariDesktopFix_tsx_96ca7f8b._.js", {

"[project]/src/components/SafariDesktopFix.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
const SafariDesktopFix = ()=>{
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SafariDesktopFix.useEffect": ()=>{
            // Workaround for Safari on Ventura (2022 builds)
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
                // Check if we're on desktop width
                const isDesktopWidth = window.innerWidth >= 768;
                // Check if we have the special parameter or cookie
                const urlParams = new URLSearchParams(window.location.search);
                const hasDesktopParam = urlParams.get('view') === 'desktop';
                const hasDesktopCookie = document.cookie.indexOf('useDesktopView=true') !== -1;
                // If we're on desktop Safari but don't have the special parameter or cookie
                if (isDesktopWidth && !hasDesktopParam && !hasDesktopCookie) {
                    // Set the cookie
                    document.cookie = "useDesktopView=true; path=/; max-age=31536000";
                }
                // Force viewport width to trigger desktop layout
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=1024, initial-scale=1');
                }
                // Apply fixes immediately and then also after a delay
                applyDesktopFixes();
                // Also apply fixes after a delay to ensure they work
                setTimeout(applyDesktopFixes, 100);
                // And one more time after page is fully loaded
                window.onload = applyDesktopFixes;
            }
        }
    }["SafariDesktopFix.useEffect"], []);
    // Function to apply desktop fixes
    function applyDesktopFixes() {
        // Force desktop navigation menu
        const navMenu = document.querySelector('nav.hidden.md\\:flex');
        if (navMenu) {
            navMenu.style.display = 'flex';
        }
        // Force visible desktop elements
        document.querySelectorAll('.md\\:block').forEach((el)=>{
            el.style.display = 'block';
        });
        // Hide mobile elements
        document.querySelectorAll('.md\\:hidden').forEach((el)=>{
            el.style.display = 'none';
        });
        // Add Safari desktop class to body
        document.body.classList.add('safari-desktop');
        // Set data attribute to indicate viewport type
        const landingPage = document.getElementById('landing-page');
        if (landingPage) {
            landingPage.setAttribute('data-viewer', 'desktop');
        }
        // Explicitly show desktop nav
        const desktopNav = document.getElementById('desktop-nav');
        if (desktopNav) {
            desktopNav.style.display = 'flex';
        }
    }
    return null;
};
_s(SafariDesktopFix, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = SafariDesktopFix;
const __TURBOPACK__default__export__ = SafariDesktopFix;
var _c;
__turbopack_context__.k.register(_c, "SafariDesktopFix");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_components_SafariDesktopFix_tsx_96ca7f8b._.js.map