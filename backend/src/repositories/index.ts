// Repository 层导出
// 封装数据库操作，提供统一的数据访问接口

export { BaseRepository } from './BaseRepository.js'
export type { IBaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository.js'

export { LeadRepository, leadRepository } from './LeadRepository.js'
export type { CreateLeadInput, UpdateLeadInput, LeadFilters } from './LeadRepository.js'

export { ScoringRuleRepository, scoringRuleRepository } from './ScoringRuleRepository.js'
export type { CreateScoringRuleInput, UpdateScoringRuleInput } from './ScoringRuleRepository.js'
