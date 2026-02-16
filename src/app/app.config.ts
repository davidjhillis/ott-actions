import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MainComponentService } from './services/main-component.service';
import { DynamicComponentService } from './services/dynamic-component.service';
import { LucideAngularModule } from 'lucide-angular';
import {
	Send, Hash, FileOutput, FolderPlus, RefreshCw, Users, Info, History,
	ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
	SlidersHorizontal, X, GripVertical, Pencil, Trash2, Plus, RotateCcw,
	MousePointer, Folder, File, Circle, Languages, Globe, Zap,
	FileText, FileCheck, FilePlus, FileMinus, FileInput, FileSearch,
	FileLock, FileWarning, FolderMinus, FolderOpen, FolderCheck,
	FolderLock, FolderSearch, FolderOutput, FolderInput,
	Mail, MailPlus, MailCheck, MessageSquare, MessageCircle, Bell, Megaphone,
	User, UserPlus, UserCheck, UserX, Contact,
	ArrowRightLeft, GitBranch, GitMerge, Workflow, Timer, Clock, Calendar,
	Minus, Check, CheckCircle, Copy, Clipboard, Download, Upload, Share, Link, Unlink,
	ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
	Image, Video, Book, Bookmark, Tag, Tags,
	Settings, Filter, Search, Eye, EyeOff, Lock, Unlock, Shield, Key,
	AlertCircle, AlertTriangle, HelpCircle, CircleCheck, CircleX, Ban,
	Layout, Grid3x3 as Grid, List, Columns3 as Columns, Rows3 as Rows,
	Home, Printer, BarChart3, GripHorizontal, ExternalLink
} from 'lucide-angular';

/** All icons registered for the application */
const appIcons = {
	Send, Hash, FileOutput, FolderPlus, RefreshCw, Users, Info, History,
	ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
	SlidersHorizontal, X, GripVertical, Pencil, Trash2, Plus, RotateCcw,
	MousePointer, Folder, File, Circle, Languages, Globe, Zap,
	FileText, FileCheck, FilePlus, FileMinus, FileInput, FileSearch,
	FileLock, FileWarning, FolderMinus, FolderOpen, FolderCheck,
	FolderLock, FolderSearch, FolderOutput, FolderInput,
	Mail, MailPlus, MailCheck, MessageSquare, MessageCircle, Bell, Megaphone,
	User, UserPlus, UserCheck, UserX, Contact,
	ArrowRightLeft, GitBranch, GitMerge, Workflow, Timer, Clock, Calendar,
	Minus, Check, CheckCircle, Copy, Clipboard, Download, Upload, Share, Link, Unlink,
	ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
	Image, Video, Book, Bookmark, Tag, Tags,
	Settings, Filter, Search, Eye, EyeOff, Lock, Unlock, Shield, Key,
	AlertCircle, AlertTriangle, HelpCircle, CircleCheck, CircleX, Ban,
	Layout, Grid, List, Columns, Rows,
	Home, Printer, BarChart3, GripHorizontal, ExternalLink
};

/**
 * Application configuration
 * Provides all necessary services and dependencies
 */
export const appConfig: ApplicationConfig = {
	providers: [
		// Angular core providers
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideAnimations(),
		provideHttpClient(),

		// Lucide icons
		LucideAngularModule.pick(appIcons).providers || [],

		// Application service providers
		MainComponentService,
		DynamicComponentService
	]
};
