import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MainComponentService } from './services/main-component.service';
import { DynamicComponentService } from './services/dynamic-component.service';

/**
 * Application configuration
 * Provides all necessary services and dependencies
 */
export const appConfig: ApplicationConfig = {
	providers: [
		// Angular core providers
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideAnimations(),
		
		// Application service providers
		MainComponentService,
		DynamicComponentService
	]
};
