import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { TranslatedStandardCollection, TMProject } from '../../models/translation.model';

@Component({
	selector: 'ott-translation-tab',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="translation-tab">
			<!-- Status summary bar -->
			<div class="status-summary" *ngIf="translatedCollections.length > 0">
				<div class="summary-stat">
					<span class="stat-number">{{ uniqueLanguages }}</span>
					<span class="stat-label">languages maintained</span>
				</div>
				<span class="stat-sep">&middot;</span>
				<div class="summary-stat">
					<span class="stat-number current">{{ currentCount }}</span>
					<span class="stat-label">current</span>
				</div>
				<span class="stat-sep">&middot;</span>
				<div class="summary-stat">
					<span class="stat-number outdated">{{ outdatedCount }}</span>
					<span class="stat-label">outdated</span>
				</div>
			</div>

			<!-- Send to Translation — button that opens modal -->
			<div class="send-bar">
				<div class="send-info">
					<span class="send-hint">Choose files to send in the modal</span>
				</div>
				<button class="btn-send" (click)="onSendToTranslation()">
					<ott-icon name="send" [size]="14"></ott-icon>
					Send to Translation
				</button>
			</div>

			<!-- Translated Collections — collapsible -->
			<div class="section">
				<button class="section-toggle" (click)="collectionsExpanded = !collectionsExpanded">
					<ott-icon [name]="collectionsExpanded ? 'chevron-down' : 'chevron-right'" [size]="13"></ott-icon>
					<span class="section-title">Translated Collections</span>
					<span class="section-count">{{ translatedCollections.length }}</span>
				</button>

				<div class="section-body" *ngIf="collectionsExpanded">
					<div class="coll-list">
						<div class="coll-row" *ngFor="let coll of translatedCollections.slice(0, visibleCollections); trackBy: trackById"
							[class.outdated-row]="coll.outdated">
							<span class="coll-name">{{ coll.name }}</span>
							<span class="coll-status" [style.color]="getStatusColor(coll.lifecycleStatus)">
								{{ coll.lifecycleStatus }}
							</span>
							<span class="coll-vendor">{{ coll.vendor }}</span>
							<span class="coll-days">{{ coll.daysElapsed }}d</span>
							<span class="outdated-badge" *ngIf="coll.outdated" title="English version is newer than this translation">
								<ott-icon name="alert-triangle" [size]="11"></ott-icon>
							</span>
						</div>
					</div>
					<button class="show-more" *ngIf="translatedCollections.length > visibleCollections"
						(click)="showMore()">
						Show more ({{ translatedCollections.length - visibleCollections }} remaining)
					</button>
				</div>
			</div>

			<!-- Quick actions -->
			<div class="quick-actions">
				<button class="action-btn" (click)="onUploadSourceFiles()">
					<ott-icon name="upload" [size]="13"></ott-icon>
					Upload Source Files
				</button>
				<button class="action-btn" (click)="onAddCollection()">
					<ott-icon name="folder-plus" [size]="13"></ott-icon>
					Add Collection
				</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Status summary */
		.status-summary {
			display: flex; align-items: center; gap: 8px;
			padding: 10px 14px; margin-bottom: 10px;
			background: var(--ott-bg-muted);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
		}
		.summary-stat {
			display: flex; align-items: baseline; gap: 4px;
		}
		.stat-number {
			font-size: 15px; font-weight: 700; color: var(--ott-text);
		}
		.stat-number.current { color: #22c55e; }
		.stat-number.outdated { color: #f59e0b; }
		.stat-label {
			font-size: 12px; color: var(--ott-text-muted);
		}
		.stat-sep { color: var(--ott-border); font-size: 14px; }

		/* Send bar */
		.send-bar {
			display: flex; align-items: center; justify-content: space-between;
			padding: 10px 14px; margin-bottom: 10px;
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
		}
		.send-info { display: flex; align-items: center; gap: 6px; }
		.send-count {
			font-size: 13px; font-weight: 600; color: var(--ott-primary);
		}
		.send-hint {
			font-size: 12px; color: var(--ott-text-muted);
		}
		.btn-send {
			display: inline-flex; align-items: center; gap: 6px;
			padding: 7px 14px; border: none; border-radius: var(--ott-radius-md);
			background: var(--ott-primary); color: #fff; cursor: pointer;
			font-size: 13px; font-family: var(--ott-font); font-weight: 500;
			transition: background 0.15s;
		}
		.btn-send:hover { background: var(--ott-primary-hover); }
		.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

		/* Sections */
		.section {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			margin-bottom: 10px;
			background: var(--ott-bg);
			overflow: hidden;
		}
		.section-toggle {
			display: flex; align-items: center; gap: 6px;
			width: 100%; padding: 10px 12px; border: none; background: none;
			cursor: pointer; font-size: var(--ott-font-size-base); font-family: var(--ott-font);
			font-weight: 600; color: var(--ott-text); text-align: left;
			transition: background 0.12s;
		}
		.section-toggle:hover { background: var(--ott-bg-muted); }
		.section-title { flex: 1; }
		.section-count {
			font-size: var(--ott-font-size-xs); font-weight: 600;
			min-width: 20px; height: 20px;
			display: inline-flex; align-items: center; justify-content: center;
			background: var(--ott-bg-subtle); border-radius: var(--ott-radius-full);
			color: var(--ott-text-muted);
		}
		.section-body {
			border-top: 1px solid var(--ott-border-light);
			padding: 10px 12px;
		}

		/* Collections list */
		.coll-list { display: flex; flex-direction: column; }
		.coll-row {
			display: grid; grid-template-columns: 1fr auto 50px 40px 20px;
			gap: 8px; align-items: center;
			padding: 6px 0; font-size: var(--ott-font-size-base);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.coll-row:last-child { border-bottom: none; }
		.coll-row.outdated-row { background: rgba(245, 158, 11, 0.05); }
		.coll-name {
			font-family: var(--ott-font-mono); font-size: var(--ott-font-size-sm);
			color: var(--ott-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.coll-status { font-size: var(--ott-font-size-xs); font-weight: 600; white-space: nowrap; }
		.coll-vendor { font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); text-align: right; }
		.coll-days { font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); text-align: right; }
		.outdated-badge { color: #f59e0b; display: flex; align-items: center; }

		.show-more {
			border: none; background: none; cursor: pointer; padding: 6px 0;
			font-size: var(--ott-font-size-sm); font-family: var(--ott-font); color: var(--ott-primary);
			display: block; width: 100%; text-align: left;
		}
		.show-more:hover { text-decoration: underline; }

		/* Quick actions */
		.quick-actions { display: flex; gap: 6px; margin-top: 4px; }
		.action-btn {
			display: inline-flex; align-items: center; gap: 4px;
			padding: 7px 12px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); background: var(--ott-bg);
			cursor: pointer; font-size: var(--ott-font-size-base); font-family: var(--ott-font);
			font-weight: 500; color: var(--ott-text-secondary); transition: all 0.12s;
		}
		.action-btn:hover { background: var(--ott-bg-muted); color: var(--ott-text); border-color: var(--ott-border); }
	`]
})
export class TranslationTabComponent {
	@Input() translatedCollections: TranslatedStandardCollection[] = [];
	@Input() tmProjects: TMProject[] = [];


	@Output() sendToTranslation = new EventEmitter<void>();
	@Output() uploadSourceFiles = new EventEmitter<void>();
	@Output() addCollection = new EventEmitter<void>();

	collectionsExpanded = true;
	visibleCollections = 10;

	private statusColors: Record<string, string> = {
		'In Quotation': '#94a3b8', 'In Translation': '#f59e0b', 'In QA': '#8b5cf6',
		'In Editorial Review': '#3b82f6', 'Published to ML': '#22c55e', 'Published': '#059669'
	};

	get uniqueLanguages(): number {
		const locales = new Set(this.translatedCollections.map(c => c.locale));
		return locales.size;
	}

	get currentCount(): number {
		return this.translatedCollections.filter(c => !c.outdated).length;
	}

	get outdatedCount(): number {
		return this.translatedCollections.filter(c => c.outdated).length;
	}

	getStatusColor(status: string): string { return this.statusColors[status] || '#94a3b8'; }
	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }
	showMore(): void { this.visibleCollections += 20; }

	onSendToTranslation(): void {
		this.sendToTranslation.emit();
	}

	onUploadSourceFiles(): void {
		this.uploadSourceFiles.emit();
	}

	onAddCollection(): void {
		this.addCollection.emit();
	}
}
