const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ManageNotices.tsx', 'utf-8');

const target = `                  ) : (
                    <div>
                      <input 
                        type="url" required 
                        value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Must provide a direct link to the image. This image notice will automatically expire and be hidden after 7 days.
                      </p>
                    </div>
                  )`;

const replacement = `                  ) : (
                    <div>
                      <input 
                        type="file" required={!newNotice.content} 
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
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
                  )`;

code = code.split(target).join(replacement);
fs.writeFileSync('src/pages/dashboard/ManageNotices.tsx', code);
