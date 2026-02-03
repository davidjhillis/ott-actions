/**
 * The script that hooks up the IGX-OTT Module to the host CMS application
 */

class IgxOttHookup {
    _moduleUri;

    constructor(moduleUri) {
        try {
            this._moduleUri = moduleUri.toLowerCase();

            // Create an iframe to hold the IGX-OTT module
            this.iframe = document.createElement('iframe');
            this.iframe.style.position = "absolute";
            this.iframe.style.left = "-9999px";
            document.body.appendChild(this.iframe);
            console.info('[IGX-OTT] - Module hooked up!');
        } catch (error) {
            console.error('[IGX-OTT] - Hookup initialization failed:', error);
        }
    }

    async setup() {
        try {
            const scripts = [
                "polyfills.js",
                "main.js"
            ];

            // Get version from server with cache busting
            let ver;
            try {
                const resp = await fetch(`${this._moduleUri}/common/ver?_=${Date.now()}`, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                ver = await resp.text();
            } catch (error) {
                // Fallback to timestamp if version fetch fails
                ver = Date.now().toString();
                console.warn('[IGX-OTT] - Failed to fetch version, using timestamp:', error);
            }

            // Add both version and timestamp for robust cache busting
            const scriptsFinal = scripts
                .map(s => `${s}?v=${ver}&t=${Date.now()}`)
                .join(";");

            const encodedUrl = btoa(window.location.href.split('#')[0]);

            this.iframe.src = `CMS/ExternalModule?root=igx-ott-root`
                + `&url=${encodeURIComponent(this._moduleUri)}`
                + `&refpointerer=${encodeURIComponent(encodedUrl)}`
                + `&scripts=${encodeURIComponent(scriptsFinal)}`;
        } catch (error) {
            console.error('[IGX-OTT] - Setup failed:', error);
        }
    }

    createScriptElement(src) {
        try {
            const scriptEle = document.createElement("script");
            scriptEle.setAttribute("src", src);
            scriptEle.setAttribute("type", "module");

            this.iframe.contentWindow.document.body.appendChild(scriptEle);
        } catch (error) {
            console.error('[IGX-OTT] - Failed to create script element:', error);
        }
    }
}

// Create hookup instance when body finished loading
document.addEventListener("DOMContentLoaded", async () => {
    try {
        let url = document.getElementById("IgxOttModule")?.getAttribute("src") || "";

        let pos = url.indexOf("/hookup/");
        if (pos > -1) {
            url = url.substring(0, pos);
        }

        if (!url) {
            console.error('[IGX-OTT] - Hookup initialization failed: Module URL not found');
            return;
        }

        window.modules_IgxOttHookup = new IgxOttHookup(url);
        await window.modules_IgxOttHookup.setup();
    } catch (error) {
        console.error('[IGX-OTT] - Hookup initialization failed:', error);
    }
}, false);
