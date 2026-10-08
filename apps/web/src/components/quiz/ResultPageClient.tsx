'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { useSearchParams } from 'next/navigation'
import { decodeScores } from '@/lib/quiz/decode-scores'
import { useLocalizedPersonality } from '@/lib/quiz/personality-i18n'
import { ResultActions } from './ResultActions'
import { ResultCompat } from './ResultCompat'
import { ResultHero } from './ResultHero'
import { ResultProfile } from './ResultProfile'
import { ResultRadar } from './ResultRadar'
import { ResultStrengths } from './ResultStrengths'
import { ResultTraining } from './ResultTraining'

export function ResultPageClient({
  personality: rawPersonality,
}: {
  personality: PersonalityType
}) {
  const personality = useLocalizedPersonality(rawPersonality)
  const searchParams = useSearchParams()
  const scores = decodeScores(searchParams.get('s'))
  const hasPersonalScores = scores !== null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <ResultHero personality={personality} />
      <ResultRadar
        personality={personality}
        bodyPercent={scores?.bodyPercent}
        motivePercent={scores?.motivePercent}
        mindPercent={scores?.mindPercent}
      />
      <ResultProfile personality={personality} scores={scores} />
      <ResultStrengths personality={personality} />
      <ResultTraining personality={personality} />
      <ResultCompat personality={personality} />
      <ResultActions
        personality={personality}
        scores={scores}
        hasPersonalScores={hasPersonalScores}
      />
    </div>
  )
}
