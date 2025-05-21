module.exports = {

"[externals]/next/dist/compiled/next-server/app-page.runtime.dev.js [external] (next/dist/compiled/next-server/app-page.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/src/components/BrowserDetection.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const BrowserDetection = ()=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Function to detect Safari
        const isSafari = ()=>{
            const ua = navigator.userAgent.toLowerCase();
            return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
        };
        // Function to detect if device is desktop
        const isDesktop = ()=>{
            return window.innerWidth >= 768;
        };
        // Function to detect mobile Safari specifically
        const isMobileSafari = ()=>{
            const ua = navigator.userAgent.toLowerCase();
            return isSafari() && (ua.indexOf('iphone') !== -1 || ua.indexOf('ipod') !== -1);
        };
        // Function to fix pricing section more deeply
        const deepFixPricing = ()=>{
            // Fix pricing card layout
            document.querySelectorAll('#pricing .rounded-xl').forEach((card)=>{
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.height = 'auto';
                card.style.overflow = 'hidden';
                card.style.borderRadius = '0.75rem';
            });
            // Fix pricing top section
            document.querySelectorAll('#pricing .p-8.flex.flex-col, #pricing .p-8.bg-white.flex.flex-col').forEach((topSection)=>{
                topSection.style.display = 'flex';
                topSection.style.flexDirection = 'column';
                topSection.style.padding = '2rem';
                topSection.style.minHeight = '280px';
                topSection.style.backgroundColor = 'white';
            });
            // Fix titles
            document.querySelectorAll('#pricing h3').forEach((title)=>{
                title.style.textAlign = 'center';
                title.style.fontSize = '1.5rem';
                title.style.fontWeight = 'bold';
                title.style.marginBottom = '0.5rem';
            });
            // Fix pricing baseline container
            document.querySelectorAll('#pricing .flex.items-baseline').forEach((container)=>{
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.textAlign = 'center';
                container.style.width = '100%';
                container.style.marginBottom = '1rem';
            });
            // Fix pricing amounts
            document.querySelectorAll('#pricing .text-4xl').forEach((price)=>{
                price.style.fontSize = '2.5rem';
                price.style.lineHeight = '1.2';
                price.style.textAlign = 'center';
                price.style.display = 'block';
                price.style.width = '100%';
                price.style.marginBottom = '0.25rem';
                price.style.fontWeight = 'bold';
            });
            // Fix pricing periods
            document.querySelectorAll('#pricing .ml-2').forEach((period)=>{
                period.style.marginLeft = '0';
                period.style.marginTop = '0.25rem';
                period.style.display = 'block';
                period.style.textAlign = 'center';
                period.style.width = '100%';
                period.style.fontSize = '1rem';
                period.style.color = '#4B5563';
            });
            // Fix description text
            document.querySelectorAll('#pricing p.text-gray-600:not(.mt-8):not(.max-w-3xl)').forEach((description)=>{
                description.style.textAlign = 'center';
                description.style.marginBottom = '1.5rem';
                description.style.color = '#4B5563';
            });
            // Fix buttons
            document.querySelectorAll('#pricing .mt-auto a').forEach((button)=>{
                button.style.display = 'block';
                button.style.textAlign = 'center';
                button.style.borderRadius = '9999px';
                button.style.padding = '0.75rem 1.5rem';
                button.style.fontWeight = '500';
            });
            // Fix feature list section
            document.querySelectorAll('#pricing .bg-gray-50.p-8').forEach((section)=>{
                section.style.padding = '2rem';
                section.style.backgroundColor = '#F9FAFB';
                section.style.height = 'auto';
                section.style.minHeight = '240px';
            });
            // Fix what's included text
            document.querySelectorAll('#pricing .font-medium.mb-6').forEach((title)=>{
                title.style.fontWeight = '500';
                title.style.marginBottom = '1.5rem';
            });
            // Fix feature list
            document.querySelectorAll('#pricing .space-y-4').forEach((list)=>{
                list.style.paddingLeft = '0';
                list.style.listStyleType = 'none';
                list.style.marginTop = '0';
                list.style.marginBottom = '0';
            });
            // Fix feature list items
            document.querySelectorAll('#pricing .flex.items-start').forEach((item)=>{
                item.style.display = 'flex';
                item.style.alignItems = 'flex-start';
                item.style.marginBottom = '1rem';
            });
            // Fix feature list icons
            document.querySelectorAll('#pricing svg').forEach((icon)=>{
                icon.style.flexShrink = '0';
                icon.style.marginRight = '0.75rem';
                icon.style.height = '1.25rem';
                icon.style.width = '1.25rem';
                icon.style.color = '#10B981';
                icon.style.marginTop = '0.125rem';
            });
            // Fix containers with columns on desktop
            document.querySelectorAll('#pricing [data-safari-grid="pricing-grid"]').forEach((grid)=>{
                if (window.innerWidth >= 768) {
                    grid.style.display = 'grid';
                    grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
                    grid.style.gap = '2rem';
                }
            });
        };
        // Function to fix centering issues
        const fixCentering = ()=>{
            // Fix container centering
            document.querySelectorAll('.container').forEach((container)=>{
                container.style.marginLeft = 'auto';
                container.style.marginRight = 'auto';
                container.style.width = '100%';
                container.style.maxWidth = '1280px';
            });
            // Fix text-center alignment issues
            document.querySelectorAll('.text-center').forEach((element)=>{
                element.style.textAlign = 'center';
            });
            // Fix flex centering issues
            document.querySelectorAll('.items-center').forEach((element)=>{
                element.style.alignItems = 'center';
            });
            document.querySelectorAll('.justify-center').forEach((element)=>{
                element.style.justifyContent = 'center';
            });
        };
        // Function to fix pricing section with a completely different approach
        const fixPricingSection = ()=>{
            // Get all pricing cards
            const pricingCards = document.querySelectorAll('#pricing .rounded-xl');
            // Force grid layout on the container
            const pricingGrid = document.querySelector('#pricing [data-safari-grid="pricing-grid"]');
            if (pricingGrid) {
                // Use direct style manipulation for the grid
                pricingGrid.style.display = 'grid';
                pricingGrid.style.gridTemplateColumns = window.innerWidth >= 768 ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)';
                pricingGrid.style.gap = '2rem';
                pricingGrid.style.maxWidth = '1280px';
                pricingGrid.style.margin = '0 auto';
            }
            // Add resize listener for responsive grid
            window.addEventListener('resize', ()=>{
                if (pricingGrid) {
                    pricingGrid.style.gridTemplateColumns = window.innerWidth >= 768 ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)';
                }
            });
            // Apply card-specific fixes
            pricingCards.forEach((card)=>{
                // Reset the card structure
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.height = 'auto';
                card.style.borderRadius = '0.75rem';
                card.style.overflow = 'hidden';
                // Get the top and bottom sections of the card
                const topSection = card.querySelector('.p-8.flex.flex-col, .p-8.bg-white.flex.flex-col');
                const bottomSection = card.querySelector('.bg-gray-50.p-8');
                if (topSection) {
                    topSection.style.display = 'flex';
                    topSection.style.flexDirection = 'column';
                    topSection.style.padding = '2rem';
                    topSection.style.height = 'auto';
                    topSection.style.minHeight = '280px';
                    // Get and fix the title
                    const title = topSection.querySelector('h3');
                    if (title) {
                        title.style.textAlign = 'center';
                        title.style.fontSize = '1.5rem';
                        title.style.fontWeight = 'bold';
                        title.style.marginBottom = '0.5rem';
                        title.style.width = '100%';
                    }
                    // Get and fix the pricing container
                    const pricingContainer = topSection.querySelector('.flex.items-baseline');
                    if (pricingContainer) {
                        pricingContainer.style.display = 'flex';
                        pricingContainer.style.flexDirection = 'column';
                        pricingContainer.style.alignItems = 'center';
                        pricingContainer.style.width = '100%';
                        pricingContainer.style.marginBottom = '1rem';
                        // Get and fix the price
                        const price = pricingContainer.querySelector('.text-4xl');
                        if (price) {
                            price.style.display = 'block';
                            price.style.width = '100%';
                            price.style.textAlign = 'center';
                            price.style.fontSize = '2.5rem';
                            price.style.lineHeight = '1.2';
                            price.style.fontWeight = 'bold';
                            price.style.marginBottom = '0.25rem';
                        }
                        // Get and fix the period
                        const period = pricingContainer.querySelector('.ml-2');
                        if (period) {
                            period.style.display = 'block';
                            period.style.width = '100%';
                            period.style.textAlign = 'center';
                            period.style.marginLeft = '0';
                            period.style.marginTop = '0.25rem';
                            period.style.fontSize = '1rem';
                            period.style.color = '#4B5563';
                        }
                    }
                    // Get and fix the description
                    const description = topSection.querySelector('p.text-gray-600');
                    if (description) {
                        description.style.textAlign = 'center';
                        description.style.marginBottom = '1.5rem';
                        description.style.color = '#4B5563';
                    }
                    // Get and fix the button container
                    const buttonContainer = topSection.querySelector('.mt-auto');
                    if (buttonContainer) {
                        buttonContainer.style.marginTop = 'auto';
                        // Get and fix the button
                        const button = buttonContainer.querySelector('a');
                        if (button) {
                            button.style.display = 'block';
                            button.style.textAlign = 'center';
                            button.style.borderRadius = '9999px';
                            button.style.padding = '0.75rem 1.5rem';
                            button.style.fontWeight = '500';
                            // Maintain the button colors based on highlight status
                            const isHighlighted = card.classList.contains('border-blue-600') || card.classList.contains('ring-4');
                            if (isHighlighted) {
                                button.style.backgroundColor = '#2563EB';
                                button.style.color = 'white';
                            } else {
                                button.style.backgroundColor = '#F3F4F6';
                                button.style.color = '#1F2937';
                            }
                        }
                    }
                }
                if (bottomSection) {
                    bottomSection.style.padding = '2rem';
                    bottomSection.style.backgroundColor = '#F9FAFB';
                    bottomSection.style.height = 'auto';
                    bottomSection.style.minHeight = '240px';
                    // Get and fix the included title
                    const includedTitle = bottomSection.querySelector('.font-medium');
                    if (includedTitle) {
                        includedTitle.style.fontWeight = '500';
                        includedTitle.style.marginBottom = '1.5rem';
                    }
                    // Get and fix the feature list
                    const featureList = bottomSection.querySelector('.space-y-4');
                    if (featureList) {
                        featureList.style.paddingLeft = '0';
                        featureList.style.listStyleType = 'none';
                        featureList.style.marginTop = '0';
                        featureList.style.marginBottom = '0';
                        // Get and fix each feature item
                        const featureItems = featureList.querySelectorAll('.flex.items-start');
                        featureItems.forEach((item)=>{
                            item.style.display = 'flex';
                            item.style.alignItems = 'flex-start';
                            item.style.marginBottom = '1rem';
                            // Get and fix the icon
                            const icon = item.querySelector('svg');
                            if (icon) {
                                icon.style.flexShrink = '0';
                                icon.style.marginRight = '0.75rem';
                                icon.style.height = '1.25rem';
                                icon.style.width = '1.25rem';
                                icon.style.color = '#10B981';
                                icon.style.marginTop = '0.125rem';
                            }
                        });
                    }
                }
            });
        };
        // Function to fix button layouts
        const fixButtonLayouts = ()=>{
            // Target flex containers with buttons (typically have flex-col with sm:flex-row)
            document.querySelectorAll('.flex.flex-col').forEach((container)=>{
                // Check if this is a button container
                const hasButtons = container.querySelector('a') || container.querySelector('button');
                if (hasButtons) {
                    // Force horizontal layout for button containers
                    container.classList.remove('flex-col');
                    container.classList.add('flex-row');
                    // Add appropriate spacing
                    if (!container.classList.contains('gap-4')) {
                        container.classList.add('gap-4');
                    }
                    // Center the buttons
                    container.style.justifyContent = 'center';
                }
            });
            // Target specific button containers by data attribute
            const heroButtons = document.querySelector('[data-safari-buttons="hero-buttons"]');
            if (heroButtons) {
                heroButtons.classList.remove('flex-col');
                heroButtons.classList.add('flex-row');
                // Ensure proper centering
                heroButtons.style.display = 'flex';
                heroButtons.style.justifyContent = 'center';
                heroButtons.style.alignItems = 'center';
                // Make sure the links inside are styled correctly
                const buttons = heroButtons.querySelectorAll('a');
                buttons.forEach((button)=>{
                    button.style.display = 'inline-block';
                    button.style.width = 'auto';
                    button.style.margin = '0 0.5rem';
                });
            }
            // Target CTA buttons
            const ctaButtons = document.querySelector('[data-safari-buttons="cta-buttons"]');
            if (ctaButtons) {
                ctaButtons.classList.remove('flex-col');
                ctaButtons.classList.add('flex-row');
                // Ensure proper centering
                ctaButtons.style.display = 'flex';
                ctaButtons.style.justifyContent = 'center';
                ctaButtons.style.alignItems = 'center';
                // Make sure the links inside are styled correctly
                const buttons = ctaButtons.querySelectorAll('a');
                buttons.forEach((button)=>{
                    button.style.display = 'inline-block';
                    button.style.width = 'auto';
                    button.style.margin = '0 0.5rem';
                });
            }
            // Fix any other sm:flex-row containers
            document.querySelectorAll('.sm\\:flex-row').forEach((container)=>{
                container.classList.remove('flex-col');
                container.classList.add('flex-row');
                container.style.justifyContent = 'center';
            });
        };
        // Function to apply grid fixes
        const applyGridFixes = ()=>{
            // Target specific grids by data attribute
            const featureGrid = document.querySelector('[data-safari-grid="features"]');
            if (featureGrid) {
                featureGrid.classList.remove('grid-cols-1');
                // For screens ≥ 768px and < 1024px (md breakpoint)
                if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                    featureGrid.classList.add('grid-cols-2');
                } else if (window.innerWidth >= 1024) {
                    featureGrid.classList.add('grid-cols-3');
                }
            }
            // Apply to all grid elements with responsive classes
            document.querySelectorAll('.grid').forEach((grid)=>{
                // For md:grid-cols-2
                if (window.innerWidth >= 768 && grid.classList.contains('md:grid-cols-2')) {
                    grid.classList.remove('grid-cols-1');
                    grid.classList.add('grid-cols-2');
                }
                // For lg:grid-cols-3
                if (window.innerWidth >= 1024 && grid.classList.contains('lg:grid-cols-3')) {
                    grid.classList.remove('grid-cols-1');
                    grid.classList.remove('grid-cols-2');
                    grid.classList.add('grid-cols-3');
                }
                // For md:grid-cols-3
                if (window.innerWidth >= 768 && grid.classList.contains('md:grid-cols-3')) {
                    grid.classList.remove('grid-cols-1');
                    grid.classList.add('grid-cols-3');
                }
                // For md:grid-cols-4 (footer)
                if (window.innerWidth >= 768 && grid.classList.contains('md:grid-cols-4')) {
                    grid.classList.remove('grid-cols-1');
                    grid.classList.add('grid-cols-4');
                }
            });
            // Specifically fix the footer grid
            const footerGrid = document.querySelector('footer .grid');
            if (footerGrid && window.innerWidth >= 768) {
                footerGrid.classList.remove('grid-cols-1');
                footerGrid.classList.add('grid-cols-4');
                footerGrid.style.display = 'grid';
                footerGrid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                footerGrid.style.gap = '2rem';
            }
        };
        // Apply all fixes function
        const applyAllSafariDesktopFixes = ()=>{
            // Add desktop classes
            document.documentElement.classList.add('safari-desktop');
            document.documentElement.classList.add('desktop-view');
            document.body.classList.add('safari-desktop-content');
            // Find and update elements that need special handling
            const landingPage = document.getElementById('landing-page');
            if (landingPage) {
                landingPage.setAttribute('data-viewer', 'desktop');
                landingPage.setAttribute('data-browser', 'safari-desktop');
                landingPage.classList.add('desktop-view');
            }
            // Force desktop navigation to be visible
            const desktopNav = document.getElementById('desktop-nav');
            if (desktopNav) {
                desktopNav.style.display = 'flex';
            }
            // Apply desktop styles to all grid/flex containers
            document.querySelectorAll('.container').forEach((container)=>{
                container.classList.add('desktop-container');
            });
            // Apply grid fixes
            applyGridFixes();
            // Fix button layouts
            fixButtonLayouts();
            // Our new, more focused pricing section fix - apply after the others
            fixPricingSection();
            // Fix centering issues
            fixCentering();
            // Apply deeper pricing fixes for good measure
            deepFixPricing();
        };
        // Set classes based on browser detection
        if (isSafari()) {
            document.documentElement.classList.add('safari');
            // Only apply desktop Safari fixes if it's Safari and desktop but NOT mobile Safari
            if (isDesktop() && !isMobileSafari()) {
                // Apply all fixes immediately on load
                applyAllSafariDesktopFixes();
                // Add an override stylesheet for Safari
                const style = document.createElement('style');
                style.textContent = `
          @media screen and (min-width: 768px) {
            .md\\:flex { display: flex !important; }
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .md\\:hidden { display: none !important; }
            .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .container { width: 100%; max-width: 1280px; margin-left: auto; margin-right: auto; }
            .desktop-view .grid { display: grid !important; }
            .desktop-view [class*="md:text-"] { font-size: inherit !important; }
            .desktop-view .md\\:text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
            .desktop-view .md\\:text-5xl { font-size: 3rem !important; line-height: 1 !important; }
            .desktop-view .md\\:flex-row { flex-direction: row !important; }
            
            /* Target Safari specifically */
            @supports (-webkit-touch-callout: none) {
              /* Override pricing grid layout */
              #pricing .grid.grid-cols-1.md\\:grid-cols-3,
              #pricing [data-safari-grid="pricing-grid"] {
                display: grid !important;
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                gap: 2rem !important;
                max-width: 1280px !important;
                margin: 0 auto !important;
              }
              
              /* Footer grid fixes */
              footer .grid {
                display: grid !important;
                grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                gap: 2rem !important;
              }
              
              [data-safari-grid="features"] {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              
              @media (min-width: 1024px) {
                [data-safari-grid="features"] {
                  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                }
              }
              
              /* Fix button layouts */
              [data-safari-buttons="true"],
              .flex.flex-col.sm\\:flex-row,
              .sm\\:flex-row {
                display: flex !important;
                flex-direction: row !important;
                gap: 1rem !important;
                justify-content: center !important;
              }
              
              .flex.flex-col.md\\:flex-row {
                display: flex !important;
                flex-direction: row !important;
              }
              
              /* Enhanced pricing section fixes */
              #pricing .rounded-xl {
                display: flex !important;
                flex-direction: column !important;
                height: auto !important;
                overflow: hidden !important;
                border-radius: 0.75rem !important;
                width: 100% !important;
              }
              
              #pricing .p-8.flex.flex-col, 
              #pricing .p-8.bg-white.flex.flex-col {
                display: flex !important;
                flex-direction: column !important;
                padding: 2rem !important;
                min-height: 280px !important;
                height: auto !important;
                background-color: white !important;
              }
              
              #pricing h3 {
                text-align: center !important;
                font-size: 1.5rem !important;
                font-weight: bold !important;
                margin-bottom: 0.5rem !important;
                width: 100% !important;
              }
              
              #pricing .flex.items-baseline {
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                width: 100% !important;
                margin-bottom: 1rem !important;
                display: flex !important;
              }
              
              #pricing .text-4xl {
                font-size: 2.5rem !important;
                line-height: 1.2 !important;
                display: block !important;
                margin-bottom: 0.25rem !important;
                width: 100% !important;
                text-align: center !important;
                font-weight: bold !important;
              }
              
              #pricing .ml-2 {
                margin-left: 0 !important;
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                margin-top: 0.25rem !important;
                font-size: 1rem !important;
                color: #4B5563 !important;
              }
              
              #pricing .text-gray-600 {
                text-align: center !important;
                margin-bottom: 1.5rem !important;
                color: #4B5563 !important;
              }
              
              #pricing .mt-auto {
                margin-top: auto !important;
              }
              
              #pricing .mt-auto a {
                display: block !important;
                text-align: center !important;
                border-radius: 9999px !important;
                padding: 0.75rem 1.5rem !important;
                font-weight: 500 !important;
              }
              
              #pricing .bg-gray-50.p-8 {
                padding: 2rem !important;
                background-color: #F9FAFB !important;
                min-height: 240px !important;
                height: auto !important;
              }
              
              #pricing .font-medium.mb-6 {
                font-weight: 500 !important;
                margin-bottom: 1.5rem !important;
              }
              
              #pricing .space-y-4 {
                padding-left: 0 !important;
                list-style-type: none !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }
              
              #pricing .flex.items-start {
                display: flex !important;
                align-items: flex-start !important;
                margin-bottom: 1rem !important;
              }
              
              #pricing svg {
                flex-shrink: 0 !important;
                margin-right: 0.75rem !important;
                height: 1.25rem !important;
                width: 1.25rem !important;
                color: #10B981 !important;
                margin-top: 0.125rem !important;
              }
              
              /* Fix text centering */
              .text-center {
                text-align: center !important;
              }
              
              .items-center {
                align-items: center !important;
              }
              
              .justify-center {
                justify-content: center !important;
              }
            }
          }
        `;
                document.head.appendChild(style);
                // Add resize listener for ongoing maintenance
                window.addEventListener('resize', ()=>{
                    if (isDesktop() && isSafari() && !isMobileSafari()) {
                        applyAllSafariDesktopFixes();
                    }
                });
            }
            // Cleanup resize listener
            return ()=>{
                window.removeEventListener('resize', ()=>{
                    if (isDesktop() && isSafari() && !isMobileSafari()) {
                        applyAllSafariDesktopFixes();
                    }
                });
            };
        }
    }, []);
    return null;
};
const __TURBOPACK__default__export__ = BrowserDetection;
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

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__d589266d._.js.map