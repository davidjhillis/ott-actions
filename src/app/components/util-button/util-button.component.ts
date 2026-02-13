import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	OnInit,
	ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';

@Component({
	selector: 'app-util-button',
	templateUrl: './util-button.component.html',
	styleUrls: ['./util-button.component.less'],
	standalone: true,
	imports: [CommonModule],
	host: {
		'style': "padding: 16px 0;"
	}
})
export class UtilButtonComponent extends ComponentBase implements OnInit, OnDestroy {
	// #region Properties
	private _attachNode?: HTMLElement;
	@Input() public app: any;
	public attachComponent: any;
	public hidden: boolean = false;
	@Input() public isCurrent: boolean = false;
	public isUtility: boolean = true;
	public requireResizeOnToggle: boolean = true;
	private _utilbarHooked: boolean = false;
	@ViewChild("path") public path!: ElementRef;
	// #endregion Properties

	constructor(ele: ElementRef, private change: ChangeDetectorRef) {
		super(ele);
	}

	// #region Public Getters And Setters
	public get attachNode(): HTMLElement | undefined {
		return this._attachNode;
	}

	public set attachNode(val: HTMLElement) {
		this._attachNode = val;
	}

	public get currentClass(): string {
		return this.isCurrent ? "current" : "";
	}

	public get utilClass(): string {
		return this.isUtility ? "Icon" : "";
	}
	// #endregion Public Getters And Setters

	// #region Lifecycle Methods
	ngOnInit(): void {
		// Initialize the button
		this.uncurrent();
	}

	ngOnDestroy(): void {
		// Clean up subscriptions
		this.cleanup();
	}
	// #endregion Lifecycle Methods

	// #region Public Methods
	/**
	 * Sets the button to current/active state
	 */
	public current(): void {
		this.isCurrent = true;
		if (this.path?.nativeElement) {
			(this.path.nativeElement as SVGPathElement).style.fill = "#4fc236";
		}
		this.change.detectChanges();
	}

	/**
	 * Handles the button click event.
	 * Shows the Actions panel in the CMS left sidebar.
	 */
	public invoke(): void {
		console.log('[IGX-OTT] Actions button invoked');

		// Get top window and access to NG_REF
		const topWindow = window.top as any;
		if (!topWindow) return;

		const ngref = topWindow.NG_REF as any;
		if (!ngref || !ngref.app) return;

		const utilbar = ngref.app.utilBar;
		if (!!utilbar) {
			// Hookup invoke event to make sure leaving panel will uncurrent the button
			this._hookupUtilbarInvoke(utilbar);

			utilbar.navButton.routeChanged = false;
			utilbar.currentButton = null;

			this.current();

			// Set other buttons to uncurrent
			utilbar.utilButtons.forEach((b: any) => {
				b.uncurrent();
			});

			// Get or create the action panel component
			let actionPanelRef = this.app.getActionPanel();

			if (!actionPanelRef) {
				// Create a temporary container, then create the action panel
				const tempContainer = document.createElement('div');
				document.body.appendChild(tempContainer);
				actionPanelRef = this.app.createActionPanel(tempContainer);
			}

			// Find the target container in the top window
			const targetContainer = topWindow.document.querySelector('.left-panel.navPanel');
			if (!targetContainer) {
				console.error('[IGX-OTT] - Target container (.left-panel.navPanel) not found in top window');
				return;
			}

			// Move the action panel to the left panel target
			const nativeElement = actionPanelRef.location.nativeElement;
			targetContainer.appendChild(nativeElement);

			// Set attachComponent and attachNode references
			this.attachComponent = actionPanelRef.instance;
			this.attachNode = nativeElement;

			// Trigger panel toggle event
			if (utilbar.onPanelToggle) {
				utilbar.onPanelToggle.emit(this);
			}
		}
	}

	/**
	 * Sets the button to uncurrent/inactive state
	 */
	public uncurrent(): void {
		this.isCurrent = false;
		if (this.path?.nativeElement) {
			(this.path.nativeElement as SVGPathElement).style.fill = "#53ace3";
		}

		// If attached node exists and has parent element, move it back to document body
		if (this.attachNode && this.attachNode.parentElement) {
			document.body.appendChild(this.attachNode);
		}

		this.change.detectChanges();
	}
	// #endregion Public Methods

	// #region Private Methods
	/**
	 * Hooks up to the utilbar's onPanelToggle event
	 */
	private _hookupUtilbarInvoke(utilbar: any): void {
		if (!this._utilbarHooked && utilbar.onPanelToggle) {
			this.observableSubTeardowns.push(utilbar.onPanelToggle.subscribe((evt: any) => {
				if (evt !== this) {
					this.uncurrent();
				}
			}));
			this._utilbarHooked = true;
		}
	}
	// #endregion Private Methods
}