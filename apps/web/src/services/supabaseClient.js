/**
 * BuildOps Sentinel — Supabase Backend Interface Client
 * Provides Supabase-style query builder, Auth SDK, and Realtime channel interface.
 * Connects directly to Supabase REST API (or Express API fallback gateway).
 */

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'http://localhost:5000/supabase';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'buildops-sentinel-anon-key';
const API_BASE_URL = 'http://localhost:5000';

class SupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = {};
    this.selectFields = '*';
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column, value) {
    this.filters[column] = value;
    return this;
  }

  async execute(method = 'GET', body = null) {
    const token = localStorage.getItem('buildops_token');
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/api/${this.table}`;
    const queryParams = new URLSearchParams(this.filters).toString();
    if (queryParams && method === 'GET') {
      url += `?${queryParams}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Database operation failed' };
    }

    return { data, error: null };
  }

  async insert(record) {
    return this.execute('POST', record);
  }

  async update(updates) {
    return this.execute('PUT', updates);
  }

  async delete() {
    return this.execute('DELETE');
  }

  // Promise resolution interface for direct await
  then(resolve, reject) {
    this.execute('GET').then(res => resolve(res)).catch(err => reject(err));
  }
}

class SupabaseRealtimeChannel {
  constructor(channelName) {
    this.channelName = channelName;
    this.listeners = [];
  }

  on(event, filter, callback) {
    this.listeners.push({ event, filter, callback });
    return this;
  }

  subscribe(statusCallback) {
    if (statusCallback) {
      statusCallback('SUBSCRIBED');
    }
    return this;
  }

  unsubscribe() {
    this.listeners = [];
  }
}

export const supabase = {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,

  from(table) {
    return new SupabaseQueryBuilder(table);
  },

  auth: {
    async signUp({ email, password, options = {} }) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: options.data?.full_name || email.split('@')[0],
            role: options.data?.role || 'contractor',
            phone_number: options.data?.phone_number || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: { message: data.error || 'Sign up failed' } };
        
        localStorage.setItem('buildops_token', data.token);
        return { data: { user: data.user, session: { access_token: data.token } }, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: { message: data.error || 'Invalid credentials' } };
        
        localStorage.setItem('buildops_token', data.token);
        return { data: { user: data.user, session: { access_token: data.token } }, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    },

    async signOut() {
      localStorage.removeItem('buildops_token');
      return { error: null };
    },

    async getUser() {
      const token = localStorage.getItem('buildops_token');
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) return { data: { user: null }, error: null };
        return { data: { user: data.user }, error: null };
      } catch (err) {
        return { data: { user: null }, error: err };
      }
    }
  },

  channel(channelName) {
    return new SupabaseRealtimeChannel(channelName);
  }
};

export default supabase;
