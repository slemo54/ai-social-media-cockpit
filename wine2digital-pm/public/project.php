<?php
require_once __DIR__ . '/../includes/bootstrap_v3.php';
require_login();
$user = current_user();

$projectId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if (!$projectId) {
    redirect('/public/dashboard.php');
}

$projectAccess = ensure_project_access($user, $projectId);

$stmt = db()->prepare(
    'SELECT p.*, u.name AS owner_name, pn.content_html AS notes_html
     FROM projects p
     JOIN users u ON p.owner_id = u.id
     LEFT JOIN project_notes pn ON pn.project_id = p.id
     WHERE p.id = ? LIMIT 1'
);
$stmt->execute([$projectId]);
$project = $stmt->fetch();

if (!$project) {
    redirect('/public/dashboard.php');
}

$projectSummary = trim($project['description'] ?? '');
$projectSummary = $projectSummary !== '' ? mb_strimwidth($projectSummary, 0, 180, '…', 'UTF-8') : 'Allinea il team e traccia le attività chiave per questa iniziativa.';

function project_metric_count(string $sql, array $params): int
{
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    } catch (Throwable $e) {
        return 0;
    }
}

$taskStats = [
    'total' => project_metric_count('SELECT COUNT(*) FROM tasks WHERE project_id = ?', [$projectId]),
    'completed' => project_metric_count('SELECT COUNT(*) FROM tasks WHERE project_id = ? AND completed_at IS NOT NULL', [$projectId]),
    'dueSoon' => project_metric_count('SELECT COUNT(*) FROM tasks WHERE project_id = ? AND due_date IS NOT NULL AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)', [$projectId]),
];
$openTasks = max($taskStats['total'] - $taskStats['completed'], 0);
$tagCount = project_metric_count('SELECT COUNT(*) FROM project_tags WHERE project_id = ?', [$projectId]);
$fileCount = project_metric_count('SELECT COUNT(*) FROM files WHERE project_id = ?', [$projectId]);

$createdAtFormatted = null;
if (!empty($project['created_at'])) {
    try {
        $createdAt = new DateTime($project['created_at']);
        $createdAtFormatted = $createdAt->format('d M Y');
    } catch (Exception $e) {
        $createdAtFormatted = null;
    }
}

$projectRole = project_user_role($user, $projectId);
$canCollaborate = in_array($projectRole, ['admin', 'manager', 'owner', 'collaborator'], true);
$canAdminProject = in_array($projectRole, ['admin', 'manager', 'owner'], true);
$projectModules = get_project_modules($projectId);
$projectNotesContent = $project['notes_html'] ?? '';
$tabOrder = array_keys(PROJECT_MODULES_MAP);
$firstTab = null;
foreach ($tabOrder as $tabKey) {
    if (project_module_enabled($projectModules, $tabKey)) {
        $firstTab = $firstTab ?? $tabKey;
    }
}
$firstTab = $firstTab ?? 'overview';

render_head(sanitize($project['name']) . ' · Project');
render_shell_start('projects');
?>
<section class="project-hero card">
    <div class="project-hero__head">
        <div>
            <p class="hero-eyebrow"><?= sanitize($project['status']) ?></p>
            <h1><?= sanitize($project['name']) ?></h1>
            <p class="text-muted"><?= sanitize($projectSummary) ?></p>
            <div class="project-hero__meta">
                <div>
                    <span class="project-hero__label">Owner</span>
                    <strong><?= sanitize($project['owner_name']) ?></strong>
                </div>
                <div>
                    <span class="project-hero__label">Creato il</span>
                    <strong><?= $createdAtFormatted ? sanitize($createdAtFormatted) : '—' ?></strong>
                </div>
                <div>
                    <span class="project-hero__label">Tag attivi</span>
                    <strong><?= $tagCount ?></strong>
                </div>
            </div>
        </div>
        <div class="project-hero__actions">
            <?php if ($canCollaborate): ?>
            <button class="btn-primary" type="button" data-open="taskModal">+ Task</button>
            <?php endif; ?>
            <?php if ($canAdminProject): ?>
            <button class="btn-secondary" type="button" id="shareProjectBtn">Share</button>
            <a class="btn-secondary" href="/public/project-settings.php?id=<?= $projectId ?>">Project settings</a>
            <?php endif; ?>
        </div>
    </div>
    <div class="project-hero__metrics">
        <article class="hero-metric-card">
            <span>Task aperti</span>
            <strong><?= $openTasks ?></strong>
            <small>su <?= $taskStats['total'] ?> totali</small>
        </article>
        <article class="hero-metric-card">
            <span>Completati</span>
            <strong><?= $taskStats['completed'] ?></strong>
            <small>Automazioni concluse</small>
        </article>
        <article class="hero-metric-card">
            <span>Due (7gg)</span>
            <strong><?= $taskStats['dueSoon'] ?></strong>
            <small>Task con scadenza ravvicinata</small>
        </article>
        <article class="hero-metric-card">
            <span>File allegati</span>
            <strong><?= $fileCount ?></strong>
            <small>Documenti e asset</small>
        </article>
    </div>
</section>

<div class="tab-bar" id="projectTabs">
<?php if (project_module_enabled($projectModules, 'overview')): ?>
    <button data-tab="overview" class="<?= $firstTab === 'overview' ? 'active' : '' ?>">Overview</button>
    <?php endif; ?>
    <?php if (project_module_enabled($projectModules, 'tasks')): ?>
    <button data-tab="tasks" class="<?= $firstTab === 'tasks' ? 'active' : '' ?>">Tasks</button>
    <?php endif; ?>
    <?php if (project_module_enabled($projectModules, 'milestones')): ?>
    <button data-tab="milestones" class="<?= $firstTab === 'milestones' ? 'active' : '' ?>">Milestones</button>
    <?php endif; ?>
    <?php if (project_module_enabled($projectModules, 'files')): ?>
    <button data-tab="files" class="<?= $firstTab === 'files' ? 'active' : '' ?>">Files</button>
    <?php endif; ?>
    <?php if (project_module_enabled($projectModules, 'discussion')): ?>
    <button data-tab="discussion" class="<?= $firstTab === 'discussion' ? 'active' : '' ?>">Discussion</button>
    <?php endif; ?>
    <?php if (project_module_enabled($projectModules, 'notes')): ?>
    <button data-tab="notes" class="<?= $firstTab === 'notes' ? 'active' : '' ?>">Notes</button>
    <?php endif; ?>
</div>

<?php if (project_module_enabled($projectModules, 'overview')): ?>
<section data-tab-panel="overview" class="tab-panel <?= $firstTab === 'overview' ? 'active' : '' ?>" style="<?= $firstTab === 'overview' ? '' : 'display:none;' ?>">
    <div class="card">
        <h3>Summary</h3>
        <p><?= nl2br(sanitize($project['description'] ?? 'No description')) ?></p>
    </div>
</section>
<?php endif; ?>

<?php if (project_module_enabled($projectModules, 'tasks')): ?>
<section data-tab-panel="tasks" class="tab-panel <?= $firstTab === 'tasks' ? 'active' : '' ?>" style="<?= $firstTab === 'tasks' ? '' : 'display:none;' ?>">
    <div class="section-header">
        <h3>Kanban Board</h3>
        <?php if ($canCollaborate): ?>
        <button class="btn-primary" type="button" data-open="taskModal">+ Task</button>
        <?php endif; ?>
    </div>
    <div class="resizable-group" data-resizable-group>
        <div class="resizable-panel">
            <div
                class="kanban-board"
                data-role="kanban-board"
                data-project-id="<?= $projectId ?>"
                data-can-manage="<?= $canCollaborate ? '1' : '0' ?>"
                data-current-user="<?= $user['id'] ?>"
            ></div>
        </div>
        <div class="resizable-handle" data-resizable-handle role="separator" aria-orientation="horizontal" aria-label="Ridimensiona la board"></div>
        <div class="resizable-panel stack">
            <?php if ($canCollaborate): ?>
            <div class="card status-manager">
                <div class="status-manager-header">
                    <h4>Colonne Kanban</h4>
                </div>
                <form id="statusForm" class="status-form" data-validate>
                    <input type="hidden" name="project_id" value="<?= $projectId ?>">
                    <label class="field">
                        <span class="field-label">Nome colonna</span>
                        <input type="text" name="name" placeholder="Es. In progress" required>
                    </label>
                    <div>
                        <button class="btn-secondary" type="submit">Aggiungi colonna</button>
                    </div>
                </form>
                <ul class="status-list" data-role="status-list" data-project-id="<?= $projectId ?>"></ul>
                <small class="text-muted">Le colonne con task attivi non possono essere eliminate.</small>
            </div>
            <?php endif; ?>

            <div class="card project-tags-card">
                <div class="project-tags-header">
                    <h4>Tag di progetto</h4>
                    <small class="text-muted">I tag devono prima esistere nel workspace.</small>
                </div>
                <div
                    class="project-tags-grid"
                    data-role="project-tags"
                    data-project-id="<?= $projectId ?>"
                    data-can-manage="<?= $canCollaborate ? '1' : '0' ?>"
                >
                    <p class="text-muted">Caricamento tag...</p>
                </div>
            </div>
        </div>
    </div>
</section>
<?php endif; ?>

<?php if (project_module_enabled($projectModules, 'milestones')): ?>
<section data-tab-panel="milestones" class="tab-panel <?= $firstTab === 'milestones' ? 'active' : '' ?>" style="<?= $firstTab === 'milestones' ? '' : 'display:none;' ?>">
    <div class="section-header">
        <h3>Milestones</h3>
    </div>
    <div class="card">
        <form id="milestoneForm" class="stack" data-validate>
            <div class="field-group" data-columns="3">
                <label class="field">
                    <span class="field-label">Nome</span>
                    <input type="text" name="name" required>
                </label>
                <label class="field">
                    <span class="field-label">Stato</span>
                    <select name="status">
                        <option value="open">Open</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </label>
                <label class="field">
                    <span class="field-label">Due date</span>
                    <input type="date" name="due_date">
                </label>
            </div>
            <label class="field">
                <span class="field-label">Descrizione</span>
                <textarea name="description" rows="2" placeholder="Dettagli della milestone"></textarea>
            </label>
            <button class="btn-primary" type="submit" style="align-self:flex-start;">Aggiungi milestone</button>
        </form>
    </div>
    <div data-role="milestones-list" data-project-id="<?= $projectId ?>" class="stack" style="margin-top:1rem;"></div>
</section>
<?php endif; ?>

<?php if (project_module_enabled($projectModules, 'files')): ?>
<section data-tab-panel="files" class="tab-panel <?= $firstTab === 'files' ? 'active' : '' ?>" style="<?= $firstTab === 'files' ? '' : 'display:none;' ?>">
    <div class="card">
        <?php if ($canCollaborate): ?>
        <form id="fileUploadForm" enctype="multipart/form-data" class="stack" aria-label="Upload file" data-validate>
            <input type="hidden" name="project_id" value="<?= $projectId ?>">
            <label class="field">
                <span class="field-label">Attach file</span>
                <input type="file" name="file" required aria-describedby="fileHelpText">
            </label>
            <small id="fileHelpText" class="text-muted">Max 15 MB · documenti, immagini e zip.</small>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn-secondary" type="submit">Upload</button>
                <button class="ghost-btn" type="button" id="clearFileInput">Reset</button>
            </div>
            <p class="upload-status" data-role="file-upload-status" aria-live="polite"></p>
        </form>
        <?php else: ?>
        <p class="text-muted">Solo i membri del progetto possono caricare file.</p>
        <?php endif; ?>
        <ul
            data-role="file-list"
            data-project-id="<?= $projectId ?>"
            data-can-manage="<?= $canCollaborate ? '1' : '0' ?>"
            class="file-list"
        ></ul>
        <div class="file-preview" data-role="file-preview" hidden>
            <div class="file-preview-toolbar">
                <div class="file-breadcrumb">
                    <button type="button" class="link-btn" data-role="file-preview-home">Files</button>
                    <span aria-hidden="true">/</span>
                    <strong data-role="file-preview-title"></strong>
                </div>
                <div class="file-preview-actions">
                    <div data-role="file-preview-meta"></div>
                    <a class="btn-secondary" data-role="file-preview-download" target="_blank" rel="noopener">Download</a>
                </div>
            </div>
            <div class="file-preview-body" data-role="file-preview-body"></div>
        </div>
    </div>
</section>
<?php endif; ?>

<?php if (project_module_enabled($projectModules, 'discussion')): ?>
<section data-tab-panel="discussion" class="tab-panel <?= $firstTab === 'discussion' ? 'active' : '' ?>" style="<?= $firstTab === 'discussion' ? '' : 'display:none;' ?>">
    <div class="card discussion-panel">
        <div
            class="discussion-thread"
            data-role="discussion-thread"
            data-project-id="<?= $projectId ?>"
            data-current-user="<?= $user['id'] ?>"
            aria-live="polite"
        ></div>
        <?php if ($canCollaborate): ?>
        <form id="messageForm" data-can-comment="1" data-validate>
            <input type="hidden" name="project_id" value="<?= $projectId ?>">
            <label class="field field-with-suggestions">
                <span class="field-label">Nuovo messaggio</span>
                <textarea name="content" rows="2" placeholder="Condividi un aggiornamento" required></textarea>
                <div class="mention-suggestions" data-role="mention-suggestions" hidden></div>
            </label>
            <label class="field">
                <span class="field-label">Allega file (opzionale)</span>
                <select id="messageAttachment" name="attachment_file_id">
                    <option value="">Nessun allegato</option>
                </select>
            </label>
            <small class="text-muted">Suggerimento: usa @nome per menzionare un collega.</small>
            <div class="modal-actions">
                <button class="btn-primary">Invia</button>
            </div>
        </form>
        <?php else: ?>
        <p class="text-muted">Solo i membri del progetto possono inviare messaggi nella chat.</p>
        <?php endif; ?>
    </div>
</section>
<?php endif; ?>

<?php if (project_module_enabled($projectModules, 'notes')): ?>
<section data-tab-panel="notes" class="tab-panel <?= $firstTab === 'notes' ? 'active' : '' ?>" style="<?= $firstTab === 'notes' ? '' : 'display:none;' ?>">
    <div class="card">
        <form id="notesForm">
            <input type="hidden" name="project_id" value="<?= $projectId ?>">
            <div contenteditable="true" id="notesEditor" class="notes-editor" tabindex="0" aria-label="Project notes editor" style="min-height:220px; border:1px solid var(--border); border-radius:10px; padding:1rem;"><?= $projectNotesContent ?></div>
            <div class="notes-status" data-role="notes-status" aria-live="polite">Draft not saved</div>
            <button class="btn-primary" type="submit" style="margin-top:1rem;">Save notes</button>
        </form>
    </div>
</section>
<?php endif; ?>

<div class="modal" id="taskModal" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
    <div class="modal-content modal-sheet">
        <button class="modal-close" type="button" aria-label="Chiudi modale" data-close-modal>&times;</button>
        <header class="modal-sheet__header">
            <div>
                <p class="hero-eyebrow">Task planner</p>
                <h3 id="taskModalTitle">Nuovo task</h3>
                <p class="text-muted">Definisci responsabilità, priorità e deadline prima di salvare.</p>
            </div>
            <span class="modal-badge">Task</span>
        </header>
        <div class="modal-sheet__body">
            <form id="taskForm" class="stack modal-main" data-validate>
                <input type="hidden" name="id" value="">
                <input type="hidden" name="project_id" value="<?= $projectId ?>">
                <label class="field">
                    <span class="field-label">Nome task</span>
                    <input type="text" name="title" required>
                </label>
                <div class="modal-fieldset" data-columns="3">
                    <label class="field">
                        <span class="field-label">Colonna</span>
                        <select name="status_id" id="taskStatusSelect">
                            <option value="">Seleziona uno status</option>
                        </select>
                    </label>
                    <label class="field">
                        <span class="field-label">Priorità</span>
                        <select name="priority" required>
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </label>
                    <label class="field">
                        <span class="field-label">Due date</span>
                        <input type="date" name="due_date">
                    </label>
                </div>
                <label class="field">
                    <span class="field-label">Descrizione</span>
                    <textarea name="description" rows="4" placeholder="Contesto, note operative o checklist"></textarea>
                </label>
                <label class="field">
                    <span class="field-label">Assegnatari</span>
                    <div class="assignee-picker" data-role="assignee-picker">
                        <div class="assignee-picker-control" data-role="assignee-picker-control">
                            <div class="assignee-chips" data-role="assignee-chips"></div>
                            <input type="text" data-role="assignee-search" placeholder="Cerca o seleziona membro" aria-label="Cerca membro del progetto">
                        </div>
                        <div class="assignee-picker-dropdown" data-role="assignee-dropdown" hidden></div>
                    </div>
                    <select name="assignees[]" id="taskAssigneesSelect" multiple class="sr-only" tabindex="-1"></select>
                    <small class="text-muted">I membri del progetto possono essere assegnati al task.</small>
                </label>
                <label class="field">
                    <span class="field-label">Tag disponibili</span>
                    <select name="tags[]" id="taskTagsSelect" multiple size="3" aria-label="Tag disponibili"></select>
                    <small class="text-muted">I tag sono definiti a livello di progetto.</small>
                </label>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Annulla</button>
                    <button type="submit" class="btn-primary">Salva task</button>
                </div>
            </form>
            
            <!-- Comments Section (Visible only in Edit Mode) -->
            <div id="taskCommentsSection" class="task-comments-section stack" hidden style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                <div class="section-header">
                    <h4>Commenti</h4>
                </div>
                <div id="commentsList" class="comments-list stack" style="gap: 1rem; max-height: 300px; overflow-y: auto;">
                    <!-- Comments will be loaded here -->
                </div>
                <form id="commentForm" class="comment-form" style="margin-top: 1rem;">
                    <div class="field-inline-group">
                        <textarea name="content" class="input" placeholder="Scrivi un commento..." rows="2" required style="flex:1;"></textarea>
                        <button type="submit" class="btn-secondary">Invia</button>
                    </div>
                </form>
            </div>
            <aside class="modal-sidebar">
                <div class="modal-sidebar-card">
                    <h4>Best practice</h4>
                    <ul class="modal-list">
                        <li>Usa i tag per filtrare dal portfolio</li>
                        <li>Assegna almeno un owner</li>
                        <li>Inserisci sempre la due date</li>
                    </ul>
                </div>
                <div class="modal-sidebar-card">
                    <h4>Shortcuts</h4>
                    <p class="text-muted">Digita <strong>@nome</strong> nella descrizione per citare un collega: la menzione genera una notifica nella discussione.</p>
                </div>
            </aside>
        </div>
    </div>
</div>

<script type="module">
const tabs = document.querySelectorAll('#projectTabs button');
const panels = document.querySelectorAll('[data-tab-panel]');

tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
        tabs.forEach((b) => b.classList.remove('active'));
        panels.forEach((panel) => panel.style.display = panel.dataset.tabPanel === btn.dataset.tab ? 'block' : 'none');
        btn.classList.add('active');
    });
});
</script>
<script type="module" src="/assets/js/tasks.js?v=<?= time() ?>"></script>
<script type="module" src="/assets/js/project-tags.js"></script>
<script type="module" src="/assets/js/milestones.js"></script>
<script type="module" src="/assets/js/files.js"></script>
<script type="module" src="/assets/js/messages.js?v=<?= time() ?>"></script>
<script type="module" src="/assets/js/notes.js"></script>
<script type="module" src="/assets/js/project-modules.js"></script>
<script type="module">
    (async function() {
        try {
            const module = await import('/assets/js/project-sharing.js');
            const shareBtn = document.getElementById('shareProjectBtn');
            if (shareBtn && typeof module.renderSharingModal === 'function') {
                shareBtn.addEventListener('click', () => {
                    module.renderSharingModal(<?= $projectId ?>, '<?= $project['visibility'] ?? 'private' ?>');
                });
            }
        } catch(e) {
            console.error('Error loading project-sharing module:', e);
        }
    })();
</script>
<?php
render_shell_end();
