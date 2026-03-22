import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { getCategories, createCategory, deleteCategory } from '../../lib/api'
import { Spinner, Modal, ConfirmModal, EmptyState } from '../../components/shared'
import { IconFolder } from '../../components/shared/Icons'

export default function AdminCategories() {
  const { toast }  = useToast()
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [deleteId,   setDeleteId]   = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({ name: '', icon: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast('Category name is required', 'error'); return }
    setSaving(true)
    try {
      await createCategory({
        name: form.name.trim(),
        icon: form.icon.trim() || '[~]',
        slug: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
      })
      toast(`Category "${form.name}" added!`, 'success')
      setModalOpen(false)
      setForm({ name: '', icon: '' })
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteCategory(deleteId)
      toast('Category deleted', 'success')
      setDeleteId(null)
      load()
    } catch (err) {
      toast(err.message || 'Cannot delete category with existing products', 'error')
      setDeleteId(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Categories</h1>
          <p>{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', icon: '' }); setModalOpen(true) }}>
          + Add Category
        </button>
      </div>

      {!categories.length ? (
        <EmptyState icon={<IconFolder width={48} height={48} />} title="No categories" message="Add your first category" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {categories.map(cat => (
            <div key={cat.id} className="card card-pad" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{cat.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cat.name}</div>
              <div className="text-xs text-muted" style={{ marginBottom: 14 }}>
                {cat.slug || cat.name.toLowerCase()}
              </div>
              <button
                className="btn btn-danger btn-sm"
                style={{ width: '100%' }}
                onClick={() => setDeleteId(cat.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Category"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Addingâ€¦' : 'Add Category'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Electronics"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Icon (emoji)</label>
          <input
            className="form-input"
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="[d]"
            style={{ width: 100 }}
          />
          <p className="form-hint">Paste any emoji to use as the category icon</p>
        </div>
        {/* Preview */}
        {form.name && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <div style={{ textAlign: 'center', padding: '16px 28px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 40 }}>{form.icon || '[~]'}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{form.name}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will fail if any products are assigned to it."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
