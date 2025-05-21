module.exports = {

"[externals]/next/dist/compiled/next-server/app-page.runtime.dev.js [external] (next/dist/compiled/next-server/app-page.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/src/components/SafariDesktopFix.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const SafariDesktopFix = ()=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
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
    }, []);
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
const __TURBOPACK__default__export__ = SafariDesktopFix;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__7f98ba01._.js.map