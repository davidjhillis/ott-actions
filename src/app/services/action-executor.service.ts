import { ComponentRef, Injectable } from '@angular/core';
import { DynamicComponentService } from './dynamic-component.service';
import { AssetContextService } from './asset-context.service';
import { CMSCommunicationsService } from './cms-communications.service';
import { NotificationService } from './notification.service';
import { ActionDefinition } from '../models/action.model';
import { DistributeReportComponent } from '../components/action-modals/distribute-report/distribute-report.component';
import { ViewDetailsComponent } from '../components/action-modals/view-details/view-details.component';
import { SendToTranslationComponent } from '../components/action-modals/send-to-translation/send-to-translation.component';
import { AssignReportNumberComponent } from '../components/action-modals/assign-report-number/assign-report-number.component';
import { ExportCollectionComponent } from '../components/action-modals/export-collection/export-collection.component';
import { CreateCollectionComponent } from '../components/action-modals/create-collection/create-collection.component';
import { ManageWorkflowComponent } from '../components/action-modals/manage-workflow/manage-workflow.component';
import { BatchAssignComponent } from '../components/action-modals/batch-assign/batch-assign.component';
import { ViewHistoryComponent } from '../components/action-modals/view-history/view-history.component';
import { UploadSourceFilesComponent } from '../components/action-modals/upload-source-files/upload-source-files.component';
import { ImportStandardsExcelComponent } from '../components/action-modals/import-standards-excel/import-standards-excel.component';
import { ActionManagerComponent } from '../components/action-admin/action-manager.component';

@Injectable({
	providedIn: 'root'
})
export class ActionExecutorService {
	private activeModalRef?: ComponentRef<any>;

	constructor(
		private dynamicComponentService: DynamicComponentService,
		private assetContextService: AssetContextService,
		private cms: CMSCommunicationsService,
		private notify: NotificationService
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

		try {
			this.activeModalRef = this.dynamicComponentService.createComponent(componentClass, host);
			console.log(`[IGX-OTT] Modal created: ${action.handler.componentId}`);
		} catch (err) {
			console.error(`[IGX-OTT] Failed to create modal: ${action.handler.componentId}`, err);
			host.remove();
			return;
		}

		// Pass asset context if the component accepts it
		this.passContextToComponent();

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
		if (!container) {
			console.warn('[IGX-OTT] Panel container #globalTabContainer not found');
			return;
		}

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

		try {
			this.activeModalRef = this.dynamicComponentService.createComponent(componentClass, host);
			console.log(`[IGX-OTT] Panel created: ${action.handler.componentId}`);
		} catch (err) {
			console.error(`[IGX-OTT] Failed to create panel: ${action.handler.componentId}`, err);
			host.remove();
			return;
		}

		// Pass asset context if the component accepts it
		this.passContextToComponent();

		if (this.activeModalRef.instance.close) {
			this.activeModalRef.instance.close.subscribe(() => {
				this.closeActiveModal();
			});
		}
	}

	/**
	 * Calls a CMS API service method via CMSCommunicationsService Observable.
	 * Shows loading → success/error toast notifications.
	 * Automatically maps PageCommandsServices to AssetServices for DAM assets.
	 */
	private callCmsApi(action: ActionDefinition): void {
		let { cmsService, cmsMethod, postCall, confirmBefore } = action.handler;

		// Handle legacy endpoint pattern
		if (!cmsService && action.handler.endpoint) {
			console.log(`[IGX-OTT] Legacy CMS API call: ${action.handler.method} ${action.handler.endpoint}`);
			this.notify.warning(`Legacy action "${action.label}" not yet supported`);
			return;
		}

		if (!cmsService || !cmsMethod) {
			console.warn(`[IGX-OTT] CMS API action missing service or method:`, action.id);
			this.notify.error(`Action "${action.label}" is not configured properly`);
			return;
		}

		// Show confirmation dialog if configured
		if (confirmBefore) {
			const confirmed = window.confirm(`Execute "${action.label}"?`);
			if (!confirmed) {
				console.log(`[IGX-OTT] Action cancelled by user: ${action.id}`);
				return;
			}
		}

		// Get the current asset context for the API call
		const ctx = this.assetContextService.getCurrentContext();
		const args = ctx?.id ? [ctx.id] : [];

		// For DAM assets (IDs starting with 'a/'), use FileBrowserServices instead of PageCommandsServices
		const isAsset = ctx?.id?.startsWith('a/');
		if (isAsset && cmsService === 'PageCommandsServices') {
			cmsService = 'FileBrowserServices';
			console.log(`[IGX-OTT] Mapped PageCommandsServices → FileBrowserServices for asset ${ctx?.id}`);
		}

		// Show loading toast
		const loader = this.notify.loading(`${action.label}...`);

		this.cms.callService<any>({
			service: cmsService,
			action: cmsMethod,
			args,
			postCall
		}).subscribe({
			next: (result) => {
				console.log(`[IGX-OTT] CMS call success: ${cmsService}.${cmsMethod}`, result);
				loader.success(`${action.label} completed`);
			},
			error: (err) => {
				console.error(`[IGX-OTT] CMS call failed: ${cmsService}.${cmsMethod}`, err);
				// Dev mode returns a specific error — show as info instead of error
				if (this.cms.isDevMode) {
					loader.dismiss();
					this.notify.info(`Dev mode: ${cmsService}.${cmsMethod}(${args.join(', ')})`);
				} else {
					loader.error(`${action.label} failed`);
				}
			}
		});
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
			case 'assign-report-number':
				return AssignReportNumberComponent;
			case 'export-collection':
				return ExportCollectionComponent;
			case 'create-collection':
				return CreateCollectionComponent;
			case 'manage-workflow':
				return ManageWorkflowComponent;
			case 'batch-assign':
				return BatchAssignComponent;
			case 'upload-source-files':
				return UploadSourceFilesComponent;
			case 'import-standards-excel':
				return ImportStandardsExcelComponent;
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
			case 'view-history':
				return ViewHistoryComponent;
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
	 * Pass the current asset context to the active component if it has a context input
	 */
	private passContextToComponent(): void {
		if (!this.activeModalRef) return;
		const ctx = this.assetContextService.getCurrentContext();
		if (ctx && 'context' in this.activeModalRef.instance) {
			this.activeModalRef.instance.context = ctx;
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
