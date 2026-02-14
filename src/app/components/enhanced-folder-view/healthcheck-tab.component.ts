import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild, AfterViewInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { HealthcheckStatusEntry, LIFECYCLE_STATUS_COLORS, LifecycleStatus } from '../../models/translation.model';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
	selector: 'ott-healthcheck-tab',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="healthcheck-tab">
			<!-- Header -->
			<div class="hc-header">
				<div>
					<div class="hc-name">{{ batchName }}</div>
					<div class="hc-timestamp">Last checked: {{ lastChecked }}</div>
				</div>
				<div class="hc-actions">
					<button class="action-btn" (click)="regenerate()">
						<ott-icon name="refresh-cw" [size]="13"></ott-icon>
						Regenerate
					</button>
					<button class="action-btn" (click)="print()">
						<ott-icon name="file-text" [size]="13"></ott-icon>
						Print
					</button>
				</div>
			</div>

			<!-- Dashboard: chart + table -->
			<div class="hc-dashboard">
				<!-- Chart -->
				<div class="chart-card">
					<div class="chart-wrap">
						<canvas #chartCanvas></canvas>
						<div class="chart-center">
							<span class="center-value">{{ totalCount }}</span>
							<span class="center-label">Total</span>
						</div>
					</div>
					<div class="chart-legend">
						<div class="legend-row" *ngFor="let entry of healthcheck">
							<span class="legend-dot" [style.background]="getColor(entry.status)"></span>
							<span class="legend-name">{{ entry.status }}</span>
							<span class="legend-count">{{ entry.count }}</span>
						</div>
					</div>
				</div>

				<!-- Status table with inline expand -->
				<div class="status-card">
					<table class="status-table">
						<thead>
							<tr>
								<th>Status</th>
								<th class="r">Count</th>
								<th class="r">%</th>
							</tr>
						</thead>
						<tbody>
							<ng-container *ngFor="let entry of healthcheck">
								<tr [class.expandable]="entry.count > 0"
									[class.expanded]="expandedStatuses.has(entry.status)"
									(click)="entry.count > 0 && toggleExpand(entry.status)">
									<td>
										<span class="status-dot" [style.background]="getColor(entry.status)"></span>
										{{ entry.status }}
										<ott-icon *ngIf="entry.count > 0"
											[name]="expandedStatuses.has(entry.status) ? 'chevron-down' : 'chevron-right'"
											[size]="12" color="var(--ott-text-muted)">
										</ott-icon>
									</td>
									<td class="r">{{ entry.count }}</td>
									<td class="r">{{ entry.percentage }}%</td>
								</tr>
								<!-- Inline expansion -->
								<tr class="expand-row" *ngIf="expandedStatuses.has(entry.status) && entry.count > 0">
									<td colspan="3">
										<div class="expand-list">
											<div class="expand-item" *ngFor="let item of entry.items.slice(0, maxExpanded)">
												<span class="item-name">{{ item.name }}</span>
												<span class="item-meta">{{ item.vendor }}</span>
												<span class="item-meta">{{ item.daysElapsed }}d</span>
											</div>
											<button class="show-more" *ngIf="entry.count > maxExpanded"
												(click)="$event.stopPropagation()">
												+{{ entry.count - maxExpanded }} more
											</button>
										</div>
									</td>
								</tr>
							</ng-container>
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total</strong></td>
								<td class="r"><strong>{{ totalCount }}</strong></td>
								<td class="r"><strong>100%</strong></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Header */
		.hc-header {
			display: flex; align-items: flex-start; justify-content: space-between;
			margin-bottom: 14px;
		}
		.hc-name { font-size: var(--ott-font-size-lg); font-weight: 600; color: var(--ott-text); }
		.hc-timestamp { font-size: var(--ott-font-size-sm); color: var(--ott-text-muted); margin-top: 1px; }
		.hc-actions { display: flex; gap: 4px; }
		.action-btn {
			display: inline-flex; align-items: center; gap: 4px;
			padding: 6px 10px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); background: var(--ott-bg);
			cursor: pointer; font-size: var(--ott-font-size-base); font-family: var(--ott-font);
			font-weight: 500; color: var(--ott-text-secondary);
			transition: all 0.12s;
		}
		.action-btn:hover { background: var(--ott-bg-muted); color: var(--ott-text); border-color: var(--ott-border); }

		/* Dashboard grid */
		.hc-dashboard {
			display: grid;
			grid-template-columns: 240px 1fr;
			gap: 14px;
		}

		/* Chart card */
		.chart-card {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			padding: 16px;
			background: var(--ott-bg);
		}
		.chart-wrap {
			position: relative;
			width: 180px; height: 180px;
			margin: 0 auto 14px;
		}
		.chart-wrap canvas { width: 100% !important; height: 100% !important; }
		.chart-center {
			position: absolute;
			top: 50%; left: 50%;
			transform: translate(-50%, -50%);
			text-align: center;
			pointer-events: none;
		}
		.center-value { display: block; font-size: var(--ott-font-size-xl); font-weight: 700; color: var(--ott-text); line-height: 1; }
		.center-label { display: block; font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

		/* Legend */
		.chart-legend { display: flex; flex-direction: column; gap: 3px; }
		.legend-row {
			display: flex; align-items: center; gap: 6px;
			font-size: var(--ott-font-size-sm); color: var(--ott-text-secondary);
		}
		.legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
		.legend-name { flex: 1; }
		.legend-count { font-family: var(--ott-font-mono); font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); }

		/* Status table card */
		.status-card {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
			background: var(--ott-bg);
		}
		.status-table { width: 100%; border-collapse: collapse; font-size: var(--ott-font-size-base); }
		.status-table th {
			text-align: left; padding: 8px 12px; font-size: var(--ott-font-size-xs); font-weight: 600;
			text-transform: uppercase; letter-spacing: 0.3px; color: var(--ott-text-muted);
			background: var(--ott-bg-muted); border-bottom: 1px solid var(--ott-border-light);
		}
		.status-table td {
			padding: 9px 12px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.status-table .r { text-align: right; }
		.status-table tr.expandable { cursor: pointer; }
		.status-table tr.expandable:hover { background: var(--ott-bg-muted); }
		.status-table tr.expanded { background: var(--ott-bg-muted); }
		.status-table tfoot td { background: var(--ott-bg-muted); border-bottom: none; }
		.status-dot {
			display: inline-block; width: 7px; height: 7px;
			border-radius: 50%; margin-right: 6px; vertical-align: middle;
		}

		/* Expand rows */
		.expand-row td {
			padding: 0 12px 8px;
			background: var(--ott-bg-muted);
		}
		.expand-list {
			display: flex; flex-direction: column; gap: 2px;
			padding: 4px 0 0 13px;
		}
		.expand-item {
			display: flex; align-items: center; gap: 10px;
			font-size: var(--ott-font-size-sm); color: var(--ott-text-secondary);
			padding: 4px 0;
		}
		.item-name {
			flex: 1; font-family: var(--ott-font-mono);
			font-size: var(--ott-font-size-sm); color: var(--ott-text);
			overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.item-meta { font-size: var(--ott-font-size-xs); color: var(--ott-text-muted); white-space: nowrap; }
		.show-more {
			border: none; background: none; cursor: pointer; padding: 2px 0;
			font-size: var(--ott-font-size-sm); font-family: var(--ott-font); color: var(--ott-primary);
			text-align: left;
		}
		.show-more:hover { text-decoration: underline; }
	`]
})
export class HealthcheckTabComponent implements OnChanges, AfterViewInit, OnDestroy {
	@Input() healthcheck: HealthcheckStatusEntry[] = [];
	@Input() batchName = '';
	@ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

	expandedStatuses = new Set<LifecycleStatus>();
	maxExpanded = 8;
	lastChecked = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

	private chart: Chart | null = null;

	get totalCount(): number {
		return this.healthcheck.reduce((sum, e) => sum + e.count, 0);
	}

	ngAfterViewInit(): void {
		this.createChart();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['healthcheck'] && this.chart) {
			this.updateChart();
		}
	}

	ngOnDestroy(): void {
		this.chart?.destroy();
	}

	getColor(status: LifecycleStatus): string {
		return LIFECYCLE_STATUS_COLORS[status] || '#94a3b8';
	}

	toggleExpand(status: LifecycleStatus): void {
		if (this.expandedStatuses.has(status)) this.expandedStatuses.delete(status);
		else this.expandedStatuses.add(status);
	}

	regenerate(): void {
		this.lastChecked = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
	}

	print(): void { window.print(); }

	private createChart(): void {
		if (!this.chartCanvas?.nativeElement) return;

		const entries = this.healthcheck.filter(e => e.count > 0);

		this.chart = new Chart(this.chartCanvas.nativeElement, {
			type: 'doughnut',
			data: {
				labels: entries.map(e => e.status),
				datasets: [{
					data: entries.map(e => e.count),
					backgroundColor: entries.map(e => this.getColor(e.status)),
					borderWidth: 2,
					borderColor: '#ffffff',
					hoverBorderColor: '#ffffff',
					hoverBorderWidth: 3,
					borderRadius: 3,
					spacing: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				cutout: '68%',
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: 'rgba(0,0,0,0.8)',
						titleFont: { family: "'Geist', sans-serif", size: 12, weight: '600' as any },
						bodyFont: { family: "'Geist', sans-serif", size: 11 },
						padding: 8,
						cornerRadius: 6,
						displayColors: true,
						boxWidth: 8,
						boxHeight: 8,
						boxPadding: 4,
						callbacks: {
							label: (ctx) => {
								const total = ctx.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
								const pct = total > 0 ? Math.round(((ctx.parsed as number) / total) * 100) : 0;
								return ` ${ctx.parsed} items (${pct}%)`;
							}
						}
					}
				},
				animation: {
					animateRotate: true,
					duration: 600
				}
			}
		});
	}

	private updateChart(): void {
		if (!this.chart) { this.createChart(); return; }

		const entries = this.healthcheck.filter(e => e.count > 0);
		this.chart.data.labels = entries.map(e => e.status);
		this.chart.data.datasets[0].data = entries.map(e => e.count);
		this.chart.data.datasets[0].backgroundColor = entries.map(e => this.getColor(e.status));
		this.chart.update('active');
	}
}
