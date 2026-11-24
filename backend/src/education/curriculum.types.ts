export interface CurriculumIndicator { id: string; description: string }
export interface CurriculumStandard { id: string; description: string; learning_outcomes: unknown[]; learning_indicators: CurriculumIndicator[]; assessment: Array<{ id: string; description: string }>; source_page: number; [key: string]: unknown }
export interface CurriculumSubstrand { number: number; name: string; content_standards: CurriculumStandard[] }
export interface CurriculumStrand { number: number; name: string; substrands: CurriculumSubstrand[] }
export interface CurriculumSubject { subject: string; strands: CurriculumStrand[] }
export interface CurriculumLevel { level: string; subjects: CurriculumSubject[] }
export interface CurriculumSource { title: string; publisher: string; publication_date: string; levels: string[]; source_pdf?: string }
export interface GeneralScienceCurriculum { title: string; country: string; publisher: string; publication_date: string; sources: CurriculumSource[]; schema: { hierarchy: string[] }; summary: Record<string, unknown>; levels: CurriculumLevel[] }
