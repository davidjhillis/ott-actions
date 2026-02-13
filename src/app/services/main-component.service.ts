import { ComponentRef, EventEmitter, Injectable, Type } from "@angular/core";
import { Router } from "@angular/router";
import { DynamicComponentService } from "./dynamic-component.service";
import { AssetContextService } from "./asset-context.service";
import { TopbarButtonComponent } from "../components/topbar-button/topbar-button.component";
import { UtilButtonComponent } from "../components/util-button/util-button.component";
import { MicroFrontendPanelComponent } from "../components/micro-frontend-panel/micro-frontend-panel.component";
import { MicroFrontendUtilPaneComponent } from "../components/micro-frontend-util-pane/micro-frontend-util-pane.component";
import { ActionBarComponent } from "../components/action-bar/action-bar.component";
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

    private getAssignButton() {
		return (window.top as any).document.body.querySelector("utility-button span.fa-list")?.parentElement as HTMLElement;
	}

	/**
	 * Creates the Actions icon button in the CMS left sidebar utility bar.
	 * When clicked, it loads the Actions panel into the left panel area.
	 */
	public createUtilButton(): void {
		// Find CMS util toolbar
		const topWindow = window.top as any;
		if (!topWindow) return;


		// Find a reference button to position next to
		const assignButton = this.getAssignButton();
		if (!assignButton) {
			console.error('[IGX-OTT] - Assign button not found');
			return;
		}

		// Create a container element for the button
		const anchor = document.createElement('div');
		assignButton.parentElement?.insertBefore(anchor, assignButton.nextSibling);

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
	 * Hides the main component when navigation occurs
	 * Also destroys the component from panelRef after a short delay
	 */
	public hideMainComponent(): void {
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

		// Call parent cleanup
		this.cleanup();
	}
}
