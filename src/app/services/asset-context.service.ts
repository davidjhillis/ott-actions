import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AssetContext } from '../models/asset-context.model';
import { CMSCommunicationsService } from './cms-communications.service';
import { MetadataLookupService } from './metadata-lookup.service';

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
	/** Incremented on every resolveFromUrl call; stale retry loops bail when mismatched */
	private navGeneration = 0;

	constructor(
		private cms: CMSCommunicationsService,
		private metadataLookup: MetadataLookupService
	) {
		if (this.cms.isDevMode) {
			// Emit demo context: Designation Collection for ASTM translation workflow
			// Enrich with metadata lookup for demo
			const demoMeta = this.metadataLookup.lookupByFolderName('E0008_E0008M');
			this.contextSubject.next({
				id: 'af/7',
				name: 'E0008_E0008M',
				isFolder: true,
				path: '/Standards Documents/E0008_E0008M',
				schema: 'Folder',
				folderType: demoMeta?.schema || 'DesignationCollection',
				metadataPageId: demoMeta?.pageId,
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
			// Subscribe to router immediately (don't delay — would miss initial nav)
			this.subscribeToRouter();
			// Load metadata index in parallel — enriches context when ready
			this.metadataLookup.loadMetadataIndex().subscribe();
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
		this.navGeneration++;

		// Try DAM folder pattern FIRST: assets/af_123 or assets/assetfolders_123
		// Must check before asset pattern since 'af_' starts with 'a'
		const folderMatch = url.match(/assets\/(af_\d+|assetfolders_\d+)/i);
		if (folderMatch) {
			this.resolveAssetFolder(folderMatch[1]);
			return;
		}

		// Try DAM asset pattern: assets/a_123 or assets/a/123 or just a_123
		const assetMatch = url.match(/assets\/(a_\d+)/i)
			|| url.match(/assets\/(a\/\d+)/i)
			|| url.match(/\b(a_\d+)\b/i);
		if (assetMatch) {
			// Normalise to underscore format (a_85)
			const urlId = assetMatch[1].replace('/', '_');
			const apiId = urlId.replace('_', '/');
			// Emit provisional non-folder context immediately so subscribers
			// (e.g. folder view) can tear down before the async GetAssetInfo returns.
			if (this.contextSubject.value?.isFolder) {
				this.contextSubject.next({ id: apiId, name: urlId, isFolder: false, path: '' });
			}
			console.log(`[IGX-OTT] Asset match: ${assetMatch[0]} → urlId=${urlId}, apiId=${apiId}`);
			this.resolveAsset(urlId);
			return;
		}

		// Try site page pattern: site/x123
		const siteMatch = url.match(/site\/(x\d+)/i);
		if (siteMatch) {
			this.resolveSitePage(siteMatch[1]);
			return;
		}

		// No match — always clear context.
		console.log(`[IGX-OTT] No pattern matched URL: ${url}`);
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
	 *
	 * Reads asset metadata from NG_REF.currentContent.Model with retry.
	 * The postMessage GetAssetInfo call is unreliable (fails with TypeError
	 * in the current CMS version), so we rely on the NG_REF sync read.
	 *
	 * Key: NG_REF `Name` is the display name (no extension), but `FileName`
	 * and the path include the extension needed for "Open in Word" matching.
	 */
	private resolveAsset(urlId: string): void {
		if (urlId === this.currentXid) return;
		this.currentXid = urlId;

		const apiId = urlId.replace('_', '/');
		const gen = this.navGeneration;
		this.tryReadAssetFromNgRef(apiId, urlId, gen, 0);
	}

	/**
	 * Attempt to read asset metadata from NG_REF.currentContent.Model.
	 * Retries up to 1.5s (8 x 200ms) for CMS to populate the model.
	 *
	 * Resolves the full filename (with extension) by checking:
	 *   1. model.FileName (has extension, e.g. "ASTM Word Doc.docx")
	 *   2. model.Name + model.Extension (e.g. "ASTM Word Doc" + ".docx")
	 *   3. Filename extracted from model.Path or model.CurrentUrl
	 *   4. model.Name as last resort (no extension, "Open in Word" won't show)
	 */
	private tryReadAssetFromNgRef(apiId: string, urlId: string, gen: number, attempt: number): void {
		if (gen !== this.navGeneration) return;

		const model = (window.top as any)?.NG_REF?.currentContent?.Model?._value;

		// Need at least a name from the model
		const displayName = model?.Name || model?.FileName;
		if (!displayName) {
			if (attempt < 8) {
				setTimeout(() => this.tryReadAssetFromNgRef(apiId, urlId, gen, attempt + 1), 200);
			} else {
				// All retries exhausted — emit basic context from URL ID
				this.contextSubject.next({
					id: apiId, name: urlId, isFolder: false, path: ''
				});
				console.log(`[IGX-OTT] Asset context (exhausted retries): ${urlId}`);
			}
			return;
		}

		// Diagnostic: dump ALL model key-value pairs (strings only) for download URL identification
		const modelKeys = Object.keys(model || {});
		console.log('[IGX-OTT] NG_REF model keys (' + modelKeys.length + '):', modelKeys.join(', '));
		const modelDump: Record<string, any> = {};
		for (const key of modelKeys) {
			const val = model[key];
			// Only log primitives and short strings (skip observables/objects)
			if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
				modelDump[key] = val;
			}
		}
		console.log('[IGX-OTT] NG_REF model values:', JSON.stringify(modelDump, null, 2));

		// Resolve the full filename WITH extension
		const fullName = this.resolveAssetFileName(model, displayName);
		const path = model?.Path || model?.FolderPath || model?.CurrentUrl || '';

		const ctx: AssetContext = {
			id: apiId,
			name: fullName,
			isFolder: false,
			path,
			schema: model?.SchemaName || model?.AssetType || 'Asset',
			workflowStatus: model?.WorkflowStatus || undefined,
			parentId: model?.FolderId || model?.ParentId || undefined,
		};
		this.contextSubject.next(ctx);
		console.log(`[IGX-OTT] Asset context (NG_REF): "${fullName}" (${apiId}), path="${path}"`);
	}

	/**
	 * Extract the best filename (with extension) from the NG_REF model.
	 */
	private resolveAssetFileName(model: any, displayName: string): string {
		// 1. FileName property (typically has extension)
		if (model?.FileName && model.FileName.includes('.')) {
			return model.FileName;
		}

		// 2. Name already has extension
		if (displayName.includes('.')) {
			return displayName;
		}

		// 3. Separate Extension property
		const ext = model?.Extension || model?.FileExtension || model?.ContentExtension;
		if (ext) {
			const dotExt = ext.startsWith('.') ? ext : '.' + ext;
			return displayName + dotExt;
		}

		// 4. Extract filename from Path (e.g. "~/ASTM.../ASTM Word Doc.docx")
		const path = model?.Path || model?.FolderPath || model?.CurrentUrl || '';
		if (path) {
			const segments = path.replace(/\\/g, '/').split('/');
			const lastSegment = segments[segments.length - 1];
			if (lastSegment && lastSegment.includes('.')) {
				return lastSegment;
			}
		}

		// 5. Fallback: display name without extension
		return displayName;
	}

	/**
	 * Resolve a DAM asset folder.
	 * Reads schema from CMS NG_REF state, with retry for timing.
	 * currentContent.Model always reflects the currently viewed content,
	 * so no ID match check is needed.
	 */
	private resolveAssetFolder(urlId: string): void {
		if (urlId === this.currentXid) return;
		this.currentXid = urlId;

		const apiId = urlId.replace('_', '/');
		this.tryResolveAssetFolder(apiId, urlId, 0, this.navGeneration);
	}

	/**
	 * Attempt to read folder metadata from NG_REF.currentContent.Model.
	 * Retries up to 1.5s (10 x 150ms) to handle CMS render timing.
	 * After basic context is set, fetches page data to read FolderType element.
	 */
	private tryResolveAssetFolder(apiId: string, urlId: string, attempt: number, gen: number): void {
		// Bail if a newer navigation has started — prevents stale folder context
		if (gen !== this.navGeneration) return;

		const model = (window.top as any)?.NG_REF?.currentContent?.Model?._value;
		const schema = model?.SchemaName;

		if (schema) {
			const ctx: AssetContext = {
				id: apiId,
				name: model.Name || urlId,
				isFolder: true,
				path: '',
				schema,
				parentId: model.ParentId || undefined,
			};
			this.contextSubject.next(ctx);
			console.log(`[IGX-OTT] Asset folder context: ${ctx.name} (${apiId}), schema: ${schema}`);

			// Now fetch page data to read the FolderType element
			this.fetchFolderType(apiId, ctx, gen);
		} else if (attempt < 10) {
			setTimeout(() => this.tryResolveAssetFolder(apiId, urlId, attempt + 1, gen), 150);
		} else {
			console.warn(`[IGX-OTT] Model.SchemaName not available after retries for ${apiId}`);
			const name = model?.Name || urlId;
			const ctx: AssetContext = {
				id: apiId,
				name,
				isFolder: true,
				path: '',
				schema: 'Folder',
				parentId: model?.ParentId || undefined,
			};
			this.contextSubject.next(ctx);

			// Still try to fetch FolderType
			this.fetchFolderType(apiId, ctx, gen);
		}
	}

	/**
	 * Fetch folder page data to read the FolderType element.
	 * If FolderType has a value, update the context — this triggers
	 * the enhanced folder view injection in AppComponent.
	 *
	 * Falls back to site tree metadata lookup if no FolderType element found.
	 */
	private fetchFolderType(folderId: string, ctx: AssetContext, gen: number): void {
		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'GetPageData',
			args: [folderId, ''],
			timeout: 5000
		}).subscribe({
			next: (pageData) => {
				// Bail if a newer navigation has started
				if (gen !== this.navGeneration) return;

				const elements = pageData?.Elements || pageData?.elements || {};
				const folderType = elements['FolderType']?.Value
					|| elements['FolderType']?.value
					|| elements['FolderType']
					|| '';

				if (folderType) {
					console.log(`[IGX-OTT] FolderType: ${folderType} for ${folderId}`);
					this.contextSubject.next({ ...ctx, folderType });
				} else {
					// No FolderType element — try site tree metadata lookup
					this.enrichFromMetadataLookup(ctx);
				}
			},
			error: () => {
				// API failed — try site tree metadata lookup
				if (gen !== this.navGeneration) return;
				this.enrichFromMetadataLookup(ctx);
			}
		});
	}

	/**
	 * Enrich context from the metadata lookup service.
	 * Matches asset folder name to a site tree metadata page.
	 */
	private enrichFromMetadataLookup(ctx: AssetContext): void {
		const folderName = ctx.name;
		const metaEntry = this.metadataLookup.lookupByFolderName(folderName);

		if (metaEntry) {
			console.log(`[IGX-OTT] Metadata lookup: found page ${metaEntry.pageId} for folder "${folderName}" (${metaEntry.schema})`);
			this.contextSubject.next({
				...ctx,
				folderType: metaEntry.schema,
				metadataPageId: metaEntry.pageId
			});
		} else {
			console.log(`[IGX-OTT] No metadata page found for folder "${folderName}"`);
		}
	}

	ngOnDestroy(): void {
		this.routerSub?.unsubscribe();
	}
}
