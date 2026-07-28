import React, { useState, useEffect } from 'react';
import { getMilestones, updateMilestone, deleteMilestone } from '../../services/api';
import MilestoneModal from './MilestoneModal';
import { CheckCircle2, Clock, AlertOctagon, Circle, Plus, Edit3, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function MilestoneList({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMilestones(projectId);
      setMilestones(data.milestones || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
    }
  }, [projectId]);

  const handleAddMilestone = () => {
    setMilestoneToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditMilestone = (milestone) => {
    setMilestoneToEdit(milestone);
    setIsModalOpen(true);
  };

  const handleQuickStatusToggle = async (milestone, newStatus) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        status: newStatus,
        ...(newStatus === 'completed' && !milestone.actual_date ? { actual_date: today } : {})
      };
      await updateMilestone(projectId, milestone.milestone_id, payload);
      fetchMilestones();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteMilestone = async (milestoneId, milestoneName) => {
    if (window.confirm(`Are you sure you want to delete milestone "${milestoneName}"?`)) {
      try {
        await deleteMilestone(projectId, milestoneId);
        fetchMilestones();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span data-testid="status-completed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span data-testid="status-in_progress" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5 mr-1 text-sky-400 animate-spin" />
            In Progress
          </span>
        );
      case 'delayed':
        return (
          <span data-testid="status-delayed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-400" />
            Delayed
          </span>
        );
      default:
        return (
          <span data-testid="status-pending" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Circle className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span>Project Milestones Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track planned vs actual completion dates and update site progress status
          </p>
        </div>

        <button
          data-testid="add-milestone-btn"
          onClick={handleAddMilestone}
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load milestones: {error}</span>
        </div>
      )}

      {/* Timeline List */}
      {loading ? (
        <div className="py-8 flex justify-center items-center text-slate-500 text-xs">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading milestone timeline...</p>
          </div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs text-slate-400">No milestones recorded for this project yet.</p>
          <button
            onClick={handleAddMilestone}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Milestone</span>
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {milestones.map((m) => (
            <div key={m.milestone_id} data-testid="milestone-item" className="relative group">
              {/* Timeline Bullet */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500 group-hover:scale-110 transition"></div>

              {/* Milestone Card */}
              <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {renderStatusBadge(m.status)}
                      <h4 className="text-sm font-bold text-white">{m.milestone_name}</h4>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3 pt-1">
                      <span>Planned: <strong className="text-slate-200">{m.planned_date}</strong></span>
                      {m.actual_date && (
                        <span className="text-emerald-400">Actual: <strong>{m.actual_date}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-start sm:self-center pt-2 sm:pt-0">
                    {/* Quick Status Select */}
                    <select
                      value={m.status}
                      onChange={(e) => handleQuickStatusToggle(m, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="pending">Set Pending</option>
                      <option value="in_progress">Set In Progress</option>
                      <option value="completed">Set Completed</option>
                      <option value="delayed">Set Delayed</option>
                    </select>

                    <button
                      onClick={() => handleEditMilestone(m)}
                      title="Edit Milestone"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteMilestone(m.milestone_id, m.milestone_name)}
                      title="Delete Milestone"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <MilestoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSaved={fetchMilestones}
        milestoneToEdit={milestoneToEdit}
      />
    </div>
  );
}
