import { Injectable } from '@angular/core';

/**
 * Design token CSS injected into the CMS top frame.
 * This string mirrors the tokens in ott-theme.less so that
 * components rendered inside the top frame resolve var(--ott-*).
 */
/**
 * CSS override to replace the CMS Asset Tree icon (igx-fa-asset-tree)
 * with a Lucide file-text SVG via background-image. The icon font glyph
 * is hidden by blanking the ::before content.
 */
const OTT_ICON_OVERRIDES_CSS = `
span.igx-fa-asset-tree::before {
  content: '' !important;
}
span.igx-fa-asset-tree {
  display: inline-block !important;
  width: 28px !important;
  height: 28px !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%2353ace3' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/%3E%3Cpath d='M14 2v4a2 2 0 0 0 2 2h4'/%3E%3Cpath d='M10 12h4'/%3E%3Cpath d='M10 16h4'/%3E%3C/svg%3E") !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
`;

const OTT_THEME_CSS = `
:root {
  --ott-font: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --ott-font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;

  --ott-bg: #ffffff;
  --ott-bg-muted: #f8f9fa;
  --ott-bg-subtle: #f0f2f5;
  --ott-bg-hover: #f1f3f5;
  --ott-bg-selected: #e8f0fe;
  --ott-border: #e2e5e9;
  --ott-border-light: #f0f0f0;
  --ott-ring: rgba(83, 172, 227, 0.3);

  --ott-text: #1a1a1a;
  --ott-text-secondary: #6b7280;
  --ott-text-muted: #9ca3af;

  --ott-primary: #53ace3;
  --ott-primary-hover: #3d9ad4;
  --ott-primary-light: #e8f4fc;
  --ott-success: #22c55e;
  --ott-success-light: #dcfce7;
  --ott-danger: #ef4444;
  --ott-danger-hover: #dc2626;
  --ott-warning: #f59e0b;
  --ott-warning-light: #fef3c7;

  --ott-radius-sm: 4px;
  --ott-radius-md: 6px;
  --ott-radius-lg: 8px;
  --ott-radius-xl: 12px;
  --ott-radius-full: 9999px;

  --ott-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --ott-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --ott-shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.12);
  --ott-shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.18);
}
`;

const GEIST_FONT_URL = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	private _injected = false;

	/**
	 * Injects the OTT design tokens and Geist font into
	 * the CMS top frame's document head. Safe to call multiple
	 * times — injection happens only once.
	 */
	injectIntoTopFrame(): void {
		if (this._injected) return;

		const topDoc = (window.top as any)?.document as Document | undefined;
		if (!topDoc) return;

		// Skip if already present (e.g. page reload while module still loaded)
		if (topDoc.getElementById('ott-theme')) {
			this._injected = true;
			return;
		}

		// Inject Geist font
		const fontLink = topDoc.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = GEIST_FONT_URL;
		fontLink.id = 'ott-font';
		topDoc.head.appendChild(fontLink);

		// Inject design tokens
		const style = topDoc.createElement('style');
		style.id = 'ott-theme';
		style.textContent = OTT_THEME_CSS;
		topDoc.head.appendChild(style);

		// Inject icon overrides (replaces Asset Tree icon)
		const iconStyle = topDoc.createElement('style');
		iconStyle.id = 'ott-icon-overrides';
		iconStyle.textContent = OTT_ICON_OVERRIDES_CSS;
		topDoc.head.appendChild(iconStyle);

		this._injected = true;
		console.log('[IGX-OTT] Theme injected into top frame');
	}
}
