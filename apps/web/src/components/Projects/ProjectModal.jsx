import React, { useState, useEffect } from 'react';
import { createProject, updateProject } from '../../services/api';
import { X, Building2, MapPin, DollarSign, Calendar, AlertCircle, Save } from 'lucide-react';

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Uasin Gishu',
  'Kilifi', 'Kajiado', 'Meru', 'Nyeri', 'Kakamega', 'Murang\'a', 'Kericho', 'Bungoma', 'Laikipia'
];

const PROJECT_TYPES = [
  'Commercial', 'Residential', 'Infrastructure', 'Industrial', 'Institutional', 'Civil Works'
];

const NCA_GRADES = ['NCA 1', 'NCA 2', 'NCA 3', 'NCA 4', 'NCA 5', 'NCA 6', 'NCA 7', 'NCA 8'];

export default function ProjectModal({ isOpen, onClose, onSaved, projectToEdit }) {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Commercial');
  const [county, setCounty] = useState('Nairobi');
  const [ncaGrade, setNcaGrade] = useState('NCA 1');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setProjectName(projectToEdit.project_name || '');
      setProjectType(projectToEdit.project_type || 'Commercial');
      setCounty(projectToEdit.county || 'Nairobi');
      setNcaGrade(projectToEdit.nca_contractor_grade || 'NCA 1');
      setBudget(projectToEdit.budget_ksh || '');
      setStartDate(projectToEdit.planned_start_date || '');
      setEndDate(projectToEdit.planned_end_date || '');
    } else {
      setProjectName('');
      setProjectType('Commercial');
      setCounty('Nairobi');
      setNcaGrade('NCA 1');
      setBudget('');
      setStartDate('');
      setEndDate('');
    }
    setError(null);
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!projectName || !budget || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        project_name: projectName,
        project_type: projectType,
        county,
        nca_contractor_grade: ncaGrade,
        budget_ksh: parseFloat(budget),
        planned_start_date: startDate,
        planned_end_date: endDate
      };

      if (projectToEdit) {
        await updateProject(projectToEdit.project_id, payload);
      } else {
        await createProject(payload);
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {projectToEdit ? 'Edit Construction Project' : 'Create Construction Project'}
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
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Nairobi High-Rise Commercial Tower"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Type & County Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Type *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">County *</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Budget & NCA Grade Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Budget (KSh) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">KSh</span>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="450000000"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg pl-12 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">NCA Contractor Grade</label>
              <select
                value={ncaGrade}
                onChange={(e) => setNcaGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {NCA_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Planned Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Planned End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
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
                  <span>{projectToEdit ? 'Save Changes' : 'Create Project'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
