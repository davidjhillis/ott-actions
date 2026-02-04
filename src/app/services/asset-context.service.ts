import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AssetContext } from '../models/asset-context.model';
import { CMSCommunicationsService } from './cms-communications.service';

/**
 * Tracks the current CMS asset/folder context by listening to
 * NG_REF router NavigationEnd events and resolving page properties.
 *
 * Dev mode: emits a hardcoded demo context.
 */
@Injectable({
	providedIn: 'root'
})
export class AssetContextService implements OnDestroy {
	private contextSubject = new BehaviorSubject<AssetContext | null>(null);
	public context$ = this.contextSubject.asObservable();

	private routerSub?: Subscription;
	private currentXid?: string;

	constructor(private cms: CMSCommunicationsService) {
		if (this.cms.isDevMode) {
			// Emit demo context for standalone dev preview
			this.contextSubject.next({
				id: 'x312',
				name: 'ISO-9001-2025 Draft',
				isFolder: true,
				path: '/Standards/Quality/ISO-9001-2025',
				schema: 'StandardsCollection',
				workflowStatus: 'Review',
				selectedItems: [
					{ id: 'x313', name: 'Draft-v3.2.docx', isFolder: false, schema: 'Document' },
					{ id: 'x314', name: 'Appendix-A.pdf', isFolder: false, schema: 'Document' },
					{ id: 'x315', name: 'Review-Comments', isFolder: true, schema: 'Folder' },
					{ id: 'x316', name: 'Supporting-Data.xlsx', isFolder: false, schema: 'Spreadsheet' },
					{ id: 'x317', name: 'Cover-Letter.docx', isFolder: false, schema: 'Document' },
				]
			});
		} else {
			this.subscribeToRouter();
		}
	}

	/**
	 * Synchronous getter for the current context.
	 */
	getCurrentContext(): AssetContext | null {
		return this.contextSubject.value;
	}

	/**
	 * Subscribe to CMS router NavigationEnd events and
	 * resolve asset context from the URL's xID.
	 */
	private subscribeToRouter(): void {
		const ngRef = (window.top as any)?.NG_REF;
		const router = ngRef?.router;
		if (!router) return;

		// Check initial URL
		this.resolveFromUrl(router.routerState?.snapshot?.url || '');

		// Listen for navigation changes
		this.routerSub = router.events.subscribe((evt: any) => {
			if (evt.constructor.name === 'NavigationEnd') {
				this.resolveFromUrl(evt.urlAfterRedirects || evt.url || '');
			}
		});
	}

	/**
	 * Extract xID from URL (pattern: site/{xID}) and fetch page properties.
	 */
	private resolveFromUrl(url: string): void {
		const match = url.match(/site\/(x\d+)/i);
		if (!match) {
			this.contextSubject.next(null);
			this.currentXid = undefined;
			return;
		}

		const xid = match[1];
		if (xid === this.currentXid) return; // No change
		this.currentXid = xid;

		this.cms.callService<any>({
			service: 'SiteTreeServices',
			action: 'GetPageProperties',
			args: [xid]
		}).subscribe({
			next: (props) => {
				const ctx: AssetContext = {
					id: xid,
					name: props?.Name || xid,
					isFolder: props?.IsIndex === true || props?.IsIndex === 'true',
					path: props?.Path || '',
					schema: props?.Schema || undefined,
					workflowStatus: props?.WorkflowStatus || undefined,
					parentId: props?.ParentId || undefined,
				};
				this.contextSubject.next(ctx);
				console.log(`[IGX-OTT] Asset context updated: ${ctx.name} (${xid})`);
			},
			error: () => {
				// Fallback: basic context from URL only
				this.contextSubject.next({
					id: xid,
					name: xid,
					isFolder: false,
					path: ''
				});
			}
		});
	}

	ngOnDestroy(): void {
		this.routerSub?.unsubscribe();
	}
}
