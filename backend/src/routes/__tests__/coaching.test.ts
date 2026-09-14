import { describe, expect, it, vi } from 'vitest'

// We test the analysis logic directly rather than HTTP, since the route
// is a thin orchestration layer over DB queries + pure functions.

import { analyzeWeaknessesStructured } from '../../services/agent/sub-agents/weakness-analysis'

describe('coaching /analysis data assembly', () => {
  describe('analyzeWeaknessesStructured for coaching API', () => {
    it('returns type imbalance with exercise recommendations for sport-heavy user', () => {
      const insights = analyzeWeaknessesStructured({
        level: '進階入門（5.10）',
        typeDistribution: [
          { type: 'sport', count: 18 },
          { type: 'boulder', count: 2 },
        ],
      })

      const typeInsight = insights.find((i) => i.id === 'type_imbalance')
      expect(typeInsight).toBeDefined()
      expect(typeInsight!.description).toContain('運攀')
      expect(typeInsight!.description).toContain('90%')
      expect(typeInsight!.exercises.length).toBeGreaterThan(0)
    })

    it('returns anti-style insight for PGB personality', () => {
      const insights = analyzeWeaknessesStructured(
        { level: '中級（5.11）' },
        'PGB'
      )

      const antiStyle = insights.find((i) => i.id === 'anti_style')
      expect(antiStyle).toBeDefined()
      expect(antiStyle!.description).toContain('人格型態弱點')
      expect(antiStyle!.exercises.length).toBeGreaterThan(0)
    })

    it('returns anti-style insight for TFS personality', () => {
      const insights = analyzeWeaknessesStructured(
        { level: '入門（5.9 以下）' },
        'TFS'
      )

      const antiStyle = insights.find((i) => i.id === 'anti_style')
      expect(antiStyle).toBeDefined()
      expect(antiStyle!.description).toContain('心理受限')
    })

    it('returns empty array for user with no data', () => {
      const insights = analyzeWeaknessesStructured({})
      expect(insights).toEqual([])
    })

    it('returns multiple insights for complex profile', () => {
      const insights = analyzeWeaknessesStructured(
        {
          level: '中級（5.11）',
          typeDistribution: [
            { type: 'sport', count: 9 },
            { type: 'boulder', count: 1 },
          ],
          styleDistribution: { redpoint: 8 },
          recentAscents: Array.from({ length: 5 }, (_, i) => ({
            route: `R${i}`,
            grade: '5.11a',
            type: 'sport',
            style: 'redpoint',
          })),
        },
        'PGB'
      )

      const ids = insights.map((i) => i.id)
      expect(ids).toContain('type_imbalance')
      expect(ids).toContain('missing_onsight')
      expect(ids).toContain('grade_plateau')
      expect(ids).toContain('anti_style')
    })
  })

  describe('level resolution', () => {
    it('beginner exercises do not include hangboard_max_hangs', () => {
      const insights = analyzeWeaknessesStructured(
        {
          level: '入門（5.9 以下）',
          recentAscents: Array.from({ length: 5 }, () => ({
            route: 'easy',
            grade: '5.8',
            type: 'sport',
            style: 'toprope',
          })),
        }
      )

      const plateau = insights.find((i) => i.id === 'grade_plateau')
      if (plateau) {
        expect(plateau.exercises.every((e) => !e.includes('最大懸掛'))).toBe(true)
      }
    })
  })
})
