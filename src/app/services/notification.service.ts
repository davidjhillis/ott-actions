import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	private container?: HTMLElement;

	/**
	 * Ensures the notification container exists in the CMS top frame.
	 * Returns null if top frame is not accessible.
	 */
	private getContainer(): HTMLElement | null {
		const topWindow = window.top as any;
		if (!topWindow) return null;

		if (this.container && this.container.parentElement) {
			return this.container;
		}

		const el = topWindow.document.createElement('div') as HTMLElement;
		el.id = 'igx-ott-notifications';
		el.style.cssText = `
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 100000;
			display: flex;
			flex-direction: column;
			gap: 8px;
			pointer-events: none;
		`;
		topWindow.document.body.appendChild(el);
		this.container = el;
		return el;
	}

	/**
	 * Shows a toast notification in the CMS top frame
	 */
	show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
		const container = this.getContainer();
		if (!container) return;

		const topWindow = window.top as any;
		const toast = topWindow.document.createElement('div') as HTMLElement;
		toast.style.cssText = `
			padding: 10px 16px;
			border-radius: 6px;
			font-family: Helvetica, Arial, sans-serif;
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

		container.appendChild(toast);

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

	/**
	 * Shows a persistent loading toast with spinner.
	 * Returns a handle with dismiss(), success(), and error() methods.
	 */
	loading(message: string): { dismiss: () => void; success: (msg: string) => void; error: (msg: string) => void } {
		const noop = { dismiss: () => { }, success: () => { }, error: () => { } };
		const container = this.getContainer();
		if (!container) return noop;

		const topWindow = window.top as any;
		if (!topWindow) return noop;

		const toast = topWindow.document.createElement('div') as HTMLElement;
		toast.style.cssText = `
			padding: 10px 16px;
			border-radius: 6px;
			font-family: Helvetica, Arial, sans-serif;
			font-size: 13px;
			color: #fff;
			background: #53ace3;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			pointer-events: auto;
			opacity: 0;
			transform: translateX(20px);
			transition: opacity 0.2s, transform 0.2s;
			max-width: 360px;
			display: flex;
			align-items: center;
			gap: 8px;
		`;

		// Spinner element
		const spinner = topWindow.document.createElement('span') as HTMLElement;
		spinner.style.cssText = `
			display: inline-block;
			width: 14px;
			height: 14px;
			border: 2px solid rgba(255,255,255,0.3);
			border-top-color: #fff;
			border-radius: 50%;
			animation: igx-spin 0.6s linear infinite;
		`;

		// Add keyframes if not already added
		if (!topWindow.document.getElementById('igx-ott-spinner-styles')) {
			const style = topWindow.document.createElement('style');
			style.id = 'igx-ott-spinner-styles';
			style.textContent = '@keyframes igx-spin { to { transform: rotate(360deg); } }';
			topWindow.document.head.appendChild(style);
		}

		const text = topWindow.document.createElement('span') as HTMLElement;
		text.textContent = message;

		toast.appendChild(spinner);
		toast.appendChild(text);
		container.appendChild(toast);

		requestAnimationFrame(() => {
			toast.style.opacity = '1';
			toast.style.transform = 'translateX(0)';
		});

		const removeToast = () => {
			toast.style.opacity = '0';
			toast.style.transform = 'translateX(20px)';
			setTimeout(() => toast.remove(), 200);
		};

		return {
			dismiss: removeToast,
			success: (msg: string) => {
				removeToast();
				this.success(msg);
			},
			error: (msg: string) => {
				removeToast();
				this.error(msg);
			}
		};
	}

	success(message: string): void { this.show(message, 'success'); }
	error(message: string): void { this.show(message, 'error', 5000); }
	info(message: string): void { this.show(message, 'info'); }
	warning(message: string): void { this.show(message, 'warning'); }
}
