import React, { useState, useEffect } from 'react';
import { createMilestone, updateMilestone } from '../../services/api';
import { X, CheckSquare, Calendar, AlertCircle, Save, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', color: 'text-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-sky-400' },
  { id: 'completed', label: 'Completed', color: 'text-emerald-400' },
  { id: 'delayed', label: 'Delayed', color: 'text-red-400' }
];

export default function MilestoneModal({ isOpen, onClose, projectId, onSaved, milestoneToEdit }) {
  const [name, setName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [actualDate, setActualDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (milestoneToEdit) {
      setName(milestoneToEdit.milestone_name || '');
      setPlannedDate(milestoneToEdit.planned_date || '');
      setActualDate(milestoneToEdit.actual_date || '');
      setStatus(milestoneToEdit.status || 'pending');
      setPhotoUrl(milestoneToEdit.photo_url || '');
    } else {
      setName('');
      setPlannedDate('');
      setActualDate('');
      setStatus('pending');
      setPhotoUrl('');
    }
    setError(null);
  }, [milestoneToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (.jpg, .jpeg, .png, .webp, .gif).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !plannedDate) {
      setError('Milestone name and planned date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        milestone_name: name,
        planned_date: plannedDate,
        actual_date: actualDate || null,
        status,
        photo_url: photoUrl || null
      };

      if (milestoneToEdit) {
        await updateMilestone(projectId, milestoneToEdit.milestone_id, payload);
      } else {
        await createMilestone(projectId, payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B2318]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-aserre rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D7B66D]/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#D7B66D]/15 text-[#D7B66D] rounded-xl border border-[#D7B66D]/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-serif-luxury text-white tracking-tight">
              {milestoneToEdit ? 'Edit Milestone' : 'Add Project Milestone'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#8FA399] hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Name */}
          <div>
            <label className="block text-xs font-semibold text-[#D7B66D] uppercase tracking-wider mb-1.5">Milestone Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Foundation Slab & Columns Pouring"
              className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none"
            />
          </div>

          {/* Planned & Actual Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D7B66D] uppercase tracking-wider mb-1.5">Planned Date *</label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D7B66D] uppercase tracking-wider mb-1.5">Actual Completion Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Status Options */}
          <div>
            <label className="block text-xs font-semibold text-[#D7B66D] uppercase tracking-wider mb-1.5">Milestone Status</label>
            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    status === opt.id
                      ? 'bg-[#D7B66D]/15 border-[#D7B66D] text-[#D7B66D]'
                      : 'bg-[#0B2318] border-[#D7B66D]/20 text-[#8FA399] hover:border-[#D7B66D]/40 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.id && <span className="w-2.5 h-2.5 rounded-full bg-[#D7B66D] shadow-[0_0_8px_rgba(215,182,109,0.8)]"></span>}
                </div>
              ))}
            </div>
          </div>

          {/* Attach Site Photo Evidence Section */}
          <div>
            <label className="block text-xs font-semibold text-[#D7B66D] uppercase tracking-wider mb-1.5">
              Attach Site Photo Evidence (.JPG, .JPEG, .PNG, .WEBP)
            </label>

            <input
              type="file"
              id="milestone-photo-upload"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="bg-[#0B2318] border border-[#D7B66D]/30 rounded-xl p-3 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={photoUrl}
                    alt="Milestone Evidence Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-[#D7B66D]/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">Site Photo Attached</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Ready for NCA audit logging</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <label
                    htmlFor="milestone-photo-upload"
                    className="p-1.5 bg-[#102A25] hover:bg-[#D7B66D]/20 border border-[#D7B66D]/30 text-[#D7B66D] rounded-lg text-xs font-medium cursor-pointer transition flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="milestone-photo-upload"
                className="border-2 border-dashed border-[#D7B66D]/30 hover:border-[#D7B66D] bg-[#0B2318] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-[#D7B66D]/10 border border-[#D7B66D]/20 group-hover:scale-110 flex items-center justify-center text-[#D7B66D] transition">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">Click or drag image to attach site photo</p>
                  <p className="text-[10px] text-[#8FA399] mt-0.5">Supports JPG, JPEG, PNG, WEBP up to 5MB</p>
                </div>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end space-x-3 border-t border-[#D7B66D]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#0B2318] border border-[#D7B66D]/20 hover:border-[#D7B66D]/40 text-[#8FA399] hover:text-white text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-aserre-gold px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#0B2318] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{milestoneToEdit ? 'Save Milestone' : 'Add Milestone'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
