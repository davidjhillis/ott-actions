import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { TranslatedStandardCollection, TMProject, FolderChildItem } from '../../models/translation.model';

@Component({
	selector: 'ott-translation-tab',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="translation-tab">
			<!-- Send to Translation section -->
			<div class="section">
				<div class="section-title">
					<ott-icon name="zap" [size]="14" color="var(--ott-primary)"></ott-icon>
					Send to Translation
				</div>

				<div class="project-picker">
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
							<input type="radio" name="project" [value]="proj.id"
								[checked]="selectedProjectId === proj.id"
								(change)="selectedProjectId = proj.id">
							<div class="project-info">
								<span class="project-name">{{ proj.name }}</span>
								<span class="project-meta">
									{{ proj.locale }} &middot; {{ proj.itemCount }} item{{ proj.itemCount !== 1 ? 's' : '' }}
									<span *ngIf="proj.dueDate"> &middot; Due {{ proj.dueDate }}</span>
								</span>
							</div>
						</label>
						<div class="empty-msg" *ngIf="tmProjects.length === 0">
							No open Translation Manager projects.
						</div>
					</div>

					<div class="new-project-form" *ngIf="projectMode === 'new'">
						<div class="form-hint">
							A new Translation Manager project will be created when you add items.
						</div>
					</div>
				</div>

				<div class="send-actions">
					<span class="selected-count" *ngIf="selectedItems.length > 0">
						{{ selectedItems.length }} item{{ selectedItems.length !== 1 ? 's' : '' }} selected
					</span>
					<button class="btn btn-primary" [disabled]="!canSend">
						<ott-icon name="send" [size]="14"></ott-icon>
						Add to Translation Project
					</button>
				</div>
			</div>

			<div class="divider"></div>

			<!-- Translated Standard Collections -->
			<div class="section">
				<div class="section-title">
					<ott-icon name="globe" [size]="14" color="var(--ott-primary)"></ott-icon>
					Translated Standard Collections
				</div>

				<div class="collection-list">
					<div class="collection-card" *ngFor="let coll of translatedCollections; trackBy: trackById">
						<div class="coll-header">
							<span class="coll-name font-mono">{{ coll.name }}</span>
							<span class="status-badge" [style.background]="getStatusColor(coll.lifecycleStatus) + '20'"
								[style.color]="getStatusColor(coll.lifecycleStatus)">
								{{ coll.lifecycleStatus }}
							</span>
						</div>
						<div class="coll-meta">
							<span>Vendor: <strong>{{ coll.vendor }}</strong></span>
							<span *ngIf="coll.batchName">Batch: <strong>{{ coll.batchName }}</strong></span>
							<span>{{ coll.daysElapsed }} days</span>
						</div>
					</div>
					<div class="empty-msg" *ngIf="translatedCollections.length === 0">
						No translated collections found.
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="tab-actions">
				<button class="btn btn-outline">
					<ott-icon name="upload" [size]="14"></ott-icon>
					Upload Source Files
				</button>
				<button class="btn btn-outline">
					<ott-icon name="folder-plus" [size]="14"></ott-icon>
					Add Translated Collection
				</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }
		.translation-tab { }

		.section { margin-bottom: 16px; }
		.section-title {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			font-weight: 600;
			color: var(--ott-text);
			margin-bottom: 10px;
		}

		/* Project picker */
		.project-picker {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.picker-tabs {
			display: flex;
			background: var(--ott-bg-muted);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.picker-tab {
			flex: 1;
			padding: 8px 12px;
			border: none;
			background: none;
			cursor: pointer;
			font-size: 12px;
			font-family: var(--ott-font);
			font-weight: 500;
			color: var(--ott-text-secondary);
			transition: all 0.15s;
		}
		.picker-tab.active {
			color: var(--ott-primary);
			background: var(--ott-bg);
			box-shadow: inset 0 -2px 0 var(--ott-primary);
		}
		.picker-tab:hover:not(.active) { background: var(--ott-bg-hover); }

		.project-list { max-height: 200px; overflow-y: auto; }
		.project-item {
			display: flex;
			align-items: flex-start;
			gap: 10px;
			padding: 10px 14px;
			cursor: pointer;
			border-bottom: 1px solid var(--ott-border-light);
			transition: background 0.12s;
		}
		.project-item:last-child { border-bottom: none; }
		.project-item:hover { background: var(--ott-bg-muted); }
		.project-item.selected { background: var(--ott-bg-selected); }
		.project-item input[type="radio"] { margin-top: 3px; }
		.project-info { display: flex; flex-direction: column; gap: 2px; }
		.project-name { font-size: 13px; font-weight: 500; color: var(--ott-text); }
		.project-meta { font-size: 11px; color: var(--ott-text-muted); }

		.new-project-form { padding: 14px; }
		.form-hint { font-size: 12px; color: var(--ott-text-muted); }

		.send-actions {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 10px;
			margin-top: 10px;
		}
		.selected-count {
			font-size: 12px;
			color: var(--ott-text-secondary);
		}

		/* Divider */
		.divider {
			border-top: 1px dashed var(--ott-border-light);
			margin: 16px 0;
		}

		/* Collection list */
		.collection-list { display: flex; flex-direction: column; gap: 6px; }
		.collection-card {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			padding: 10px 14px;
			transition: border-color 0.15s;
		}
		.collection-card:hover { border-color: var(--ott-border); }
		.coll-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 4px;
		}
		.coll-name {
			font-size: 13px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.font-mono { font-family: var(--ott-font-mono); }
		.coll-meta {
			display: flex;
			gap: 12px;
			font-size: 11px;
			color: var(--ott-text-muted);
		}
		.coll-meta strong { color: var(--ott-text-secondary); }

		.status-badge {
			display: inline-flex;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			font-size: 10px;
			font-weight: 600;
			letter-spacing: 0.2px;
		}

		/* Actions */
		.tab-actions {
			display: flex;
			gap: 8px;
			margin-top: 16px;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 7px 14px;
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			transition: all 0.15s;
		}
		.btn-primary {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
		.btn-outline {
			background: var(--ott-bg);
			color: var(--ott-text-secondary);
		}
		.btn-outline:hover {
			background: var(--ott-bg-hover);
			color: var(--ott-text);
		}

		.empty-msg {
			padding: 16px;
			text-align: center;
			font-size: 13px;
			color: var(--ott-text-muted);
		}
	`]
})
export class TranslationTabComponent {
	@Input() translatedCollections: TranslatedStandardCollection[] = [];
	@Input() tmProjects: TMProject[] = [];
	@Input() selectedItems: FolderChildItem[] = [];

	projectMode: 'existing' | 'new' = 'existing';
	selectedProjectId: string | null = null;

	private statusColors: Record<string, string> = {
		'In Quotation': '#94a3b8',
		'In Translation': '#f59e0b',
		'In QA': '#8b5cf6',
		'In Editorial Review': '#3b82f6',
		'Published to ML': '#22c55e',
		'Published': '#059669'
	};

	get canSend(): boolean {
		return this.selectedItems.length > 0 && (this.selectedProjectId !== null || this.projectMode === 'new');
	}

	getStatusColor(status: string): string {
		return this.statusColors[status] || '#94a3b8';
	}

	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }
}
