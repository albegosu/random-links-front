const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request URL:', url);
      console.error('Request config:', config);
      throw error;
    }
  }

  // Links
  async getLinks() {
    return this.request('/links');
  }

  async getLink(id) {
    return this.request(`/links/${id}`);
  }

  async createLink(link) {
    return this.request('/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async updateLink(id, link) {
    return this.request(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(link),
    });
  }

  async deleteLink(id) {
    return this.request(`/links/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(category) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(name, color) {
    return this.request(`/categories/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ color }),
    });
  }

  async deleteCategory(name) {
    return this.request(`/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  // Title
  async getTitle() {
    const result = await this.request('/title');
    return result.title;
  }

  async updateTitle(title) {
    const result = await this.request('/title', {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
    return result.title;
  }
}

export default new ApiClient();

