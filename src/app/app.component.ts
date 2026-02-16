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
import { AssetFileBarComponent } from './components/asset-file-bar/asset-file-bar.component';
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
	imports: [CommonModule, ActionBarComponent, ActionManagerComponent, EnhancedFolderViewComponent, AssetFileBarComponent],
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

		// Add router navigation event listener — hide sidebar UI on navigation,
		// but do NOT destroy the folder view here (managed by context subscription below).
		if (ngref.router) {
			this.observableSubTeardowns.push(
				ngref.router.events.subscribe((event: any) => {
					if (event.constructor.name === 'NavigationEnd') {
						this.mainComponentService.hideNonFolderComponents();
					}
				})
			);
		}

		// In CMS mode: 3-way context branch for folder view / file bar / clear.
		// Folder → inject enhanced folder view, destroy file bar
		// File asset → inject file bar, destroy folder view
		// null → destroy both
		this.observableSubTeardowns.push(
			this.assetContextService.context$.subscribe(ctx => {
				if (ctx?.isFolder) {
					this.mainComponentService.destroyFileBar();
					this.waitForFolderViewThenInject();
				} else if (ctx && !ctx.isFolder) {
					this.mainComponentService.destroyEnhancedFolderView();
					this.waitForAssetPaneThenInjectFileBar();
				} else {
					this.mainComponentService.destroyEnhancedFolderView();
					this.mainComponentService.destroyFileBar();
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

	/**
	 * Polls for the CMS <folder-view> element to appear, then injects the enhanced view.
	 * Retries every 150ms up to 3 seconds to handle variable CMS render timing.
	 */
	private waitForFolderViewThenInject(elapsed = 0): void {
		const maxWait = 3000;
		const interval = 150;
		const topWindow = window.top as any;
		const folderView = topWindow?.document?.querySelector('folder-view');

		if (folderView) {
			this.mainComponentService.injectEnhancedFolderView();
			return;
		}

		if (elapsed < maxWait) {
			setTimeout(() => this.waitForFolderViewThenInject(elapsed + interval), interval);
		} else {
			console.warn('[IGX-OTT] Timed out waiting for CMS <folder-view> to render');
		}
	}

	/** Generation counter to cancel stale file-bar polling loops */
	private fileBarPollGen = 0;

	/**
	 * Polls for the CMS Download/Upload buttons to render, then injects
	 * the "Open in Word" button next to them. Retries every 300ms up to 6s
	 * to handle variable CMS render timing.
	 */
	private waitForAssetPaneThenInjectFileBar(): void {
		const gen = ++this.fileBarPollGen;
		this.pollForCmsButtons(gen, 0);
	}

	private pollForCmsButtons(gen: number, elapsed: number): void {
		if (gen !== this.fileBarPollGen) return; // stale poll

		const maxWait = 6000;
		const interval = 300;

		// Try injection — returns true if it succeeded
		const success = this.mainComponentService.injectFileBar();
		if (success) return;

		if (elapsed < maxWait) {
			setTimeout(() => this.pollForCmsButtons(gen, elapsed + interval), interval);
		} else {
			console.warn('[IGX-OTT] Timed out waiting for CMS buttons for Open in Word injection');
		}
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
