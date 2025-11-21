<template>
  <div class="app-container">
    <!-- Header with controls -->
    <header class="header">
      <div class="title-container">
        <h1 
          v-if="!editingTitle" 
          class="title" 
          @dblclick="startEditingTitle"
          :title="editMode ? 'Double-click to edit' : ''"
        >
          {{ pageTitle }}
        </h1>
        <input
          v-else
          v-model="titleInput"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          @keyup.esc="cancelEditingTitle"
          class="title-input"
          ref="titleInputRef"
        />
      </div>
      <div class="controls">
        <button @click="showAddModal = true" class="btn btn-primary">
          <span>+</span> Add Link
        </button>
        <button @click="showCategoryModal = true" class="btn btn-secondary">
          <span>📁</span> Manage Categories
        </button>
        <button @click="toggleEditMode" class="btn" :class="{ 'btn-active': editMode }">
          <span>✏️</span> {{ editMode ? 'Done Editing' : 'Edit Mode' }}
        </button>
      </div>
    </header>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      <strong>Error:</strong> {{ error }}
      <button @click="error = null" class="error-close">×</button>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- Main content area with draggable links -->
    <main class="main-content" @click="handleBackgroundClick">
      <div
        v-for="link in links"
        :key="link.id"
        class="link-button"
        :class="{ 'dragging': link.id === draggingId, 'edit-mode': editMode }"
        :style="{
          left: link.x + 'px',
          top: link.y + 'px',
          '--category-color': getCategoryColor(link.category)
        }"
        @mousedown="startDrag($event, link.id)"
        @click.stop="handleLinkClick(link)"
      >
        <div class="link-content">
          <div class="link-icon">{{ getLinkIcon(link.url) }}</div>
          <div class="link-info">
            <div class="link-title">{{ link.title || 'Untitled' }}</div>
            <div class="link-category" v-if="link.category">{{ link.category }}</div>
          </div>
        </div>
        <div v-if="editMode" class="link-actions">
          <button @click.stop="editLink(link)" class="action-btn edit-btn">✏️</button>
          <button @click.stop="deleteLink(link.id)" class="action-btn delete-btn">🗑️</button>
        </div>
      </div>
    </main>

    <!-- Add/Edit Link Modal -->
    <div v-if="showAddModal || editingLink" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h2>{{ editingLink ? 'Edit Link' : 'Add New Link' }}</h2>
        <form @submit.prevent="saveLink">
          <div class="form-group">
            <label>Title</label>
            <input v-model="linkForm.title" type="text" placeholder="Link title" required>
          </div>
          <div class="form-group">
            <label>URL</label>
            <input v-model="linkForm.url" type="url" placeholder="https://example.com" required>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="linkForm.category">
              <option value="">No Category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Category Management Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click="showCategoryModal = false">
      <div class="modal" @click.stop>
        <h2>Manage Categories</h2>
        <div class="category-list">
          <div v-for="(cat, index) in categories" :key="cat" class="category-item">
            <div class="category-color-picker">
              <input type="color" :value="getCategoryColor(cat)" @input="updateCategoryColor(cat, $event.target.value)">
            </div>
            <input v-model="categories[index]" type="text" class="category-input">
            <button @click="deleteCategory(cat)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
        <div class="form-group">
          <input
            v-model="newCategory"
            type="text"
            placeholder="New category name"
            @keyup.enter="addCategory"
            class="category-input"
          >
          <button @click="addCategory" class="btn btn-primary btn-small">Add Category</button>
        </div>
        <div class="form-actions">
          <button @click="showCategoryModal = false" class="btn btn-primary">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import api from './api.js'

export default {
  name: 'App',
  setup() {
    const links = ref([])
    const categories = ref([])
    const categoryColors = ref({})
    const editMode = ref(false)
    const showAddModal = ref(false)
    const showCategoryModal = ref(false)
    const editingLink = ref(null)
    const draggingId = ref(null)
    const dragOffset = ref({ x: 0, y: 0 })
    const hasDragged = ref(false)
    const dragStartPos = ref({ x: 0, y: 0 })
    const justFinishedDrag = ref(false)
    const newCategory = ref('')
    const loading = ref(false)
    const error = ref(null)
    const pageTitle = ref('My Links')
    const editingTitle = ref(false)
    const titleInput = ref('')
    const titleInputRef = ref(null)

    const linkForm = reactive({
      title: '',
      url: '',
      category: ''
    })

    // Load data from API
    const loadData = async () => {
      loading.value = true
      error.value = null
      try {
        // Load title
        try {
          const title = await api.getTitle()
          pageTitle.value = title || 'My Links'
        } catch (err) {
          console.warn('Could not load title, using default')
        }

        // Load links
        const loadedLinks = await api.getLinks()
        links.value = loadedLinks.map(link => ({
          ...link,
          x: link.x !== undefined && link.x !== null ? link.x : 100,
          y: link.y !== undefined && link.y !== null ? link.y : 100
        }))

        // Load categories
        const loadedCategories = await api.getCategories()
        if (loadedCategories.length > 0) {
          categories.value = loadedCategories.map(cat => cat.name)
          loadedCategories.forEach(cat => {
            categoryColors.value[cat.name] = cat.color
          })
        } else {
          // Initialize default categories if none exist
          const defaultCategories = ['Work', 'Personal', 'Social', 'Tools']
          for (const cat of defaultCategories) {
            const color = getRandomColor()
            await api.createCategory({ name: cat, color })
            categories.value.push(cat)
            categoryColors.value[cat] = color
          }
        }
      } catch (err) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        error.value = `Failed to load data. Check: 1) Backend is running, 2) API URL is correct (${apiUrl}), 3) CORS is configured. See console for details.`
        console.error('Error loading data:', err)
        console.error('API URL:', apiUrl)
        // Fallback to empty state
        links.value = []
        categories.value = []
      } finally {
        loading.value = false
      }
    }

    // Initialize default category colors
    const initializeCategoryColors = () => {
      categories.value.forEach(cat => {
        if (!categoryColors.value[cat]) {
          categoryColors.value[cat] = getRandomColor()
        }
      })
    }

    const getRandomColor = () => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
      return colors[Math.floor(Math.random() * colors.length)]
    }

    const getCategoryColor = (category) => {
      if (!category) return '#6366f1'
      return categoryColors.value[category] || '#6366f1'
    }

    const getLinkIcon = (url) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        return domain.charAt(0).toUpperCase()
      } catch {
        return '🔗'
      }
    }

    const toggleEditMode = () => {
      editMode.value = !editMode.value
    }

    const closeModal = () => {
      showAddModal.value = false
      editingLink.value = null
      linkForm.title = ''
      linkForm.url = ''
      linkForm.category = ''
    }

    const saveLink = async () => {
      try {
        if (editingLink.value) {
          // Update existing link - preserve position
          const existingLink = links.value.find(l => l.id === editingLink.value.id)
          const updatedLink = await api.updateLink(editingLink.value.id, {
            title: linkForm.title,
            url: linkForm.url,
            category: linkForm.category || null,
            x: existingLink?.x !== undefined ? existingLink.x : 100,
            y: existingLink?.y !== undefined ? existingLink.y : 100
          })
          const index = links.value.findIndex(l => l.id === editingLink.value.id)
          if (index !== -1) {
            links.value[index] = updatedLink
          }
        } else {
          // Add new link
          const newLink = await api.createLink({
            title: linkForm.title,
            url: linkForm.url,
            category: linkForm.category || null,
            x: Math.random() * (window.innerWidth - 200) + 50,
            y: Math.random() * (window.innerHeight - 150) + 100
          })
          links.value.push(newLink)
        }
        closeModal()
      } catch (err) {
        error.value = 'Failed to save link. Please try again.'
        console.error('Error saving link:', err)
      }
    }

    const editLink = (link) => {
      editingLink.value = link
      linkForm.title = link.title
      linkForm.url = link.url
      linkForm.category = link.category || ''
    }

    const deleteLink = async (id) => {
      try {
        await api.deleteLink(id)
        links.value = links.value.filter(l => l.id !== id)
      } catch (err) {
        error.value = 'Failed to delete link. Please try again.'
        console.error('Error deleting link:', err)
      }
    }

    const handleLinkClick = (link, event) => {
      // Don't open link if we just finished dragging
      if (justFinishedDrag.value) {
        justFinishedDrag.value = false
        return
      }
      
      // Only open link if not in edit mode
      if (!editMode.value) {
        window.open(link.url, '_blank')
      }
    }

    const handleBackgroundClick = () => {
      if (editMode.value) {
        // Could add functionality to place new links on click
      }
    }

    // Drag and drop functionality
    const startDrag = (event, linkId) => {
      // Allow dragging in both edit mode and normal mode
      draggingId.value = linkId
      hasDragged.value = false
      dragStartPos.value = { x: event.clientX, y: event.clientY }
      
      const link = links.value.find(l => l.id === linkId)
      dragOffset.value = {
        x: event.clientX - link.x,
        y: event.clientY - link.y
      }

      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
    }

    const onDrag = (event) => {
      if (!draggingId.value) return
      
      // Check if mouse has moved significantly (more than 5px) to consider it a drag
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - dragStartPos.value.x, 2) + 
        Math.pow(event.clientY - dragStartPos.value.y, 2)
      )
      
      if (moveDistance > 5) {
        hasDragged.value = true
      }
      
      const link = links.value.find(l => l.id === draggingId.value)
      if (link) {
        link.x = event.clientX - dragOffset.value.x
        link.y = event.clientY - dragOffset.value.y
        
        // Keep within bounds
        link.x = Math.max(0, Math.min(link.x, window.innerWidth - 200))
        link.y = Math.max(100, Math.min(link.y, window.innerHeight - 100))
      }
    }

    const stopDrag = async (event) => {
      const wasDragging = draggingId.value !== null
      const didDrag = hasDragged.value
      
      if (wasDragging) {
        const link = links.value.find(l => l.id === draggingId.value)
        if (link && didDrag) {
          // Mark that we just finished a drag to prevent click from opening link
          justFinishedDrag.value = true
          
          // Save position to API
          try {
            await api.updateLink(link.id, {
              x: link.x,
              y: link.y
            })
          } catch (err) {
            console.error('Error saving link position:', err)
          }
          
          // Reset flag after click event has had time to fire
          setTimeout(() => {
            justFinishedDrag.value = false
          }, 200)
        }
        
        draggingId.value = null
        hasDragged.value = false
      }
      
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // Category management
    const addCategory = async () => {
      const categoryName = newCategory.value.trim()
      if (categoryName && !categories.value.includes(categoryName)) {
        try {
          const color = getRandomColor()
          await api.createCategory({ name: categoryName, color })
          categories.value.push(categoryName)
          categoryColors.value[categoryName] = color
          newCategory.value = ''
        } catch (err) {
          error.value = 'Failed to create category. Please try again.'
          console.error('Error creating category:', err)
        }
      }
    }

    const deleteCategory = async (category) => {
      try {
        await api.deleteCategory(category)
        categories.value = categories.value.filter(c => c !== category)
        delete categoryColors.value[category]
        // Remove category from links
        links.value.forEach(async (link) => {
          if (link.category === category) {
            try {
              await api.updateLink(link.id, { category: null })
              link.category = null
            } catch (err) {
              console.error('Error updating link category:', err)
            }
          }
        })
      } catch (err) {
        error.value = 'Failed to delete category. Please try again.'
        console.error('Error deleting category:', err)
      }
    }

    const updateCategoryColor = async (category, color) => {
      try {
        await api.updateCategory(category, color)
        categoryColors.value[category] = color
      } catch (err) {
        error.value = 'Failed to update category color. Please try again.'
        console.error('Error updating category color:', err)
      }
    }

    // Title editing
    const startEditingTitle = () => {
      if (!editMode.value) return
      editingTitle.value = true
      titleInput.value = pageTitle.value
      // Focus input after it's rendered
      setTimeout(() => {
        if (titleInputRef.value) {
          titleInputRef.value.focus()
          titleInputRef.value.select()
        }
      }, 0)
    }

    const saveTitle = async () => {
      if (!editingTitle.value) return
      
      const newTitle = titleInput.value.trim() || 'My Links'
      if (newTitle !== pageTitle.value) {
        try {
          await api.updateTitle(newTitle)
          pageTitle.value = newTitle
        } catch (err) {
          error.value = 'Failed to save title. Please try again.'
          console.error('Error saving title:', err)
        }
      }
      editingTitle.value = false
    }

    const cancelEditingTitle = () => {
      editingTitle.value = false
      titleInput.value = pageTitle.value
    }

    onMounted(() => {
      loadData()
      initializeCategoryColors()
    })

    return {
      links,
      categories,
      categoryColors,
      editMode,
      showAddModal,
      showCategoryModal,
      editingLink,
      draggingId,
      linkForm,
      newCategory,
      loading,
      error,
      toggleEditMode,
      closeModal,
      saveLink,
      editLink,
      deleteLink,
      handleLinkClick,
      handleBackgroundClick,
      startDrag,
      getCategoryColor,
      getLinkIcon,
      addCategory,
      deleteCategory,
      updateCategoryColor,
      pageTitle,
      editingTitle,
      titleInput,
      titleInputRef,
      startEditingTitle,
      saveTitle,
      cancelEditingTitle
    }
  }
}
</script>

