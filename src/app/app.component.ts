import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from './ComponentBase';
import { MainComponentService } from './services/main-component.service';
import { DynamicComponentService } from './services/dynamic-component.service';
import { ActionExecutorService } from './services/action-executor.service';
import { ActionConfigService } from './services/action-config.service';
import { ThemeService } from './services/theme.service';
import { ActionBarComponent } from './components/action-bar/action-bar.component';
import { ActionManagerComponent } from './components/action-admin/action-manager.component';
import { ActionDefinition } from './models/action.model';

/**
 * Main application component
 *
 * This component is responsible for initializing the IGX-OTT module components
 * and coordinating their interactions with the CMS.
 */
@Component({
	selector: '[igx-ott-root]',
	standalone: true,
	imports: [CommonModule, ActionBarComponent, ActionManagerComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.less'
})
export class AppComponent extends ComponentBase implements AfterViewInit, OnDestroy {
	/** Dev mode: true when not running inside CMS iframe */
	devMode = false;
	showActionManager = false;
	
	constructor(
		private mainComponentService: MainComponentService,
		private dynamicComponentService: DynamicComponentService,
		private actionExecutorService: ActionExecutorService,
		public actionConfigService: ActionConfigService,
		private themeService: ThemeService
	) {
		super();

		// Get reference to the top window
		const topWindow = window.top as any;
		if (!topWindow)
			return;

		// Get NgRef from top window
		const ngref = topWindow.NG_REF as any;
		if (!ngref) {
			// No CMS context - enable dev mode for standalone preview
			this.devMode = true;
			console.log('[IGX-OTT] Dev mode: rendering components standalone');
			return;
		}

		// Inject design tokens + Geist font into CMS top frame
		this.themeService.injectIntoTopFrame();
		
		// Wire up action execution
		this.observableSubTeardowns.push(
			this.mainComponentService.onActionExecute.subscribe(action => {
				this.actionExecutorService.execute(action);
			})
		);

		// Wire up manage actions (opens admin builder)
		this.observableSubTeardowns.push(
			this.mainComponentService.onManageActions.subscribe(() => {
				this.actionExecutorService.openActionManager();
			})
		);

		// Note: We no longer create a topbar button. The action bar
		// appears automatically in Site/Assets views.
		
		// Add router navigation event listener
		if (ngref.router) {
			this.observableSubTeardowns.push(
				ngref.router.events.subscribe((event: any) => {
					if (event.constructor.name === 'NavigationEnd') {
						this.mainComponentService.hideMainComponent();

						// Show/hide action bar based on whether we're in a content view
						const url = ngref.router.routerState?.snapshot?.url || '';
						if (this.isContentView(url)) {
							this.mainComponentService.createActionBar();
							this.mainComponentService.showActionBar();
						} else {
							this.mainComponentService.hideActionBar();
						}
					}
				})
			);
		}
	}
	
	ngAfterViewInit(): void {
		if (!this.devMode) {
			// Delay to let CMS DOM settle, then create action bar
			this._initCmsComponents();
		}
	}
	
	ngOnDestroy(): void {
		// Clean up subscriptions
		this.cleanup();
		
		// Destroy all components
		this.dynamicComponentService.destroyAllComponents();
	}
	
	private _initCmsComponents() {
		setTimeout(() => {
			this.mainComponentService.createUtilButton();

			// Create action bar if we're in a content view (Site or Assets)
			const topWindow = window.top as any;
			const router = topWindow?.NG_REF?.router;
			if (router) {
				const url = router.routerState?.snapshot?.url || '';
				if (this.isContentView(url)) {
					this.mainComponentService.createActionBar();
				}
			}
		}, 300);
	}
	
	/** Dev mode: handle action clicks */
	onDevActionClick(action: ActionDefinition): void {
		console.log(`[IGX-OTT] Dev action: ${action.id} (${action.handler.type})`);
		this.actionExecutorService.execute(action);
	}

	/** Dev mode: open Action Manager */
	onDevManageActions(): void {
		this.showActionManager = true;
	}

	/** Dev mode: close Action Manager */
	onDevCloseManager(): void {
		this.showActionManager = false;
	}

	/**
	 * Checks if the current CMS URL is a content view (Site tree or Assets)
	 * where the action bar should be visible.
	 */
	private isContentView(url: string): boolean {
		return url.includes('site/') || url.includes('asset');
	}
}
