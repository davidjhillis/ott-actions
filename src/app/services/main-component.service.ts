import { ComponentRef, EventEmitter, Injectable, Type } from "@angular/core";
import { Router } from "@angular/router";
import { DynamicComponentService } from "./dynamic-component.service";
import { AssetContextService } from "./asset-context.service";
import { AssetContext } from "../models/asset-context.model";
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
	/** Raw DOM button injected between CMS Upload New / Download buttons */
	private openInWordBtn?: HTMLElement;

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

	/**
	 * Injects an "Open in [App]" button between the CMS "Upload New" and
	 * "Download" buttons, matching the CMS DOM structure:
	 *   <div igx-button class="editform-field-item">
	 *     <input type="button" class="button" value="Open in Word">
	 *   </div>
	 *
	 * Returns true if injection succeeded (or not applicable), false if
	 * the CMS buttons haven't rendered yet (caller should retry).
	 */
	public injectFileBar(): boolean {
		const ctx = this.assetContextService.getCurrentContext();
		if (!ctx || ctx.isFolder) return true; // not applicable, don't retry

		// Don't re-inject if already present
		if (this.openInWordBtn) return true;

		const topWindow = window.top as any;
		if (!topWindow) return true;

		// Resolve file extension → Office app mapping
		const name = ctx.name || '';
		const dotIdx = name.lastIndexOf('.');
		const ext = dotIdx > 0 ? name.substring(dotIdx).toLowerCase() : '';

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
		if (!mapping) return true; // not an Office file, don't retry

		// Find CMS buttons by their exact input[value] attributes
		const uploadBtn = topWindow.document.querySelector('input[value="Upload New"]') as HTMLInputElement;
		const downloadBtn = topWindow.document.querySelector('input[value="Download"]') as HTMLInputElement;

		const anchorBtn = uploadBtn || downloadBtn;
		if (!anchorBtn) return false; // CMS buttons haven't rendered — retry

		// Get the parent <div igx-button class="editform-field-item">
		const anchorDiv = anchorBtn.closest('div[igx-button]') || anchorBtn.parentElement;
		if (!anchorDiv?.parentElement) return false;
		const container = anchorDiv.parentElement;

		// Create matching CMS button structure:
		// <div igx-button class="editform-field-item">
		//   <input type="button" class="button" value="Open in Word">
		// </div>
		const wrapper = topWindow.document.createElement('div');
		wrapper.setAttribute('igx-button', '');
		wrapper.className = 'editform-field-item';

		const btn = topWindow.document.createElement('input');
		btn.type = 'button';
		btn.className = 'button';
		btn.value = `Open in ${mapping.app}`;

		wrapper.appendChild(btn);

		// Click handler: resolve URL at click time, open online or via Office URI scheme
		btn.addEventListener('click', () => {
			const url = this.resolveAssetDownloadUrl(ctx);
			if (!url) {
				console.warn('[IGX-OTT] Could not resolve URL for Open in Word');
				return;
			}

			// Online URLs (SharePoint, OneDrive, Office) → open in browser (Word Online)
			if (this.isOnlineOfficeUrl(url)) {
				console.log(`[IGX-OTT] Opening in Word Online: ${url}`);
				topWindow.open(url, '_blank');
				return;
			}

			// Local/CMS files → try ms-word URI scheme
			const uri = mapping.uri + encodeURI(url);
			console.log(`[IGX-OTT] Opening in ${mapping.app}: ${uri}`);
			topWindow.open(uri, '_self');
		});

		// Insert after Upload New (between Upload New and Download)
		if (uploadBtn) {
			const uploadDiv = uploadBtn.closest('div[igx-button]') || uploadBtn.parentElement;
			if (uploadDiv?.nextSibling) {
				container.insertBefore(wrapper, uploadDiv.nextSibling);
			} else {
				container.appendChild(wrapper);
			}
		} else {
			// No Upload New — insert before Download
			container.insertBefore(wrapper, anchorDiv);
		}

		this.openInWordBtn = wrapper;
		console.log(`[IGX-OTT] "Open in ${mapping.app}" injected between CMS buttons`);
		return true;
	}

	/**
	 * Resolves the URL for the current asset.
	 * Called at click time so CMS DOM is fully rendered.
	 *
	 * For Remote Assets: reads the "Current URL" field from the Properties
	 * panel — this contains the SharePoint/OneDrive share link.
	 *
	 * For local assets: tries NG_REF model, then dss download URL.
	 *
	 * Strategy:
	 *   1. Search DOM for "Current URL" field (Remote Assets → SharePoint link)
	 *   2. Search DOM for any SharePoint/OneDrive URL in inputs or text
	 *   3. NG_REF model string properties
	 *   4. Convert dsspreview → dss for raw file download
	 *   5. Fallback: dss/amd/{id}
	 */
	private resolveAssetDownloadUrl(ctx: AssetContext): string {
		const topWindow = window.top as any;
		if (!topWindow) return '';
		const baseUrl = topWindow.location?.origin || '';
		const instancePath = topWindow.location?.pathname?.replace(/\/$/, '') || '';

		const hub = topWindow.document.querySelector('assetpane-hub');

		// 1. Search for "Current URL" field value in the Properties panel.
		//    Remote Assets store the SharePoint share link here.
		if (hub) {
			// Check input fields for URLs (Current URL is often in a text input)
			const inputs = hub.querySelectorAll('input[type="text"], input:not([type]), textarea');
			for (let i = 0; i < inputs.length; i++) {
				const val = (inputs[i] as HTMLInputElement).value?.trim() || '';
				if (val.startsWith('http')) {
					console.log(`[IGX-OTT] Found URL in input field: ${val}`);
					return val;
				}
			}

			// Check text elements for URLs (might be rendered as plain text)
			const allEls = hub.querySelectorAll('*');
			for (let i = 0; i < allEls.length; i++) {
				const el = allEls[i] as HTMLElement;
				const text = el.textContent?.trim() || '';
				if (text.startsWith('https://') && el.children.length === 0 && text.length < 500) {
					if (this.isOnlineOfficeUrl(text) || text.includes('.com/')) {
						console.log(`[IGX-OTT] Found URL in text element: ${text}`);
						return text;
					}
				}
			}
		}

		// 2. Try NG_REF model for path/URL string properties
		const model = topWindow.NG_REF?.currentContent?.Model?._value;
		if (model) {
			const urlKeys = [
				'CurrentUrl', 'Path', 'Url', 'DownloadUrl', 'AssetUrl',
				'FilePath', 'Source', 'ContentUrl', 'RemoteUrl', 'ExternalUrl'
			];
			for (const key of urlKeys) {
				const val = model[key];
				if (typeof val === 'string' && val.length > 0) {
					console.log(`[IGX-OTT] Model.${key} = "${val}"`);
					if (val.startsWith('http')) return val;
					const cleanPath = val.replace(/^~\//, '');
					return `${baseUrl}${instancePath}/${cleanPath}`;
				}
			}
		}

		// 3. Find <a> in hub and convert dsspreview → dss for raw file
		if (hub) {
			const anchors = hub.querySelectorAll('a[href]');
			for (let i = 0; i < anchors.length; i++) {
				const a = anchors[i] as HTMLAnchorElement;
				if (a.href && !a.href.includes('javascript:') && !a.href.includes('#')) {
					let url = a.href;
					if (url.includes('/dsspreview/')) {
						url = url.replace('/dsspreview/', '/dss/');
						console.log(`[IGX-OTT] Converted preview → raw URL: ${url}`);
					} else {
						console.log(`[IGX-OTT] Found <a> URL: ${url}`);
					}
					return url;
				}
			}
		}

		// 4. Fallback: construct dss URL from asset ID
		const numericId = ctx.id.replace(/[^0-9]/g, '');
		const fallbackUrl = `${baseUrl}${instancePath}/dss/amd/${numericId}`;
		console.warn(`[IGX-OTT] Using fallback dss URL: ${fallbackUrl}`);
		return fallbackUrl;
	}

	/** Check if a URL points to an online Office service (SharePoint, OneDrive, Office 365) */
	private isOnlineOfficeUrl(url: string): boolean {
		return url.includes('sharepoint.com')
			|| url.includes('onedrive.com')
			|| url.includes('onedrive.live.com')
			|| url.includes('office.com')
			|| url.includes('office365.com');
	}

	/**
	 * Public method to destroy the file bar / Open in Word button.
	 */
	public destroyFileBar(): void {
		this.destroyFileBarInternal();
	}

	/**
	 * Destroys the Open in Word button (and Angular component if used)
	 */
	private destroyFileBarInternal(): void {
		if (this.openInWordBtn) {
			this.openInWordBtn.remove();
			this.openInWordBtn = undefined;
		}
		if (this.fileBarRef) {
			const host = this.fileBarRef.location.nativeElement;
			this.dynamicComponentService.destroyComponent(this.fileBarRef.instance);
			host?.remove();
			this.fileBarRef = undefined;
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
