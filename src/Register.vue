<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Create Account</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Choose a username" 
            required
            autocomplete="username"
            minlength="3"
          >
          <small>At least 3 characters</small>
        </div>
        <div class="form-group">
          <label>Email (optional)</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="your@email.com" 
            autocomplete="email"
          >
        </div>
        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Choose a password" 
            required
            autocomplete="new-password"
            minlength="6"
          >
          <small>At least 6 characters</small>
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Confirm your password" 
            required
            autocomplete="new-password"
          >
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>
      <div class="auth-footer">
        <p>Already have an account? <a href="#" @click.prevent="$emit('switch-to-login')">Login</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import api from './api.js'

export default {
  name: 'Register',
  emits: ['register-success', 'switch-to-login'],
  setup(props, { emit }) {
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const error = ref(null)
    const loading = ref(false)

    const handleRegister = async () => {
      error.value = null

      // Validation
      if (username.value.length < 3) {
        error.value = 'Username must be at least 3 characters'
        return
      }

      if (password.value.length < 6) {
        error.value = 'Password must be at least 6 characters'
        return
      }

      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match'
        return
      }

      loading.value = true

      try {
        const result = await api.register(username.value, password.value, email.value || null)
        emit('register-success', result.user)
      } catch (err) {
        error.value = err.message || 'Failed to create account. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return {
      username,
      email,
      password,
      confirmPassword,
      error,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow: auto;
}

.auth-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.auth-card h1 {
  color: white;
  margin-bottom: 30px;
  text-align: center;
  font-size: 2rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: white;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.15);
}

.form-group small {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  font-size: 0.85rem;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(239, 68, 68, 0.2);
  color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
}

.auth-footer p {
  color: white;
}

.auth-footer a {
  color: white;
  text-decoration: underline;
  cursor: pointer;
}

.auth-footer a:hover {
  opacity: 0.8;
}
</style>

