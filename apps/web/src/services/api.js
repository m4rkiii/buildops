const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';

function getAuthHeaders() {
  let token = localStorage.getItem('buildops_token');
  if (!token) {
    try {
      const supabaseAuth = JSON.parse(localStorage.getItem('buildops_supabase_auth') || '{}');
      token = supabaseAuth?.access_token;
    } catch {
      // Ignore parse error
    }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status} Error`);
  }
  return data;
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res);
  } catch (err) {
    if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed'))) {
      throw new Error(`Backend server unavailable (${API_BASE_URL}). Set VITE_API_BASE_URL in Render environment variables to your live API URL.`);
    }
    throw err;
  }
}

// Local Storage Cache Helpers
function getCachedProjects() {
  try {
    const raw = localStorage.getItem('buildops_cached_projects');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedProjects(projects) {
  try {
    localStorage.setItem('buildops_cached_projects', JSON.stringify(projects));
  } catch {
    // Ignore quota errors
  }
}

// Projects API
export async function getProjects() {
  try {
    const data = await safeFetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders()
    });
    if (data && Array.isArray(data.projects)) {
      const cached = getCachedProjects();
      const backendIds = new Set(data.projects.map(p => p.project_id));
      const localOnly = cached.filter(p => p && p.project_id && !backendIds.has(p.project_id));

      // Auto-sync local-only cached projects to backend so they exist server-side
      for (const localProj of localOnly) {
        createProject(localProj).catch(() => {});
      }

      const merged = [...data.projects, ...localOnly];
      saveCachedProjects(merged);
      return { projects: merged };
    }
    return data;
  } catch (err) {
    const cached = getCachedProjects();
    if (cached.length > 0) {
      console.warn('[API Cache Warning] Serving cached projects due to error:', err.message);
      return { projects: cached, isOffline: true };
    }
    throw err;
  }
}

export async function getProjectById(id) {
  return safeFetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders()
  });
}

export async function createProject(projectData) {
  const result = await safeFetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  if (result && result.project) {
    const cached = getCachedProjects();
    saveCachedProjects([result.project, ...cached]);
  }
  return result;
}

export async function updateProject(id, projectData) {
  const result = await safeFetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  if (result && result.project) {
    const cached = getCachedProjects().map(p => p.project_id === id ? { ...p, ...result.project } : p);
    saveCachedProjects(cached);
  }
  return result;
}

export async function deleteProject(id) {
  const result = await safeFetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const cached = getCachedProjects().filter(p => p && p.project_id !== id);
  saveCachedProjects(cached);
  return result;
}

// Milestones API
export async function getMilestones(projectId) {
  return safeFetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
    headers: getAuthHeaders()
  });
}

export async function createMilestone(projectId, milestoneData) {
  return safeFetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(milestoneData)
  });
}

export async function updateMilestone(projectId, milestoneId, milestoneData) {
  return safeFetch(`${API_BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(milestoneData)
  });
}

export async function deleteMilestone(projectId, milestoneId) {
  return safeFetch(`${API_BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

// Notifications API
export async function getNotifications() {
  return safeFetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders()
  });
}

export async function getProjectNotifications(projectId) {
  return safeFetch(`${API_BASE_URL}/notifications/project/${projectId}`, {
    headers: getAuthHeaders()
  });
}

export async function getProjectDigest(projectId) {
  return safeFetch(`${API_BASE_URL}/projects/${projectId}/digest`, {
    headers: getAuthHeaders()
  });
}
