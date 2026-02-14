import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { TranslatedStandardCollection, TMProject, FolderChildItem } from '../../models/translation.model';

@Component({
	selector: 'ott-translation-tab',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="translation-tab">
			<!-- Send to Translation — collapsible -->
			<div class="section">
				<button class="section-toggle" (click)="sendExpanded = !sendExpanded">
					<ott-icon [name]="sendExpanded ? 'chevron-down' : 'chevron-right'" [size]="13"></ott-icon>
					<span class="section-title">Send to Translation</span>
					<span class="section-badge" *ngIf="selectedItems.length > 0">{{ selectedItems.length }} selected</span>
				</button>

				<div class="section-body" *ngIf="sendExpanded">
					<div class="picker-tabs">
						<button class="picker-tab" [class.active]="projectMode === 'existing'" (click)="projectMode = 'existing'">
							Existing Project
						</button>
						<button class="picker-tab" [class.active]="projectMode === 'new'" (click)="projectMode = 'new'">
							New Project
						</button>
					</div>

					<div class="project-list" *ngIf="projectMode === 'existing'">
						<label class="project-item" *ngFor="let proj of tmProjects"
							[class.selected]="selectedProjectId === proj.id"
							(click)="selectedProjectId = proj.id">
							<input type="radio" name="project" [value]="proj.id" [checked]="selectedProjectId === proj.id">
							<div class="project-info">
								<span class="project-name">{{ proj.name }}</span>
								<span class="project-meta">
									{{ proj.locale }} &middot; {{ proj.itemCount }} items
									<span *ngIf="proj.dueDate"> &middot; Due {{ proj.dueDate }}</span>
								</span>
							</div>
						</label>
						<div class="empty-msg" *ngIf="tmProjects.length === 0">No open projects</div>
					</div>

					<div class="new-hint" *ngIf="projectMode === 'new'">
						A new TM project will be created when you add items.
					</div>

					<div class="send-footer">
						<button class="btn-primary" [disabled]="!canSend" (click)="onAddToProject()">
							<ott-icon name="send" [size]="13"></ott-icon>
							Add to Project
						</button>
					</div>
				</div>
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
						<div class="coll-row" *ngFor="let coll of translatedCollections.slice(0, visibleCollections); trackBy: trackById">
							<span class="coll-name">{{ coll.name }}</span>
							<span class="coll-status" [style.color]="getStatusColor(coll.lifecycleStatus)">
								{{ coll.lifecycleStatus }}
							</span>
							<span class="coll-meta">{{ coll.vendor }}</span>
							<span class="coll-meta">{{ coll.daysElapsed }}d</span>
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
		.section-badge {
			font-size: var(--ott-font-size-xs); font-weight: 600; padding: 2px 7px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-primary-light); color: var(--ott-primary);
		}
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

		/* Project picker */
		.picker-tabs {
			display: flex; gap: 0; margin-bottom: 8px;
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-sm);
			overflow: hidden;
		}
		.picker-tab {
			flex: 1; padding: 7px 10px; border: none; background: var(--ott-bg-muted);
			cursor: pointer; font-size: var(--ott-font-size-base); font-family: var(--ott-font);
			font-weight: 500; color: var(--ott-text-muted);
			transition: all 0.12s;
		}
		.picker-tab.active { background: var(--ott-bg); color: var(--ott-text); font-weight: 600; }
		.picker-tab:not(:last-child) { border-right: 1px solid var(--ott-border-light); }

		.project-list { max-height: 160px; overflow-y: auto; }
		.project-item {
			display: flex; align-items: flex-start; gap: 8px;
			padding: 8px 10px; cursor: pointer; border-radius: var(--ott-radius-sm);
			transition: background 0.1s;
		}
		.project-item:hover { background: var(--ott-bg-muted); }
		.project-item.selected { background: var(--ott-bg-selected); }
		.project-item input[type="radio"] { margin-top: 3px; }
		.project-info { display: flex; flex-direction: column; gap: 1px; }
		.project-name { font-size: var(--ott-font-size-base); font-weight: 500; color: var(--ott-text); }
		.project-meta { font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); }
		.new-hint { font-size: var(--ott-font-size-sm); color: var(--ott-text-muted); padding: 8px 0; }
		.empty-msg { font-size: var(--ott-font-size-sm); color: var(--ott-text-muted); padding: 12px 0; text-align: center; }

		.send-footer { display: flex; justify-content: flex-end; margin-top: 8px; }

		/* Collections list */
		.coll-list { display: flex; flex-direction: column; }
		.coll-row {
			display: grid; grid-template-columns: 1fr auto 50px 40px;
			gap: 8px; align-items: center;
			padding: 6px 0; font-size: var(--ott-font-size-base);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.coll-row:last-child { border-bottom: none; }
		.coll-name {
			font-family: var(--ott-font-mono); font-size: var(--ott-font-size-sm);
			color: var(--ott-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.coll-status { font-size: var(--ott-font-size-xs); font-weight: 600; white-space: nowrap; }
		.coll-meta { font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); text-align: right; }

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

		/* Buttons */
		.btn-primary {
			display: inline-flex; align-items: center; gap: 5px;
			padding: 7px 14px; border: none; border-radius: var(--ott-radius-md);
			background: var(--ott-primary); color: #fff; cursor: pointer;
			font-size: var(--ott-font-size-base); font-family: var(--ott-font); font-weight: 500;
			transition: background 0.15s;
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	`]
})
export class TranslationTabComponent implements OnChanges {
	@Input() translatedCollections: TranslatedStandardCollection[] = [];
	@Input() tmProjects: TMProject[] = [];
	@Input() selectedItems: FolderChildItem[] = [];

	@Output() addToProject = new EventEmitter<{ projectId: string | null; items: FolderChildItem[]; isNew: boolean }>();
	@Output() uploadSourceFiles = new EventEmitter<void>();
	@Output() addCollection = new EventEmitter<void>();

	sendExpanded = false;
	collectionsExpanded = true;
	projectMode: 'existing' | 'new' = 'existing';
	selectedProjectId: string | null = null;
	visibleCollections = 10;

	private statusColors: Record<string, string> = {
		'In Quotation': '#94a3b8', 'In Translation': '#f59e0b', 'In QA': '#8b5cf6',
		'In Editorial Review': '#3b82f6', 'Published to ML': '#22c55e', 'Published': '#059669'
	};

	ngOnChanges(changes: SimpleChanges): void {
		// Auto-expand Send to Translation when items are selected
		if (changes['selectedItems'] && this.selectedItems.length > 0) {
			this.sendExpanded = true;
		}
	}

	get canSend(): boolean {
		return this.selectedItems.length > 0 && (this.selectedProjectId !== null || this.projectMode === 'new');
	}

	getStatusColor(status: string): string { return this.statusColors[status] || '#94a3b8'; }
	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }
	showMore(): void { this.visibleCollections += 20; }

	onAddToProject(): void {
		if (!this.canSend) return;
		this.addToProject.emit({
			projectId: this.projectMode === 'existing' ? this.selectedProjectId : null,
			items: this.selectedItems,
			isNew: this.projectMode === 'new'
		});
	}

	onUploadSourceFiles(): void {
		this.uploadSourceFiles.emit();
	}

	onAddCollection(): void {
		this.addCollection.emit();
	}
}
