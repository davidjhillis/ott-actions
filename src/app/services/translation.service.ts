import { Injectable } from '@angular/core';

export interface CmsLocale {
	code: string;
	name: string;
}

export interface LingualMapEntry {
	id: string;
	name: string;
	locale: string;
	status: 'completed' | 'in-progress' | 'not-started';
}

export interface LingualMapsResult {
	masterPage: { id: string; name: string; locale: string };
	clonePages: LingualMapEntry[];
}

/**
 * Wraps CMS Worldview translation APIs.
 * In production this calls PageCommandsServices via the CMS top frame.
 * For the demo/MVP, responses are stubbed.
 */
@Injectable({
	providedIn: 'root'
})
export class TranslationService {

	/**
	 * Get available locales from CMS implementation config.
	 * Production: reads from CMS NG_REF implementation settings.
	 */
	getAvailableLocales(): CmsLocale[] {
		// Stubbed — in production, pull from CMS implementation config
		return [
			{ code: 'en-US', name: 'English (US)' },
			{ code: 'fr-FR', name: 'French (France)' },
			{ code: 'de-DE', name: 'German (Germany)' },
			{ code: 'es-ES', name: 'Spanish (Spain)' },
			{ code: 'ja-JP', name: 'Japanese' },
			{ code: 'zh-CN', name: 'Chinese (Simplified)' },
			{ code: 'pt-BR', name: 'Portuguese (Brazil)' },
			{ code: 'ko-KR', name: 'Korean' },
			{ code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
			{ code: 'it-IT', name: 'Italian' },
		];
	}

	/**
	 * Get existing lingual maps (translations) for a page.
	 * Production: calls PageCommandsServices.GetFullLingualMaps(pageId)
	 */
	getFullLingualMaps(pageId: string): LingualMapsResult {
		// Stubbed
		return {
			masterPage: {
				id: pageId,
				name: 'ISO-9001-2025 Draft',
				locale: 'en-US'
			},
			clonePages: [
				{ id: 'x350', name: 'ISO-9001-2025 Draft (FR)', locale: 'fr-FR', status: 'completed' },
				{ id: 'x351', name: 'ISO-9001-2025 Draft (DE)', locale: 'de-DE', status: 'in-progress' },
			]
		};
	}

	/**
	 * Send items for translation to specified locales.
	 * Production: calls MoveCopyPageAdvanced for each target locale,
	 * then AddCloneMap to link the translation.
	 */
	sendToTranslation(pageId: string, targetLocales: string[]): void {
		console.log(`[IGX-OTT] Sending page ${pageId} for translation to:`, targetLocales);
		// Stubbed — in production:
		// 1. For each targetLocale: MoveCopyPageAdvanced(targetLocale)
		// 2. AddCloneMap(pageId, cloneId, pubTarget)
		// 3. Return created clone page IDs
	}
}
