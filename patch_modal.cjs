const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ManageNotices.tsx', 'utf-8');

const target = `              {selectedNoticeForView.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800">
                  <img 
                    src={selectedNoticeForView.content} 
                    alt={selectedNoticeForView.title} 
                    className="w-full max-h-[450px] object-contain mx-auto" 
                    onError={(e) => {
                      (e.target).src = 'https://via.placeholder.com/600x300?text=Invalid+Image+URL';
                    }} 
                  />
                </div>
              ) : (`;

const target2 = `              {selectedNoticeForView.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800">
                  <img 
                    src={selectedNoticeForView.content} 
                    alt={selectedNoticeForView.title} 
                    className="w-full max-h-[450px] object-contain mx-auto" 
                    onError={(e) => {
                      (e.target).src = 'https://via.placeholder.com/600x300?text=Invalid+Image+URL';
                    }} 
                  />
                </div>
              )`;

const targetReal = `              {selectedNoticeForView.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800">
                  <img 
                    src={selectedNoticeForView.content} 
                    alt={selectedNoticeForView.title} 
                    className="w-full max-h-[450px] object-contain mx-auto" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Invalid+Image+URL';
                    }} 
                  />
                </div>
              ) : (`;

const replacement = `              {selectedNoticeForView.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800 relative group">
                  {selectedNoticeForView.content.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-4">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center">
                        <FileText className="w-10 h-10" />
                      </div>
                      <p className="text-base font-medium text-slate-600 dark:text-slate-300">PDF Document Attached</p>
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
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={selectedNoticeForView.content} 
                      download={selectedNoticeForView.title.replace(/\\s+/g, '_') + (selectedNoticeForView.content.startsWith('data:application/pdf') ? '.pdf' : '.png')}
                      className="bg-white/95 hover:bg-white text-slate-900 py-2.5 px-5 rounded-full shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 text-sm font-bold border border-slate-200/50 hover:scale-105"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              ) : (`;

code = code.split(targetReal).join(replacement);
fs.writeFileSync('src/pages/dashboard/ManageNotices.tsx', code);
