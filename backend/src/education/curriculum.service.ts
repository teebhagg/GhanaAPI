import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import curriculum from './data/general-science-curriculum.json';
import { CurriculumLevel, CurriculumStandard, CurriculumStrand, GeneralScienceCurriculum } from './curriculum.types';

@Injectable()
export class CurriculumService {
  private readonly data = curriculum as GeneralScienceCurriculum;
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}
  getLevels() { return this.wrap([...new Set(this.data.levels.map((level) => level.level))]); }
  getSummary() { return this.wrap({ ...this.data.summary, title: this.data.title, publisher: this.data.publisher, publication_date: this.data.publication_date, sources: this.data.sources }); }
  async getCurriculum(query: { year?: string; subject?: string; strand?: string; substrand?: string; limit?: number; offset?: number }) {
    const entries = this.getCurriculumEntries(query); const limit = Math.min(Math.max(query.limit ?? entries.length, 1), 100); const offset = Math.max(query.offset ?? 0, 0); const data = entries.slice(offset, offset + limit);
    return { success: true, data, total: entries.length, pagination: { limit, offset, hasMore: offset + data.length < entries.length }, timestamp: new Date().toISOString() };
  }
  getStrands() {
    const strands = new Map<string, CurriculumStrand>();
    for (const level of this.filteredLevels({})) for (const subject of level.subjects) for (const strand of subject.strands) { const key = `${strand.number}:${strand.name}`; const existing = strands.get(key) ?? { number: strand.number, name: strand.name, substrands: [] }; for (const substrand of strand.substrands) if (!existing.substrands.some((item) => item.number === substrand.number && item.name === substrand.name)) existing.substrands.push({ number: substrand.number, name: substrand.name, content_standards: [] }); strands.set(key, existing); }
    return this.wrap([...strands.values()]);
  }
  getContentStandards(query: { year?: string; subject?: string; strand?: string; substrand?: string }) { return this.wrap(this.getCurriculumEntries(query).flatMap((entry) => entry.substrand.content_standards.map((standard) => ({ level: entry.level, subject: entry.subject, strand: entry.strand, substrand: entry.substrand, ...standard })))); }
  async getStandard(id: string) { const cached = await this.cache.get<CurriculumStandard>(`curriculum_standard_${id}`); if (cached) return cached; const standard = this.getContentStandards({}).data.find((item) => item.id === id); if (!standard) throw new NotFoundException(`Content standard ${id} not found`); await this.cache.set(`curriculum_standard_${id}`, standard, 3600000); return standard; }
  private filteredLevels(query: { year?: string; subject?: string; strand?: string; substrand?: string }): CurriculumLevel[] { const levels = this.getLevels().data as string[]; if (query.year && !levels.includes(query.year)) throw new BadRequestException(`Invalid year: ${query.year}`); return this.data.levels.filter((level) => !query.year || level.level === query.year).map((level) => ({ ...level, subjects: level.subjects.filter((subject) => !query.subject || subject.subject.toLowerCase() === query.subject.toLowerCase()).map((subject) => ({ ...subject, strands: subject.strands.filter((strand) => !query.strand || strand.name.toLowerCase() === query.strand.toLowerCase()).map((strand) => ({ ...strand, substrands: strand.substrands.filter((substrand) => !query.substrand || substrand.name.toLowerCase() === query.substrand.toLowerCase()) })) })) })).filter((level) => level.subjects.some((subject) => subject.strands.some((strand) => strand.substrands.length))); }
  private getCurriculumEntries(query: { year?: string; subject?: string; strand?: string; substrand?: string }) { return this.filteredLevels(query).flatMap((level) => level.subjects.flatMap((subject) => subject.strands.flatMap((strand) => strand.substrands.map((substrand) => ({ year: level.level, level: level.level, subject: subject.subject, strand, substrand }))))); }
  private wrap<T>(data: T) { return { success: true, data, timestamp: new Date().toISOString() }; }
}
