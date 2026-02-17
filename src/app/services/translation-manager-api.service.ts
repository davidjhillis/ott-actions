import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { CMSCommunicationsService } from './cms-communications.service';
import { CmsApiService } from './cms-api.service';
import { TMProject, TmCreateProjectResult, TranslationSubmission, FolderChildItem } from '../models/translation.model';

/**
 * Bridge service for the Translation Manager (TM) app API.
 *
 * TM is a separate Angular 10 + ASP.NET MVC app installed in the CMS at
 * #/apps/translation_manager. This service calls its backend endpoints
 * (relative to {cmsBaseUrl}/TranslationManager/) and provides URL helpers
 * for navigating the parent CMS frame to the TM frontend.
 *
 * In dev mode (outside the CMS iframe), all calls are simulated.
 */
@Injectable({
	providedIn: 'root'
})
export class TranslationManagerApiService {
	/** Base URL for TM backend API endpoints */
	private get tmBaseUrl(): string {
		return 'https://igx-demos.ingeniux.com/dhillis/TranslationManager';
	}

	/** CMS hash route for the TM frontend app */
	private readonly tmAppHash = '#/apps/translation_manager';

	constructor(
		private http: HttpClient,
		private cms: CMSCommunicationsService,
		private cmsApi: CmsApiService
	) {}

	/**
	 * Fetch all TM projects, mapping the TM Project model → our TMProject type.
	 */
	getProjects(): Observable<TMProject[]> {
		if (this.cms.isDevMode) {
			return this.simulateGetProjects();
		}

		return this.http.get<any[]>(`${this.tmBaseUrl}/GetProjects`).pipe(
			map(projects => projects.map(p => this.mapProject(p))),
			catchError(() => this.simulateGetProjects())
		);
	}

	/**
	 * Create a TM project from a translation submission.
	 *
	 * Matches the legacy Dojo UI format exactly:
	 *   - application/x-www-form-urlencoded POST
	 *   - pageList: JSON string in form body with {pageName, id, locale, schema, masterPage}
	 *   - targetLanguages: display name format "Language - [locale]"
	 *   - dueDate: "M/dd/yyyy HH:mm:ss" format
	 */
	createProject(submission: TranslationSubmission, files: FolderChildItem[]): Observable<TmCreateProjectResult> {
		if (this.cms.isDevMode) {
			return this.simulateCreateProject(submission);
		}

		// Build TranslationPage[] matching the 5 fields the legacy UI sends
		const pageList = files.map(f => ({
			pageName: encodeURIComponent(f.name),
			id: f.id,
			locale: submission.locale,
			schema: f.schema || f.type || '',
			masterPage: f.id
		}));

		// Format dueDate as M/dd/yyyy HH:mm:ss (what the legacy _parseDate produces)
		const dueDateStr = this.formatDueDate(submission.dueDate);

		// Display name for targetLanguages: "Language - [locale]"
		const targetLangDisplay = `${this.localeToLanguage(submission.locale)} - [${submission.locale}]`;

		// Build URL-encoded form body (application/x-www-form-urlencoded)
		// matching exactly what Dojo xhr.post({ content: {...} }) sends
		let body = new HttpParams()
			.set('name', submission.projectName)
			.set('pageList', JSON.stringify(pageList))
			.set('targetLanguages', targetLangDisplay)
			.set('locales', submission.locale)
			.set('translateTaxonomy', 'false')
			.set('createClones', 'false')
			.set('dueDate', dueDateStr)
			.set('forceCheckin', 'false');

		console.log('[IGX-OTT] TM CreateProject:', {
			url: `${this.tmBaseUrl}/CreateProject`,
			name: submission.projectName,
			locale: submission.locale,
			targetLanguage: targetLangDisplay,
			dueDate: dueDateStr,
			pageCount: files.length,
			pageList
		});

		return this.http.post<any>(
			`${this.tmBaseUrl}/CreateProject`,
			body.toString(),
			{ headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
		).pipe(
			tap(res => console.log('[IGX-OTT] TM CreateProject response:', res)),
			map(res => ({
				success: res.success !== false,
				projectId: res.projectId || '',
				reason: res.reason,
				tmAppUrl: this.getProjectUrl(res.projectId)
			})),
			catchError(err => {
				console.error('[IGX-OTT] TM CreateProject failed:', err);
				return this.simulateCreateProject(submission);
			})
		);
	}

	/**
	 * Build the CMS URL for viewing a specific project in the TM app.
	 * TM uses hash-based routing: #/Projects/ViewProject;projectId=xxx
	 */
	getProjectUrl(projectId: string): string {
		return `${this.tmAppHash}#/Projects/ViewProject;projectId=${projectId}`;
	}

	/**
	 * Navigate the parent CMS frame to the TM app.
	 * In dev mode, opens a new tab instead.
	 */
	navigateToTm(projectId?: string): void {
		const hash = projectId
			? `${this.tmAppHash}#/Projects/ViewProject;projectId=${projectId}`
			: `${this.tmAppHash}#/Projects/OpenProjects`;

		if (this.cms.isDevMode) {
			window.open(hash, '_blank');
		} else {
			try {
				window.top!.location.hash = hash;
			} catch {
				window.open(hash, '_blank');
			}
		}
	}

	// -- Private helpers --

	/** Map TM backend Project model → our TMProject interface */
	private mapProject(p: any): TMProject {
		return {
			id: p.ProjectId || p.projectId || p.Id || '',
			name: p.Name || p.name || '',
			locale: p.Locale || p.locale || (p.Locales?.[0]) || '',
			language: p.Language || p.language || (p.TargetLanguages?.[0]) || '',
			vendor: p.Vendor || p.vendor || '',
			itemCount: parseInt(p.ItemCount || p.itemCount || p.PageCount || '0', 10),
			dueDate: p.DueDate || p.dueDate,
			status: p.Status || p.status || 'Open',
			tmAppUrl: this.getProjectUrl(p.ProjectId || p.projectId || p.Id || '')
		};
	}

	/** Map locale code → display language name */
	private localeToLanguage(locale: string): string {
		const map: Record<string, string> = {
			'pt-BR': 'Brazilian Portuguese',
			'es-CL': 'Chilean Spanish',
			'ja-JP': 'Japanese',
			'de-DE': 'German',
			'fr-FR': 'French',
			'zh-CN': 'Chinese (Simplified)',
			'ko-KR': 'Korean'
		};
		return map[locale] || locale;
	}

	/** Format date as M/dd/yyyy HH:mm:ss (matching legacy TM _parseDate format) */
	private formatDueDate(dateStr?: string): string {
		const d = dateStr ? new Date(dateStr) : new Date();
		// Default to 30 days from now if no date provided
		if (!dateStr) d.setDate(d.getDate() + 30);
		const month = d.getMonth() + 1;
		const day = String(d.getDate()).padStart(2, '0');
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		const seconds = String(d.getSeconds()).padStart(2, '0');
		return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
	}

	// -- Simulated responses for dev mode / fallback --

	private simulateGetProjects(): Observable<TMProject[]> {
		return of<TMProject[]>([]).pipe(delay(300));
	}

	private simulateCreateProject(submission: TranslationSubmission): Observable<TmCreateProjectResult> {
		const projectId = `tm-${Date.now()}`;
		return of<TmCreateProjectResult>({
			success: true,
			projectId,
			tmAppUrl: this.getProjectUrl(projectId)
		}).pipe(delay(1200));
	}
}
