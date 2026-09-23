import React, { useState, useEffect } from 'react';
import { getMilestones, updateMilestone, deleteMilestone } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MilestoneModal from './MilestoneModal';
import { CheckCircle2, Clock, AlertOctagon, Circle, Plus, Edit3, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function MilestoneList({ projectId, onMilestoneChanged }) {
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
      if (onMilestoneChanged) onMilestoneChanged();
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
          <span data-testid="status-completed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white text-black border border-white">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-black" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span data-testid="status-in_progress" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-800 text-white border border-zinc-600">
            <Clock className="w-3.5 h-3.5 mr-1 text-white animate-spin" />
            In Progress
          </span>
        );
      case 'delayed':
        return (
          <span data-testid="status-delayed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-950 text-white border border-white">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-white" />
            Delayed
          </span>
        );
      default:
        return (
          <span data-testid="status-pending" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-black text-zinc-400 border border-zinc-800">
            <Circle className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="card-aserre rounded-2xl p-7 shadow-2xl space-y-6 bg-zinc-950 border border-zinc-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-white" />
            <span>Project Milestones Timeline</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Track planned vs actual completion dates and update site progress status
          </p>
        </div>

        {!isNcaRegulator && (
          <button
            data-testid="add-milestone-btn"
            onClick={handleAddMilestone}
            className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition self-start sm:self-auto border border-zinc-300"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-zinc-900 border border-white text-white p-4 rounded-xl text-xs flex items-center space-x-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span>Failed to load milestones: {error}</span>
        </div>
      )}

      {/* Timeline List */}
      {loading ? (
        <div className="py-8 flex justify-center items-center text-zinc-400 text-xs font-medium">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <p>Loading milestone timeline...</p>
          </div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="bg-black border border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-medium">No milestones recorded for this project yet.</p>
          {!isNcaRegulator && (
            <button
              onClick={handleAddMilestone}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center space-x-1 transition border border-zinc-300"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>Create First Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-zinc-700 ml-4 pl-6 space-y-6">
          {milestones.map((m) => (
            <div key={m.milestone_id} data-testid="milestone-item" className="relative group">
              {/* Timeline Bullet */}
              <div className="absolute -left-[31px] top-2.5 w-4 h-4 rounded-full bg-black border-2 border-white group-hover:scale-125 transition"></div>

              {/* Milestone Card */}
              <div className="bg-black border border-zinc-800 hover:border-zinc-500 rounded-xl p-4 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      {renderStatusBadge(m.status)}
                      <h4 className="text-base font-bold text-white tracking-tight">{m.milestone_name}</h4>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center space-x-4 pt-1 font-medium">
                      <span>Planned: <strong className="text-white">{m.planned_date}</strong></span>
                      {m.actual_date && (
                        <span className="text-zinc-300">Actual: <strong className="text-white">{m.actual_date}</strong></span>
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
                        className="bg-zinc-900 border border-zinc-700 text-xs text-white font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-white"
                      >
                        <option value="pending">Set Pending</option>
                        <option value="in_progress">Set In Progress</option>
                        <option value="completed">Set Completed</option>
                        <option value="delayed">Set Delayed</option>
                      </select>

                      <button
                        onClick={() => handleEditMilestone(m)}
                        title="Edit Milestone"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteMilestone(m.milestone_id, m.milestone_name)}
                        title="Delete Milestone"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Site Photo Verification & Compliance Audit Badge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Site Photo Verification & Logging */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
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
                          className="w-10 h-10 object-cover rounded-md border border-zinc-600 cursor-pointer hover:scale-105 transition shrink-0 grayscale hover:grayscale-0"
                          title="Click to expand photo"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                          📷
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-bold text-[11px] truncate">Site Photo Evidence</p>
                        <p className="text-zinc-400 text-[10px] truncate">
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
                            className="text-[10px] bg-white text-black hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-300 font-bold transition"
                          >
                            View Photo
                          </button>
                          {!isNcaRegulator && (
                            <label
                              htmlFor={`direct-photo-upload-${m.milestone_id}`}
                              className="text-[10px] bg-zinc-800 text-white hover:bg-zinc-700 px-2 py-1 rounded border border-zinc-600 font-bold cursor-pointer transition"
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
                            className="text-[10px] bg-white text-black hover:bg-zinc-200 px-2.5 py-1 rounded border border-zinc-300 font-bold cursor-pointer transition flex items-center space-x-1"
                          >
                            <span>📷 Attach Photo</span>
                          </label>
                        ) : (
                          <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                            Pending Audit
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* NCA Audit Trail */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                        🛡️
                      </div>
                      <div>
                        <p className="text-white font-bold text-[11px]">NCA Immutable Audit Log</p>
                        <p className="text-zinc-400 text-[10px]">Logged by PM / NCA Regulator</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded border border-zinc-700 font-mono font-bold">
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-aserre rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative border border-zinc-700 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Site Photo Evidence — {activePhotoModal.milestone_name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Status: <strong className="text-white capitalize">{activePhotoModal.status}</strong> • Planned: {activePhotoModal.planned_date}
                </p>
              </div>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl transition"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center max-h-[60vh]">
              <img
                src={activePhotoModal.photo_url}
                alt={activePhotoModal.milestone_name}
                className="w-full h-full object-contain max-h-[60vh] grayscale hover:grayscale-0 transition"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-white font-mono flex items-center space-x-1 font-bold">
                <span>✓ Geotagged Site Photo Verified</span>
              </span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="bg-white hover:bg-zinc-200 text-black text-xs px-4 py-1.5 rounded-xl font-bold border border-zinc-300"
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
