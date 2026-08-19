import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Search, FileText, Download, FileArchive, File } from 'lucide-react';
import { useMaterials } from '../../hooks/useMaterials';
import { useDepartments } from '../../hooks/useDepartments';

export default function StudentMaterials() {
  const { user } = useOutletContext<any>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Try to use student's department if available, otherwise 'ALL'
  const studentDept = user.user_metadata?.department || 'ALL';
  const studentBatch = user.user_metadata?.batch || '';

  // We could filter strictly by student's dept/semester, but letting them search is also good
  // We'll pass the student's dept to prioritize, or let them select.
  // The requirement says: "view and download materials assigned to their department, batch, and course."
  // So we should filter by their department and batch.
  
  const { materials, loading, getPublicUrl } = useMaterials(studentDept, studentBatch);
  const { departments, loading: deptsLoading } = useDepartments();

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

  const handleDownload = async (material: any) => {
    if (material.file_data && material.file_data.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = material.file_data;
      const safeTitle = material.title.replace(/[^a-z0-9_-]/gi, '_');
      a.download = safeTitle;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const fileUrl = getPublicUrl(material.file_path);

    if (fileUrl && fileUrl !== '#' && !material.file_path.startsWith('demo/')) {
      try {
        const response = await fetch(fileUrl, { method: 'GET' });
        if (response.ok) {
          const blob = await response.blob();
          if (!blob.type.includes('json') && !blob.type.includes('xml')) {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = material.title.replace(/[^a-z0-9_-]/gi, '_');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            return;
          }
        }
      } catch (e) {}
    }

    const docText = `===================================================================
${material.title.toUpperCase()}
===================================================================
Course     : ${material.course}
Department : ${material.department}
Batch      : ${material.batch || 'All'}
Uploaded By: ${material.uploaded_by}
Shared Date: ${new Date(material.created_at).toLocaleDateString()}

-------------------------------------------------------------------
DESCRIPTION & STUDY NOTES
-------------------------------------------------------------------
${material.description || 'Course material and resource notes for ' + material.course}

===================================================================
UniXX Academic Management Portal
===================================================================
`;

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title.replace(/[^a-z0-9_-]/gi, '_')}_MaterialNotes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Materials</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Resources for your courses</p>
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
              Your faculty hasn't uploaded any materials for your current batch yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredMaterials.map((material) => {
              const deptName = material.department;
              
              return (
                <div key={material.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group bg-white dark:bg-slate-900 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl group-hover:bg-blue-50 dark:bg-blue-950/50 transition-colors">
                      {getFileIcon(material.file_type)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {material.course}
                    </span>
                  </div>
                  
                  <div className="mb-4 flex-grow">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{material.title}</h3>
                    {material.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{material.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(material.file_size)}</span>
                      <span>{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(material)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-medium rounded-xl transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
