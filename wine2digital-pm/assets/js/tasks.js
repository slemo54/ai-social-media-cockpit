import { apiFetch } from './api.js';

const board = document.querySelector('[data-role="kanban-board"]');
const projectId = board?.dataset.projectId;
const canManage = board?.dataset.canManage === '1';
const currentUser = board?.dataset.currentUser;
const taskForm = document.getElementById('taskForm');
const statusSelect = document.getElementById('taskStatusSelect');
const tagSelect = document.getElementById('taskTagsSelect');
const assigneeSelect = document.getElementById('taskAssigneesSelect');
const assigneePicker = document.querySelector('[data-role="assignee-picker"]');
const assigneeChipsContainer = assigneePicker?.querySelector('[data-role="assignee-chips"]');
const assigneeSearchInput = assigneePicker?.querySelector('[data-role="assignee-search"]');
const assigneeDropdown = assigneePicker?.querySelector('[data-role="assignee-dropdown"]');
const statusForm = document.getElementById('statusForm');
const statusList = document.querySelector('[data-role="status-list"]');
const taskIdInput = taskForm?.querySelector('input[name="id"]');
const modalTitle = document.getElementById('taskModalTitle');
const submitButton = taskForm?.querySelector('button[type="submit"]');
const titleInput = taskForm?.querySelector('input[name="title"]');
const descriptionInput = taskForm?.querySelector('textarea[name="description"]');
const prioritySelect = taskForm?.querySelector('select[name="priority"]');
const dueDateInput = taskForm?.querySelector('input[name="due_date"]');
let cachedStatuses = [];
let cachedProjectTags = [];
let projectMembers = [];
let taskLookup = new Map();
let assigneeDropdownOpen = false;
let selectedAssigneeIds = new Set();

// Commenti
// Commenti gestiti dinamicamente per evitare problemi di inizializzazione

function formatDate(dateString) {
  if (!dateString) return 'Senza scadenza';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function getInitials(name = '') {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function renderAssigneeBadges(assignees = []) {
  if (!assignees.length) return '';
  const badges = assignees
    .map(
      (assignee) => `
        <span class="avatar-pill" title="${assignee.name}">
          ${assignee.avatar_url ? `<img src="${assignee.avatar_url}" alt="${assignee.name}">` : getInitials(assignee.name)}
        </span>
      `
    )
    .join('');
  return `<div class="task-assignees">${badges}</div>`;
}

function setMultiSelectValues(select, values = []) {
  if (!select) return;
  const normalized = values.map((value) => String(value));
  Array.from(select.options).forEach((option) => {
    option.selected = normalized.includes(option.value);
  });
}

function getSelectedAssigneeIds() {
  return Array.from(selectedAssigneeIds);
}

function setSelectedAssignees(ids = []) {
  console.log('[SELECT] setSelectedAssignees called with:', ids);

  // Add stack trace when called with empty array to debug the issue
  if (ids.length === 0) {
    console.warn('[SELECT] ⚠️ Called with EMPTY array! Stack trace:');
    console.trace();
  }

  selectedAssigneeIds = new Set(ids.map(String));

  console.log('[SELECT] selectedAssigneeIds Set:', Array.from(selectedAssigneeIds));

  if (assigneeSelect) {
    const normalized = Array.from(selectedAssigneeIds);
    Array.from(assigneeSelect.options).forEach((option) => {
      option.selected = normalized.includes(option.value);
    });
    console.log('[SELECT] Updated assigneeSelect with', normalized.length, 'selected');
  }

  console.log('[SELECT] Calling renderAssigneeChips, container exists:', !!assigneeChipsContainer);
  renderAssigneeChips();
  renderAssigneeDropdown(assigneeSearchInput?.value || '');
}

function populateAssigneesSelect(selectedIds = []) {
  if (!assigneeSelect) return;

  if (!projectMembers.length) {
    assigneeSelect.innerHTML = '';
    assigneeSelect.disabled = true;
    if (assigneeSearchInput) assigneeSearchInput.disabled = true;
    renderAssigneeChips();
    renderAssigneeDropdown();
    return;
  }

  assigneeSelect.disabled = false;
  // if (assigneeSearchInput) assigneeSearchInput.disabled = false; // Removed search input

  renderAssigneeChips();
  renderAssigneeDropdown(); // No search arg
}


function renderAssigneeChips() {
  console.log('[CHIPS] renderAssigneeChips called, container:', !!assigneeChipsContainer);
  if (!assigneeChipsContainer) return;

  const selectedIds = getSelectedAssigneeIds();
  console.log('[CHIPS] selectedIds:', selectedIds);

  if (!selectedIds.length) {
    assigneeChipsContainer.innerHTML = '<span class="assignee-placeholder">Nessun assegnatario</span>';
    console.log('[CHIPS] No selection, showing placeholder');
    return;
  }

  console.log('[CHIPS] projectMembers count:', projectMembers.length);
  assigneeChipsContainer.innerHTML = selectedIds
    .map((id) => {
      const member = projectMembers.find((m) => String(m.id) === String(id));
      console.log('[CHIPS] Rendering chip for ID:', id, 'member:', member);
      const name = member?.name || 'Sconosciuto';
      return `<span class="assignee-chip" data-user-id="${id}"><span>${name}</span><button type="button" data-remove-assignee="${id}" aria-label="Rimuovi ${name}">&times;</button></span>`;
    })
    .join('');
  console.log('[CHIPS] Chips HTML length:', assigneeChipsContainer.innerHTML.length);
}

function renderAssigneeDropdown(filterText = '') {
  if (!assigneeDropdown) return;
  if (!projectMembers.length) {
    assigneeDropdown.innerHTML = '<p class="dropdown-empty">Nessun membro disponibile</p>';
    return;
  }
  const query = filterText.trim().toLowerCase();
  const matches = projectMembers.filter((member) => {
    const label = `${member.name} ${member.email || ''}`.toLowerCase();
    return query ? label.includes(query) : true;
  });
  if (!matches.length) {
    assigneeDropdown.innerHTML = '<p class="dropdown-empty">Nessun risultato</p>';
    return;
  }
  const selected = new Set(getSelectedAssigneeIds().map(String));
  assigneeDropdown.innerHTML = matches
    .map(
      (member) => `
        <div role="button" tabindex="0" class="assignee-option ${selected.has(String(member.id)) ? 'is-selected' : ''}" data-user-id="${member.id}">
          <strong>${member.name}</strong>
          <small>${member.email || 'Nessuna email'}</small>
        </div>
      `
    )
    .join('');
}

function toggleAssigneeDropdown(forceOpen) {
  if (!assigneeDropdown) return;
  const nextState = typeof forceOpen === 'boolean' ? forceOpen : !assigneeDropdownOpen;
  assigneeDropdownOpen = nextState;
  // Use classList instead of hidden attribute for better compatibility
  if (nextState) {
    assigneeDropdown.removeAttribute('hidden');
    assigneeDropdown.style.display = 'block';
    renderAssigneeDropdown(assigneeSearchInput?.value || '');
  } else {
    assigneeDropdown.setAttribute('hidden', '');
    assigneeDropdown.style.display = 'none';
  }
}

function toggleAssigneeSelection(userId) {
  if (!userId) return;
  const idStr = String(userId);
  if (selectedAssigneeIds.has(idStr)) {
    selectedAssigneeIds.delete(idStr);
  } else {
    selectedAssigneeIds.add(idStr);
  }
  setSelectedAssignees(Array.from(selectedAssigneeIds));
}

async function loadProjectMembers() {
  if (!projectId || !assigneeSelect) return;
  try {
    const members = await apiFetch(`projects.php?action=members&project_id=${projectId}`);
    projectMembers = Array.isArray(members)
      ? members.sort((a, b) => a.name.localeCompare(b.name))
      : [];
    // Inizializza la selezione basata su ciò che è attualmente selezionato nel select (se presente) o nel Set
    const currentIds = selectedAssigneeIds.size > 0 ? Array.from(selectedAssigneeIds) : [];
    populateAssigneesSelect(currentIds);
  } catch (error) {
    console.error('Errore caricamento membri progetto', error);
    assigneeSelect.innerHTML = '';
    assigneeSelect.disabled = true;
    renderAssigneeChips();
    renderAssigneeDropdown();
  }
}

function appendAssigneesToFormData(formData) {
  if (!assigneeSelect) return;
  formData.delete('assignees[]');
  const selected = getSelectedAssigneeIds();
  selected.forEach((value) => formData.append('assignees[]', value));
}

function renderTaskCard(task) {
  const completed = Boolean(task.completed_at);
  const priority = task.priority ?? 'medium';
  const isAssignee = task.assignees?.some(a => String(a.id) === String(currentUser));
  const canEdit = canManage || isAssignee;

  const tagsMarkup =
    task.tags?.length
      ? `<div class="task-tags">${task.tags
        .map((tag) => `<span class="tag-pill" style="background:${tag.color}">${tag.name}</span>`)
        .join('')}</div>`
      : '';
  const assigneesMarkup = task.assignees?.length ? renderAssigneeBadges(task.assignees) : '';
  return `
    <article id="task-${task.id}" class="task-card ${completed ? 'is-completed' : ''}" draggable="${canEdit}" data-task-id="${task.id}">
      <div class="task-card-header">
        <h5>${task.title}</h5>
        <span class="priority-chip priority-${priority}">${priority}</span>
      </div>
      <p class="task-meta">${formatDate(task.due_date)}</p>
      ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
      ${tagsMarkup}
      ${assigneesMarkup}
      ${canEdit
      ? `<div class="task-card-actions">
              <button class="btn-link" data-task-action="complete" data-task-id="${task.id}" data-completed="${completed}">
                ${completed ? 'Riattiva' : 'Completa'}
              </button>
              <button class="btn-link task-danger" data-task-action="delete" data-task-id="${task.id}">Elimina</button>
            </div>`
      : ''
    }
    </article>
  `;
}

function buildTaskLookup() {
  taskLookup = new Map();
  cachedStatuses.forEach((status) => {
    status.tasks?.forEach((task) => {
      taskLookup.set(String(task.id), task);
    });
  });
}

async function loadBoard() {
  if (!board || !projectId) return;
  board.innerHTML = '<p class="text-muted">Caricamento tasks...</p>';
  try {
    const data = await apiFetch(`tasks.php?action=board&project_id=${projectId}`);
    cachedStatuses = data.statuses ?? [];
    board.innerHTML = cachedStatuses
      .map(
        (status) => `
        <div class="kanban-column" data-status-id="${status.id}">
          <h4>${status.name}<span>${status.tasks.length}</span></h4>
          <div class="kanban-column-body" data-column="${status.id}">
            ${status.tasks?.length
            ? status.tasks.map((task) => renderTaskCard(task)).join('')
            : `<div class="empty-state">
                 <div class="empty-state__icon">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                   </svg>
                 </div>
                 <p class="empty-state__title">Nessun task</p>
               </div>`
          }
          </div>
        </div>`
      )
      .join('');
    populateStatusSelect();
    buildTaskLookup();
    renderStatusList();
    attachTaskActionListeners();
    attachTaskCardEditors();
    initDragAndDrop();
  } catch (error) {
    board.innerHTML = `<p class="text-muted">${error.message}</p>`;
  }
}

function initDragAndDrop() {
  // if (!canManage) return; // Allow drag if items are draggable
  board.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('is-dragging');
    });
    card.addEventListener('dragend', (event) => {
      card.classList.remove('is-dragging');
      board.querySelectorAll('.kanban-column-body').forEach(col => col.classList.remove('is-dragover'));
    });
  });

  board.querySelectorAll('.kanban-column-body').forEach((column) => {
    column.addEventListener('dragenter', (event) => {
      event.preventDefault();
      column.classList.add('is-dragover');
    });
    column.addEventListener('dragleave', (event) => {
      column.classList.remove('is-dragover');
    });
    column.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    column.addEventListener('drop', async (event) => {
      event.preventDefault();
      column.classList.remove('is-dragover');
      const taskId = event.dataTransfer.getData('text/plain');
      const targetStatusId = column.dataset.column;

      // Optimistic update or just reload? Reload is safer but slower.
      // For now, just reload as before.

      try {
        const movePayload = new URLSearchParams();
        movePayload.append('task_id', taskId);
        movePayload.append('status_id', targetStatusId);
        await apiFetch('tasks.php?action=move', {
          method: 'POST',
          body: movePayload,
        });
        loadBoard();
      } catch (error) {
        window.W2DPM?.showToast(error.message, 'error');
      }
    });
  });
}

function attachTaskActionListeners() {
  if (!board) return;
  board.querySelectorAll('[data-task-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { taskAction: action, taskId } = btn.dataset;
      if (!taskId) return;
      try {
        if (action === 'delete') {
          const confirmed = window.confirm('Eliminare questo task?');
          if (!confirmed) return;
          const body = new URLSearchParams();
          body.append('id', taskId);
          await apiFetch('tasks.php?action=delete', { method: 'POST', body });
          window.W2DPM?.showToast('Task eliminato', 'success');
        } else if (action === 'complete') {
          const currentState = btn.dataset.completed === 'true';
          const body = new URLSearchParams();
          body.append('id', taskId);
          body.append('completed', currentState ? 'false' : 'true');
          await apiFetch('tasks.php?action=complete', { method: 'POST', body });
          window.W2DPM?.showToast(currentState ? 'Task riaperto' : 'Task completato', 'success');
        }
        loadBoard();
      } catch (error) {
        window.W2DPM?.showToast(error.message, 'error');
      }
    });
  });
}

function attachTaskCardEditors() {
  if (!board || !taskForm) return;
  board.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-task-action]')) return;
      if (card.classList.contains('is-dragging')) return;
      const taskId = card.dataset.taskId;
      if (!taskId) return;
      openTaskModalForEdit(taskId);
    });
  });
}

function populateStatusSelect() {
  if (!statusSelect) return;
  if (!cachedStatuses.length) {
    statusSelect.innerHTML = '<option value="">Nessuna colonna disponibile</option>';
    statusSelect.disabled = true;
    return;
  }
  statusSelect.disabled = false;
  statusSelect.innerHTML = cachedStatuses
    .map((status, index) => `<option value="${status.id}" ${index === 0 ? 'selected' : ''}>${status.name}</option>`)
    .join('');
}

async function loadProjectTags() {
  if (!projectId || !tagSelect) return;
  try {
    const tags = await apiFetch(`tags.php?action=list&project_id=${projectId}`);
    cachedProjectTags = tags.filter((tag) => tag.attached);
    renderTagSelect();
  } catch (error) {
    console.error(error);
  }
}

function renderTagSelect() {
  if (!tagSelect) return;
  if (!cachedProjectTags.length) {
    tagSelect.innerHTML = '<option disabled>Nessun tag associato</option>';
    tagSelect.disabled = true;
    return;
  }
  tagSelect.disabled = false;
  tagSelect.innerHTML = cachedProjectTags
    .map((tag) => `<option value="${tag.id}">${tag.name}</option>`)
    .join('');
}

function renderStatusList() {
  if (!statusList) return;
  if (!cachedStatuses.length) {
    statusList.innerHTML = '<li class="text-muted">Nessuna colonna configurata</li>';
    return;
  }
  statusList.innerHTML = cachedStatuses
    .map((status, index) => {
      const hasTasks = status.tasks?.length;
      return `
        <li class="status-item" data-status-id="${status.id}">
          <div>
            <strong>${status.name}</strong>
            <small class="text-muted">${hasTasks ? `${status.tasks.length} task` : 'Vuoto'}</small>
          </div>
          <div class="status-actions">
            <button type="button" class="ghost-btn" data-status-action="up" data-status-id="${status.id}" ${index === 0 ? 'disabled' : ''} aria-label="Sposta su ${status.name}">↑</button>
            <button type="button" class="ghost-btn" data-status-action="down" data-status-id="${status.id}" ${index === cachedStatuses.length - 1 ? 'disabled' : ''} aria-label="Sposta giù ${status.name}">↓</button>
            <button type="button" class="ghost-btn danger" data-status-action="delete" data-status-id="${status.id}" ${hasTasks ? 'disabled title="Svuota la colonna prima di eliminarla"' : ''} aria-label="Elimina ${status.name}">🗑</button>
          </div>
        </li>
      `;
    })
    .join('');
}

function setTaskModalMode(mode) {
  if (!taskForm) return;
  taskForm.dataset.mode = mode;
  if (mode === 'edit') {
    modalTitle && (modalTitle.textContent = 'Modifica task');
    submitButton && (submitButton.textContent = 'Salva modifiche');
  } else {
    modalTitle && (modalTitle.textContent = 'Nuovo task');
    submitButton && (submitButton.textContent = 'Crea task');
  }
}

function prepareTaskFormForCreate() {
  if (!taskForm || !canManage) return;
  taskForm.reset();
  if (taskIdInput) {
    taskIdInput.value = '';
  }
  setTaskModalMode('create');
  if (cachedStatuses[0] && statusSelect) {
    statusSelect.value = cachedStatuses[0].id;
  }
  if (tagSelect) {
    setMultiSelectValues(tagSelect, []);
  }
  setSelectedAssignees([]);
  if (assigneeSearchInput) {
    assigneeSearchInput.value = '';
  }
  toggleAssigneeDropdown(false);
  toggleAssigneeDropdown(false);
  const commentsSection = document.getElementById('taskCommentsSection');
  if (commentsSection) commentsSection.hidden = true;
}

function openTaskModalForEdit(taskId) {
  if (!taskForm) return;
  const task = taskLookup.get(String(taskId));
  if (!task) {
    window.W2DPM?.showToast('Task non trovato', 'error');
    return;
  }
  const isAssignee = task.assignees?.some(a => String(a.id) === String(currentUser));
  if (!canManage && !isAssignee) {
    window.W2DPM?.showToast('Permessi insufficienti', 'error');
    return;
  }
  setTaskModalMode('edit');
  if (taskIdInput) taskIdInput.value = task.id;
  if (titleInput) titleInput.value = task.title || '';
  if (descriptionInput) descriptionInput.value = task.description || '';
  if (prioritySelect) prioritySelect.value = task.priority || 'medium';
  if (dueDateInput) {
    dueDateInput.value = task.due_date ? task.due_date.slice(0, 10) : '';
  }
  if (statusSelect) {
    statusSelect.value = task.status_id || '';
  }
  if (tagSelect) {
    const tagIds = (task.tags || []).map((tag) => String(tag.id));
    setMultiSelectValues(tagSelect, tagIds);
  }
  const assignees = task.assignees || [];
  if (assignees.length) {
    const memberMap = new Map(projectMembers.map((member) => [String(member.id), member]));
    assignees.forEach((assignee) => {
      const key = String(assignee.id);
      if (!memberMap.has(key)) {
        memberMap.set(key, assignee);
      }
    });
    projectMembers = Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  const assigneeIds = assignees.map((assignee) => String(assignee.id));
  setSelectedAssignees(assigneeIds);
  if (assigneeSearchInput) {
    assigneeSearchInput.value = '';
  }
  toggleAssigneeDropdown(false);
  window.W2DPM?.openModal?.('taskModal');
  window.W2DPM?.openModal?.('taskModal');
  const commentsSection = document.getElementById('taskCommentsSection');
  if (commentsSection) {
    commentsSection.hidden = false;
    loadComments(taskId);
  }
}

async function persistStatusOrder() {
  if (!projectId) return;
  const orderBody = new URLSearchParams();
  orderBody.append('project_id', projectId);
  cachedStatuses.forEach((status) => {
    orderBody.append('order[]', status.id);
  });
  try {
    await apiFetch('statuses.php?action=reorder', { method: 'POST', body: orderBody });
    renderStatusList();
  } catch (error) {
    window.W2DPM?.showToast(error.message, 'error');
    loadBoard();
  }
}

function moveStatus(statusId, direction) {
  const index = cachedStatuses.findIndex((status) => String(status.id) === String(statusId));
  if (index === -1) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= cachedStatuses.length) return;
  const temp = cachedStatuses[targetIndex];
  cachedStatuses[targetIndex] = cachedStatuses[index];
  cachedStatuses[index] = temp;
  renderStatusList();
  persistStatusOrder();
}

if (statusList) {
  statusList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-status-action]');
    if (!button) return;
    const { statusAction: action, statusId } = button.dataset;
    if (!statusId) return;
    if (action === 'delete') {
      const confirmed = window.confirm('Eliminare questa colonna? Deve essere vuota.');
      if (!confirmed) return;
      const body = new URLSearchParams();
      body.append('id', statusId);
      try {
        await apiFetch('statuses.php?action=delete', { method: 'POST', body });
        window.W2DPM?.showToast('Colonna eliminata', 'success');
        loadBoard();
      } catch (error) {
        window.W2DPM?.showToast(error.message, 'error');
      }
      return;
    }
    moveStatus(statusId, action);
  });
}

if (statusForm && projectId) {
  statusForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(statusForm);
    formData.set('project_id', projectId);
    formData.set('position', cachedStatuses.length + 1);
    try {
      await apiFetch('statuses.php?action=create', { method: 'POST', body: formData });
      statusForm.reset();
      window.W2DPM?.showToast('Colonna creata', 'success');
      loadBoard();
    } catch (error) {
      window.W2DPM?.showToast(error.message, 'error');
    }
  });
}

if (taskForm && projectId) {
  taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(taskForm);
    formData.set('project_id', projectId);
    if (!formData.get('status_id') && cachedStatuses[0]) {
      formData.set('status_id', cachedStatuses[0].id);
    }
    appendAssigneesToFormData(formData);
    const isEdit = Boolean(taskIdInput?.value);
    if (isEdit && taskIdInput?.value) {
      formData.set('id', taskIdInput.value);
    }
    try {
      const url = isEdit
        ? `tasks.php?action=update&id=${taskIdInput.value}`
        : 'tasks.php?action=create';
      await apiFetch(url, { method: 'POST', body: formData });
      window.W2DPM?.showToast(isEdit ? 'Task aggiornato' : 'Task creato', 'success');
      loadBoard();
      prepareTaskFormForCreate();
      window.W2DPM?.closeModal?.('taskModal');
    } catch (error) {
      window.W2DPM?.showToast(error.message, 'error');
    }
  });
}

if (taskForm && canManage) {
  setTaskModalMode('create');
}

if (taskForm && canManage) {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open="taskModal"]');
    if (!trigger) return;
    prepareTaskFormForCreate();
  });
}

// Gestione apertura dropdown assegnatari
if (assigneePicker) {
  assigneePicker.addEventListener('click', (event) => {
    // Se si clicca sul dropdown o su un'opzione, non fare nulla (gestito dal dropdown stesso)
    if (event.target.closest('[data-role="assignee-dropdown"]') || event.target.closest('.assignee-option')) {
      return;
    }
    if (event.target.closest('[data-remove-assignee]')) {
      return;
    }
    if (!projectMembers.length) {
      console.log('assigneePicker click: nessun membro disponibile');
      return;
    }
    console.log('assigneePicker click: apertura dropdown');
    toggleAssigneeDropdown(true);
    assigneeSearchInput?.focus();
  });
}

// Add direct listeners to search input for better control
if (assigneeSearchInput) {
  assigneeSearchInput.addEventListener('focus', () => {
    console.log('[ASSIGNEE] Input focus event triggered');
    console.log('[ASSIGNEE] projectMembers count:', projectMembers.length);

    // Force remove hidden attribute
    if (assigneeDropdown) {
      const wasHidden = assigneeDropdown.hasAttribute('hidden');
      assigneeDropdown.removeAttribute('hidden');
      console.log('[ASSIGNEE] Removed hidden attr (was hidden:', wasHidden, ')');

      // Force render if not already populated
      if (!assigneeDropdown.innerHTML || assigneeDropdown.innerHTML.trim() === '') {
        console.log('[ASSIGNEE] Dropdown empty, rendering...');
        renderAssigneeDropdown('');
      }

      console.log('[ASSIGNEE] Dropdown innerHTML length:', assigneeDropdown.innerHTML?.length);
    }
  });

  assigneeSearchInput.addEventListener('input', (e) => {
    console.log('[ASSIGNEE] Input event:', e.target.value);
    if (assigneeDropdown) {
      assigneeDropdown.removeAttribute('hidden');
      renderAssigneeDropdown(e.target.value);
    }
  });
}

assigneeChipsContainer?.addEventListener('click', (event) => {
  // Ignore clicks from dropdown if it somehow bubbles here
  if (event.target.closest('[data-role="assignee-dropdown"]')) return;

  const removeBtn = event.target.closest('[data-remove-assignee]');
  if (!removeBtn) return;

  console.log('[CHIPS] Remove button clicked for:', removeBtn.dataset.removeAssignee);
  event.stopPropagation();
  toggleAssigneeSelection(removeBtn.dataset.removeAssignee);
});

assigneeDropdown?.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent label ghost clicks
  event.stopPropagation(); // Previeni la chiusura del dropdown

  console.log('🔍 Dropdown clicked', {
    target: event.target,
    tagName: event.target.tagName,
    classList: Array.from(event.target.classList),
    dataset: event.target.dataset
  });

  // Cerca l'opzione più vicina
  const option = event.target.closest('.assignee-option');
  console.log('🔍 Found option:', option);

  if (!option) {
    console.warn('⚠️ No .assignee-option found');
    return;
  }

  const userId = option.dataset.userId || option.getAttribute('data-user-id');
  console.log('🔍 User ID from option:', userId, {
    datasetUserId: option.dataset.userId,
    getAttribute: option.getAttribute('data-user-id')
  });

  if (!userId) {
    console.error('❌ No userId found on option!', {
      optionDataset: option.dataset,
      optionAttributes: Array.from(option.attributes).map(a => ({ name: a.name, value: a.value }))
    });
    return;
  }

  console.log('✅ Toggling selection for user:', userId);
  toggleAssigneeSelection(userId);
  // Mantieni il dropdown aperto dopo la selezione
  toggleAssigneeDropdown(true);
});

assigneeSearchInput?.addEventListener('focus', () => {
  if (!projectMembers.length) return;
  toggleAssigneeDropdown(true);
});

assigneeSearchInput?.addEventListener('input', (event) => {
  renderAssigneeDropdown(event.target.value);
  toggleAssigneeDropdown(true);
});

document.addEventListener('click', (event) => {
  if (!assigneePicker) return;
  // Se si clicca sul picker o sul dropdown, non chiudere
  if (assigneePicker.contains(event.target) || event.target.closest('[data-role="assignee-dropdown"]')) {
    return;
  }
  // Se il dropdown è aperto e si clicca fuori, chiudilo
  if (assigneeDropdownOpen) {
    console.log('document click: chiusura dropdown (click fuori)');
    toggleAssigneeDropdown(false);
  }
});

renderAssigneeChips();
renderAssigneeDropdown();

loadBoard();
loadProjectTags();
loadProjectMembers();
window.addEventListener('project-tags:updated', () => loadProjectTags());

// Funzioni Commenti
async function loadComments(taskId) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;
  commentsList.innerHTML = '<p class="text-muted">Caricamento commenti...</p>';
  try {
    const comments = await apiFetch(`comments.php?action=list&task_id=${taskId}`);
    renderComments(comments);
  } catch (error) {
    commentsList.innerHTML = `<p class="text-danger">Errore caricamento commenti: ${error.message}</p>`;
  }
}

function renderComments(comments) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;
  if (!comments.length) {
    commentsList.innerHTML = '<p class="text-muted">Nessun commento ancora.</p>';
    return;
  }

  commentsList.innerHTML = comments.map(c => `
    <div class="comment-item" style="display:flex; gap:0.75rem; align-items:flex-start;">
      <div class="avatar-pill" title="${c.user_name}">
        ${c.user_avatar ? `<img src="${c.user_avatar}" alt="${c.user_name}">` : getInitials(c.user_name)}
      </div>
      <div style="flex:1; background:var(--bg-surface); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
            <strong>${c.user_name}</strong>
            <small class="text-muted">${new Date(c.created_at).toLocaleString()}</small>
        </div>
        <div style="white-space:pre-wrap;">${c.content}</div>
        ${c.can_delete ? `<button class="btn-link text-danger text-xs" onclick="deleteComment(${c.id})" style="margin-top:0.5rem;">Elimina</button>` : ''}
      </div>
    </div>
  `).join('');
}

// Event listener delegato per il form commenti (poiché l'elemento potrebbe non esistere all'init)
document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'commentForm') {
    e.preventDefault();
    const commentForm = e.target;
    const taskId = taskIdInput?.value;
    if (!taskId) return;

    const content = commentForm.querySelector('textarea').value;
    if (!content.trim()) return;

    try {
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('content', content);

      await apiFetch('comments.php?action=create', { method: 'POST', body: formData });
      commentForm.reset();
      loadComments(taskId);
    } catch (error) {
      window.W2DPM?.showToast(error.message, 'error');
    }
  }
});

window.deleteComment = async (id) => {
  if (!confirm('Eliminare questo commento?')) return;
  try {
    await apiFetch('comments.php?action=delete', {
      method: 'POST',
      body: new URLSearchParams({ id })
    });
    const taskId = taskIdInput?.value;
    if (taskId) loadComments(taskId);
  } catch (error) {
    window.W2DPM?.showToast(error.message, 'error');
  }
};
