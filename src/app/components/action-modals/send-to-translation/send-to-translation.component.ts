import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { TranslationService, CmsLocale, LingualMapsResult } from '../../../services/translation.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface SelectableLocale extends CmsLocale {
	selected: boolean;
}

@Component({
	selector: 'app-send-to-translation',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="languages" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Send to Translation</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Source info -->
					<div class="source-info">
						<div class="source-label">Source</div>
						<div class="source-detail">
							<span class="source-name">{{ lingualMaps.masterPage.name }}</span>
							<span class="locale-badge master">{{ lingualMaps.masterPage.locale }}</span>
						</div>
						<div class="source-path">/Standards/Quality/ISO-9001-2025</div>
					</div>

					<!-- Existing translations -->
					<div class="section" *ngIf="lingualMaps.clonePages.length > 0">
						<div class="section-header">
							<ott-icon name="globe" [size]="14"></ott-icon>
							Existing Translations
						</div>
						<div class="translation-list">
							<div class="translation-item" *ngFor="let clone of lingualMaps.clonePages">
								<span class="locale-code">{{ clone.locale }}</span>
								<span class="translation-name">{{ clone.name }}</span>
								<span class="status-badge" [ngClass]="'status-' + clone.status">
									{{ formatStatus(clone.status) }}
								</span>
							</div>
						</div>
					</div>

					<!-- Target languages -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="plus" [size]="14"></ott-icon>
							Send to New Languages
						</div>

						<div class="locale-list" *ngIf="availableLocales.length > 0">
							<label class="locale-item" *ngFor="let loc of availableLocales">
								<input type="checkbox" [(ngModel)]="loc.selected">
								<span class="locale-code">{{ loc.code }}</span>
								<span class="locale-name">{{ loc.name }}</span>
							</label>
						</div>
						<div class="no-locales" *ngIf="availableLocales.length === 0">
							All available locales already have translations.
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<span class="selected-count" *ngIf="selectedCount > 0">
						{{ selectedCount }} language{{ selectedCount !== 1 ? 's' : '' }} selected
					</span>
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onSend()" [disabled]="selectedCount === 0">
						<ott-icon name="send" [size]="14"></ott-icon>
						Send
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.modal-overlay {
			position: fixed;
			top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0,0,0,0.4);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: var(--ott-font);
		}
		.modal-dialog {
			background: var(--ott-bg);
			border-radius: var(--ott-radius-xl);
			box-shadow: var(--ott-shadow-xl);
			border: 1px solid var(--ott-border);
			width: 520px;
			max-height: 80vh;
			display: flex;
			flex-direction: column;
		}
		.modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.header-title {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.modal-header h3 {
			margin: 0;
			font-size: 15px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.close-btn {
			border: none;
			background: none;
			cursor: pointer;
			color: var(--ott-text-muted);
			padding: 4px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background-color 0.15s;
		}
		.close-btn:hover {
			color: var(--ott-text);
			background: var(--ott-bg-hover);
		}
		.modal-body {
			padding: 16px 20px;
			overflow-y: auto;
			flex: 1;
		}

		/* Source info */
		.source-info {
			padding: 12px;
			background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg);
			border: 1px solid var(--ott-border-light);
			margin-bottom: 16px;
		}
		.source-label {
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			color: var(--ott-text-muted);
			letter-spacing: 0.5px;
			margin-bottom: 4px;
		}
		.source-detail {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 4px;
		}
		.source-name {
			font-size: 14px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.source-path {
			font-size: 12px;
			color: var(--ott-text-muted);
			font-family: var(--ott-font-mono);
		}

		/* Locale badges */
		.locale-badge {
			display: inline-flex;
			padding: 2px 6px;
			border-radius: var(--ott-radius-sm);
			font-size: 10px;
			font-weight: 600;
			letter-spacing: 0.3px;
		}
		.locale-badge.master {
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}

		/* Sections */
		.section {
			margin-bottom: 16px;
		}
		.section-header {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 12px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 8px;
		}

		/* Existing translations */
		.translation-list {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.translation-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			font-size: 13px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.translation-item:last-child { border-bottom: none; }
		.locale-code {
			font-size: 11px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			font-family: var(--ott-font-mono);
			width: 40px;
			flex-shrink: 0;
		}
		.translation-name {
			flex: 1;
			color: var(--ott-text);
		}
		.status-badge {
			font-size: 10px;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			font-weight: 600;
		}
		.status-completed { background: var(--ott-success-light); color: #166534; }
		.status-in-progress { background: var(--ott-warning-light); color: #92400e; }
		.status-not-started { background: var(--ott-bg-subtle); color: var(--ott-text-muted); }

		/* Target locale selection */
		.locale-list {
			max-height: 200px;
			overflow-y: auto;
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
		}
		.locale-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			cursor: pointer;
			font-size: 13px;
			border-bottom: 1px solid var(--ott-border-light);
			transition: background-color 0.12s;
			color: var(--ott-text);
		}
		.locale-item:last-child { border-bottom: none; }
		.locale-item:hover { background: var(--ott-bg-muted); }
		.locale-name { flex: 1; }
		.no-locales {
			padding: 12px;
			text-align: center;
			color: var(--ott-text-muted);
			font-size: 13px;
		}

		/* Footer */
		.modal-footer {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light);
		}
		.selected-count {
			flex: 1;
			font-size: 12px;
			color: var(--ott-text-secondary);
		}
		.btn {
			padding: 8px 16px;
			border-radius: var(--ott-radius-md);
			font-size: 13px;
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			display: inline-flex;
			align-items: center;
			gap: 6px;
			transition: background-color 0.15s, border-color 0.15s;
		}
		.btn-secondary {
			background: var(--ott-bg);
			color: var(--ott-text);
		}
		.btn-secondary:hover { background: var(--ott-bg-hover); }
		.btn-primary {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	`]
})
export class SendToTranslationComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();

	lingualMaps!: LingualMapsResult;
	availableLocales: SelectableLocale[] = [];

	constructor(
		ele: ElementRef,
		private translationService: TranslationService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Send to Translation modal opened');

		// Load existing translations
		this.lingualMaps = this.translationService.getFullLingualMaps('x312');

		// Get available locales, excluding master + already translated
		const existingLocales = new Set([
			this.lingualMaps.masterPage.locale,
			...this.lingualMaps.clonePages.map(c => c.locale)
		]);

		this.availableLocales = this.translationService.getAvailableLocales()
			.filter(loc => !existingLocales.has(loc.code))
			.map(loc => ({ ...loc, selected: false }));
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get selectedCount(): number {
		return this.availableLocales.filter(l => l.selected).length;
	}

	formatStatus(status: string): string {
		switch (status) {
			case 'completed': return 'Completed';
			case 'in-progress': return 'In Progress';
			case 'not-started': return 'Not Started';
			default: return status;
		}
	}

	onCancel(): void {
		this.close.emit();
	}

	onSend(): void {
		const selected = this.availableLocales
			.filter(l => l.selected)
			.map(l => l.code);

		this.translationService.sendToTranslation('x312', selected);
		console.log(`[IGX-OTT] Sent for translation to: ${selected.join(', ')}`);
		this.close.emit();
	}
}
