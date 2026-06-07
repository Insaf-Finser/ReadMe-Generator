import { Check, Loader2 } from 'lucide-react'

const STEPS = [
  'Fetching repository metadata',
  'Scanning file tree',
  'Reading key configuration files',
  'Detecting tech stack',
  'Running AI analysis',
  'Generating README',
]

interface LoadingStepsProps {
  activeStep: number
  useAI?: boolean
}

export function LoadingSteps({ activeStep, useAI = false }: LoadingStepsProps) {
  const steps = useAI ? STEPS : STEPS.filter((s) => s !== 'Running AI analysis')

  return (
    <div className="loading-steps">
      <h2 className="loading-title">
        {useAI ? 'AI is analyzing the repository...' : 'Analyzing repository...'}
      </h2>
      <ul className="steps-list">
        {steps.map((step, i) => {
          const done = i < activeStep
          const active = i === activeStep
          return (
            <li key={step} className={`step-item ${done ? 'step-done' : ''} ${active ? 'step-active' : ''}`}>
              {done ? <Check size={16} /> : active ? <Loader2 size={16} className="spin" /> : <span className="step-dot" />}
              {step}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
