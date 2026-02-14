import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from './ComponentBase';
import { MainComponentService } from './services/main-component.service';
import { DynamicComponentService } from './services/dynamic-component.service';
import { ActionExecutorService } from './services/action-executor.service';
import { ActionConfigService } from './services/action-config.service';
import { AssetContextService } from './services/asset-context.service';
import { ThemeService } from './services/theme.service';
import { ActionBarComponent } from './components/action-bar/action-bar.component';
import { ActionManagerComponent } from './components/action-admin/action-manager.component';
import { EnhancedFolderViewComponent } from './components/enhanced-folder-view/enhanced-folder-view.component';
import { ActionDefinition } from './models/action.model';
import { AssetContext } from './models/asset-context.model';

/**
 * Main application component
 *
 * This component is responsible for initializing the IGX-OTT module components
 * and coordinating their interactions with the CMS.
 *
 * The Actions panel is shown in the CMS left sidebar via the utility button.
 * Clicking the Zap icon in the left icon bar shows the Actions panel,
 * replacing the Asset Tree view. Clicking Asset Tree restores it.
 */
@Component({
	selector: '[igx-ott-root]',
	standalone: true,
	imports: [CommonModule, ActionBarComponent, ActionManagerComponent, EnhancedFolderViewComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.less'
})
export class AppComponent extends ComponentBase implements AfterViewInit, OnDestroy {
	/** Dev mode: true when not running inside CMS iframe */
	devMode = false;
	showActionManager = false;
	/** Dev mode: which left panel is active */
	activePanel: 'tree' | 'actions' = 'actions';
	/** Dev mode: current asset context for Enhanced Folder View */
	devContext: AssetContext | null = null;

	constructor(
		private mainComponentService: MainComponentService,
		private dynamicComponentService: DynamicComponentService,
		private actionExecutorService: ActionExecutorService,
		public actionConfigService: ActionConfigService,
		private assetContextService: AssetContextService,
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

			// Subscribe to asset context for dev mode Enhanced Folder View
			this.observableSubTeardowns.push(
				this.assetContextService.context$.subscribe(ctx => {
					this.devContext = ctx;
				})
			);
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

		// Add router navigation event listener
		if (ngref.router) {
			this.observableSubTeardowns.push(
				ngref.router.events.subscribe((event: any) => {
					if (event.constructor.name === 'NavigationEnd') {
						this.mainComponentService.hideMainComponent();
					}
				})
			);
		}

		// In CMS mode: inject Enhanced Folder View when context changes to a folder
		this.observableSubTeardowns.push(
			this.assetContextService.context$.subscribe(ctx => {
				if (ctx?.isFolder) {
					setTimeout(() => this.mainComponentService.injectEnhancedFolderView(), 200);
				}
			})
		);
	}

	ngAfterViewInit(): void {
		if (!this.devMode) {
			// Delay to let CMS DOM settle, then create the Actions button in the left sidebar
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
			// Create the Zap icon button in the CMS left sidebar (2nd position, after Asset Tree)
			this.mainComponentService.createUtilButton();
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
}
