import { ComponentRef, EventEmitter, Injectable, Type } from "@angular/core";
import { Router } from "@angular/router";
import { DynamicComponentService } from "./dynamic-component.service";
import { AssetContextService } from "./asset-context.service";
import { TopbarButtonComponent } from "../components/topbar-button/topbar-button.component";
import { UtilButtonComponent } from "../components/util-button/util-button.component";
import { MicroFrontendPanelComponent } from "../components/micro-frontend-panel/micro-frontend-panel.component";
import { MicroFrontendUtilPaneComponent } from "../components/micro-frontend-util-pane/micro-frontend-util-pane.component";
import { ActionBarComponent } from "../components/action-bar/action-bar.component";
import { EnhancedFolderViewComponent } from "../components/enhanced-folder-view/enhanced-folder-view.component";
import { AssetFileBarComponent } from "../components/asset-file-bar/asset-file-bar.component";
import { ActionDefinition } from "../models/action.model";
import { ActionConfigService } from "./action-config.service";
import { ComponentBase } from "../ComponentBase";
import { Subscription } from "rxjs";

@Injectable({
	providedIn: 'root'
})
export class MainComponentService extends ComponentBase {
	private topbarButtonRef?: ComponentRef<TopbarButtonComponent>;
	private utilButtonRef?: ComponentRef<UtilButtonComponent>;
	private microFrontendPanelRef?: ComponentRef<MicroFrontendPanelComponent>;
	private microFrontendUtilPaneRef?: ComponentRef<MicroFrontendUtilPaneComponent>;
	private actionPanelRef?: ComponentRef<ActionBarComponent>;
	private folderViewRef?: ComponentRef<EnhancedFolderViewComponent>;
	private fileBarRef?: ComponentRef<AssetFileBarComponent>;
	/** Stored original style of assetpane-hub so we can restore on file bar destroy */
	private hubOriginalStyle?: string;

	// Panel toggle event
	public onPanelToggle: EventEmitter<any> = new EventEmitter<any>();

	// Action execution event
	public onActionExecute: EventEmitter<ActionDefinition> = new EventEmitter<ActionDefinition>();

	// Manage actions event (opens admin builder)
	public onManageActions: EventEmitter<void> = new EventEmitter<void>();

	constructor(
		private dynamicComponentService: DynamicComponentService,
		private actionConfigService: ActionConfigService,
		private assetContextService: AssetContextService
	) {
		super();

		// Subscribe to config changes to update action panel
		this.observableSubTeardowns.push(
			this.actionConfigService.configChanged.subscribe(config => {
				if (this.actionPanelRef?.instance) {
					this.actionPanelRef.instance.config = config;
				}
			})
		);

		// Subscribe to asset context changes to update action panel
		this.observableSubTeardowns.push(
			this.assetContextService.context$.subscribe(ctx => {
				if (this.actionPanelRef?.instance) {
					this.actionPanelRef.instance.context = ctx ?? undefined;
				}
			})
		);
	}

	/**
	 * Creates a topbar button
	 * @param container The container element to create the button in
	 * @returns Reference to the created component
	 */
	public createTopbarButton(container: HTMLElement): ComponentRef<TopbarButtonComponent> {
		// Create the button component
		this.topbarButtonRef = this.dynamicComponentService.createComponent(TopbarButtonComponent, container);

		// Set the app reference
		this.topbarButtonRef.instance.app = this;

		return this.topbarButtonRef;
	}

	/**
	 * Finds the utilbar container and the first button (Asset Tree navButton)
	 * by using the assign button (fa-list) as a known reference point.
	 * Returns the first child of the utilbar container (the navButton element).
	 */
	private getFirstSidebarButton(): HTMLElement | null {
		const assignButton = this.getAssignButton();
		if (!assignButton?.parentElement) return null;

		// The assign button's parent is the utilbar container.
		// The first child of that container is the navButton (Asset Tree).
		const container = assignButton.parentElement;
		return container.firstElementChild as HTMLElement || null;
	}

	/**
	 * Fallback: finds the list utility button to insert next to.
	 */
    private getAssignButton() {
		return (window.top as any).document.body.querySelector("utility-button span.fa-list")?.parentElement as HTMLElement;
	}

	/**
	 * Creates the Actions icon button in the CMS left sidebar utility bar.
	 * Positioned as the second icon (right after Asset Tree).
	 */
	public createUtilButton(): void {
		// Find CMS util toolbar
		const topWindow = window.top as any;
		if (!topWindow) return;

		// Insert as 2nd item in the left sidebar (after Asset Tree navButton)
		const firstButton = this.getFirstSidebarButton();
		const anchor = document.createElement('div');

		if (firstButton?.parentElement) {
			firstButton.parentElement.insertBefore(anchor, firstButton.nextElementSibling);
			console.log('[IGX-OTT] Zap button inserted as 2nd sidebar item');
		} else {
			// Fallback: insert after the list button
			const assignButton = this.getAssignButton();
			if (!assignButton) {
				console.error('[IGX-OTT] - Could not find insertion point for Zap button');
				return;
			}
			assignButton.parentElement?.insertBefore(anchor, assignButton.nextSibling);
			console.log('[IGX-OTT] Zap button inserted after list button (fallback)');
		}

		// Create the util button component
		this.utilButtonRef = this.dynamicComponentService.createComponent(UtilButtonComponent, anchor);
		this.utilButtonRef.instance.app = this;

		// Check router events to show/hide button based on section
		const router = (window.top as any).NG_REF?.router as Router;
		if (router) {
			// Check initial state - hide if not in assets section
			const url = router.routerState?.snapshot?.url || '';
			if (!this.isAssetsView(url)) {
				if (this.utilButtonRef?.instance?.ele?.nativeElement) {
					this.utilButtonRef.instance.ele.nativeElement.style.display = "none";
				}
			}

			// Subscribe to router events
			this.observableSubTeardowns.push(router.events.subscribe(evt => {
				if (evt.constructor.name === "NavigationEnd" && !!this.utilButtonRef) {
					const currentUrl = router.routerState?.snapshot?.url || '';
					if (!this.isAssetsView(currentUrl)) {
						if (this.utilButtonRef?.instance?.ele?.nativeElement) {
							this.utilButtonRef.instance.ele.nativeElement.style.display = "none";
						}
					} else {
						if (this.utilButtonRef?.instance?.ele?.nativeElement) {
							this.utilButtonRef.instance.ele.nativeElement.style.display = "";
						}
					}
				}
			}));
		}
	}

	/**
	 * Creates the micro frontend panel
	 * @param container The container element to create the panel in
	 * @returns Reference to the created component
	 */
	public createMicroFrontendPanel(container: HTMLElement): ComponentRef<MicroFrontendPanelComponent> {
		// Create the panel component
		this.microFrontendPanelRef = this.dynamicComponentService.createComponent(MicroFrontendPanelComponent, container);
		return this.microFrontendPanelRef;
	}

	/**
	 * Creates the micro frontend util pane
	 * @param container The container element to create the pane in
	 * @returns Reference to the created component
	 */
	public createMicroFrontendUtilPane(container: HTMLElement): ComponentRef<MicroFrontendUtilPaneComponent> {
		// Create the util pane component
		this.microFrontendUtilPaneRef = this.dynamicComponentService.createComponent(MicroFrontendUtilPaneComponent, container);
		return this.microFrontendUtilPaneRef;
	}

	/**
	 * Gets the micro frontend panel if it exists
	 * @returns Reference to the panel component or undefined
	 */
	public getMicroFrontendPanel(): ComponentRef<MicroFrontendPanelComponent> | undefined {
		return this.microFrontendPanelRef;
	}

	/**
	 * Gets the micro frontend util pane if it exists
	 * @returns Reference to the util pane component or undefined
	 */
	public getMicroFrontendUtilPane(): ComponentRef<MicroFrontendUtilPaneComponent> | undefined {
		return this.microFrontendUtilPaneRef;
	}

	/**
	 * Creates the Actions panel component for the left sidebar.
	 * This replaces the old right-side action bar.
	 * @param container The host element for the component
	 * @returns Reference to the created ActionBarComponent
	 */
	public createActionPanel(container: HTMLElement): ComponentRef<ActionBarComponent> {
		if (this.actionPanelRef) return this.actionPanelRef;

		this.actionPanelRef = this.dynamicComponentService.createComponent(ActionBarComponent, container);

		// Set initial config and context
		this.actionPanelRef.instance.config = this.actionConfigService.getConfig();
		const ctx = this.assetContextService.getCurrentContext();
		if (ctx) {
			this.actionPanelRef.instance.context = ctx;
		}

		// Wire up action execution events
		this.actionPanelRef.instance.actionExecute.subscribe((action: ActionDefinition) => {
			console.log(`[IGX-OTT] Action executed: ${action.id}`);
			this.onActionExecute.emit(action);
		});

		// Wire up manage actions event
		this.actionPanelRef.instance.manageActions.subscribe(() => {
			console.log('[IGX-OTT] Opening action manager');
			this.onManageActions.emit();
		});

		console.log('[IGX-OTT] Action panel created for left sidebar');
		return this.actionPanelRef;
	}

	/**
	 * Gets the action panel component if it exists
	 * @returns Reference to the ActionBarComponent or undefined
	 */
	public getActionPanel(): ComponentRef<ActionBarComponent> | undefined {
		return this.actionPanelRef;
	}

	/**
	 * Injects the Enhanced Folder View into the CMS main content area.
	 * Called when a folder is selected and it's a folder context.
	 * Replaces the native folder contents view.
	 */
	public injectEnhancedFolderView(): void {
		const ctx = this.assetContextService.getCurrentContext();
		if (!ctx?.isFolder) return;

		// Destroy existing folder view if present
		this.destroyFolderView();

		const topWindow = window.top as any;
		if (!topWindow) return;

		// Find the native <folder-view> Angular component in the CMS DOM.
		// CMS hierarchy: #globalTabContainer > .splitcontainer > split > split-area > assetpane-hub > folder-view
		const nativeFolder = topWindow.document.querySelector('folder-view') as HTMLElement;
		if (!nativeFolder) {
			console.warn('[IGX-OTT] Could not find native <folder-view> for injection');
			return;
		}

		// The parent (assetpane-hub) is where we inject our view
		const container = nativeFolder.parentElement;
		if (!container) {
			console.warn('[IGX-OTT] Could not find folder-view parent container');
			return;
		}

		// Hide native folder view
		nativeFolder.style.display = 'none';

		// Create host element
		const host = topWindow.document.createElement('div');
		host.id = 'igx-ott-folder-view';
		host.style.cssText = 'position:relative;z-index:1;width:100%;height:100%;';

		container.appendChild(host);

		// Create the Enhanced Folder View component
		this.folderViewRef = this.dynamicComponentService.createComponent(EnhancedFolderViewComponent, host);
		this.folderViewRef.instance.context = ctx;

		console.log(`[IGX-OTT] Enhanced Folder View injected for: ${ctx.name} (${ctx.id})`);
	}

	/**
	 * Public method to destroy the Enhanced Folder View.
	 * Called by the context subscription when navigating away from a folder.
	 */
	public destroyEnhancedFolderView(): void {
		this.destroyFolderView();
	}

	/**
	 * Destroys the Enhanced Folder View if present
	 */
	private destroyFolderView(): void {
		if (this.folderViewRef) {
			const host = this.folderViewRef.location.nativeElement;
			this.dynamicComponentService.destroyComponent(this.folderViewRef.instance);
			host?.remove();
			this.folderViewRef = undefined;

			// Restore native folder view
			const topWindow = window.top as any;
			const nativeFolder = topWindow?.document?.querySelector('folder-view') as HTMLElement;
			if (nativeFolder) {
				nativeFolder.style.display = '';
			}
		}
	}

	/**
	 * Gets the folder view component if it exists
	 */
	public getFolderView(): ComponentRef<EnhancedFolderViewComponent> | undefined {
		return this.folderViewRef;
	}

	/** Reference to the injected "Open in Word" button element */
	private openInWordBtn?: HTMLElement;

	/**
	 * Injects an "Open in Word" (or appropriate app) button into the CMS
	 * asset button area — next to the existing "Upload New" / "Download" buttons.
	 *
	 * Reads the download URL from the existing CMS Download button/link
	 * so we use the exact same URL the CMS uses.
	 */
	public injectFileBar(): void {
		const ctx = this.assetContextService.getCurrentContext();
		if (!ctx || ctx.isFolder) return;

		// Destroy existing button if present
		this.destroyFileBarInternal();

		const topWindow = window.top as any;
		if (!topWindow) return;

		// Resolve file extension → app mapping
		const name = ctx.name || '';
		const dotIdx = name.lastIndexOf('.');
		const ext = dotIdx > 0 ? name.substring(dotIdx).toLowerCase() : '';

		// Map of extensions to Office app info
		const officeMap: Record<string, { app: string; uri: string }> = {
			'.docx': { app: 'Word', uri: 'ms-word:ofe|u|' },
			'.doc':  { app: 'Word', uri: 'ms-word:ofe|u|' },
			'.rtf':  { app: 'Word', uri: 'ms-word:ofe|u|' },
			'.xlsx': { app: 'Excel', uri: 'ms-excel:ofe|u|' },
			'.xls':  { app: 'Excel', uri: 'ms-excel:ofe|u|' },
			'.csv':  { app: 'Excel', uri: 'ms-excel:ofe|u|' },
			'.pptx': { app: 'PowerPoint', uri: 'ms-powerpoint:ofe|u|' },
			'.ppt':  { app: 'PowerPoint', uri: 'ms-powerpoint:ofe|u|' },
		};
		const mapping = officeMap[ext];
		if (!mapping) {
			console.log(`[IGX-OTT] No Office app mapping for extension "${ext}" — skipping Open in App button`);
			return;
		}

		// Find the CMS button area: look for the "Download" button by text,
		// then use its parent container as the injection point.
		const allButtons = topWindow.document.querySelectorAll('a, button');
		let downloadBtn: HTMLElement | null = null;
		for (const el of allButtons) {
			const text = (el as HTMLElement).textContent?.trim();
			if (text === 'Download' || text === 'Upload New') {
				downloadBtn = el as HTMLElement;
				break;
			}
		}

		if (!downloadBtn?.parentElement) {
			console.warn('[IGX-OTT] Could not find CMS Download/Upload button for Open in Word injection');
			return;
		}

		const container = downloadBtn.parentElement;

		// Read the download URL from the CMS Download link
		let downloadUrl = '';
		for (const el of container.querySelectorAll('a, button')) {
			if ((el as HTMLElement).textContent?.trim() === 'Download') {
				downloadUrl = (el as HTMLAnchorElement).href || '';
				break;
			}
		}
		// Fallback: construct from CMS base URL + asset path
		if (!downloadUrl && ctx.path) {
			const baseUrl = topWindow.location?.origin || '';
			const cleanPath = ctx.path.replace(/^~\//, '');
			downloadUrl = `${baseUrl}/dhillis/${cleanPath}`;
		}

		if (!downloadUrl) {
			console.warn('[IGX-OTT] Could not determine download URL for Open in Word');
			return;
		}

		// Create the "Open in Word" button, matching CMS button styling
		const btn = topWindow.document.createElement('a');
		btn.id = 'igx-ott-open-in-word';
		btn.textContent = `Open in ${mapping.app}`;
		btn.href = 'javascript:void(0)';
		btn.style.cssText = [
			'display: block',
			'width: 100%',
			'padding: 8px 16px',
			'margin-bottom: 5px',
			'background: #2563eb',
			'color: #fff',
			'text-align: center',
			'border-radius: 3px',
			'font-size: 13px',
			'font-family: inherit',
			'font-weight: 500',
			'cursor: pointer',
			'text-decoration: none',
			'box-sizing: border-box',
		].join(';');

		btn.addEventListener('click', (e: Event) => {
			e.preventDefault();
			const uri = mapping.uri + encodeURI(downloadUrl);
			console.log(`[IGX-OTT] Opening in ${mapping.app}: ${uri}`);
			topWindow.open(uri, '_self');
		});

		// Hover effect
		btn.addEventListener('mouseenter', () => { btn.style.background = '#1d4ed8'; });
		btn.addEventListener('mouseleave', () => { btn.style.background = '#2563eb'; });

		// Insert as first child of the button container (above Upload New)
		container.insertBefore(btn, container.firstChild);
		this.openInWordBtn = btn;

		console.log(`[IGX-OTT] "Open in ${mapping.app}" button injected, URL: ${downloadUrl}`);
	}

	/**
	 * Public method to destroy the file bar / Open in Word button.
	 */
	public destroyFileBar(): void {
		this.destroyFileBarInternal();
	}

	/**
	 * Destroys the Open in Word button if present
	 */
	private destroyFileBarInternal(): void {
		if (this.openInWordBtn) {
			this.openInWordBtn.remove();
			this.openInWordBtn = undefined;
		}
		// Also clean up the Angular component if it was used
		if (this.fileBarRef) {
			const host = this.fileBarRef.location.nativeElement;
			this.dynamicComponentService.destroyComponent(this.fileBarRef.instance);
			host?.remove();
			this.fileBarRef = undefined;
		}
		if (this.hubOriginalStyle !== undefined) {
			const topWindow = window.top as any;
			const hub = topWindow?.document?.querySelector('assetpane-hub') as HTMLElement;
			if (hub) {
				hub.style.cssText = this.hubOriginalStyle;
			}
			this.hubOriginalStyle = undefined;
		}
	}

	/**
	 * Hides non-folder UI components on navigation.
	 * The folder view lifecycle is managed separately by the context subscription.
	 */
	public hideNonFolderComponents(): void {
		// Hide the topbar button's panel if it exists
		if (this.topbarButtonRef?.instance) {
			this.topbarButtonRef.instance.uncurrent();
		}

		// Hide the util button's panel if it exists
		if (this.utilButtonRef?.instance) {
			this.utilButtonRef.instance.uncurrent();
		}

		// Delay destruction to let UI hide first
		setTimeout(() => {
			if (this.microFrontendPanelRef) {
				this.dynamicComponentService.destroyComponent(this.microFrontendPanelRef.instance);
				this.microFrontendPanelRef = undefined;
			}

			if (this.microFrontendUtilPaneRef) {
				this.dynamicComponentService.destroyComponent(this.microFrontendUtilPaneRef.instance);
				this.microFrontendUtilPaneRef = undefined;
			}
		}, 100);
	}

	/**
	 * Checks if the current URL is in the Assets section
	 */
	private isAssetsView(url: string): boolean {
		return url.includes('/assets/') || url.includes('assets/');
	}

	ngOnDestroy(): void {
		// Clean up components
		if (this.topbarButtonRef) {
			this.dynamicComponentService.destroyComponent(this.topbarButtonRef.instance);
		}

		if (this.utilButtonRef) {
			this.dynamicComponentService.destroyComponent(this.utilButtonRef.instance);
		}

		if (this.microFrontendPanelRef) {
			this.dynamicComponentService.destroyComponent(this.microFrontendPanelRef.instance);
		}

		if (this.microFrontendUtilPaneRef) {
			this.dynamicComponentService.destroyComponent(this.microFrontendUtilPaneRef.instance);
		}

		if (this.actionPanelRef) {
			this.dynamicComponentService.destroyComponent(this.actionPanelRef.instance);
		}

		this.destroyFolderView();
		this.destroyFileBarInternal();

		// Call parent cleanup
		this.cleanup();
	}
}
