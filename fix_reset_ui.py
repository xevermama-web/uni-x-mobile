import re

with open('src/pages/dashboard/ManageStudents.tsx', 'r') as f:
    content = f.read()

old_modal = """<p className="text-sm text-slate-500 mb-6">
                Send a password reset email to <strong>{studentToEdit.email}</strong>?
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setIsResetPassModalOpen(false); setNewPassword(''); setConfirmPassword(''); setError(null); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Link
                </button>
              </div>"""

new_modal = """<p className="text-sm text-slate-500 mb-6">
                Enter a new password for <strong>{studentToEdit.name}</strong>.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input 
                    type="password" required 
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input 
                    type="password" required 
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsResetPassModalOpen(false); setNewPassword(''); setConfirmPassword(''); setError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Reset
                  </button>
                </div>
              </form>"""

content = content.replace(old_modal, new_modal)

with open('src/pages/dashboard/ManageStudents.tsx', 'w') as f:
    f.write(content)
