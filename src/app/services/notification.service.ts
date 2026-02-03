import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	private container?: HTMLElement;

	/**
	 * Shows a toast notification in the CMS top frame
	 */
	show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
		const topWindow = window.top as any;
		if (!topWindow) return;

		// Create or get container
		if (!this.container || !this.container.parentElement) {
			this.container = topWindow.document.createElement('div');
			this.container.id = 'igx-ott-notifications';
			this.container.style.cssText = `
				position: fixed;
				top: 16px;
				right: 16px;
				z-index: 100000;
				display: flex;
				flex-direction: column;
				gap: 8px;
				pointer-events: none;
			`;
			topWindow.document.body.appendChild(this.container);
		}

		const toast = topWindow.document.createElement('div');
		toast.style.cssText = `
			padding: 10px 16px;
			border-radius: 6px;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 13px;
			color: #fff;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			pointer-events: auto;
			cursor: pointer;
			opacity: 0;
			transform: translateX(20px);
			transition: opacity 0.2s, transform 0.2s;
			max-width: 360px;
		`;

		const colors: Record<NotificationType, string> = {
			success: '#28a745',
			error: '#dc3545',
			info: '#53ace3',
			warning: '#ffc107'
		};

		const icons: Record<NotificationType, string> = {
			success: '\u2713',
			error: '\u2717',
			info: '\u2139',
			warning: '\u26A0'
		};

		toast.style.background = colors[type];
		if (type === 'warning') toast.style.color = '#333';
		toast.textContent = `${icons[type]}  ${message}`;

		toast.addEventListener('click', () => {
			toast.style.opacity = '0';
			toast.style.transform = 'translateX(20px)';
			setTimeout(() => toast.remove(), 200);
		});

		this.container.appendChild(toast);

		// Animate in
		requestAnimationFrame(() => {
			toast.style.opacity = '1';
			toast.style.transform = 'translateX(0)';
		});

		// Auto dismiss
		setTimeout(() => {
			if (toast.parentElement) {
				toast.style.opacity = '0';
				toast.style.transform = 'translateX(20px)';
				setTimeout(() => toast.remove(), 200);
			}
		}, duration);
	}

	success(message: string): void { this.show(message, 'success'); }
	error(message: string): void { this.show(message, 'error', 5000); }
	info(message: string): void { this.show(message, 'info'); }
	warning(message: string): void { this.show(message, 'warning'); }
}
