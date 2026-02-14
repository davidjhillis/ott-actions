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
			// Emit demo context: Designation Collection for ASTM translation workflow
			this.contextSubject.next({
				id: 'af/7',
				name: 'E0008_E0008M',
				isFolder: true,
				path: '/Standards Documents/E0008_E0008M',
				schema: 'DesignationCollection',
				workflowStatus: 'In Review',
				selectedItems: [
					{ id: 'af/12', name: 'E0008_E0008M-16AE01: Standard Test Methods...', isFolder: true, schema: 'StandardCollection' },
					{ id: 'af/13', name: 'E0008_E0008M-21: Standard Test Methods...', isFolder: true, schema: 'StandardCollection' },
					{ id: 'af/14', name: 'E0008_E0008M-22: Standard Test Methods...', isFolder: true, schema: 'StandardCollection' },
					{ id: 'af/15', name: 'E0008_E0008M-24: Standard Test Methods...', isFolder: true, schema: 'StandardCollection' },
					{ id: 'af/16', name: 'E0008_E0008M-25: Standard Test Methods...', isFolder: true, schema: 'StandardCollection' },
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
		console.log(`[IGX-OTT] resolveFromUrl: ${url}`);

		// Try DAM folder pattern FIRST: assets/af_123 or assets/assetfolders_123
		// Must check before asset pattern since 'af_' starts with 'a'
		const folderMatch = url.match(/assets\/(af_\d+|assetfolders_\d+)/i);
		if (folderMatch) {
			this.resolveAssetFolder(folderMatch[1]);
			return;
		}

		// Try DAM asset pattern: assets/a_123
		const assetMatch = url.match(/assets\/(a_\d+)/i);
		if (assetMatch) {
			this.resolveAsset(assetMatch[1]);
			return;
		}

		// Try site page pattern: site/x123
		const siteMatch = url.match(/site\/(x\d+)/i);
		if (siteMatch) {
			this.resolveSitePage(siteMatch[1]);
			return;
		}

		// No match — only clear context if we're not already on a folder.
		// The CMS sometimes fires extra NavigationEnd events with unrelated URLs;
		// don't let them clobber a valid folder context.
		const current = this.contextSubject.value;
		if (!current?.isFolder) {
			this.contextSubject.next(null);
			this.currentXid = undefined;
		}
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
	 * Reads schema directly from CMS NG_REF state (synchronous, reliable)
	 * instead of making a potentially failing API call.
	 */
	private resolveAssetFolder(urlId: string): void {
		if (urlId === this.currentXid) return;
		this.currentXid = urlId;

		// Convert URL format (af_7) to API format (af/7)
		const apiId = urlId.replace('_', '/');

		// Read folder model directly from CMS state
		const model = (window.top as any)?.NG_REF?.currentContent?.Model?._value;

		// Verify model matches current folder
		const modelMatchesCurrent = model?.Id === apiId;
		const name = modelMatchesCurrent ? (model.Name || urlId) : urlId;
		const schema = modelMatchesCurrent ? (model.SchemaName || 'Folder') : 'Folder';
		const parentId = modelMatchesCurrent ? model.ParentId : undefined;

		const ctx: AssetContext = {
			id: apiId,
			name,
			isFolder: true,
			path: '',
			schema,
			parentId,
		};
		this.contextSubject.next(ctx);
		console.log(`[IGX-OTT] Asset folder context: ${ctx.name} (${apiId}), schema: ${schema}`);
	}

	ngOnDestroy(): void {
		this.routerSub?.unsubscribe();
	}
}
