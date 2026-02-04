import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface HistoryEntry {
	version: number;
	date: string;
	user: string;
	action: string;
	comment?: string;
}

@Component({
	selector: 'app-view-history',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="history-panel">
			<div class="panel-header">
				<h3>
					<ott-icon name="history" [size]="15" color="var(--ott-primary)"></ott-icon>
					Version History
				</h3>
				<button class="close-btn" (click)="onClose()">
					<ott-icon name="x" [size]="16"></ott-icon>
				</button>
			</div>

			<div class="panel-info">
				<div class="info-name">{{ context?.name || 'N/A' }}</div>
				<div class="info-meta">{{ entries.length }} versions</div>
			</div>

			<div class="panel-body">
				<div class="timeline">
					<div class="timeline-entry" *ngFor="let entry of entries; let first = first"
						[class.latest]="first">
						<div class="timeline-marker">
							<div class="marker-dot" [class.latest]="first"></div>
							<div class="marker-line" *ngIf="!first"></div>
						</div>
						<div class="entry-content">
							<div class="entry-header">
								<span class="version-badge" [class.latest]="first">v{{ entry.version }}</span>
								<span class="entry-action" [ngClass]="'action-' + entry.action.toLowerCase()">
									{{ entry.action }}
								</span>
							</div>
							<div class="entry-meta">
								<span class="entry-user">
									<ott-icon name="user" [size]="11"></ott-icon>
									{{ entry.user }}
								</span>
								<span class="entry-date">{{ entry.date }}</span>
							</div>
							<div class="entry-comment" *ngIf="entry.comment">
								{{ entry.comment }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; height: 100%; }
		.history-panel {
			height: 100%; background: var(--ott-bg);
			border-left: 1px solid var(--ott-border);
			display: flex; flex-direction: column;
			width: 300px; font-family: var(--ott-font);
		}
		.panel-header {
			display: flex; align-items: center; justify-content: space-between;
			padding: 14px 16px; border-bottom: 1px solid var(--ott-border-light);
		}
		.panel-header h3 {
			margin: 0; font-size: 14px; font-weight: 600; color: var(--ott-text);
			display: flex; align-items: center; gap: 6px;
		}
		.close-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 4px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background-color 0.15s;
		}
		.close-btn:hover { color: var(--ott-text); background: var(--ott-bg-hover); }

		.panel-info {
			padding: 10px 16px; border-bottom: 1px solid var(--ott-border-light);
			background: var(--ott-bg-muted);
		}
		.info-name { font-size: 13px; font-weight: 600; color: var(--ott-text); }
		.info-meta { font-size: 11px; color: var(--ott-text-muted); margin-top: 2px; }

		.panel-body { flex: 1; overflow-y: auto; padding: 14px 16px; }

		.timeline { position: relative; }
		.timeline-entry {
			display: flex; gap: 12px; margin-bottom: 2px;
			position: relative;
		}

		.timeline-marker {
			display: flex; flex-direction: column; align-items: center;
			width: 16px; flex-shrink: 0; padding-top: 4px;
		}
		.marker-dot {
			width: 8px; height: 8px; border-radius: 50%;
			background: var(--ott-border); border: 2px solid var(--ott-bg);
			z-index: 1;
		}
		.marker-dot.latest { background: var(--ott-primary); }
		.marker-line {
			width: 2px; flex: 1; background: var(--ott-border-light);
			margin-top: -2px;
		}

		.entry-content {
			flex: 1; padding-bottom: 16px;
		}
		.entry-header {
			display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
		}
		.version-badge {
			font-size: 10px; font-weight: 700; padding: 2px 6px;
			border-radius: var(--ott-radius-sm); font-family: var(--ott-font-mono);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}
		.version-badge.latest {
			background: var(--ott-primary-light); color: var(--ott-primary);
		}
		.entry-action {
			font-size: 11px; font-weight: 600;
		}
		.action-created { color: var(--ott-success); }
		.action-modified { color: var(--ott-primary); }
		.action-published { color: #2563eb; }
		.action-advanced { color: #7c3aed; }
		.action-reverted { color: #dc2626; }
		.action-assigned { color: #ea580c; }

		.entry-meta {
			display: flex; align-items: center; gap: 8px;
			font-size: 11px; color: var(--ott-text-muted);
		}
		.entry-user {
			display: flex; align-items: center; gap: 3px;
		}
		.entry-date { }

		.entry-comment {
			margin-top: 4px; font-size: 12px; color: var(--ott-text-secondary);
			padding: 6px 8px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-sm); border-left: 2px solid var(--ott-border);
		}
	`]
})
export class ViewHistoryComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	entries: HistoryEntry[] = [];

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] View History panel opened');
		this.loadHistory();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	private loadHistory(): void {
		const pageId = this.context?.id || 'x312';

		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'GetVersionHistoryPaged',
			args: [pageId, 0, 20]
		}).subscribe({
			next: (result) => {
				this.entries = (result?.Items || []).map((item: any) => ({
					version: item.Version,
					date: item.Date,
					user: item.User,
					action: item.Action,
					comment: item.Comment
				}));
			},
			error: () => this.loadDemoData()
		});
	}

	private loadDemoData(): void {
		this.entries = [
			{ version: 12, date: 'Jan 28, 2025 3:42 PM', user: 'Sarah Chen', action: 'Modified', comment: 'Updated compliance section per review feedback' },
			{ version: 11, date: 'Jan 27, 2025 10:15 AM', user: 'John Smith', action: 'Advanced', comment: 'Submitted for final review' },
			{ version: 10, date: 'Jan 25, 2025 2:30 PM', user: 'Michael Torres', action: 'Modified' },
			{ version: 9, date: 'Jan 24, 2025 9:00 AM', user: 'Emily Watson', action: 'Assigned', comment: 'Assigned to Quality team for review' },
			{ version: 8, date: 'Jan 22, 2025 4:18 PM', user: 'Sarah Chen', action: 'Modified', comment: 'Added appendix references' },
			{ version: 7, date: 'Jan 20, 2025 11:30 AM', user: 'David Kim', action: 'Published' },
			{ version: 6, date: 'Jan 18, 2025 3:00 PM', user: 'John Smith', action: 'Advanced' },
			{ version: 5, date: 'Jan 15, 2025 1:45 PM', user: 'Sarah Chen', action: 'Modified' },
			{ version: 4, date: 'Jan 12, 2025 10:00 AM', user: 'Emily Watson', action: 'Reverted', comment: 'Reverted formatting changes' },
			{ version: 3, date: 'Jan 10, 2025 2:15 PM', user: 'Michael Torres', action: 'Modified' },
			{ version: 2, date: 'Jan 8, 2025 9:30 AM', user: 'John Smith', action: 'Modified' },
			{ version: 1, date: 'Jan 5, 2025 11:00 AM', user: 'Sarah Chen', action: 'Created', comment: 'Initial draft created from template' },
		];
	}

	onClose(): void {
		this.close.emit();
	}
}
