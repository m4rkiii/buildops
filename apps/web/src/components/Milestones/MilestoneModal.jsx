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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-aserre rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-900 text-white rounded-xl border border-zinc-700">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {milestoneToEdit ? 'Edit Milestone' : 'Add Project Milestone'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-zinc-900 border border-white rounded-xl p-3.5 flex items-start space-x-2 text-white text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Milestone Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Foundation Slab & Columns Pouring"
              className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition font-medium"
            />
          </div>

          {/* Planned & Actual Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Planned Date *</label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Actual Completion Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Status Options */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Milestone Status</label>
            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                    status === opt.id
                      ? 'bg-white border-white text-black shadow-md'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.id && <span className="w-2.5 h-2.5 rounded-full bg-black"></span>}
                </div>
              ))}
            </div>
          </div>

          {/* Attach Site Photo Evidence Section */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
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
              <div className="bg-black border border-zinc-700 rounded-xl p-3 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={photoUrl}
                    alt="Milestone Evidence Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-zinc-600 shrink-0 grayscale hover:grayscale-0 transition"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Site Photo Attached</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Ready for NCA audit logging</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <label
                    htmlFor="milestone-photo-upload"
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Change</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 bg-black hover:bg-zinc-900 text-white border border-zinc-700 rounded-lg transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="milestone-photo-upload"
                className="border-2 border-dashed border-zinc-700 hover:border-white bg-black rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 group-hover:scale-110 flex items-center justify-center text-white transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Click or drag image to attach site photo</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Supports JPG, JPEG, PNG, WEBP up to 5MB</p>
                </div>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end space-x-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-black border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition border border-zinc-300 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 text-black" />
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
