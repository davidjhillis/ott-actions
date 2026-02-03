import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';

@Component({
    selector: 'app-topbar-button',
    templateUrl: './topbar-button.component.html',
    styleUrls: ['./topbar-button.component.less'],
    standalone: true,
    imports: [CommonModule],
    host: {
        'class': 'TopButton ctnp-topbar-button',
        'title': 'IGX-OTT Actions',
        '(click)': 'invoke()'
    }
})
export class TopbarButtonComponent extends ComponentBase implements OnInit, OnDestroy {
    /** Whether the button is currently active */
    public isCurrent: boolean = false;

    /** Reference to the main panel component */
    public panelComponent: any;

    /** The parent application instance */
    public app: any;

    constructor(ele: ElementRef, private renderer: Renderer2) {
        super(ele);
    }

    ngOnInit(): void {
        // Initialize the button state
        this.uncurrent();
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this.cleanup();
    }

    /**
     * Sets this button as current/active
     */
    public current(): void {
        this.isCurrent = true;
        if (this.ele) {
            const topWindow = window.top as any;
            // Remove TabSelected class from all TopButton elements
            const topButtons = topWindow.document.querySelectorAll('.TopButton.TabSelected');
            topButtons.forEach((button: HTMLElement) => {
                button.classList.remove('TabSelected');
            });
            (this.ele?.nativeElement as HTMLElement).classList.add("TabSelected");
            // Fake URL in address bar
            if (topWindow.history && topWindow.history.pushState) {
                topWindow.history.pushState({}, '', '#');
            }
        }
    }

    /**
     * Sets this button as uncurrent/inactive and hides the panel
     */
    public uncurrent(): void {
        this.isCurrent = false;
        if (this.ele)
            (this.ele?.nativeElement as HTMLElement).classList.remove("TabSelected");
    }

    /**
     * Handler for button click
     * Shows the micro frontend panel
     */
    public invoke(): void {
        console.log('[IGX-OTT] Button clicked');

        // Get reference to the top window
        const topWindow = window.top as any;
        if (!topWindow) return;

        // Get NgRef from top window
        const ngref = topWindow.NG_REF as any;
        if (!ngref || !ngref.app) {
            console.error('[IGX-OTT] - NG_REF not found in top window');
            return;
        }


        this.current();

        // Create or get the panel
        let panelRef = this.app.getMicroFrontendPanel();

        if (!panelRef) {
            // If the panel doesn't exist, create a temporary container and create the component
            const tempContainer = document.createElement('div');
            document.body.appendChild(tempContainer);
            panelRef = this.app.createMicroFrontendPanel(tempContainer);
        }

        // Find the target container in the top window
        const targetContainer = topWindow.document.querySelector('#globalTabContainer');
        if (!targetContainer) {
            console.error('[IGX-OTT] - Target container not found in top window');
            return;
        }

        targetContainer.style.position = 'relative';

        // Move the component to the target container
        const nativeElement = panelRef.location.nativeElement;
        targetContainer.appendChild(nativeElement);

        // Set panel reference
        this.panelComponent = panelRef;

        // Call show method on the component if it exists
        if (panelRef.instance && typeof panelRef.instance.show === 'function') {
            panelRef.instance.show();
        }
    }
}