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

// Projects API
export async function getProjects() {
  return safeFetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders()
  });
}

export async function getProjectById(id) {
  return safeFetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders()
  });
}

export async function createProject(projectData) {
  return safeFetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
}

export async function updateProject(id, projectData) {
  return safeFetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
}

export async function deleteProject(id) {
  return safeFetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
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
