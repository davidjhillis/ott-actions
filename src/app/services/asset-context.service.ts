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
	 * Extract ID from URL and fetch properties.
	 * Supports: site/{xID}, assets/{a_ID}, assets/{assetfolders_ID}
	 */
	private resolveFromUrl(url: string): void {
		// Try site page pattern: site/x123
		const siteMatch = url.match(/site\/(x\d+)/i);
		if (siteMatch) {
			this.resolveSitePage(siteMatch[1]);
			return;
		}

		// Try DAM asset pattern: assets/a_123
		const assetMatch = url.match(/assets\/(a_\d+)/i);
		if (assetMatch) {
			this.resolveAsset(assetMatch[1]);
			return;
		}

		// Try DAM folder pattern: assets/assetfolders_123
		const folderMatch = url.match(/assets\/(assetfolders_\d+)/i);
		if (folderMatch) {
			this.resolveAssetFolder(folderMatch[1]);
			return;
		}

		// No match — clear context
		this.contextSubject.next(null);
		this.currentXid = undefined;
	}

	/**
	 * Resolve a site tree page by xID.
	 */
	private resolveSitePage(xid: string): void {
		if (xid === this.currentXid) return;
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
				console.log(`[IGX-OTT] Site context: ${ctx.name} (${xid})`);
			},
			error: () => {
				this.contextSubject.next({
					id: xid,
					name: xid,
					isFolder: false,
					path: ''
				});
			}
		});
	}

	/**
	 * Resolve a DAM asset by ID (URL format: a_17 → API format: a/17).
	 */
	private resolveAsset(urlId: string): void {
		if (urlId === this.currentXid) return;
		this.currentXid = urlId;

		// Convert URL format (a_17) to API format (a/17)
		const apiId = urlId.replace('_', '/');

		this.cms.callService<any>({
			service: 'AssetServices',
			action: 'GetAssetInfo',
			args: [apiId]
		}).subscribe({
			next: (info) => {
				const ctx: AssetContext = {
					id: apiId,
					name: info?.Name || info?.FileName || urlId,
					isFolder: false,
					path: info?.Path || info?.FolderPath || '',
					schema: info?.Schema || info?.AssetType || 'Asset',
					workflowStatus: info?.WorkflowStatus || undefined,
					parentId: info?.FolderId || info?.ParentId || undefined,
				};
				this.contextSubject.next(ctx);
				console.log(`[IGX-OTT] Asset context: ${ctx.name} (${apiId})`);
			},
			error: () => {
				// Fallback: basic context from URL
				this.contextSubject.next({
					id: apiId,
					name: urlId,
					isFolder: false,
					path: ''
				});
				console.log(`[IGX-OTT] Asset context (fallback): ${urlId}`);
			}
		});
	}

	/**
	 * Resolve a DAM asset folder.
	 */
	private resolveAssetFolder(folderId: string): void {
		if (folderId === this.currentXid) return;
		this.currentXid = folderId;

		// Asset folders are folders — set basic context
		this.contextSubject.next({
			id: folderId,
			name: folderId,
			isFolder: true,
			path: ''
		});
		console.log(`[IGX-OTT] Asset folder context: ${folderId}`);
	}

	ngOnDestroy(): void {
		this.routerSub?.unsubscribe();
	}
}
