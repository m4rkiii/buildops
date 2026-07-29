const API_BASE_URL = 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('buildops_token');
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

// Projects API
export async function getProjects() {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function getProjectById(id) {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function createProject(projectData) {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  return handleResponse(res);
}

export async function updateProject(id, projectData) {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  return handleResponse(res);
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

// Milestones API
export async function getMilestones(projectId) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function createMilestone(projectId, milestoneData) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(milestoneData)
  });
  return handleResponse(res);
}

export async function updateMilestone(projectId, milestoneId, milestoneData) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(milestoneData)
  });
  return handleResponse(res);
}

export async function deleteMilestone(projectId, milestoneId) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

// Notifications API
export async function getNotifications() {
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function getProjectNotifications(projectId) {
  const res = await fetch(`${API_BASE_URL}/notifications/project/${projectId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function getProjectDigest(projectId) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/digest`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}
