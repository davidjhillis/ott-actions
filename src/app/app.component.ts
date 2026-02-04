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
	private _topbarRef: any;

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

		// Subscribe to component initialization events if available
		if (ngref.componentInitialized) {
			this.observableSubTeardowns.push(
				ngref.componentInitialized.subscribe((evt: any) => {
					if (evt.component.constructor.name === "Topbar") {
						// Topbar component is initialized
						this.createTopbarButton();
					}
				})
			);
		}
		
		// Add router navigation event listener
		if (ngref.router) {
			this.observableSubTeardowns.push(
				ngref.router.events.subscribe((event: any) => {
					if (event.constructor.name === 'NavigationEnd') {
						this.mainComponentService.hideMainComponent();

						// Show/hide action bar based on whether we're in Assets view
						const url = ngref.router.routerState?.snapshot?.url || '';
						if (url.includes('site/')) {
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
		// Add a timeout delay before creating the topbar button
		this._createTopbarButtonWithDelay(); // 300ms delay
	}
	
	ngOnDestroy(): void {
		// Clean up subscriptions
		this.cleanup();
		
		// Destroy all components
		this.dynamicComponentService.destroyAllComponents();
	}
	
	private _createTopbarButtonWithDelay() {
		setTimeout(() => {
			this.createTopbarButton();
			this.mainComponentService.createUtilButton();

			// Try to create action bar if we're already in Assets view
			const topWindow = window.top as any;
			const router = topWindow?.NG_REF?.router;
			if (router) {
				const url = router.routerState?.snapshot?.url || '';
				if (url.includes('site/')) {
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

	private createTopbarButton(): void {
		if (!!this._topbarRef)
			return;
		
		// Find CMS top toolbar
		const topWindow = window.top as any;
		if (!topWindow) return;
		
		// Find the toolbar
		const toolbar = topWindow.document.querySelector('div.igx-toolbar');
		if (!toolbar) {
			console.error('[IGX-OTT] - Toolbar not found');
			return;
		}
		
		// Get buttons in the toolbar
		const buttons = toolbar.querySelectorAll('.TopButton');
		if (buttons.length < 3) {
			console.error('[IGX-OTT] - Not enough buttons in toolbar', `${buttons.length} buttons found`);
			return;
		}
		
		// Create a container element
		const container = document.createElement('div');
        container.classList.add("TopButton")
		
		// Insert container after the second button
		buttons[1].parentNode?.insertBefore(container, buttons[2].nextSibling);
		
		// Create TopbarButton component
		this._topbarRef = this.mainComponentService.createTopbarButton(container);
	}
}
