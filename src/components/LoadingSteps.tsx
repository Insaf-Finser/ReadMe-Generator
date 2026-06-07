import { Loader2 } from 'lucide-react'

const STEPS = [
  'Fetching repo',
  'Scanning files',
  'Reading configs',
  'Detecting stack',
  'Running AI',
  'Writing README',
]

interface LoadingStepsProps {
  activeStep: number
  useAI?: boolean
}

export function LoadingSteps({ activeStep, useAI = false }: LoadingStepsProps) {
  const steps = useAI ? STEPS : STEPS.filter((s) => s !== 'Running AI')
  const progress = ((activeStep + 1) / steps.length) * 100

  return (
    <div className="loading">
      <Loader2 size={28} className="spin loading-icon" />
      <p className="loading-label">{steps[activeStep] ?? 'Done'}…</p>
      <div className="loading-track">
        <div className="loading-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="loading-step-count">
        {activeStep + 1} / {steps.length}
      </p>
    </div>
  )
}
