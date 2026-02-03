import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';

interface CmsPage {
	id: string;
	name: string;
	title: string;
	bodyContent: string;
}

@Component({
	selector: 'app-micro-frontend-util-pane',
	templateUrl: './micro-frontend-util-pane.component.html',
	styleUrls: ['./micro-frontend-util-pane.component.less'],
	standalone: true,
	imports: [CommonModule]
})
export class MicroFrontendUtilPaneComponent extends ComponentBase implements OnInit, OnDestroy {
	/** Whether the panel is visible */
	private isVisible: boolean = false;
	
	/** Current CMS page details (stub) */
	public currentPage: CmsPage = {
		id: 'page-123456',
		name: 'Homepage',
		title: 'Welcome to Our Website',
		bodyContent: 'This is a sample content of the current CMS page. In a real implementation, this would be populated with actual content from the CMS system.'
	};
	
	constructor(ele: ElementRef) {
		super(ele);
	}
	
	ngOnInit(): void {
		// Initialization logic
		console.log('[IGX-OTT] Util Pane initialized');
	}
	
	ngOnDestroy(): void {
		// Clean up subscriptions
		this.cleanup();
	}
	
	/**
	 * Shows the util pane
	 */
	public show(): void {
		this.isVisible = true;
		console.log('[IGX-OTT] Util Pane shown');
		
		// Add any animation or visibility logic here
		if (this.ele?.nativeElement) {
			this.ele.nativeElement.style.display = 'block';
			
			// Attempt to get current page information
			this.fetchCurrentPageInfo();
			
			// Optional: Add a small delay before adding the 'visible' class for animation
			setTimeout(() => {
				if (this.ele?.nativeElement) {
					this.ele.nativeElement.classList.add('visible');
				}
			}, 10);
		}
	}
	
	/**
	 * Hides the util pane
	 */
	public hide(): void {
		this.isVisible = false;
		console.log('[IGX-OTT] Util Pane hidden');
		
		// Add any animation or visibility logic here
		if (this.ele?.nativeElement) {
			this.ele.nativeElement.classList.remove('visible');
			
			// Optional: Add a small delay before hiding the element for animation
			setTimeout(() => {
				if (this.ele?.nativeElement) {
					this.ele.nativeElement.style.display = 'none';
				}
			}, 300); // Match this with CSS transition duration
		}
	}
	
	/**
	 * Toggles the util pane visibility
	 */
	public toggle(): void {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}
	
	/**
	 * Fetches current page information from the CMS
	 * This is a stub method that would be replaced with actual implementation
	 */
	private fetchCurrentPageInfo(): void {
		// In a real implementation, this would fetch data from the CMS
		
		// For now, we'll just simulate getting page data by generating a random page
		const pageIds = ['page-123456', 'page-789012', 'page-345678'];
		const pageNames = ['Homepage', 'About Us', 'Contact Us'];
		const pageTitles = ['Welcome to Our Website', 'Learn About Our Company', 'Get in Touch With Us'];
		const pageContents = [
			'This is the homepage content. It introduces visitors to our website and services.',
			'This page contains information about our company, mission, and values.',
			'This page provides contact information and a form to get in touch with our team.'
		];
		
		const randomIndex = Math.floor(Math.random() * pageIds.length);
		
		this.currentPage = {
			id: pageIds[randomIndex],
			name: pageNames[randomIndex],
			title: pageTitles[randomIndex],
			bodyContent: pageContents[randomIndex]
		};
	}
}