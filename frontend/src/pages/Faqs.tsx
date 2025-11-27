import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import * as faqsApi from '../api/faqs';

export default function Faqs() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  // FAQ category currently fixed to 'general' for MVP
  const [category] = useState('general');

  const { user } = useAuthStore();

  useEffect(() => { fetchList(); }, [user?.business?.id]);

  async function fetchList() {
    setLoading(true);
    try {
      const businessId = user?.business?.id;
      const data = await faqsApi.listFaqs({ onlyActive: true, businessId });
      if (data.success) setFaqs(data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    try {
      const payload = { question, answer: { en: answerEn }, category };
      const res = await faqsApi.createFaq(payload);
      if (res.success) {
        // Immediately show the new faq in UI (optimistic)
        if (res.data) setFaqs((prev) => [res.data, ...prev]);
        setQuestion('');
        setAnswerEn('');
        // refresh from server just to normalize
        fetchList();
      } else {
        alert(res.message || 'Failed to add FAQ');
      }
    } catch (err: any) { console.error(err);
      if (err.message === 'unauthorized') {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      alert('Error: ' + (err.message || String(err)));
    }
  }

  async function handleEdit(f: any) {
    setEditingFaq(f);
    setShowEditModal(true);
  }

  async function handleUpdate(e: any) {
    e.preventDefault();
    if (!editingFaq) return;
    try {
      const payload: any = { question: editingFaq.question, answer: editingFaq.answer };
      const res = await faqsApi.updateFaq(editingFaq._id, payload);
      if (res.success) {
        setFaqs(prev => prev.map(p => p._id === editingFaq._id ? res.data : p));
        setShowEditModal(false);
        setEditingFaq(null);
      } else {
        alert(res.message || 'Failed to update FAQ');
      }
    } catch (err: any) {
      console.error('Failed to update FAQ', err);
      alert('Failed to update FAQ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const res = await faqsApi.deleteFaq(id);
      if (res.success) {
        setFaqs(prev => prev.filter(p => p._id !== id));
      } else {
        alert(res.message || 'Failed to delete FAQ');
      }
    } catch (err: any) {
      console.error('Failed to delete FAQ', err);
      alert('Failed to delete FAQ');
    }
  }

  return (
    <Layout>
      <div className="py-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">FAQs</h1>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-3">Add FAQ</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input className="w-full px-3 py-2 border rounded" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Question (English)" required />
            <textarea className="w-full px-3 py-2 border rounded" value={answerEn} onChange={e=>setAnswerEn(e.target.value)} placeholder="Answer (English)" rows={3} required />
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" type="submit">Add FAQ</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="font-semibold mb-3">Active FAQs</h2>
          {loading ? <div>Loading...</div> : (
            <ul className="space-y-3">
              {faqs.map(f => (
                <li key={f._id} className="border p-3 rounded">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.question}</div>
                      <div className="text-xs text-gray-600 mt-1">{f.answer?.en}</div>
                    </div>
                        <div className="flex-shrink-0 ml-3 flex items-start gap-2">
                          <button onClick={() => handleEdit(f)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Edit</button>
                          <button onClick={() => handleDelete(f._id)} className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">Delete</button>
                          <button onClick={async () => {
                              try {
                                const res = await faqsApi.updateFaq(f._id, { isActive: !f.isActive });
                                if (res.success) {
                                  // if toggled off (unpublished) remove from active list, otherwise update
                                  if (!res.data.isActive) {
                                    setFaqs(prev => prev.filter(p => p._id !== f._id));
                                  } else {
                                    setFaqs(prev => prev.map(p => p._id === f._id ? res.data : p));
                                  }
                                } else {
                                  alert(res.message || 'Failed to toggle');
                                }
                              } catch (err: any) {
                                console.error('Toggle fail', err);
                                alert('Failed to toggle FAQ');
                              }
                            }} className={`px-3 py-1 rounded text-sm ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {f.isActive ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Edit Modal */}
          {showEditModal && editingFaq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white p-6 rounded-lg w-full max-w-xl mx-4">
                <h3 className="text-lg font-semibold mb-3">Edit FAQ</h3>
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input value={editingFaq.question} onChange={(e) => setEditingFaq((s:any) => ({ ...s, question: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                  <textarea rows={4} value={editingFaq.answer?.en || ''} onChange={(e) => setEditingFaq((s:any) => ({ ...s, answer: { ...s.answer, en: e.target.value } }))} className="w-full px-3 py-2 border rounded" />
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => { setShowEditModal(false); setEditingFaq(null); }} className="px-3 py-1 border rounded">Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
