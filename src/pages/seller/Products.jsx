import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  getSellerProducts, getCategories,
  createProduct, updateProduct, deleteProduct, uploadProductImage,
} from '../../lib/api'
import { formatPrice, CITIES } from '../../lib/utils'
import { Spinner, Modal, ConfirmModal, EmptyState } from '../../components/shared'
import { IconTag } from '../../components/shared/Icons'

const EMPTY_FORM = {
  title: '', description: '', price: '', category_id: '',
  city: 'Addis Ababa', images: ['[~]'],
}

export default function SellerProducts() {
  const { profile } = useAuth()
  const { toast }   = useToast()

  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [imgFiles,    setImgFiles]    = useState([])

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const [prods, cats] = await Promise.all([
        getSellerProducts(profile.id),
        getCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
      if (cats.length && !form.category_id) {
        setForm(f => ({ ...f, category_id: cats[0].id }))
      }
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditProduct(null)
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || '' })
    setImgFiles([])
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditProduct(p)
    setForm({
      title: p.title,
      description: p.description || '',
      price: p.price,
      category_id: p.category_id,
      city: p.city,
      images: p.images || ['[~]'],
    })
    setImgFiles([])
    setModalOpen(true)
  }

  async function handleSave() {
    const { title, description, price, category_id, city } = form
    if (!title.trim())         { toast('Title is required', 'error'); return }
    if (!price || +price <= 0) { toast('Valid price is required', 'error'); return }
    if (!category_id)          { toast('Category is required', 'error'); return }

    setSaving(true)
    try {
      const org = profile.organizations

      // Use emoji icon by default â€" never save blob: URLs
      const safeImages = form.images.filter(i => !i.startsWith('blob:'))
      const finalImages = safeImages.length ? safeImages : ['[~]']

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: +price,
        category_id,
        city,
        seller_id: profile.id,
        org_id: org?.id || null,
        images: finalImages,
      }

      let saved
      if (editProduct) {
        saved = await updateProduct(editProduct.id, payload)
      } else {
        saved = await createProduct(payload)
      }

      // Try to upload real image files if bucket exists
      if (imgFiles.length && saved?.id) {
        const urls = (await Promise.all(imgFiles.map(f => uploadProductImage(f, saved.id)))).filter(Boolean)
        if (urls.length) {
          await updateProduct(saved.id, { images: urls, status: 'pending' })
        }
      }

      toast(editProduct ? 'Product updated!' : 'Product submitted for review!', 'success')
      setModalOpen(false)
      load()
    } catch (err) {
      toast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(deleteId)
      toast('Product deleted', 'success')
      setDeleteId(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>My Products</h1>
          <p>{products.length} products</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {!products.length ? (
        <EmptyState
          icon={<IconTag width={48} height={48} />}
          title="No products yet"
          message="Add your first product to start selling"
          action={<button className="btn btn-primary" onClick={openAdd}>Add Product</button>}
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th>
                  <th>Status</th><th>Views</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex-align gap-10">
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                          {p.images?.[0]?.startsWith('http')
                            ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (p.images?.[0] || '[~]')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.title}</div>
                          <div className="text-xs text-muted">{p.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{p.categories?.name}</td>
                    <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{formatPrice(p.price)}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'approved' ? 'green' : p.status === 'pending' ? 'amber' : 'red'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{p.views}</td>
                    <td>
                      <div className="flex-align gap-6">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Savingâ€¦' : editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={f('title')} placeholder="Product name" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={f('description')} placeholder="Describe your productâ€¦" rows={3} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Price (Birr) *</label>
            <input className="form-input" type="number" min="1" value={form.price} onChange={f('price')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" value={form.category_id} onChange={f('category_id')}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <select className="form-input" value={form.city} onChange={f('city')}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Product Image</label>
          {form.images[0] && (
            <div style={{ marginBottom: 10, width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', fontSize: 48 }}>
              {(form.images[0].startsWith('blob:') || form.images[0].startsWith('http'))
                ? <img src={form.images[0]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : form.images[0]
              }
            </div>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid var(--gray-300)', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: 'white' }}>
            Choose Photo
            <input
              type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0]
                if (!file) return
                setImgFiles([file])
                setForm(prev => ({ ...prev, images: [URL.createObjectURL(file)] }))
              }}
            />
          </label>
          <p className="form-hint" style={{ marginTop: 6 }}>Upload a photo, or type an emoji icon below.</p>
        </div>
        <div className="form-group">
          <label className="form-label">Or type an emoji icon</label>
          <input
            className="form-input"
            value={imgFiles.length ? '' : (form.images[0] && !form.images[0].startsWith('http') && !form.images[0].startsWith('blob:') ? form.images[0] : '')}
            onChange={e => { setImgFiles([]); setForm(prev => ({ ...prev, images: [e.target.value] })) }}
            placeholder="e.g. [d] or [v]"
            style={{ width: 120 }}
            disabled={imgFiles.length > 0}
          />
        </div>
        {editProduct && (
          <p className="form-hint" style={{ marginTop: 8 }}>
            iï¸ Editing will re-submit this product for admin review.
          </p>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
