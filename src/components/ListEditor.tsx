import { Plus, Trash2 } from 'lucide-react'

interface ListEditorProps<T extends { id: string }> {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode
  createItem: () => T
  addLabel?: string
}

export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  renderItem,
  createItem,
  addLabel = 'Add item',
}: ListEditorProps<T>) {
  const updateItem = (index: number, patch: Partial<T>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChange([...items, createItem()])
  }

  return (
    <div className="list-editor">
      {items.map((item, index) => (
        <div key={item.id} className="list-editor-row">
          <div className="list-editor-fields">{renderItem(item, index, (patch) => updateItem(index, patch))}</div>
          <button type="button" className="btn-icon btn-danger" onClick={() => removeItem(index)} aria-label="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  )
}
