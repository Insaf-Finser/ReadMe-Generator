export interface Badge {
  id: string
  label: string
  url: string
}

export interface Feature {
  id: string
  text: string
}

export interface TechItem {
  id: string
  name: string
}

export interface SocialLink {
  id: string
  platform: string
  url: string
}

export interface ReadmeData {
  title: string
  tagline: string
  badges: Badge[]
  aim: string
  description: string
  problemStatement: string
  targetAudience: string
  features: Feature[]
  featuresDetail: string
  demoUrl: string
  screenshotUrl: string
  techStack: TechItem[]
  architecture: string
  prerequisites: string
  installation: string
  usage: string
  testing: string
  deployment: string
  envVars: string
  projectStructure: string
  additionalSections: { id: string; title: string; content: string }[]
  contributing: string
  license: string
  authorName: string
  authorEmail: string
  socialLinks: SocialLink[]
  showTableOfContents: boolean
}

export const defaultReadmeData = (): ReadmeData => ({
  title: 'My Awesome Project',
  tagline: 'A short, catchy description of what your project does',
  badges: [
    { id: '1', label: 'License MIT', url: 'https://img.shields.io/badge/license-MIT-blue.svg' },
    { id: '2', label: 'PRs Welcome', url: 'https://img.shields.io/badge/PRs-welcome-brightgreen.svg' },
  ],
  aim: 'State the primary goal and purpose of your project in one or two sentences.',
  description:
    'A longer description of your project. Explain the problem it solves, who it\'s for, and what makes it unique.',
  problemStatement: 'Describe the problem or gap this project addresses.',
  targetAudience: 'Who is this project built for?',
  architecture: '',
  features: [
    { id: '1', text: 'Fast and lightweight' },
    { id: '2', text: 'Easy to configure' },
    { id: '3', text: 'Well documented' },
  ],
  featuresDetail: '',
  demoUrl: '',
  screenshotUrl: '',
  techStack: [
    { id: '1', name: 'React' },
    { id: '2', name: 'TypeScript' },
    { id: '3', name: 'Vite' },
  ],
  prerequisites: 'Node.js 18+ and npm',
  installation: 'git clone https://github.com/username/repo.git\ncd repo\nnpm install',
  usage: 'npm run dev',
  testing: '',
  deployment: '',
  envVars: 'VITE_API_URL=your_api_url',
  projectStructure: '',
  additionalSections: [],
  contributing: 'Contributions are welcome! Please open an issue or submit a pull request.',
  license: 'MIT',
  authorName: 'Your Name',
  authorEmail: '',
  socialLinks: [
    { id: '1', platform: 'GitHub', url: 'https://github.com/username' },
  ],
  showTableOfContents: true,
})
