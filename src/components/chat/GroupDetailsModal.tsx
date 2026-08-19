import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, BookOpen, Shield, Calendar, Edit3, Trash2, Clock, AlertTriangle, Check, Camera, Image, Link, Sparkles } from 'lucide-react';
import { ChatGroup, GroupMember } from '../../types/chat';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatGroup | null;
  members: GroupMember[];
  currentUser: any;
  onEditGroup?: () => void;
  onUpdateRetention?: (groupId: string, retention: '7_days' | '1_month' | '6_months') => Promise<boolean>;
  onDeleteGroup?: (groupId: string) => Promise<boolean>;
  onUpdateGroupPhoto?: (groupId: string, photoUrl: string) => Promise<boolean>;
  onOpenMaterials?: () => void;
}

const PRESET_PHOTOS = [
  { label: 'Computer Science', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80' },
  { label: 'Engineering', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80' },
  { label: 'Business', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80' },
  { label: 'Library & Study', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=150&auto=format&fit=crop&q=80' },
  { label: 'Science Lab', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=150&auto=format&fit=crop&q=80' }
];

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  group,
  members,
  currentUser,
  onEditGroup,
  onUpdateRetention,
  onDeleteGroup,
  onUpdateGroupPhoto,
  onOpenMaterials
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRetention, setIsUpdatingRetention] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoInput, setPhotoInput] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  useEffect(() => {
    if (group) {
      setPhotoInput(group.image_url || group.group_photo || '');
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const isFaculty = userRole === 'faculty';
  const isFacultyOwner = isFaculty && group.created_by === currentUser?.id;
  const canManageGroup = isAdmin || isModerator || isFaculty;
  const canManageGroupPhoto = isAdmin || isModerator || isFaculty;

  const groupPhotoUrl = group.image_url || group.group_photo || null;

  const getRetentionLabel = (val?: string) => {
    if (val === '1_month') return '1 Month';
    if (val === '6_months') return '6 Months';
    return '7 Days';
  };

  const handleRetentionChange = async (val: '7_days' | '1_month' | '6_months') => {
    if (!onUpdateRetention || isUpdatingRetention) return;
    setIsUpdatingRetention(true);
    await onUpdateRetention(group.id, val);
    setIsUpdatingRetention(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteGroup || isDeleting) return;
    setIsDeleting(true);
    const success = await onDeleteGroup(group.id);
    setIsDeleting(false);
    if (success) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleSavePhoto = async (photoToSave?: string) => {
    if (!onUpdateGroupPhoto || isSavingPhoto) return;
    const targetUrl = photoToSave !== undefined ? photoToSave : photoInput.trim();
    setIsSavingPhoto(true);
    const success = await onUpdateGroupPhoto(group.id, targetUrl);
    setIsSavingPhoto(false);
    if (success) {
      setPhotoSuccess(true);
      setTimeout(() => setPhotoSuccess(false), 2000);
      setIsEditingPhoto(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              {groupPhotoUrl ? (
                <img
                  src={groupPhotoUrl}
                  alt={group.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {group.name}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {group.type === 'course_group' ? 'Course Group' : 'Faculty Study Group'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Group Photo Section */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Group Photo</span>
                </div>
                {canManageGroupPhoto ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditingPhoto ? 'Cancel' : groupPhotoUrl ? 'Change Photo' : 'Add Photo'}
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium italic">
                    Faculty/Admin/Moderator Only
                  </span>
                )}
              </div>

              {/* Current Photo Preview or Edit Form */}
              {isEditingPhoto && canManageGroupPhoto ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Group Photo Image URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={photoInput}
                        onChange={(e) => setPhotoInput(e.target.value)}
                        placeholder="https://example.com/group-photo.png"
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                      />
                      {photoInput && (
                        <button
                          type="button"
                          onClick={() => setPhotoInput('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Quick Select */}
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Or Choose Preset Theme Photo
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {PRESET_PHOTOS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPhotoInput(p.url);
                            handleSavePhoto(p.url);
                          }}
                          className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all text-left aspect-square"
                          title={p.label}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    {groupPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoInput('');
                          handleSavePhoto('');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Photo
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleSavePhoto()}
                        disabled={isSavingPhoto}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSavingPhoto ? 'Saving...' : 'Save Photo'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {groupPhotoUrl ? (
                    <img
                      src={groupPhotoUrl}
                      alt={group.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center">
                      <Image className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {groupPhotoUrl ? 'Custom Group Photo Active' : 'No Group Photo Set'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {canManageGroupPhoto
                        ? 'Admin, Moderator, or Faculty can edit this group photo.'
                        : 'Group photo is visible to all members.'}
                    </p>
                  </div>
                </div>
              )}

              {photoSuccess && (
                <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Group photo updated successfully!
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                About Group
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {group.description || 'No description provided for this group.'}
              </p>
            </div>

            {/* Badges / Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                  Department
                </span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {group.department || 'All Departments'}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                  Target Batches
                </span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {group.batches && group.batches.length > 0
                    ? group.batches.map(b => `Batch ${b}`).join(', ')
                    : 'All Batches'}
                </span>
              </div>
            </div>

            {/* Study Group Materials Action Item */}
            {onOpenMaterials && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Group Materials & Resources</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">View slides, lecture notes, syllabus, and files shared for this group</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMaterials();
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0"
                >
                  View Files
                </button>
              </div>
            )}

            {/* Message Disappearing / Retention Setting Section */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Message Auto-Disappearing</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:text-blue-300 font-bold rounded text-[10px]">
                  {getRetentionLabel(group.message_retention)}
                </span>
              </div>

              {canManageGroup ? (
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Faculty owner retention setting: Expired messages older than this setting are automatically deleted.
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: '7_days', label: '7 Days' },
                      { id: '1_month', label: '1 Month' },
                      { id: '6_months', label: '6 Months' }
                    ].map(opt => {
                      const isSelected = (group.message_retention || '7_days') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isUpdatingRetention}
                          onClick={() => handleRetentionChange(opt.id as any)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Messages in this channel automatically expire after <strong>{getRetentionLabel(group.message_retention)}</strong>.
                </p>
              )}
            </div>

            {/* Member List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Group Members ({members.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Loading members...
                  </p>
                ) : (
                  members.map((m, idx) => {
                    const prof = m.profile;
                    const name = prof?.full_name || 'Member';
                    const role = prof?.role || m.role;
                    return (
                      <div
                        key={m.user_id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {name} {prof?.id === currentUser?.id && <span className="text-blue-600 font-normal">(You)</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                              {prof?.department ? `${prof.department} • ` : ''}
                              {prof?.batch ? `Batch ${prof.batch}` : role}
                            </p>
                          </div>
                        </div>

                        {role.toLowerCase() === 'admin' ? (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-transparent dark:border-red-900/50 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : role.toLowerCase() === 'faculty' ? (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-900/50 rounded-md text-[10px] font-bold flex items-center gap-1">
                            Faculty
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700 rounded-md text-[10px] font-medium">
                            Student
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Danger Zone / Group Deletion */}
            {canManageGroup && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat Group</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800">
            {onOpenMaterials ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenMaterials();
                }}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Group Materials</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {canManageGroup && onEditGroup && (
                <button
                  onClick={() => {
                    onClose();
                    onEditGroup();
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Settings
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>

        {/* Group Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-100 dark:border-red-900/60 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Study Group?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-red-50/50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
                Are you sure you want to permanently delete <strong>"{group.name}"</strong>? All chat messages, group members, and settings will be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
