const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ManageNotices.tsx', 'utf-8');

const listTarget = `                  {notice.type === 'text' ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 flex-1 whitespace-pre-wrap">{notice.content}</p>
                  ) : (
                    <div className="flex-1 mt-2 mb-2 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-[120px] border border-slate-200 dark:border-slate-800">
                      <img src={notice.content} alt={notice.title} className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                      }} />
                    </div>
                  )}`;

const listReplace = `                  {notice.type === 'text' ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 flex-1 whitespace-pre-wrap">{notice.content}</p>
                  ) : (
                    <div className="flex-1 mt-2 mb-2 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center min-h-[120px] border border-dashed border-slate-200 dark:border-slate-800">
                      <FileText className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                      <span className="text-xs font-medium text-slate-500">Attachment Included</span>
                    </div>
                  )}`;

code = code.split(listTarget).join(listReplace);

const dlTarget = `                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">`;
const dlReplace = `                  <div className="absolute top-4 right-4 z-10 transition-opacity">`;

code = code.split(dlTarget).join(dlReplace);

fs.writeFileSync('src/pages/dashboard/ManageNotices.tsx', code);
