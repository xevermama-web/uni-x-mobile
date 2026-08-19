import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Plus, X, Trash2, Edit2, Image as ImageIcon, Type, Calendar as CalendarIcon, Tag, Download, FileText } from 'lucide-react';
import { useNotices, Notice } from '../../hooks/useNotices';
import { useDepartments } from '../../hooks/useDepartments';

export default function ManageNotices() {
  const { user, role: contextRole } = useOutletContext<any>();
  const role = (
    contextRole ||
    user?.role ||
    user?.user_metadata?.role ||
    (user?.email === 'admin@unixx.com' ? 'admin' :
    localStorage.getItem('unixx_student_session') ? 'student' :
    localStorage.getItem('unixx_faculty_session') ? 'faculty' :
    localStorage.getItem('unixx_moderator_session') ? 'moderator' :
    localStorage.getItem('unixx_admin_session') === 'true' ? 'admin' : 'student')
  ).toLowerCase();

  const isStudent = role === 'student';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [selectedNoticeForView, setSelectedNoticeForView] = useState<Notice | null>(null);
  
  const { notices, loading, addNotice, updateNotice, removeNotice } = useNotices();
  const { departments } = useDepartments();

  const [newNotice, setNewNotice] = useState({ 
    title: '', 
    content: '', 
    type: 'text' as 'text' | 'image', 
    department: 'ALL',
    tag: 'INFO',
    tagColor: 'bg-blue-100 text-blue-800'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const noticeToSave: any = { ...newNotice };
    
    if (noticeToSave.type === 'image' && fileToUpload) {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        try {
          const { supabase } = await import('../../lib/supabase');
          const fileExt = fileToUpload.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Notice')
            .upload(filePath, fileToUpload);
            
          if (uploadError) {
            console.warn("Storage upload failed, fallback to local URL:", uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage.from('Notice').getPublicUrl(filePath);
            noticeToSave.content = publicUrl;
          }
        } catch (err) {
          console.warn("Exception during storage upload:", err);
        }
      }
    }
    
    // Auto-delete JPG files after 7 days
    if (noticeToSave.type === 'image') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      noticeToSave.expiresAt = expires.toISOString();
    }

    const { error: err } = await addNotice(noticeToSave);
    
    setIsSubmitting(false);
    if (!err) {
      setNewNotice({ title: '', content: '', type: 'text', department: 'ALL', tag: 'INFO', tagColor: 'bg-blue-100 text-blue-800' });
      setFileToUpload(null);
      setIsAddModalOpen(false);
    } else {
      setError(err.message || 'Failed to add notice');
    }
  };

  const openEditModal = (notice: Notice) => {
    setNewNotice({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      department: notice.department,
      tag: notice.tag,
      tagColor: notice.tagColor,
    } as any);
    setEditingNoticeId(notice.id);
    setIsEditModalOpen(true);
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoticeId) return;
    setIsSubmitting(true);
    setError(null);
    
    const noticeToSave: any = { ...newNotice };
    
    if (noticeToSave.type === 'image' && !noticeToSave.expiresAt) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      noticeToSave.expiresAt = expires.toISOString();
    } else if (noticeToSave.type === 'text') {
      noticeToSave.expiresAt = null;
    }

    const { error: err } = await updateNotice(editingNoticeId, noticeToSave);
    
    setIsSubmitting(false);
    if (!err) {
      setNewNotice({ title: '', content: '', type: 'text', department: 'ALL', tag: 'INFO', tagColor: 'bg-blue-100 text-blue-800' });
      setIsEditModalOpen(false);
      setEditingNoticeId(null);
    } else {
      setError(err.message || 'Failed to update notice');
    }
  };

  const confirmDelete = async () => {
    if (!noticeToDelete) return;
    setIsSubmitting(true);
    const { error } = await removeNotice(noticeToDelete) as { error: any };
    setIsSubmitting(false);
    
    if (error) {
      setError(error.message || 'Failed to delete notice');
    } else {
      setNoticeToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setNoticeToDelete(id);
  };

  const tagColors = [
    { label: 'Blue', value: 'bg-blue-100 text-blue-800' },
    { label: 'Red (Urgent)', value: 'bg-red-100 text-red-800' },
    { label: 'Green (Success)', value: 'bg-green-100 text-green-800' },
    { label: 'Amber (Warning)', value: 'bg-amber-100 text-amber-800' },
    { label: 'Sky (Academic)', value: 'bg-sky-100 text-sky-800' },
    { label: 'Slate (General)', value: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isStudent ? 'Notice Board' : 'Manage Notices'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-xs sm:text-sm">
            {isStudent ? 'Official university announcements, notices, and updates.' : 'Add, update, or remove notices for students.'}
          </p>
        </div>
        {!isStudent && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto justify-center bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Create Notice
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[24px] border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading notices...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No notices found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {isStudent ? 'There are currently no active notices on the board.' : 'There are currently no active notices. Create one to notify students.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map((notice: Notice) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={notice.id}
                  onClick={() => setSelectedNoticeForView(notice)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative group flex flex-col cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/60 hover:shadow-md transition-all"
                >
                  {!isStudent && (
                    <div className="absolute top-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(notice); }} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-900 shadow-sm hover:bg-blue-50 dark:bg-blue-950/50 rounded-lg transition-colors border border-slate-100 dark:border-slate-800"
                        title="Edit Notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }} 
                        className="p-2 text-red-500 hover:text-red-700 bg-white dark:bg-slate-900 shadow-sm hover:bg-red-50 rounded-lg transition-colors border border-slate-100 dark:border-slate-800"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${notice.tagColor}`}>
                      {notice.tag}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {notice.title}
                  </h3>
                  
                  {notice.type === 'text' ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 flex-1 whitespace-pre-wrap">{notice.content}</p>
                  ) : (
                    <div className="flex-1 mt-2 mb-2 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col min-h-[120px] relative group border border-slate-200 dark:border-slate-800">
                      {notice.content.match(/data:application\/|\.pdf|\.doc/i) ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                          <FileText className="w-8 h-8 text-red-400 mb-2 opacity-80" />
                          <span className="text-xs font-medium text-slate-500">Document Attached</span>
                        </div>
                      ) : (
                        <img src={notice.content} loading="lazy" alt={notice.title} className="w-full h-full max-h-[160px] object-cover" onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Attachment';
                        }} />
                      )}
                      <a 
                        href={notice.content} 
                        download={notice.title.replace(/\s+/g, '_') + (notice.content.match(/data:application\/|\.pdf|\.doc/i) ? '.pdf' : '.png')}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur text-slate-700 rounded-md shadow-sm hover:bg-blue-50 hover:text-blue-600 transition-colors z-10"
                        title="Download Attachment"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                      Read Full Notice &rarr;
                    </span>
                    <div className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                      {notice.department === 'ALL' ? 'All Departments' : notice.department}
                    </div>
                  </div>
                  
                  {notice.expiresAt && (
                     <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded text-center">
                       Auto-deletes on {new Date(notice.expiresAt).toLocaleDateString()}
                     </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Notice Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-lg p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Create New Notice</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddNotice} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Title</label>
                  <input 
                    type="text" required 
                    value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="E.g. Final Exam Schedule"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                    <select 
                      required 
                      value={newNotice.department} onChange={e => setNewNotice({...newNotice, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Type</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setNewNotice({...newNotice, type: 'text', content: ''})}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${newNotice.type === 'text' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                      >
                        <Type className="w-4 h-4" /> Text
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewNotice({...newNotice, type: 'image', content: ''})}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${newNotice.type === 'image' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                      >
                        <ImageIcon className="w-4 h-4" /> Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tag Label</label>
                    <input 
                      type="text" required 
                      value={newNotice.tag} onChange={e => setNewNotice({...newNotice, tag: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. URGENT, EVENT"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tag Color</label>
                    <select 
                      required 
                      value={newNotice.tagColor} onChange={e => setNewNotice({...newNotice, tagColor: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {tagColors.map(color => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {newNotice.type === 'text' ? 'Notice Content' : 'Upload File (Image or PDF)'}
                  </label>
                  {newNotice.type === 'text' ? (
                    <textarea 
                      required 
                      value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px] resize-y"
                      placeholder="Enter the notice details here..."
                    />
                  ) : (
                    <div>
                      <input 
                        type="file" required={!newNotice.content} 
                        accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return; setFileToUpload(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewNotice({ ...newNotice, content: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Upload an image or document from your device. This notice will automatically expire and be hidden after 7 days.
                      </p>
                      {newNotice.content && newNotice.content.startsWith('data:') && (
                        <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                          File selected successfully.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Publishing...' : 'Publish Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isEditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-lg p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Edit Notice</h3>
                <button onClick={() => { setIsEditModalOpen(false); setEditingNoticeId(null); }} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditNotice} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Title</label>
                  <input 
                    type="text" required 
                    value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="E.g. Final Exam Schedule"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                    <select 
                      required 
                      value={newNotice.department} onChange={e => setNewNotice({...newNotice, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Type</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setNewNotice({...newNotice, type: 'text', content: ''})}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${newNotice.type === 'text' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                      >
                        <Type className="w-4 h-4" /> Text
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewNotice({...newNotice, type: 'image', content: ''})}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${newNotice.type === 'image' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                      >
                        <ImageIcon className="w-4 h-4" /> Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tag Label</label>
                    <input 
                      type="text" required 
                      value={newNotice.tag} onChange={e => setNewNotice({...newNotice, tag: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. URGENT, EVENT"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tag Color</label>
                    <select 
                      required 
                      value={newNotice.tagColor} onChange={e => setNewNotice({...newNotice, tagColor: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {tagColors.map(color => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {newNotice.type === 'text' ? 'Notice Content' : 'Upload File (Image or PDF)'}
                  </label>
                  {newNotice.type === 'text' ? (
                    <textarea 
                      required 
                      value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px] resize-y"
                      placeholder="Enter the notice details here..."
                    />
                  ) : (
                    <div>
                      <input 
                        type="file" required={!newNotice.content} 
                        accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return; setFileToUpload(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewNotice({ ...newNotice, content: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Upload an image or document from your device. This notice will automatically expire and be hidden after 7 days.
                      </p>
                      {newNotice.content && newNotice.content.startsWith('data:') && (
                        <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                          File selected successfully.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingNoticeId(null); }} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Updating...' : 'Update Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {noticeToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-sm p-6"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Delete Notice?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this notice? This action cannot be undone.</p>
                {error && <p className="text-xs text-red-600 mt-3 bg-red-50 p-2 rounded">{error}</p>}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setNoticeToDelete(null); setError(null); }} 
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  disabled={isSubmitting} 
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full View Notice Modal */}
        {selectedNoticeForView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setSelectedNoticeForView(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl p-4 sm:p-6 lg:p-8 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedNoticeForView.tagColor}`}>
                    {selectedNoticeForView.tag}
                  </span>
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    {selectedNoticeForView.department === 'ALL' ? 'All Departments' : selectedNoticeForView.department}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedNoticeForView(null)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Published on {new Date(selectedNoticeForView.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-5 leading-snug">
                {selectedNoticeForView.title}
              </h2>

              {selectedNoticeForView.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800 relative group">
                  {selectedNoticeForView.content.match(/data:application\/|\.pdf|\.doc/i) ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-4">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center">
                        <FileText className="w-10 h-10" />
                      </div>
                      <p className="text-base font-medium text-slate-600 dark:text-slate-300">Document Attached Attached</p>
                    </div>
                  ) : (
                    <img 
                      src={selectedNoticeForView.content} 
                      alt={selectedNoticeForView.title} 
                      className="w-full max-h-[450px] object-contain mx-auto" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Invalid+File';
                      }} 
                    />
                  )}
                  <div className="absolute top-4 right-4 z-10 transition-opacity">
                    <a 
                      href={selectedNoticeForView.content} 
                      download={selectedNoticeForView.title.replace(/\s+/g, '_') + (selectedNoticeForView.content.match(/data:application\/|\.pdf|\.doc/i) ? '.pdf' : '.png')}
                      className="bg-white/95 hover:bg-white text-slate-900 py-2.5 px-5 rounded-full shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 text-sm font-bold border border-slate-200/50 hover:scale-105"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {selectedNoticeForView.content}
                </div>
              )}

              {selectedNoticeForView.expiresAt && (
                <div className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-2 rounded-xl text-center border border-amber-200/50 dark:border-amber-900/50">
                  ⏰ Active Notice — Scheduled for removal on {new Date(selectedNoticeForView.expiresAt).toLocaleDateString()}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedNoticeForView(null)} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-xs shadow-sm"
                >
                  Close Notice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
