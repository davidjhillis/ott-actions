import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

/** Generic CMS page field extracted from GetPageData */
export interface CmsPageField {
	name: string;
	value: any;
	type: 'text' | 'date' | 'link' | 'list' | 'dropdown' | 'table' | 'rich-text' | 'unknown';
	label: string;
}

/** Typed response from GetPageData */
export interface CmsPageData {
	ID: string;
	Name: string;
	Schema: string;
	SchemaID?: string;
	Path?: string;
	Elements?: Record<string, any>;
	Attributes?: Record<string, any>;
	CreatedBy?: string;
	CreatedDate?: string;
	LastModifiedBy?: string;
	LastModifiedDate?: string;
}

/** Asset child item from GetAssetChildren */
export interface CmsAssetChild {
	ID: string;
	Name: string;
	Type: string;
	IsFolder: boolean;
	Schema?: string;
	Size?: number;
	LastModifiedDate?: string;
	CreatedDate?: string;
	Path?: string;
}

/** Asset root from GetAssetRoots */
export interface CmsAssetRoot {
	ID: string;
	Name: string;
	Path: string;
}

/** Child page from GetChildPagesSimple */
export interface CmsChildPage {
	ID: string;
	Name: string;
	Schema?: string;
	Path?: string;
	IsFolder: boolean;
	LastModifiedDate?: string;
}

/** Page properties from GetPageProperties */
export interface CmsPageProperties {
	ID: string;
	Name: string;
	Schema: string;
	Path: string;
	CreatedBy?: string;
	CreatedDate?: string;
	LastModifiedBy?: string;
	LastModifiedDate?: string;
	WorkflowStatus?: string;
	PublishStatus?: string;
	ParentID?: string;
	BreadcrumbPath?: { ID: string; Name: string }[];
}

/** Schema definition from GetAllSchemas */
export interface CmsSchema {
	ID: string;
	Name: string;
	Description?: string;
}

@Injectable({
	providedIn: 'root'
})
export class CmsApiService {
	private baseUrl = 'https://igx-demos.ingeniux.com/dhillis';
	private authToken: string | null = null;
	private isAvailable: boolean | null = null;

	constructor(private http: HttpClient) {}

	/**
	 * Login to get auth token
	 */
	login(username: string, password: string): Observable<string> {
		return this.http.post<any>(`${this.baseUrl}/api/MembershipProvidersServices/Login`, {
			Username: username,
			Password: password
		}).pipe(
			map(res => {
				this.authToken = res?.Token || res?.token || res;
				this.isAvailable = true;
				return this.authToken as string;
			}),
			catchError(err => {
				this.isAvailable = false;
				return throwError(() => err);
			})
		);
	}

	/**
	 * Set auth token directly (e.g. from CMS iframe context)
	 */
	setToken(token: string): void {
		this.authToken = token;
		this.isAvailable = true;
	}

	/**
	 * Check if CMS API is reachable.
	 * Uses REST v1 root endpoint (proven to work).
	 */
	checkAvailability(): Observable<boolean> {
		if (this.isAvailable !== null) return of(this.isAvailable);

		return this.http.get(`${this.baseUrl}/api/v1/pages/root`, {
			headers: this.getHeaders(),
			responseType: 'text'
		}).pipe(
			map(() => { this.isAvailable = true; return true; }),
			catchError(() => { this.isAvailable = false; return of(false); })
		);
	}

	/**
	 * Get page data including all schema fields.
	 * Tries REST v1 preview/page-xml first (returns XML that we parse),
	 * then falls back to WCF PageCommandsServices.
	 */
	getPageData(pageId: string, pubTarget?: string): Observable<CmsPageData> {
		// Try REST v1 preview endpoint first (proven to work)
		return this.http.get<any>(
			`${this.baseUrl}/api/v1/preview/page-xml?pageId=${encodeURIComponent(pageId)}`,
			{ headers: this.getHeaders() }
		).pipe(
			map(response => this.parsePageXml(response)),
			catchError(() => {
				// Fall back to WCF endpoint
				const params: any = { pageId };
				if (pubTarget) params.pubTarget = pubTarget;
				return this.callApi<CmsPageData>('PageCommandsServices', 'GetPageData', params);
			})
		);
	}

	/**
	 * Parse the preview/page-xml response into CmsPageData.
	 * The response has { Content: "<xml>", PageId, Name, ... }
	 * Extracts both element values and UIDs (needed for SavePartial).
	 */
	private parsePageXml(response: any): CmsPageData {
		const xml = response?.Content || '';
		const pageId = response?.PageId || '';
		const name = response?.Name || '';

		// Parse XML elements into key-value pairs
		const elements: Record<string, any> = {};
		// Match elements with content: <TagName attr="val">content</TagName>
		const regex = /<(\w+)\s([^>]*)>([^<]*)<\/\1>/g;
		let match;
		while ((match = regex.exec(xml)) !== null) {
			const [, tagName, attrs, value] = match;
			elements[tagName] = value.trim() || '';
			// Store UID for SavePartial
			const uidMatch = attrs.match(/UID="([^"]+)"/);
			if (uidMatch) {
				elements[`__uid_${tagName}`] = uidMatch[1];
			}
		}

		// Extract schema name from root element
		const rootMatch = xml.match(/^<(\w+)/);
		const schema = rootMatch ? rootMatch[1] : '';

		return {
			ID: pageId,
			Name: name,
			Schema: schema,
			Elements: elements
		};
	}

	/**
	 * Get children of an asset folder
	 */
	getAssetChildren(folderId: string): Observable<CmsAssetChild[]> {
		return this.callApi<CmsAssetChild[]>(
			'AssetServices', 'GetAssetChildren', { folderId }
		);
	}

	/**
	 * Get asset root folders
	 */
	getAssetRoots(): Observable<CmsAssetRoot[]> {
		return this.callApi<CmsAssetRoot[]>(
			'AssetServices', 'GetAssetRoots', {}
		);
	}

	/**
	 * Get child pages of a parent.
	 * Uses REST v1 /pages/page/children endpoint (proven to work),
	 * falls back to WCF SiteTreeServices.
	 */
	getChildPagesSimple(parentId: string, depth: number = 1): Observable<CmsChildPage[]> {
		return this.http.get<any>(
			`${this.baseUrl}/api/v1/pages/page/children?id=${encodeURIComponent(parentId)}`,
			{ headers: this.getHeaders() }
		).pipe(
			map(response => {
				const results = response?.Results || [];
				return results.map((r: any) => ({
					ID: r.Id || r.ID || '',
					Name: r.Name || '',
					Schema: r.SchemaName || '',
					Path: r.Path || '',
					IsFolder: r.SchemaName === 'Folder' || r.ChildrenCount > 0,
					LastModifiedDate: r.LastModified || ''
				}));
			}),
			catchError(() => {
				// Fall back to WCF endpoint
				return this.callApi<CmsChildPage[]>(
					'SiteTreeServices', 'GetChildPagesSimple', { parentId, depth: depth.toString() }
				);
			})
		);
	}

	/**
	 * Get page properties including path, workflow, schema
	 */
	getPageProperties(pageId: string, pubTarget?: string): Observable<CmsPageProperties> {
		const params: any = { pageId };
		if (pubTarget) params.pubTarget = pubTarget;

		return this.callApi<CmsPageProperties>(
			'SiteTreeServices', 'GetPageProperties', params
		);
	}

	/**
	 * Get all available schemas
	 */
	getAllSchemas(): Observable<CmsSchema[]> {
		return this.callApi<CmsSchema[]>(
			'PageCommandsServices', 'GetAllSchemas', {}
		);
	}

	/**
	 * Parse CMS page data into generic field list for dynamic rendering
	 */
	parsePageFields(pageData: CmsPageData): CmsPageField[] {
		const fields: CmsPageField[] = [];

		// Parse Elements (skip internal __uid_* keys used for SavePartial)
		if (pageData.Elements) {
			for (const [key, value] of Object.entries(pageData.Elements)) {
				if (key.startsWith('__uid_')) continue;
				fields.push(this.classifyField(key, value));
			}
		}

		// Parse Attributes
		if (pageData.Attributes) {
			for (const [key, value] of Object.entries(pageData.Attributes)) {
				fields.push(this.classifyField(key, value));
			}
		}

		return fields;
	}

	/**
	 * POST to a WCF service endpoint.
	 * Used for save operations where the data wrapper format matters.
	 */
	postWcf<T>(service: string, action: string, data: any): Observable<T> {
		const url = `${this.baseUrl}/REST/${service}.svc/${action}`;
		return this.http.post<T>(url, { data }, { headers: this.getHeaders() }).pipe(
			catchError(err => {
				console.warn(`[IGX-OTT] WCF POST failed: ${service}.${action}`, err);
				return throwError(() => err);
			})
		);
	}

	// -- Private helpers --

	private getHeaders(): HttpHeaders {
		let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
		if (this.authToken) {
			headers = headers.set('Authorization', `Bearer ${this.authToken}`);
		}
		return headers;
	}

	private callApi<T>(service: string, action: string, params: Record<string, string>): Observable<T> {
		const queryString = Object.entries(params)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&');
		const url = `${this.baseUrl}/api/${service}/${action}${queryString ? '?' + queryString : ''}`;

		return this.http.get<T>(url, { headers: this.getHeaders() }).pipe(
			catchError(err => {
				console.warn(`[IGX-OTT] CMS API call failed: ${service}.${action}`, err);
				return throwError(() => err);
			})
		);
	}

	/**
	 * Classify a field by inspecting its value shape
	 */
	private classifyField(name: string, value: any): CmsPageField {
		const label = this.humanizeFieldName(name);

		if (value === null || value === undefined) {
			return { name, value: '', type: 'text', label };
		}

		// Array → list or table
		if (Array.isArray(value)) {
			// Array of objects → table
			if (value.length > 0 && typeof value[0] === 'object') {
				return { name, value, type: 'table', label };
			}
			return { name, value, type: 'list', label };
		}

		// Object with href/url → link
		if (typeof value === 'object') {
			if (value.href || value.url || value.ID) {
				return { name, value, type: 'link', label };
			}
			// Object with multiple keys → table (single row)
			return { name, value: [value], type: 'table', label };
		}

		// String inspection
		if (typeof value === 'string') {
			// Date patterns
			if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || /^\d{4}-\d{2}-\d{2}/.test(value)) {
				return { name, value, type: 'date', label };
			}
			// HTML content
			if (/<[a-z][\s\S]*>/i.test(value)) {
				return { name, value, type: 'rich-text', label };
			}
		}

		return { name, value: String(value), type: 'text', label };
	}

	/**
	 * Convert camelCase/PascalCase field names to human-readable labels
	 */
	private humanizeFieldName(name: string): string {
		return name
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
			.replace(/_/g, ' ')
			.replace(/\b\w/g, c => c.toUpperCase())
			.trim();
	}
}
