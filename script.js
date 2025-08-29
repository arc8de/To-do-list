// TaskManager Application - JavaScript Implementation
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    // Initialize the application
    init() {
        this.renderTasks();
        this.updateTaskCounter();
        this.bindEvents();
        this.updateEmptyState();
    }

    // Bind event listeners
    bindEvents() {
        // Add task button and Enter key
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear completed button
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());

        // Modal events
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('editInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
            if (e.key === 'Escape') this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeModal();
            }
        });
    }

    // Add a new task
    addTask() {
        const input = document.getElementById('taskInput');
        const taskText = input.value.trim();

        if (taskText === '') {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        if (taskText.length > 100) {
            this.showNotification('Task is too long! Maximum 100 characters.', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        input.value = '';
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounter();
        this.updateEmptyState();
        this.showNotification('Task added successfully!', 'success');
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounter();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as active';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    // Delete a task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounter();
            this.updateEmptyState();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    // Open edit modal
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            document.getElementById('editInput').value = task.text;
            document.getElementById('editModal').style.display = 'block';
            document.getElementById('editInput').focus();
            document.getElementById('editInput').select();
        }
    }

    // Save edited task
    saveEdit() {
        const newText = document.getElementById('editInput').value.trim();
        
        if (newText === '') {
            this.showNotification('Task cannot be empty!', 'error');
            return;
        }

        if (newText.length > 100) {
            this.showNotification('Task is too long! Maximum 100 characters.', 'error');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
            this.closeModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    // Close modal
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingTaskId = null;
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
        this.updateTaskCounter();
    }

    // Clear completed tasks
    clearCompleted() {
        const completedTasks = this.tasks.filter(t => t.completed);
        
        if (completedTasks.length === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedTasks.length} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounter();
            this.updateEmptyState();
            this.showNotification(`${completedTasks.length} completed task(s) cleared!`, 'success');
        }
    }

    // Get filtered tasks
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    // Render tasks
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="taskManager.toggleTask(${task.id})">
                <span class="task-text" ondblclick="taskManager.editTask(${task.id})">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="taskManager.editTask(${task.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });

        this.updateClearButton();
    }

    // Update task counter
    updateTaskCounter() {
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        const counterElement = document.getElementById('taskCount');
        counterElement.textContent = activeTasks;
        
        // Update counter text
        const counterText = counterElement.nextSibling;
        counterText.textContent = ` task${activeTasks !== 1 ? 's' : ''} remaining`;
    }

    // Update clear button state
    updateClearButton() {
        const clearBtn = document.getElementById('clearCompleted');
        const completedTasks = this.tasks.filter(t => t.completed).length;
        clearBtn.disabled = completedTasks === 0;
        clearBtn.textContent = `Clear Completed${completedTasks > 0 ? ` (${completedTasks})` : ''}`;
    }

    // Update empty state
    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
            
            // Update empty state message based on current filter
            const icon = emptyState.querySelector('i');
            const title = emptyState.querySelector('h3');
            const message = emptyState.querySelector('p');
            
            switch (this.currentFilter) {
                case 'active':
                    icon.className = 'fas fa-check-circle';
                    title.textContent = 'All tasks completed!';
                    message.textContent = 'Great job! You\'ve completed all your tasks.';
                    break;
                case 'completed':
                    icon.className = 'fas fa-clock';
                    title.textContent = 'No completed tasks';
                    message.textContent = 'Complete some tasks to see them here.';
                    break;
                default:
                    icon.className = 'fas fa-clipboard-check';
                    title.textContent = 'No tasks yet';
                    message.textContent = 'Add a task to get started on your productivity journey!';
            }
        } else {
            emptyState.classList.add('hidden');
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '2000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#667eea',
            warning: '#ed8936'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM and animate in
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Get statistics
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            active,
            completionRate
        };
    }

    // Export tasks (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!', 'success');
    }

    // Import tasks (bonus feature)
    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    if (confirm('This will replace all existing tasks. Continue?')) {
                        this.tasks = importedTasks;
                        this.saveTasks();
                        this.renderTasks();
                        this.updateTaskCounter();
                        this.updateEmptyState();
                        this.showNotification('Tasks imported successfully!', 'success');
                    }
                } else {
                    this.showNotification('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading file!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('editModal');
        if (modal.style.display === 'block') {
            taskManager.closeModal();
        }
    }
});

// Service Worker for offline functionality (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}