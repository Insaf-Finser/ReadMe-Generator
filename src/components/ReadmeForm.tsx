import type { ReadmeData } from '../types'
import { FormField } from './FormField'
import { ListEditor } from './ListEditor'

interface ReadmeFormProps {
  data: ReadmeData
  onChange: (data: ReadmeData) => void
}

let idCounter = 100

function nextId() {
  return String(++idCounter)
}

export function ReadmeForm({ data, onChange }: ReadmeFormProps) {
  const set = <K extends keyof ReadmeData>(key: K, value: ReadmeData[K]) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="readme-form">
      <section className="form-section">
        <h2 className="section-title">Header</h2>
        <FormField label="Project Title">
          <input
            className="input"
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="My Awesome Project"
          />
        </FormField>
        <FormField label="Tagline" hint="Shown as a blockquote under the title">
          <input
            className="input"
            value={data.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            placeholder="A short description"
          />
        </FormField>
        <FormField label="Badges" hint="Shield.io badge image URLs">
          <ListEditor
            items={data.badges}
            onChange={(badges) => set('badges', badges)}
            createItem={() => ({ id: nextId(), label: 'Badge', url: '' })}
            addLabel="Add badge"
            renderItem={(item, _i, update) => (
              <>
                <input
                  className="input input-sm"
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => update({ label: e.target.value })}
                />
                <input
                  className="input input-sm"
                  placeholder="https://img.shields.io/..."
                  value={item.url}
                  onChange={(e) => update({ url: e.target.value })}
                />
              </>
            )}
          />
        </FormField>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={data.showTableOfContents}
            onChange={(e) => set('showTableOfContents', e.target.checked)}
          />
          Include table of contents
        </label>
      </section>

      <section className="form-section">
        <h2 className="section-title">Overview</h2>
        <FormField label="Aim" hint="The primary goal and purpose of the project">
          <textarea
            className="textarea"
            rows={3}
            value={data.aim}
            onChange={(e) => set('aim', e.target.value)}
            placeholder="What is the main aim of this project?"
          />
        </FormField>
        <FormField label="Description" hint="Detailed overview — multiple paragraphs supported">
          <textarea
            className="textarea"
            rows={6}
            value={data.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe your project in detail..."
          />
        </FormField>
        <FormField label="Problem Statement">
          <textarea
            className="textarea"
            rows={3}
            value={data.problemStatement}
            onChange={(e) => set('problemStatement', e.target.value)}
            placeholder="What problem does this solve?"
          />
        </FormField>
        <FormField label="Target Audience">
          <textarea
            className="textarea"
            rows={3}
            value={data.targetAudience}
            onChange={(e) => set('targetAudience', e.target.value)}
            placeholder="Who is this project for?"
          />
        </FormField>
        <FormField label="Features">
          <ListEditor
            items={data.features}
            onChange={(features) => set('features', features)}
            createItem={() => ({ id: nextId(), text: '' })}
            addLabel="Add feature"
            renderItem={(item, _i, update) => (
              <input
                className="input"
                placeholder="Feature description"
                value={item.text}
                onChange={(e) => update({ text: e.target.value })}
              />
            )}
          />
        </FormField>
        <FormField label="Demo URL">
          <input
            className="input"
            value={data.demoUrl}
            onChange={(e) => set('demoUrl', e.target.value)}
            placeholder="https://your-demo.com"
          />
        </FormField>
        <FormField label="Screenshot URL">
          <input
            className="input"
            value={data.screenshotUrl}
            onChange={(e) => set('screenshotUrl', e.target.value)}
            placeholder="https://..."
          />
        </FormField>
        <FormField label="Tech Stack">
          <ListEditor
            items={data.techStack}
            onChange={(techStack) => set('techStack', techStack)}
            createItem={() => ({ id: nextId(), name: '' })}
            addLabel="Add technology"
            renderItem={(item, _i, update) => (
              <input
                className="input"
                placeholder="React, Node.js, etc."
                value={item.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            )}
          />
        </FormField>
        <FormField label="Architecture">
          <textarea
            className="textarea"
            rows={5}
            value={data.architecture}
            onChange={(e) => set('architecture', e.target.value)}
            placeholder="Describe the project structure and design..."
          />
        </FormField>
      </section>

      <section className="form-section">
        <h2 className="section-title">Getting Started</h2>
        <FormField label="Prerequisites">
          <textarea
            className="textarea"
            rows={2}
            value={data.prerequisites}
            onChange={(e) => set('prerequisites', e.target.value)}
          />
        </FormField>
        <FormField label="Installation" hint="Shown as a bash code block">
          <textarea
            className="textarea textarea-mono"
            rows={4}
            value={data.installation}
            onChange={(e) => set('installation', e.target.value)}
          />
        </FormField>
        <FormField label="Usage" hint="Supports markdown — tables and code blocks included">
          <textarea
            className="textarea"
            rows={6}
            value={data.usage}
            onChange={(e) => set('usage', e.target.value)}
          />
        </FormField>
        <FormField label="Testing">
          <textarea
            className="textarea"
            rows={4}
            value={data.testing}
            onChange={(e) => set('testing', e.target.value)}
          />
        </FormField>
        <FormField label="Deployment">
          <textarea
            className="textarea"
            rows={4}
            value={data.deployment}
            onChange={(e) => set('deployment', e.target.value)}
          />
        </FormField>
        <FormField label="Environment Variables">
          <textarea
            className="textarea textarea-mono"
            rows={3}
            value={data.envVars}
            onChange={(e) => set('envVars', e.target.value)}
          />
        </FormField>
        <FormField label="Project Structure" hint="Optional tree layout">
          <textarea
            className="textarea textarea-mono"
            rows={4}
            value={data.projectStructure}
            onChange={(e) => set('projectStructure', e.target.value)}
            placeholder={'src/\n  components/\n  utils/\nREADME.md'}
          />
        </FormField>
      </section>

      <section className="form-section">
        <h2 className="section-title">Footer</h2>
        <FormField label="Contributing">
          <textarea
            className="textarea"
            rows={3}
            value={data.contributing}
            onChange={(e) => set('contributing', e.target.value)}
          />
        </FormField>
        <FormField label="License">
          <input
            className="input"
            value={data.license}
            onChange={(e) => set('license', e.target.value)}
            placeholder="MIT"
          />
        </FormField>
        <FormField label="Author Name">
          <input
            className="input"
            value={data.authorName}
            onChange={(e) => set('authorName', e.target.value)}
          />
        </FormField>
        <FormField label="Author Email">
          <input
            className="input"
            type="email"
            value={data.authorEmail}
            onChange={(e) => set('authorEmail', e.target.value)}
          />
        </FormField>
        <FormField label="Social Links">
          <ListEditor
            items={data.socialLinks}
            onChange={(socialLinks) => set('socialLinks', socialLinks)}
            createItem={() => ({ id: nextId(), platform: '', url: '' })}
            addLabel="Add link"
            renderItem={(item, _i, update) => (
              <>
                <input
                  className="input input-sm"
                  placeholder="Platform"
                  value={item.platform}
                  onChange={(e) => update({ platform: e.target.value })}
                />
                <input
                  className="input input-sm"
                  placeholder="URL"
                  value={item.url}
                  onChange={(e) => update({ url: e.target.value })}
                />
              </>
            )}
          />
        </FormField>
      </section>
    </div>
  )
}
