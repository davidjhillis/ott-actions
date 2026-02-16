import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { AssetContext } from '../../models/asset-context.model';

/** Maps file extensions to desktop app info */
interface AppMapping {
	app: string;
	/** MS Office URI scheme prefix, or null for browser/download-only */
	uriPrefix: string | null;
	icon: string;
}

const EXT_MAP: Record<string, AppMapping> = {
	// Word
	'.docx': { app: 'Word', uriPrefix: 'ms-word:ofe|u|', icon: 'file-text' },
	'.doc':  { app: 'Word', uriPrefix: 'ms-word:ofe|u|', icon: 'file-text' },
	'.rtf':  { app: 'Word', uriPrefix: 'ms-word:ofe|u|', icon: 'file-text' },
	// Excel
	'.xlsx': { app: 'Excel', uriPrefix: 'ms-excel:ofe|u|', icon: 'file' },
	'.xls':  { app: 'Excel', uriPrefix: 'ms-excel:ofe|u|', icon: 'file' },
	'.csv':  { app: 'Excel', uriPrefix: 'ms-excel:ofe|u|', icon: 'file' },
	// PowerPoint
	'.pptx': { app: 'PowerPoint', uriPrefix: 'ms-powerpoint:ofe|u|', icon: 'file' },
	'.ppt':  { app: 'PowerPoint', uriPrefix: 'ms-powerpoint:ofe|u|', icon: 'file' },
	// Browser-viewable
	'.pdf':  { app: 'Browser', uriPrefix: null, icon: 'file-text' },
	'.png':  { app: 'Browser', uriPrefix: null, icon: 'image' },
	'.jpg':  { app: 'Browser', uriPrefix: null, icon: 'image' },
	'.jpeg': { app: 'Browser', uriPrefix: null, icon: 'image' },
	'.gif':  { app: 'Browser', uriPrefix: null, icon: 'image' },
	'.svg':  { app: 'Browser', uriPrefix: null, icon: 'image' },
	'.htm':  { app: 'Browser', uriPrefix: null, icon: 'file-text' },
	'.html': { app: 'Browser', uriPrefix: null, icon: 'file-text' },
	'.xml':  { app: 'Browser', uriPrefix: null, icon: 'file-text' },
	'.dxml': { app: 'Browser', uriPrefix: null, icon: 'file-text' },
};

@Component({
	selector: 'ott-asset-file-bar',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="afb" *ngIf="context">
			<!-- File info -->
			<div class="afb-info">
				<ott-icon [name]="fileIcon" [size]="18" color="var(--ott-text-secondary, #6b7280)"></ott-icon>
				<span class="afb-name" [title]="context.name">{{ context.name }}</span>
				<span class="afb-meta" *ngIf="extension">{{ extension }}</span>
				<span class="afb-meta" *ngIf="context.schema && context.schema !== 'Asset'">{{ context.schema }}</span>
			</div>

			<!-- Actions -->
			<div class="afb-actions">
				<button class="afb-btn afb-btn-primary" *ngIf="appMapping?.uriPrefix" (click)="openInApp()" [title]="'Open in ' + appMapping!.app">
					<ott-icon name="external-link" [size]="14"></ott-icon>
					Open in {{ appMapping!.app }}
				</button>
				<button class="afb-btn afb-btn-primary" *ngIf="appMapping && !appMapping.uriPrefix && appMapping.app === 'Browser'" (click)="openInBrowser()" title="Open in browser">
					<ott-icon name="external-link" [size]="14"></ott-icon>
					Open
				</button>
				<button class="afb-btn" (click)="download()" title="Download file">
					<ott-icon name="download" [size]="14"></ott-icon>
					Download
				</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.afb {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 8px 16px;
			background: var(--ott-bg-surface, #fff);
			border-bottom: 1px solid var(--ott-border, #e5e7eb);
			font-family: var(--ott-font, 'Geist', -apple-system, sans-serif);
			min-height: 44px;
		}
		.afb-info {
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
			flex: 1;
		}
		.afb-name {
			font-size: 13px;
			font-weight: 500;
			color: var(--ott-text, #1f2937);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.afb-meta {
			font-size: 11px;
			color: var(--ott-text-tertiary, #9ca3af);
			background: var(--ott-bg-muted, #f3f4f6);
			padding: 1px 6px;
			border-radius: 3px;
			white-space: nowrap;
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}
		.afb-actions {
			display: flex;
			align-items: center;
			gap: 6px;
			flex-shrink: 0;
		}
		.afb-btn {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 5px 10px;
			border: 1px solid var(--ott-border, #e5e7eb);
			border-radius: 5px;
			background: var(--ott-bg-surface, #fff);
			color: var(--ott-text-secondary, #6b7280);
			font-size: 12px;
			font-family: inherit;
			cursor: pointer;
			transition: all 0.15s ease;
			white-space: nowrap;
		}
		.afb-btn:hover {
			background: var(--ott-bg-muted, #f3f4f6);
			color: var(--ott-text, #1f2937);
			border-color: var(--ott-border-hover, #d1d5db);
		}
		.afb-btn-primary {
			background: var(--ott-primary, #2563eb);
			color: #fff;
			border-color: var(--ott-primary, #2563eb);
		}
		.afb-btn-primary:hover {
			background: var(--ott-primary-hover, #1d4ed8);
			color: #fff;
			border-color: var(--ott-primary-hover, #1d4ed8);
		}
	`]
})
export class AssetFileBarComponent {
	private _context: AssetContext | null = null;

	/** Input setter — resolves file type immediately when set programmatically
	 *  (ngOnChanges does NOT fire for dynamically created components). */
	@Input()
	set context(value: AssetContext | null) {
		this._context = value;
		if (value) {
			this.resolveFileType();
		}
	}
	get context(): AssetContext | null {
		return this._context;
	}

	extension = '';
	fileIcon = 'file';
	appMapping: AppMapping | null = null;

	private resolveFileType(): void {
		if (!this.context) return;
		const name = this.context.name || '';
		const dotIndex = name.lastIndexOf('.');
		this.extension = dotIndex > 0 ? name.substring(dotIndex).toLowerCase() : '';
		this.appMapping = this.extension ? (EXT_MAP[this.extension] || null) : null;
		this.fileIcon = this.appMapping?.icon || 'file';
	}

	private getDownloadUrl(): string {
		if (!this.context) return '';
		// Build download URL from context path or ID
		// CMS pattern: assets are served at the base CMS URL + asset path
		const path = this.context.path;
		if (path) {
			// Use the CMS base URL from the top window location
			const baseUrl = (window.top as any)?.location?.origin || '';
			return `${baseUrl}/assets/${path.replace(/^\//, '')}`;
		}
		// Fallback: construct from asset ID (a/85 → asset download endpoint)
		const baseUrl = (window.top as any)?.location?.origin || '';
		return `${baseUrl}/api/AssetServices/GetAssetContent/${this.context.id}`;
	}

	openInApp(): void {
		if (!this.appMapping?.uriPrefix) return;
		const downloadUrl = this.getDownloadUrl();
		if (!downloadUrl) return;
		const uri = this.appMapping.uriPrefix + encodeURI(downloadUrl);
		console.log(`[IGX-OTT] Opening in ${this.appMapping.app}: ${uri}`);
		(window.top as any)?.open(uri, '_self');
	}

	openInBrowser(): void {
		const downloadUrl = this.getDownloadUrl();
		if (!downloadUrl) return;
		console.log(`[IGX-OTT] Opening in browser: ${downloadUrl}`);
		(window.top as any)?.open(downloadUrl, '_blank');
	}

	download(): void {
		const downloadUrl = this.getDownloadUrl();
		if (!downloadUrl) return;
		console.log(`[IGX-OTT] Downloading: ${downloadUrl}`);
		const a = (window.top as any)?.document?.createElement('a');
		if (a) {
			a.href = downloadUrl;
			a.download = this.context?.name || 'file';
			a.style.display = 'none';
			(window.top as any).document.body.appendChild(a);
			a.click();
			a.remove();
		}
	}
}
