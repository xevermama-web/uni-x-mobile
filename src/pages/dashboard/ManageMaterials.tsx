import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Search, Plus, X, Trash2, Edit2, FileText, Download, FileArchive, File, UploadCloud, AlertCircle } from 'lucide-react';
import { useMaterials, CourseMaterial } from '../../hooks/useMaterials';
import { useDepartments } from '../../hooks/useDepartments';
import { useStudents } from '../../hooks/useStudents';
import { useBatches } from '../../hooks/useBatches';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export default function ManageMaterials() {
  const { user } = useOutletContext<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  const { materials, loading, addMaterial, editMaterial, deleteMaterial, getPublicUrl } = useMaterials(selectedDept);
  const { departments, loading: deptsLoading } = useDepartments();
  const { students } = useStudents();
  

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    department: '',
    batch: '',
    course: ''
  });
  const newMaterialDeptName = useMemo(() => departments.find(d => d.id === newMaterial?.department)?.name, [departments, newMaterial?.department]);
  const editMaterialDeptName = useMemo(() => departments.find(d => d.id === editingMaterial?.department)?.name, [departments, editingMaterial?.department]);
  
  const { batches: newMaterialBatches } = useBatches(newMaterialDeptName);
  const { batches: editMaterialBatches } = useBatches(editMaterialDeptName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.zip')) {
        setError('Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 100MB limit');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const materialData = {
      title: newMaterial.title,
      description: newMaterial.description,
      department: newMaterial.department,
      batch: newMaterial.batch,
      course: newMaterial.course,
      file_type: selectedFile.type || 'application/octet-stream',
      file_size: selectedFile.size,
      uploaded_by: user.id || user.email || 'unknown',
    };

    const { error: err } = await addMaterial(materialData, selectedFile);
    
    setIsSubmitting(false);
    
    if (!err) {
      setNewMaterial({ title: '', description: '', department: '', batch: '', course: '' });
      setSelectedFile(null);
      setIsAddModalOpen(false);
    } else {
      const errorMsg = typeof err === 'string' ? err : ((err as any)?.message || 'Failed to upload material');
      setError(errorMsg);
    }
  };

  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: err } = await editMaterial(editingMaterial.id, {
      title: editingMaterial.title,
      description: editingMaterial.description,
      department: editingMaterial.department,
      batch: editingMaterial.batch,
      course: editingMaterial.course
    });
    setIsSubmitting(false);
    if (!err) {
      setIsEditModalOpen(false);
      setEditingMaterial(null);
    } else {
      setError(err.message || 'Failed to update material');
    }
  };

  const handleDelete = async (id: string, filePath: string, uploadedBy: string) => {
    // Only allow admin, moderator to delete anything. Faculty can only delete their own.
    if (user.role === 'faculty' && uploadedBy !== (user.id || user.email)) {
      alert("You can only delete your own uploads.");
      return;
    }
    
    if (confirm('Are you sure you want to delete this material? This will also remove the file from storage.')) {
      await deleteMaterial(id, filePath);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('zip') || type.includes('compressed')) return <FileArchive className="w-8 h-8 text-yellow-600" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (type.includes('presentation') || type.includes('powerpoint')) return <FileText className="w-8 h-8 text-orange-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileText className="w-8 h-8 text-green-600" />;
    return <File className="w-8 h-8 text-slate-500 dark:text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Materials</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Manage and share course resources</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm w-full md:w-64"
            />
          </div>
          
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Upload
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading || deptsLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading materials...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No materials found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Upload class notes, slides, or reading materials to share with students.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-4 font-medium">Material</th>
                  <th className="p-4 font-medium hidden md:table-cell">Department & Course</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Batch</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Size</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Uploaded</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaterials.map((material) => {
                  const deptName = material.department;
                  const canEdit = user.role === 'admin' || user.role === 'moderator' || (user.role === 'faculty' && material.uploaded_by === (user.id || user.email));
                  
                  return (
                    <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70/50 dark:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {getFileIcon(material.file_type)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{material.title}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{material.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100">{material.course}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{deptName}</div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                          {material.batch}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-slate-600 dark:text-slate-300">
                        {formatFileSize(material.file_size)}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(material.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={getPublicUrl(material.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:bg-blue-950/50 rounded-lg transition-colors tooltip-trigger"
                            title="Download/View"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                          
                          {canEdit && (
                            <button
                              onClick={() => { setEditingMaterial(material); setIsEditModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleDelete(material.id, material.file_path, material.uploaded_by)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsAddModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85dvh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upload Material</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share a file with your students</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="upload-form" onSubmit={handleUpload} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="e.g. Week 1 Lecture Slides"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24"
                      placeholder="Optional details about this material..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                      <select
                        required
                        value={newMaterial.department}
                        onChange={(e) => setNewMaterial({ ...newMaterial, department: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900"
                      >
                        <option value="">Select Dept</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch (comma separated for multiple)</label>
                      <input
                        type="text"
                        required
                        list="existing-batches"
                        value={newMaterial.batch}
                        onChange={(e) => setNewMaterial({ ...newMaterial, batch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. Fall 2024, Spring 2025"
                      />
                      <datalist id="existing-batches">
                        {newMaterialBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Name/Code</label>
                    <input
                      type="text"
                      required
                      value={newMaterial.course}
                      onChange={(e) => setNewMaterial({ ...newMaterial, course: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="e.g. CSE 101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">File</label>
                    <div 
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      {selectedFile ? (
                        <div className="text-sm font-medium text-blue-600 truncate px-4">{selectedFile.name}</div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-blue-600">Click to browse</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, DOC, PPT, XLS, ZIP up to 100MB</div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="upload-form"
                  disabled={isSubmitting || !selectedFile}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && editingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsEditModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85dvh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Material</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update details for this material</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="edit-form" onSubmit={handleEdit} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editingMaterial.title}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={editingMaterial.description || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                      <select
                        required
                        value={editingMaterial.department}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, department: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900"
                      >
                        <option value="">Select Dept</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch (comma separated for multiple)</label>
                      <input
                        type="text"
                        required
                        list="existing-batches-edit"
                        value={editingMaterial.batch}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, batch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <datalist id="existing-batches-edit">
                        {editMaterialBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Name/Code</label>
                    <input
                      type="text"
                      required
                      value={editingMaterial.course}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, course: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
