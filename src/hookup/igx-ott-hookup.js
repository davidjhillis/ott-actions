/**
 * IGX-OTT Module Hookup Script
 * ============================================================
 * Loads the IGX-OTT Action Bar & Tools module into the
 * Ingeniux CMS via the standard ExternalModule SaaS pattern.
 *
 * INSTALLATION (CMS manifest):
 *   Add to externalModulesManifest.json:
 *
 *   {
 *       "Name": "Actions",
 *       "Url": "https://ott-actions.vercel.app/hookup/igx-ott-hookup.js",
 *       "Styles": []
 *   }
 *
 * HOW IT WORKS:
 *   1. Captures this script's URL at parse time via document.currentScript
 *   2. Derives the module base URL (strips /hookup/... suffix)
 *   3. Creates a hidden iframe for the Angular module runtime
 *   4. Points the iframe at CMS/ExternalModule which:
 *      - Loads polyfills.js + main.js into the iframe
 *      - Injects NG_REF (router, events, app context) into the iframe
 *   5. The Angular app bootstraps, detects NG_REF, and:
 *      - Injects design tokens + Geist font into the CMS top frame
 *      - Creates the Action Bar in the Assets view
 *      - Creates toolbar + utility buttons
 *      - Listens for CMS router events to show/hide contextually
 *
 * REQUIRED CMS ELEMENTS (standard Ingeniux layout):
 *   - div.igx-toolbar          (top toolbar - for OTT button)
 *   - #globalTabContainer      (content area - for action bar + panels)
 *   - .left-panel.navPanel     (left sidebar - for utility pane)
 *   - CMS/ExternalModule       (built-in external module loader)
 *   - window.NG_REF            (injected by ExternalModule loader)
 * ============================================================
 */

// Capture script URL at parse time (document.currentScript is only
// available during initial script execution, not in callbacks)
var _igxOttScriptUrl = (document.currentScript && document.currentScript.src) || '';

class IgxOttHookup {
	_moduleUri;
	iframe;

	constructor(moduleUri) {
		try {
			this._moduleUri = moduleUri.toLowerCase();

			// Create a hidden iframe to host the Angular runtime.
			// The iframe is offscreen; all visible UI is injected
			// into the CMS top frame via DynamicComponentService.
			this.iframe = document.createElement('iframe');
			this.iframe.id = 'igx-ott-frame';
			this.iframe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;border:none;';
			this.iframe.setAttribute('aria-hidden', 'true');
			document.body.appendChild(this.iframe);

			console.info('[IGX-OTT] Module hookup initialized');
		} catch (error) {
			console.error('[IGX-OTT] Hookup initialization failed:', error);
		}
	}

	async setup() {
		try {
			// Scripts that the CMS ExternalModule loader will inject into the iframe
			const scripts = [
				'polyfills.js',
				'main.js'
			];

			// Cache busting: try the /common/ver endpoint first (standard
			// Ingeniux OTT pattern), fall back to timestamp for static hosts
			let ver;
			try {
				const resp = await fetch(
					`${this._moduleUri}/common/ver?_=${Date.now()}`,
					{
						headers: {
							'Cache-Control': 'no-cache, no-store, must-revalidate',
							'Pragma': 'no-cache',
							'Expires': '0'
						}
					}
				);
				if (resp.ok) {
					ver = (await resp.text()).trim();
				}
			} catch (_) {
				// Silently fall through to timestamp
			}
			if (!ver) {
				ver = Date.now().toString();
			}

			// Build the scripts parameter: semicolon-separated with cache-bust query
			const scriptsFinal = scripts
				.map(s => `${s}?v=${ver}&t=${Date.now()}`)
				.join(';');

			// Encode the current page URL for the CMS referer parameter
			const encodedUrl = btoa(window.location.href.split('#')[0]);

			// Point the iframe at the CMS ExternalModule loader.
			// The loader creates the <div igx-ott-root> element,
			// loads the scripts, and injects NG_REF into the iframe.
			this.iframe.src = 'CMS/ExternalModule?root=igx-ott-root'
				+ `&url=${encodeURIComponent(this._moduleUri)}`
				+ `&refpointerer=${encodeURIComponent(encodedUrl)}`
				+ `&scripts=${encodeURIComponent(scriptsFinal)}`;

			console.info(`[IGX-OTT] Module loading from: ${this._moduleUri}`);
		} catch (error) {
			console.error('[IGX-OTT] Setup failed:', error);
		}
	}
}

// ============================================================
// Auto-initialize when the DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
	try {
		// Derive the module base URL from the script src captured at parse time.
		// e.g. "https://ott-actions.vercel.app/hookup/igx-ott-hookup.js"
		//    -> "https://ott-actions.vercel.app"
		let url = _igxOttScriptUrl;

		const pos = url.indexOf('/hookup/');
		if (pos > -1) {
			url = url.substring(0, pos);
		}

		if (!url) {
			console.error('[IGX-OTT] Module URL not found. Script src could not be determined.');
			return;
		}

		window.modules_IgxOttHookup = new IgxOttHookup(url);
		await window.modules_IgxOttHookup.setup();
	} catch (error) {
		console.error('[IGX-OTT] Hookup initialization failed:', error);
	}
}, false);
