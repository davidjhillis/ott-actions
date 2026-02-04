import { ComponentRef, Injectable } from '@angular/core';
import { DynamicComponentService } from './dynamic-component.service';
import { ActionDefinition } from '../models/action.model';
import { DistributeReportComponent } from '../components/action-modals/distribute-report/distribute-report.component';
import { ViewDetailsComponent } from '../components/action-modals/view-details/view-details.component';
import { SendToTranslationComponent } from '../components/action-modals/send-to-translation/send-to-translation.component';
import { ActionManagerComponent } from '../components/action-admin/action-manager.component';

@Injectable({
	providedIn: 'root'
})
export class ActionExecutorService {
	private activeModalRef?: ComponentRef<any>;

	constructor(
		private dynamicComponentService: DynamicComponentService
	) { }

	/**
	 * Executes an action based on its definition
	 */
	public execute(action: ActionDefinition): void {
		console.log(`[IGX-OTT] Executing action: ${action.id} (type: ${action.handler.type})`);

		switch (action.handler.type) {
			case 'modal':
				this.openModal(action);
				break;
			case 'panel':
				this.openPanel(action);
				break;
			case 'cmsApi':
				this.callCmsApi(action);
				break;
			case 'link':
				this.openLink(action);
				break;
			case 'external':
				this.openExternal(action);
				break;
			default:
				console.warn(`[IGX-OTT] Unknown action type: ${action.handler.type}`);
		}
	}

	/**
	 * Opens a modal for the given action
	 */
	private openModal(action: ActionDefinition): void {
		// Close any existing modal
		this.closeActiveModal();

		const topWindow = window.top as any;
		if (!topWindow) return;

		// Create a host element in the top frame
		const host = topWindow.document.createElement('div');
		host.id = 'igx-ott-modal';
		topWindow.document.body.appendChild(host);

		// Map componentId to component class
		const componentClass = this.getModalComponent(action.handler.componentId);
		if (!componentClass) {
			console.warn(`[IGX-OTT] No modal component for: ${action.handler.componentId}`);
			host.remove();
			return;
		}

		this.activeModalRef = this.dynamicComponentService.createComponent(componentClass, host);

		// Wire up close event
		if (this.activeModalRef.instance.close) {
			this.activeModalRef.instance.close.subscribe(() => {
				this.closeActiveModal();
			});
		}
	}

	/**
	 * Opens a panel for the given action
	 */
	private openPanel(action: ActionDefinition): void {
		this.closeActiveModal();

		const topWindow = window.top as any;
		if (!topWindow) return;

		const container = topWindow.document.querySelector('#globalTabContainer');
		if (!container) return;

		const host = topWindow.document.createElement('div');
		host.id = 'igx-ott-panel';
		host.style.cssText = 'position:absolute;right:0;top:0;bottom:0;z-index:99;';
		container.appendChild(host);

		const componentClass = this.getPanelComponent(action.handler.componentId);
		if (!componentClass) {
			console.warn(`[IGX-OTT] No panel component for: ${action.handler.componentId}`);
			host.remove();
			return;
		}

		this.activeModalRef = this.dynamicComponentService.createComponent(componentClass, host);

		if (this.activeModalRef.instance.close) {
			this.activeModalRef.instance.close.subscribe(() => {
				this.closeActiveModal();
			});
		}
	}

	/**
	 * Calls a CMS API endpoint (stub for MVP)
	 */
	private callCmsApi(action: ActionDefinition): void {
		console.log(`[IGX-OTT] CMS API call: ${action.handler.method} ${action.handler.endpoint}`);
		// TODO: Implement actual CMS API calls
	}

	/**
	 * Opens an external link
	 */
	private openLink(action: ActionDefinition): void {
		if (action.handler.url) {
			if (action.handler.newTab) {
				window.open(action.handler.url, '_blank');
			} else {
				window.location.href = action.handler.url;
			}
		}
	}

	/**
	 * Opens an external application/page
	 */
	private openExternal(action: ActionDefinition): void {
		if (action.handler.url) {
			window.open(action.handler.url, '_blank');
		}
	}

	/**
	 * Maps componentId to modal component class
	 */
	private getModalComponent(componentId?: string): any {
		switch (componentId) {
			case 'distribute-report':
				return DistributeReportComponent;
			case 'send-to-translation':
				return SendToTranslationComponent;
			default:
				return null;
		}
	}

	/**
	 * Maps componentId to panel component class
	 */
	private getPanelComponent(componentId?: string): any {
		switch (componentId) {
			case 'view-details':
				return ViewDetailsComponent;
			default:
				return null;
		}
	}

	/**
	 * Opens the Action Manager admin interface
	 */
	public openActionManager(): void {
		this.closeActiveModal();

		const topWindow = window.top as any;
		if (!topWindow) return;

		const host = topWindow.document.createElement('div');
		host.id = 'igx-ott-action-manager';
		topWindow.document.body.appendChild(host);

		this.activeModalRef = this.dynamicComponentService.createComponent(ActionManagerComponent, host);

		if (this.activeModalRef.instance.close) {
			this.activeModalRef.instance.close.subscribe(() => {
				this.closeActiveModal();
			});
		}
	}

	/**
	 * Closes the currently active modal/panel
	 */
	public closeActiveModal(): void {
		if (this.activeModalRef) {
			const host = this.activeModalRef.location.nativeElement;
			this.dynamicComponentService.destroyComponent(this.activeModalRef.instance);
			if (host?.parentElement) {
				host.parentElement.removeChild(host);
			}
			this.activeModalRef = undefined;
		}
	}
}
