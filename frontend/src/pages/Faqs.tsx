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
  const [answer, setAnswer] = useState('');
  // 'all' = show everyone, 'published' = only active, 'unpublished' = only inactive
  // default to 'published' as requested
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('published');
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => { fetchList(); }, [user?.business?.id, filter]);

  async function fetchList() {
    setLoading(true);
    try {
      const params: any = {};
      if (filter === 'published') params.onlyActive = true;
      else if (filter === 'unpublished') params.onlyActive = false;

      const data = await faqsApi.listFaqs(params);
      if (data.success) {
        setFaqs(data.data || []);
        // Clear selection when the list changes
        setSelected([]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    try {
      const payload = { question, answer };
      const res = await faqsApi.createFaq(payload);
      if (res.success) {
        // Immediately show the new faq in UI (optimistic)
        if (res.data) setFaqs((prev) => [res.data, ...prev]);
        setQuestion('');
        setAnswer('');
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

  // Export FAQs as CSV
  function handleExport() {
    if (faqs.length === 0) {
      alert('No FAQs to export');
      return;
    }

    // CSV headers
    const headers = ['question', 'answer', 'isActive'];
    const rows = faqs.map(faq => [
      `"${(faq.question || '').replace(/"/g, '""')}"`,
      `"${(faq.answer || '').replace(/"/g, '""')}"`,
      faq.isActive ? 'true' : 'false',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `faqs_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // Import FAQs from CSV
  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportMessage('❌ CSV file is empty or invalid');
        setImporting(false);
        return;
      }

      // Parse CSV (simple implementation, assumes no commas in quoted fields beyond our format)
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      // Skip header row
      const dataRows = lines.slice(1);
      const faqsToImport: any[] = [];

      for (const line of dataRows) {
        const columns = parseCsvLine(line);
        if (columns.length < 2) continue; // Skip invalid rows

        const [question, answer, statusVal = 'true'] = columns;
        
        if (!question.trim() || !answer.trim()) continue;

        faqsToImport.push({
          question: question.trim(),
          answer: answer.trim(),
          isActive: statusVal.trim().toLowerCase() === 'true',
        });
      }

      if (faqsToImport.length === 0) {
        setImportMessage('❌ No valid FAQs found in CSV');
        setImporting(false);
        return;
      }

      // Call bulk import API
      const result = await faqsApi.bulkImportFaqs(faqsToImport);
      
      if (result.success) {
        const msg = `✅ Imported ${result.data.created} FAQs${result.data.skipped > 0 ? `, skipped ${result.data.skipped} duplicates` : ''}${result.data.errors > 0 ? `, ${result.data.errors} errors` : ''}`;
        setImportMessage(msg);
        fetchList(); // Refresh the list
      } else {
        setImportMessage(`❌ Import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportMessage(`❌ Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  }

  return (
    <Layout>
      <div className="py-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">FAQs</h1>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Add FAQ</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                title="Export FAQs as CSV"
              >
                <span>📥</span>
                Export CSV
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <span>📤</span>
                Import CSV
              </button>
            </div>
          </div>

          {importMessage && (
            <div className={`mb-3 p-2 rounded text-sm ${importMessage.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {importMessage}
            </div>
          )}

          {importing && (
            <div className="mb-3 p-2 rounded text-sm bg-blue-100 text-blue-800">
              Importing FAQs...
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-3">
            <input className="w-full px-3 py-2 border rounded" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Question" required />
            <textarea className="w-full px-3 py-2 border rounded" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Answer" rows={3} required />
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" type="submit">Add FAQ</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.length > 0 && selected.length === faqs.length}
                onChange={(e) => {
                  if (e.target.checked) setSelected(faqs.map(f => f._id));
                  else setSelected([]);
                }}
                className="w-4 h-4"
              />
              <h2 className="font-semibold">FAQs</h2>
              {selected.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">{selected.length} selected</span>
              )}
            </div>

            {/* dropdown filter in corner */}
            <div>
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-1 border rounded bg-white text-sm">
                <option value="published">Published</option>
                <option value="all">All</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
          </div>

          {/* Bulk actions when multiple selected */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={async () => {
                  if (!confirm(`Publish ${selected.length} selected?`)) return;
                  try {
                    await Promise.all(selected.map(id => faqsApi.updateFaq(id, { isActive: true })));
                    fetchList();
                  } catch (err) { console.error(err); alert('Bulk publish failed'); }
                }} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Publish Selected</button>

              <button onClick={async () => {
                  if (!confirm(`Unpublish ${selected.length} selected?`)) return;
                  try {
                    await Promise.all(selected.map(id => faqsApi.updateFaq(id, { isActive: false })));
                    fetchList();
                  } catch (err) { console.error(err); alert('Bulk unpublish failed'); }
                }} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Unpublish Selected</button>

              <button onClick={async () => {
                  if (!confirm(`Delete ${selected.length} selected? This is permanent.`)) return;
                  try {
                    await Promise.all(selected.map(id => faqsApi.deleteFaq(id)));
                    fetchList();
                  } catch (err) { console.error(err); alert('Bulk delete failed'); }
                }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Delete Selected</button>
            </div>
          )}
          {loading ? <div>Loading...</div> : (
            <ul className="space-y-3">
              {faqs.map(f => (
                <li key={f._id} className="border p-3 rounded">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selected.includes(f._id)}
                        onChange={(e) => {
                          setSelected(prev => e.target.checked ? [...prev, f._id] : prev.filter(id => id !== f._id));
                        }}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium">{f.question}</div>
                        <div className="text-xs text-gray-600 mt-1">{f.answer}</div>
                      </div>
                    </div>
                        <div className="flex-shrink-0 ml-3 flex items-start gap-2">
                          <button onClick={() => handleEdit(f)} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Edit</button>
                          <button onClick={() => handleDelete(f._id)} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Delete</button>
                          <button onClick={async () => {
                              try {
                                const res = await faqsApi.updateFaq(f._id, { isActive: !f.isActive });
                                if (res.success) {
                                  // reload list for current filter (keeps UI consistent)
                                  fetchList();
                                } else {
                                  alert(res.message || 'Failed to toggle');
                                }
                              } catch (err: any) {
                                console.error('Toggle fail', err);
                                alert('Failed to toggle FAQ');
                              }
                            }} className={`px-2 py-1 rounded text-xs ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
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
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <input value={editingFaq.question} onChange={(e) => setEditingFaq((s:any) => ({ ...s, question: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                  <label className="block text-sm font-medium mb-1 mt-3">Answer</label>
                  <textarea rows={4} value={editingFaq.answer || ''} onChange={(e) => setEditingFaq((s:any) => ({ ...s, answer: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => { setShowEditModal(false); setEditingFaq(null); }} className="px-3 py-1 border rounded">Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FAQ Import Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                <h2 className="text-2xl font-bold mb-6">Bulk Upload FAQs (CSV)</h2>
                <div className="text-sm text-gray-700 mb-4 space-y-2">
                  <p>
                    <strong>Required CSV Headers:</strong> question, answer
                  </p>
                  <p className="text-sm italic text-gray-500">
                    Example: "What are your hours?","We are open 9am-9pm"
                  </p>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleImport} 
                  disabled={importing}
                  className="mb-4 w-full"
                />
                {importMessage && (
                  <div className={`mb-3 p-2 rounded text-sm ${importMessage.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {importMessage}
                  </div>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => { setShowImportModal(false); setImportMessage(''); }} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
