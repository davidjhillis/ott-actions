import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { HealthcheckStatusEntry, LIFECYCLE_STATUS_COLORS, LifecycleStatus } from '../../models/translation.model';

interface PieSlice {
	status: LifecycleStatus;
	color: string;
	percentage: number;
	count: number;
	startAngle: number;
	endAngle: number;
	pathD: string;
}

@Component({
	selector: 'ott-healthcheck-tab',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="healthcheck-tab">
			<!-- Header -->
			<div class="hc-header">
				<div class="hc-title">
					<span class="hc-name">{{ batchName }}</span>
					<span class="hc-timestamp">Last checked: {{ lastChecked }}</span>
				</div>
				<div class="hc-actions">
					<button class="btn btn-outline" (click)="regenerate()">
						<ott-icon name="refresh-cw" [size]="14"></ott-icon>
						Regenerate
					</button>
					<button class="btn btn-outline" (click)="print()">
						<ott-icon name="file-text" [size]="14"></ott-icon>
						Print
					</button>
				</div>
			</div>

			<!-- Chart + Table row -->
			<div class="hc-dashboard">
				<!-- Pie Chart -->
				<div class="pie-container">
					<div class="pie-title">Lifecycle Status Insight</div>
					<svg viewBox="0 0 200 200" class="pie-chart">
						<g *ngFor="let slice of pieSlices">
							<path
								[attr.d]="slice.pathD"
								[attr.fill]="slice.color"
								class="pie-slice"
								(mouseenter)="hoveredSlice = slice"
								(mouseleave)="hoveredSlice = null">
							</path>
						</g>
						<!-- Center text -->
						<text x="100" y="95" text-anchor="middle" class="pie-center-label">Total</text>
						<text x="100" y="115" text-anchor="middle" class="pie-center-value">{{ totalCount }}</text>
					</svg>
					<div class="pie-legend">
						<div class="legend-item" *ngFor="let slice of pieSlices">
							<span class="legend-dot" [style.background]="slice.color"></span>
							<span class="legend-label">{{ slice.status }}</span>
							<span class="legend-count">{{ slice.count }} ({{ slice.percentage }}%)</span>
						</div>
					</div>
				</div>

				<!-- Status Table -->
				<div class="status-table-container">
					<table class="status-table">
						<thead>
							<tr>
								<th>Status</th>
								<th class="align-right">Count</th>
								<th class="align-right">%</th>
							</tr>
						</thead>
						<tbody>
							<tr *ngFor="let entry of healthcheck"
								[class.expandable]="entry.count > 0"
								(click)="entry.count > 0 && toggleExpand(entry.status)">
								<td>
									<span class="expand-icon" *ngIf="entry.count > 0">
										{{ expandedStatuses.has(entry.status) ? '&#9662;' : '&#9656;' }}
									</span>
									<span class="status-dot" [style.background]="getColor(entry.status)"></span>
									{{ entry.status }}
								</td>
								<td class="align-right">{{ entry.count }}</td>
								<td class="align-right">{{ entry.percentage }}%</td>
							</tr>
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total</strong></td>
								<td class="align-right"><strong>{{ totalCount }}</strong></td>
								<td class="align-right"><strong>100%</strong></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			<!-- Expanded item lists -->
			<div class="expanded-sections">
				<div *ngFor="let entry of healthcheck">
					<div class="expanded-section" *ngIf="expandedStatuses.has(entry.status) && entry.count > 0">
						<div class="expanded-header" (click)="toggleExpand(entry.status)">
							<span class="expand-icon">&#9662;</span>
							{{ entry.status }} ({{ entry.count }})
						</div>
						<div class="expanded-list">
							<div class="expanded-item" *ngFor="let item of entry.items.slice(0, maxExpandedItems)">
								<span class="item-name font-mono">{{ item.name }}</span>
								<span class="item-vendor">{{ item.vendor }}</span>
								<span class="item-due">{{ item.dueDate || '—' }}</span>
								<span class="item-days">{{ item.daysElapsed }} days</span>
							</div>
							<div class="more-items" *ngIf="entry.count > maxExpandedItems">
								+{{ entry.count - maxExpandedItems }} more
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		.hc-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.hc-name { font-size: 15px; font-weight: 600; color: var(--ott-text); }
		.hc-timestamp {
			display: block;
			font-size: 12px;
			color: var(--ott-text-muted);
			margin-top: 2px;
		}
		.hc-actions { display: flex; gap: 6px; }

		/* Dashboard */
		.hc-dashboard {
			display: grid;
			grid-template-columns: 280px 1fr;
			gap: 20px;
			margin-bottom: 16px;
		}

		/* Pie chart */
		.pie-container {
			background: var(--ott-bg-muted);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-lg);
			padding: 14px;
		}
		.pie-title {
			font-size: 12px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			margin-bottom: 8px;
		}
		.pie-chart {
			width: 180px;
			height: 180px;
			display: block;
			margin: 0 auto 12px;
		}
		.pie-slice {
			transition: opacity 0.15s;
			cursor: pointer;
		}
		.pie-slice:hover { opacity: 0.8; }
		.pie-center-label {
			font-size: 11px;
			fill: var(--ott-text-muted);
			font-family: var(--ott-font);
		}
		.pie-center-value {
			font-size: 18px;
			font-weight: 700;
			fill: var(--ott-text);
			font-family: var(--ott-font);
		}
		.pie-legend { display: flex; flex-direction: column; gap: 4px; }
		.legend-item {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 11px;
		}
		.legend-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			flex-shrink: 0;
		}
		.legend-label { flex: 1; color: var(--ott-text-secondary); }
		.legend-count { color: var(--ott-text-muted); font-family: var(--ott-font-mono); font-size: 10px; }

		/* Status table */
		.status-table-container {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-lg);
			overflow: hidden;
		}
		.status-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
		}
		.status-table th {
			text-align: left;
			padding: 8px 12px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.3px;
			color: var(--ott-text-muted);
			background: var(--ott-bg-muted);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.status-table td {
			padding: 8px 12px;
			color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.status-table tr.expandable { cursor: pointer; }
		.status-table tr.expandable:hover { background: var(--ott-bg-hover); }
		.status-table tfoot td {
			background: var(--ott-bg-muted);
			border-bottom: none;
		}
		.align-right { text-align: right; }
		.status-dot {
			display: inline-block;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			margin-right: 6px;
		}
		.expand-icon {
			display: inline-block;
			width: 14px;
			font-size: 10px;
			color: var(--ott-text-muted);
		}

		/* Expanded sections */
		.expanded-sections { display: flex; flex-direction: column; gap: 8px; }
		.expanded-section {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.expanded-header {
			padding: 8px 12px;
			font-size: 13px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			background: var(--ott-bg-muted);
			cursor: pointer;
			user-select: none;
		}
		.expanded-header:hover { background: var(--ott-bg-hover); }
		.expanded-list { }
		.expanded-item {
			display: grid;
			grid-template-columns: 1fr 60px 80px 70px;
			gap: 8px;
			padding: 6px 12px;
			font-size: 12px;
			border-bottom: 1px solid var(--ott-border-light);
			color: var(--ott-text);
		}
		.expanded-item:last-child { border-bottom: none; }
		.font-mono { font-family: var(--ott-font-mono); }
		.item-vendor, .item-due, .item-days { color: var(--ott-text-muted); }
		.more-items {
			padding: 6px 12px;
			font-size: 12px;
			color: var(--ott-primary);
			cursor: pointer;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			transition: all 0.15s;
		}
		.btn-outline {
			background: var(--ott-bg);
			color: var(--ott-text-secondary);
		}
		.btn-outline:hover {
			background: var(--ott-bg-hover);
			color: var(--ott-text);
		}
	`]
})
export class HealthcheckTabComponent implements OnChanges {
	@Input() healthcheck: HealthcheckStatusEntry[] = [];
	@Input() batchName = '';

	pieSlices: PieSlice[] = [];
	expandedStatuses = new Set<LifecycleStatus>();
	hoveredSlice: PieSlice | null = null;
	maxExpandedItems = 20;
	lastChecked = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

	get totalCount(): number {
		return this.healthcheck.reduce((sum, e) => sum + e.count, 0);
	}

	ngOnChanges(): void {
		this.buildPieSlices();
	}

	getColor(status: LifecycleStatus): string {
		return LIFECYCLE_STATUS_COLORS[status] || '#94a3b8';
	}

	toggleExpand(status: LifecycleStatus): void {
		if (this.expandedStatuses.has(status)) {
			this.expandedStatuses.delete(status);
		} else {
			this.expandedStatuses.add(status);
		}
	}

	regenerate(): void {
		this.lastChecked = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
		console.log('[IGX-OTT] Healthcheck regenerated');
	}

	print(): void {
		window.print();
	}

	private buildPieSlices(): void {
		const total = this.totalCount;
		if (total === 0) {
			this.pieSlices = [];
			return;
		}

		const slices: PieSlice[] = [];
		let currentAngle = -90; // Start from top

		for (const entry of this.healthcheck) {
			if (entry.count === 0) continue;

			const percentage = entry.percentage;
			const sliceAngle = (percentage / 100) * 360;
			const startAngle = currentAngle;
			const endAngle = currentAngle + sliceAngle;

			slices.push({
				status: entry.status,
				color: this.getColor(entry.status),
				percentage,
				count: entry.count,
				startAngle,
				endAngle,
				pathD: this.describeArc(100, 100, 70, startAngle, endAngle)
			});

			currentAngle = endAngle;
		}

		this.pieSlices = slices;
	}

	private describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
		const start = this.polarToCartesian(cx, cy, r, endAngle);
		const end = this.polarToCartesian(cx, cy, r, startAngle);
		const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

		return [
			'M', cx, cy,
			'L', start.x, start.y,
			'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
			'Z'
		].join(' ');
	}

	private polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
		const angleRad = (angleDeg * Math.PI) / 180;
		return {
			x: cx + r * Math.cos(angleRad),
			y: cy + r * Math.sin(angleRad)
		};
	}
}
