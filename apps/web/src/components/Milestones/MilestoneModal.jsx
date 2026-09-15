import React, { useState, useEffect } from 'react';
import { createMilestone, updateMilestone } from '../../services/api';
import { X, CheckSquare, Calendar, AlertCircle, Save } from 'lucide-react';

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
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (milestoneToEdit) {
      setName(milestoneToEdit.milestone_name || '');
      setPlannedDate(milestoneToEdit.planned_date || '');
      setActualDate(milestoneToEdit.actual_date || '');
      setStatus(milestoneToEdit.status || 'pending');
    } else {
      setName('');
      setPlannedDate('');
      setActualDate('');
      setStatus('pending');
    }
    setError(null);
  }, [milestoneToEdit, isOpen]);

  if (!isOpen) return null;

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
        status
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
      <div className="card-aserre rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
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

          {/* Actions */}
          <div className="pt-3 flex justify-end space-x-3">
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
