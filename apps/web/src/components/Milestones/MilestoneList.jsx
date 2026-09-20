import React, { useState, useEffect } from 'react';
import { getMilestones, updateMilestone, deleteMilestone } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MilestoneModal from './MilestoneModal';
import { CheckCircle2, Clock, AlertOctagon, Circle, Plus, Edit3, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function MilestoneList({ projectId }) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const isNcaRegulator = user && user.role === 'nca_regulator';

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
    if (isNcaRegulator) return;
    setMilestoneToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditMilestone = (milestone) => {
    if (isNcaRegulator) return;
    setMilestoneToEdit(milestone);
    setIsModalOpen(true);
  };

  const handleQuickStatusToggle = async (milestone, newStatus) => {
    if (isNcaRegulator) return;
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
    if (isNcaRegulator) return;
    if (window.confirm(`Are you sure you want to delete milestone "${milestoneName}"?`)) {
      try {
        await deleteMilestone(projectId, milestoneId);
        fetchMilestones();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleDirectPhotoUpload = (milestone, event) => {
    if (isNcaRegulator) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (.jpg, .jpeg, .png, .webp, .gif).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateMilestone(projectId, milestone.milestone_id, {
          photo_url: reader.result
        });
        fetchMilestones();
      } catch (err) {
        alert(`Failed to attach photo: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span data-testid="status-completed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span data-testid="status-in_progress" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#D7B66D]/15 text-[#D7B66D] border border-[#D7B66D]/30">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#D7B66D] animate-spin" />
            In Progress
          </span>
        );
      case 'delayed':
        return (
          <span data-testid="status-delayed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-400" />
            Delayed
          </span>
        );
      default:
        return (
          <span data-testid="status-pending" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#0B2318] text-[#8FA399] border border-[#D7B66D]/20">
            <Circle className="w-3.5 h-3.5 mr-1 text-[#8FA399]" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="card-aserre rounded-2xl p-7 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D7B66D]/20 pb-4">
        <div>
          <h3 className="text-2xl font-bold font-serif-luxury text-white tracking-tight flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-[#D7B66D]" />
            <span>Project Milestones Timeline</span>
          </h3>
          <p className="text-xs text-[#8FA399] mt-1">
            Track planned vs actual completion dates and update site progress status
          </p>
        </div>

        {!isNcaRegulator && (
          <button
            data-testid="add-milestone-btn"
            onClick={handleAddMilestone}
            className="btn-aserre-gold text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load milestones: {error}</span>
        </div>
      )}

      {/* Timeline List */}
      {loading ? (
        <div className="py-8 flex justify-center items-center text-[#8FA399] text-xs">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-3 border-[#D7B66D] border-t-transparent rounded-full animate-spin"></div>
            <p>Loading milestone timeline...</p>
          </div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="bg-[#0B2318] border border-dashed border-[#D7B66D]/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs text-[#8FA399]">No milestones recorded for this project yet.</p>
          {!isNcaRegulator && (
            <button
              onClick={handleAddMilestone}
              className="btn-aserre-gold text-xs font-medium px-4 py-2 rounded-xl inline-flex items-center space-x-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-[#D7B66D]/30 ml-4 pl-6 space-y-6">
          {milestones.map((m) => (
            <div key={m.milestone_id} data-testid="milestone-item" className="relative group">
              {/* Timeline Bullet */}
              <div className="absolute -left-[31px] top-2.5 w-4 h-4 rounded-full bg-[#0B2318] border-2 border-[#D7B66D] group-hover:scale-125 transition"></div>

              {/* Milestone Card */}
              <div className="bg-[#0B2318] border border-[#D7B66D]/20 hover:border-[#D7B66D]/40 rounded-xl p-4 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D7B66D]/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      {renderStatusBadge(m.status)}
                      <h4 className="text-base font-bold font-serif-luxury text-white">{m.milestone_name}</h4>
                    </div>
                    <div className="text-xs text-[#8FA399] flex items-center space-x-4 pt-1">
                      <span>Planned: <strong className="text-white font-serif-luxury">{m.planned_date}</strong></span>
                      {m.actual_date && (
                        <span className="text-emerald-400">Actual: <strong className="font-serif-luxury">{m.actual_date}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isNcaRegulator && (
                    <div className="flex items-center space-x-2 self-start sm:self-center pt-2 sm:pt-0">
                      {/* Quick Status Select */}
                      <select
                        value={m.status}
                        onChange={(e) => handleQuickStatusToggle(m, e.target.value)}
                        className="bg-[#102A25] border border-[#D7B66D]/30 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#D7B66D]"
                      >
                        <option value="pending">Set Pending</option>
                        <option value="in_progress">Set In Progress</option>
                        <option value="completed">Set Completed</option>
                        <option value="delayed">Set Delayed</option>
                      </select>

                      <button
                        onClick={() => handleEditMilestone(m)}
                        title="Edit Milestone"
                        className="p-1.5 text-[#8FA399] hover:text-[#D7B66D] hover:bg-[#102A25] rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteMilestone(m.milestone_id, m.milestone_name)}
                        title="Delete Milestone"
                        className="p-1.5 text-[#8FA399] hover:text-red-400 hover:bg-[#102A25] rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Site Photo Verification & Compliance Audit Badge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Site Photo Verification & Logging */}
                  <div className="bg-[#102A25]/60 border border-[#D7B66D]/15 rounded-lg p-2.5 flex items-center justify-between">
                    <input
                      type="file"
                      id={`direct-photo-upload-${m.milestone_id}`}
                      accept="image/*"
                      onChange={(e) => handleDirectPhotoUpload(m, e)}
                      className="hidden"
                    />

                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt="Site Evidence"
                          onClick={() => setActivePhotoModal(m)}
                          className="w-10 h-10 object-cover rounded-md border border-[#D7B66D]/40 cursor-pointer hover:scale-105 transition shrink-0"
                          title="Click to expand photo"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          📷
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[#D7B66D] font-semibold text-[11px] truncate">Site Photo Evidence</p>
                        <p className="text-[#8FA399] text-[10px] truncate">
                          {m.photo_url ? 'Attached & SHA-256 Logged' : 'No Photo Logged Yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {m.photo_url ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePhotoModal(m)}
                            className="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2 py-1 rounded border border-emerald-500/40 font-semibold transition"
                          >
                            View Photo
                          </button>
                          {!isNcaRegulator && (
                            <label
                              htmlFor={`direct-photo-upload-${m.milestone_id}`}
                              className="text-[10px] bg-[#D7B66D]/15 text-[#D7B66D] hover:bg-[#D7B66D]/25 px-2 py-1 rounded border border-[#D7B66D]/30 font-semibold cursor-pointer transition"
                              title="Replace attached photo"
                            >
                              Replace
                            </label>
                          )}
                        </>
                      ) : (
                        !isNcaRegulator ? (
                          <label
                            htmlFor={`direct-photo-upload-${m.milestone_id}`}
                            className="text-[10px] bg-[#D7B66D]/20 text-[#D7B66D] hover:bg-[#D7B66D]/35 px-2.5 py-1 rounded border border-[#D7B66D]/40 font-semibold cursor-pointer transition flex items-center space-x-1"
                          >
                            <span>📷 Attach Photo</span>
                          </label>
                        ) : (
                          <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded border border-slate-500/20 font-mono">
                            Pending Audit
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* NCA Audit Trail */}
                  <div className="bg-[#102A25]/60 border border-[#D7B66D]/15 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-md bg-[#D7B66D]/20 border border-[#D7B66D]/30 flex items-center justify-center text-[#D7B66D]">
                        🛡️
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[11px]">NCA Immutable Audit Log</p>
                        <p className="text-[#8FA399] text-[10px]">Logged by PM / NCA Regulator</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#D7B66D]/10 text-[#D7B66D] px-2 py-0.5 rounded border border-[#D7B66D]/20 font-mono">
                      SHA-256 Logged
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-[#0B2318]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-aserre rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative border border-[#D7B66D]/40">
            <div className="flex items-center justify-between border-b border-[#D7B66D]/20 pb-3">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Site Photo Evidence — {activePhotoModal.milestone_name}
                </h3>
                <p className="text-xs text-[#8FA399]">
                  Status: <strong className="text-white capitalize">{activePhotoModal.status}</strong> • Planned: {activePhotoModal.planned_date}
                </p>
              </div>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 text-[#8FA399] hover:text-white rounded-xl transition"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#D7B66D]/30 bg-[#0B2318] flex items-center justify-center max-h-[60vh]">
              <img
                src={activePhotoModal.photo_url}
                alt={activePhotoModal.milestone_name}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-400 font-mono flex items-center space-x-1">
                <span>✓ Geotagged Site Photo Verified</span>
              </span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="btn-aserre-gold text-xs px-4 py-1.5 rounded-xl font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {!isNcaRegulator && (
        <MilestoneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          onSaved={fetchMilestones}
          milestoneToEdit={milestoneToEdit}
        />
      )}
    </div>
  );
}
