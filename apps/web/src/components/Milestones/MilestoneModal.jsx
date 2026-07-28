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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {milestoneToEdit ? 'Edit Milestone' : 'Add Project Milestone'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Milestone Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Foundation Slab & Columns Pouring"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Planned & Actual Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Planned Date *</label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Actual Completion Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Status Options */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Milestone Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    status === opt.id
                      ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.id && <span className="w-2 h-2 rounded-full bg-sky-400"></span>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-sky-600/20 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
