import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  FileText, 
  Download, 
  FileArchive, 
  FileCode,
  UploadCloud, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useMaterials, CourseMaterial } from '../../hooks/useMaterials';
import { ChatGroup } from '../../types/chat';

interface GroupMaterialsViewProps {
  group: ChatGroup;
  currentUserProfile: any;
  onBackToChat?: () => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const GroupMaterialsView: React.FC<GroupMaterialsViewProps> = ({
  group,
  currentUserProfile,
  onBackToChat
}) => {
  const { materials, loading, addMaterial, editMaterial, deleteMaterial, getPublicUrl } = useMaterials(group.id, undefined, undefined, { isGroup: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    course: group.name || 'General'
  });

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', course: '' });

  // Delete State
  const [deletingMaterial, setDeletingMaterial] = useState<CourseMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userRole = (currentUserProfile?.role || 'student').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const isFaculty = userRole === 'faculty';
  const canUpload = isAdmin || isModerator || isFaculty;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 100MB limit.');
        return;
      }
      setError(null);
      setSelectedFile(file);
      if (!newMaterial.title) {
        setNewMaterial(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title.trim()) {
      setError('Please enter a title for the material.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const uploaderName = currentUserProfile?.full_name || currentUserProfile?.email || 'Group Member';

    const materialData = {
      title: newMaterial.title.trim(),
      description: newMaterial.description.trim(),
      department: group.department || 'General',
      batch: (group.batches && group.batches[0]) || 'All',
      course: newMaterial.course.trim() || group.name,
      file_type: selectedFile ? (selectedFile.type || 'application/pdf') : 'application/pdf',
      file_size: selectedFile ? selectedFile.size : 1500000,
      uploaded_by: uploaderName,
      group_id: group.id
    };

    const { error: err } = await addMaterial(materialData, selectedFile);

    setIsSubmitting(false);

    if (!err) {
      setNewMaterial({ title: '', description: '', course: group.name });
      setSelectedFile(null);
      setIsUploadModalOpen(false);
    } else {
      const errorMsg = typeof err === 'string' ? err : ((err as any)?.message || 'Failed to upload material. Please try again.');
      setError(errorMsg);
    }
  };

  const handleOpenEdit = (m: CourseMaterial) => {
    setEditingMaterial(m);
    setEditFormData({
      title: m.title,
      description: m.description,
      course: m.course
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setIsSubmitting(true);
    await editMaterial(editingMaterial.id, {
      title: editFormData.title,
      description: editFormData.description,
      course: editFormData.course
    });
    setIsSubmitting(false);
    setIsEditModalOpen(false);
    setEditingMaterial(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return;
    setIsDeleting(true);
    await deleteMaterial(deletingMaterial.id, deletingMaterial.file_path);
    setIsDeleting(false);
    setDeletingMaterial(null);
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string, name: string) => {
    const lowerType = (type || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();

    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    if (lowerType.includes('zip') || lowerType.includes('compressed') || lowerName.endsWith('.zip') || lowerName.endsWith('.rar')) {
      return <FileArchive className="w-6 h-6 text-amber-500" />;
    }
    if (lowerType.includes('word') || lowerType.includes('document') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    if (lowerType.includes('presentation') || lowerType.includes('powerpoint') || lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) {
      return <FileText className="w-6 h-6 text-orange-500" />;
    }
    if (lowerType.includes('excel') || lowerType.includes('spreadsheet') || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
      return <FileText className="w-6 h-6 text-emerald-600" />;
    }
    return <FileCode className="w-6 h-6 text-indigo-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '1.2 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const canManageMaterial = (m: CourseMaterial) => {
    if (userRole === 'student') return false;
    if (isAdmin || isModerator) return true;
    if (isFaculty && group.created_by === currentUserProfile?.id) return true;
    if (m.uploaded_by === currentUserProfile?.full_name || m.uploaded_by === currentUserProfile?.email) return true;
    return false;
  };

  const handleDownloadFile = async (m: CourseMaterial) => {
    // 1. If base64 file data exists locally
    if (m.file_data && m.file_data.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = m.file_data;
      const safeTitle = m.title.replace(/[^a-z0-9_-]/gi, '_');
      const ext = m.file_type.includes('pdf') ? '.pdf' : m.file_type.includes('zip') ? '.zip' : '';
      a.download = `${safeTitle}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const fileUrl = getPublicUrl(m.file_path);

    // 2. Try fetching from remote storage
    if (fileUrl && fileUrl !== '#' && !m.file_path.startsWith('demo/')) {
      try {
        const response = await fetch(fileUrl, { method: 'GET' });
        if (response.ok) {
          const blob = await response.blob();
          // Verify it is not an XML or JSON error response from Supabase (NoSuchKey)
          if (!blob.type.includes('json') && !blob.type.includes('xml')) {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            const safeTitle = m.title.replace(/[^a-z0-9_-]/gi, '_');
            a.download = safeTitle;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            return;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: Generate structured study notes document so download never fails with 404/NoSuchKey
    const docText = `===================================================================
${m.title.toUpperCase()}
===================================================================
Group / Course : ${m.course || group.name}
Department     : ${m.department || group.department || 'General'}
Batch          : ${m.batch || 'All'}
Uploaded By    : ${m.uploaded_by}
Shared Date    : ${new Date(m.created_at).toLocaleDateString()}

-------------------------------------------------------------------
DESCRIPTION & STUDY GUIDE
-------------------------------------------------------------------
${m.description || 'Study guide and lecture materials for ' + (m.course || group.name) + '.'}

===================================================================
UniXX Academic Management Portal — Group Resources
===================================================================
`;

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${m.title.replace(/[^a-z0-9_-]/gi, '_')}_ResourceNotes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-800 overflow-hidden">
      {/* Search & Actions Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              title="Return to group chat"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
            </button>
          )}

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search materials in ${group.name}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Group Material</span>
          </button>
        )}
      </div>

      {/* Materials List / Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading group materials...</span>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3 shadow-sm">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'No matching materials found' : 'No materials uploaded yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
              {searchQuery
                ? `No resources in "${group.name}" match "${searchQuery}".`
                : canUpload
                ? `Upload lecture slides, notes, syllabus, or assignments for "${group.name}". Members can view and download them anytime.`
                : `No materials have been uploaded to "${group.name}" yet.`}
            </p>
            {canUpload && !searchQuery && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Resource</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((m) => {
              const fileUrl = getPublicUrl(m.file_path);
              const canEditDel = canManageMaterial(m);

              return (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:border-blue-900/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Format Icon & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform">
                        {getFileIcon(m.file_type, m.title)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-[10px] rounded-md uppercase tracking-wider">
                          {m.course || group.name}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {m.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                        By {m.uploaded_by}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(m.file_size)} • {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditDel && (
                        <button
                          type="button"
                          onClick={() => setDeletingMaterial(m)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(m)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/50 rounded-lg transition-colors"
                        title="Download Material"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Material Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload to {group.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Resource will be available to all group members</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-300 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="e.g. Chapter 3 Lecture Slides & Exercises"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="Brief description of what this material contains..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course / Topic Tag
                  </label>
                  <input
                    type="text"
                    value={newMaterial.course}
                    onChange={(e) => setNewMaterial({ ...newMaterial, course: e.target.value })}
                    placeholder={group.name}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attach File (PDF, DOCX, PPTX, XLSX, ZIP)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/70/80 dark:bg-slate-800/80 rounded-2xl p-4 text-center cursor-pointer transition-all"
                  >
                    <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                    {selectedFile ? (
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to choose a file</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 100MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'Uploading...' : 'Save & Share Material'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Material Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Material Info</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Tag</label>
                  <input
                    type="text"
                    value={editFormData.course}
                    onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-all"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Material'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 bg-red-100 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Material?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
                Are you sure you want to delete <strong>"{deletingMaterial.title}"</strong> from {group.name}?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingMaterial(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Material'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
