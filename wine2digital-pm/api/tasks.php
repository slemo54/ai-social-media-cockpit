<?php
require_once __DIR__ . '/../includes/bootstrap_v3.php';
require_once __DIR__ . '/../includes/email_service.php';
require_once __DIR__ . '/../includes/activity_service.php';
api_require_login();

$agentLogPath = '/Users/Anselmo/wine2digital-pm/.cursor/debug.log';
if (!function_exists('debug_log_entry_tasks')) {
    function debug_log_entry_tasks(array $payload): void
    {
        try {
            $payload['timestamp'] = $payload['timestamp'] ?? (int) round(microtime(true) * 1000);
            $logPath = '/Users/Anselmo/wine2digital-pm/.cursor/debug.log';
            @file_put_contents($logPath, json_encode($payload) . PHP_EOL, FILE_APPEND | LOCK_EX);
        } catch (Throwable $e) {
            // Silently fail - logging should never break API responses
        }
    }
}

try {
    $user = current_user();
    $action = $_GET['action'] ?? 'list';

function ensure_status_in_project(int $statusId, int $projectId): void
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM statuses WHERE id = ? AND project_id = ?');
    $stmt->execute([$statusId, $projectId]);
    if (!$stmt->fetchColumn()) {
        json_response(false, null, 'Status mismatch');
    }
}

function normalize_tag_ids($raw): array
{
    if ($raw === null) {
        return [];
    }
    if (!is_array($raw)) {
        $raw = [$raw];
    }
    $ids = [];
    foreach ($raw as $value) {
        $int = (int) $value;
        if ($int > 0) {
            $ids[] = $int;
        }
    }
    return array_values(array_unique($ids));
}

function normalize_id_list($raw): array
{
    if ($raw === null) {
        return [];
    }
    if (!is_array($raw)) {
        $raw = [$raw];
    }
    $ids = [];
    foreach ($raw as $value) {
        $int = (int) $value;
        if ($int > 0) {
            $ids[] = $int;
        }
    }
    return array_values(array_unique($ids));
}

function sync_task_tags(int $taskId, array $tagIds, int $projectId): void
{
    $pdo = db();
    $pdo->prepare('DELETE FROM task_tags WHERE task_id = ?')->execute([$taskId]);
    if (!$tagIds) {
        return;
    }
    $placeholders = implode(',', array_fill(0, count($tagIds), '?'));
    $params = array_merge([$projectId], $tagIds);
    $allowedStmt = $pdo->prepare("SELECT tag_id FROM project_tags WHERE project_id = ? AND tag_id IN ($placeholders)");
    $allowedStmt->execute($params);
    $allowed = $allowedStmt->fetchAll(PDO::FETCH_COLUMN);
    if (!$allowed) {
        return;
    }
    $insertStmt = $pdo->prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
    foreach ($allowed as $tagId) {
        $insertStmt->execute([$taskId, (int) $tagId]);
    }
}

function fetch_task_tags(array $taskIds): array
{
    if (!$taskIds) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($taskIds), '?'));
    $stmt = db()->prepare(
        "SELECT tt.task_id, tg.id, tg.name, tg.color
         FROM task_tags tt
         JOIN tags tg ON tg.id = tt.tag_id
         WHERE tt.task_id IN ($placeholders)
         ORDER BY tg.name ASC"
    );
    $stmt->execute($taskIds);
    $result = [];
    foreach ($stmt as $row) {
        $result[$row['task_id']][] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'color' => $row['color'],
        ];
    }
    return $result;
}

function fetch_task_assignees(array $taskIds): array
{
    if (!$taskIds) {
        return [];
    }

    require_once __DIR__ . '/../includes/calendar_helpers.php';

    $placeholders = implode(',', array_fill(0, count($taskIds), '?'));
    $stmt = db()->prepare(
        "SELECT ta.task_id, u.id, u.name, u.email, u.avatar_url
         FROM task_assignees ta
         JOIN users u ON u.id = ta.user_id
         WHERE ta.task_id IN ($placeholders)
         ORDER BY u.name ASC"
    );
    $stmt->execute($taskIds);
    $result = [];
    foreach ($stmt as $row) {
        // Check if user is currently absent
        $absenceInfo = is_user_absent((int)$row['id']);

        $result[$row['task_id']][] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'is_absent' => $absenceInfo !== false,
            'absence_reason' => $absenceInfo ? $absenceInfo['type'] : null,
            'absence_until' => $absenceInfo ? $absenceInfo['end_date'] : null,
            'avatar_url' => $row['avatar_url'],
        ];
    }
    return $result;
}

function fetch_task_dependencies(array $taskIds): array
{
    if (!$taskIds) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($taskIds), '?'));
    $result = array_fill_keys($taskIds, ['blocking' => [], 'is_blocked_by' => []]);

    // Find tasks that are blocked by tasks in our list
    $blockingStmt = db()->prepare(
        "SELECT td.prerequisite_task_id as task_id, t.id, t.title, t.completed_at
         FROM task_dependencies td
         JOIN tasks t ON t.id = td.dependent_task_id
         WHERE td.prerequisite_task_id IN ($placeholders)"
    );
    $blockingStmt->execute($taskIds);
    foreach ($blockingStmt as $row) {
        $result[$row['task_id']]['blocking'][] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'completed_at' => $row['completed_at'],
        ];
    }

    // Find tasks that block tasks in our list
    $isBlockedByStmt = db()->prepare(
        "SELECT td.dependent_task_id as task_id, t.id, t.title, t.completed_at
         FROM task_dependencies td
         JOIN tasks t ON t.id = td.prerequisite_task_id
         WHERE td.dependent_task_id IN ($placeholders)"
    );
    $isBlockedByStmt->execute($taskIds);
    foreach ($isBlockedByStmt as $row) {
        $result[$row['task_id']]['is_blocked_by'][] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'completed_at' => $row['completed_at'],
        ];
    }
    return $result;
}

function allowed_project_assignee_ids(int $projectId, ?int $actingUserId = null): array
{
    $project = find_project($projectId);
    if (!$project) {
        return [];
    }
    $allowed = [(int) $project['owner_id']];
    $stmt = db()->prepare('SELECT user_id FROM project_members WHERE project_id = ?');
    $stmt->execute([$projectId]);
    while ($row = $stmt->fetch(PDO::FETCH_COLUMN)) {
        $allowed[] = (int) $row;
    }
    if ($actingUserId) {
        $allowed[] = (int) $actingUserId;
    }
    return array_values(array_unique(array_filter($allowed, static fn ($id) => $id > 0)));
}

function sync_task_assignees(int $taskId, $rawIds, int $projectId, ?int $actingUserId = null): array
{
    $pdo = db();
    error_log("[sync_task_assignees] START: taskId=$taskId, projectId=$projectId, rawIds=" . json_encode($rawIds));
    
    $desired = normalize_id_list($rawIds);
    error_log("[sync_task_assignees] Normalized desired IDs: " . json_encode($desired));
    
    // Auto-join: Ensure all assigned users are members of the project
    foreach ($desired as $userId) {
        error_log("[sync_task_assignees] Processing userId=$userId");
        try {
            // Check membership
            $stmt = $pdo->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?');
            $stmt->execute([$projectId, $userId]);
            $isMember = $stmt->fetchColumn();
            
            error_log("[sync_task_assignees] User $userId is" . ($isMember ? "" : " NOT") . " a member");
            
            if (!$isMember) {
                // Check if user is owner
                $ownerCheck = $pdo->prepare('SELECT owner_id FROM projects WHERE id = ?');
                $ownerCheck->execute([$projectId]);
                $ownerId = $ownerCheck->fetchColumn();
                
                error_log("[sync_task_assignees] Project owner_id=$ownerId, checking userId=$userId");
                
                if ($ownerId != $userId) {
                    error_log("[sync_task_assignees] User $userId is not owner, attempting to add as collaborator");
                    // Add as collaborator using ON DUPLICATE KEY UPDATE to avoid errors
                    $addStmt = $pdo->prepare("
                        INSERT INTO project_members (project_id, user_id, role) 
                        VALUES (?, ?, 'collaborator')
                        ON DUPLICATE KEY UPDATE role = 'collaborator'
                    ");
                    $result = $addStmt->execute([$projectId, $userId]);
                    if (!$result) {
                        error_log("[sync_task_assignees] ❌ Failed to add user $userId to project $projectId");
                    } else {
                        error_log("[sync_task_assignees] ✅ SUCCESS: Added user $userId to project $projectId as collaborator");
                    }
                } else {
                    error_log("[sync_task_assignees] User $userId is the owner, skipping add");
                }
            }
        } catch (Throwable $e) {
            error_log("[sync_task_assignees] ❌ Error adding user $userId to project $projectId: " . $e->getMessage());
            // Continue with other assignees even if one fails
        }
    }

    $currentStmt = $pdo->prepare('SELECT user_id FROM task_assignees WHERE task_id = ?');
    $currentStmt->execute([$taskId]);
    $current = array_map('intval', $currentStmt->fetchAll(PDO::FETCH_COLUMN));

    $toDelete = array_diff($current, $desired);
    if ($toDelete) {
        $deleteStmt = $pdo->prepare('DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?');
        foreach ($toDelete as $userId) {
            $deleteStmt->execute([$taskId, $userId]);
        }
    }

    $added = array_diff($desired, $current);
    if ($added) {
        $insertStmt = $pdo->prepare('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)');
        foreach ($added as $userId) {
            $insertStmt->execute([$taskId, $userId]);
            error_log("[sync_task_assignees] Added user $userId to task_assignees");
        }
    }

    error_log("[sync_task_assignees] END: current=" . json_encode($desired) . ", added=" . json_encode(array_values($added)));

    return [
        'current' => $desired,
        'added' => array_values($added),
    ];
}

switch ($action) {
    case 'list':
        $projectId = (int) ($_GET['project_id'] ?? 0);
        ensure_project_access($user, $projectId);
        $stmt = db()->prepare('SELECT t.*, GROUP_CONCAT(u.name) AS assignees
            FROM tasks t
            LEFT JOIN task_assignees ta ON ta.task_id = t.id
            LEFT JOIN users u ON u.id = ta.user_id
            WHERE t.project_id = ?
            GROUP BY t.id
            ORDER BY t.position ASC');
        $stmt->execute([$projectId]);
        json_response(true, $stmt->fetchAll());
        break;

    case 'board':
        $projectId = (int) ($_GET['project_id'] ?? 0);
        ensure_project_access($user, $projectId);
        try {
            $statusesStmt = db()->prepare('SELECT * FROM statuses WHERE project_id = ? ORDER BY position ASC');
            $statusesStmt->execute([$projectId]);
            $statuses = $statusesStmt->fetchAll();

            if (!$statuses) {
                $insertStatus = db()->prepare('INSERT INTO statuses (project_id, name, position) VALUES (?, ?, ?)');
                $insertStatus->execute([$projectId, 'To do', 1]);
                $statusesStmt->execute([$projectId]);
                $statuses = $statusesStmt->fetchAll();
            }

            $tasksStmt = db()->prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC');
            $tasksStmt->execute([$projectId]);
            $tasksByStatus = [];
            $taskIds = [];
            foreach ($tasksStmt as $task) {
                $taskIds[] = (int) $task['id'];
                $tasksByStatus[$task['status_id']][] = $task;
            }
            $taskTags = $taskIds ? fetch_task_tags($taskIds) : [];
            $taskAssignees = $taskIds ? fetch_task_assignees($taskIds) : [];
            $taskDependencies = $taskIds ? fetch_task_dependencies($taskIds) : [];
            foreach ($statuses as &$status) {
                $tasks = $tasksByStatus[$status['id']] ?? [];
                foreach ($tasks as &$task) {
                    $taskId = (int) $task['id'];
                    $task['tags'] = $taskTags[$taskId] ?? [];
                    $task['assignees'] = $taskAssignees[$taskId] ?? [];
                    $task['dependencies'] = $taskDependencies[$taskId] ?? ['blocking' => [], 'is_blocked_by' => []];
                }
                unset($task);
                $status['tasks'] = $tasks;
            }
            unset($status);
            // #region agent log
            debug_log_entry_tasks([
                'sessionId' => 'debug-session',
                'runId' => 'run1',
                'hypothesisId' => 'H3',
                'location' => 'api/tasks.php:board',
                'message' => 'Board payload ready',
                'data' => [
                    'projectId' => $projectId,
                    'statusesCount' => count($statuses),
                    'tasksCount' => count($taskIds),
                ],
            ]);
            // #endregion
            json_response(true, ['statuses' => $statuses]);
        } catch (PDOException $e) {
            json_response(false, null, 'DB error: ' . $e->getMessage());
        } catch (Throwable $e) {
            error_log('[tasks.board] ' . $e->getMessage());
            json_response(false, null, 'Server error while loading board');
        }
        break;

    case 'create':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $projectId = (int) ($_POST['project_id'] ?? 0);
        ensure_project_access($user, $projectId, true);
        $title = trim($_POST['title'] ?? '');
        if ($title === '') {
            json_response(false, null, 'Title required');
        }
        try {
            $statusId = (int) ($_POST['status_id'] ?? 0);
            if (!$statusId) {
                $stmt = db()->prepare('SELECT id FROM statuses WHERE project_id = ? ORDER BY position ASC LIMIT 1');
                $stmt->execute([$projectId]);
                $statusId = (int) $stmt->fetchColumn();
                // Se ancora 0, creiamo una colonna di default
                if (!$statusId) {
                    $insertStatus = db()->prepare('INSERT INTO statuses (project_id, name, position) VALUES (?, ?, ?)');
                    $insertStatus->execute([$projectId, 'To do', 1]);
                    $statusId = (int) db()->lastInsertId();
                }
            } else {
                ensure_status_in_project($statusId, $projectId);
            }
            $description = trim($_POST['description'] ?? '');
            $priority = $_POST['priority'] ?? 'medium';
            $dueDateRaw = trim((string) ($_POST['due_date'] ?? ''));
            $dueDate = $dueDateRaw !== '' ? $dueDateRaw : null;
            $positionStmt = db()->prepare('SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE status_id = ?');
            $positionStmt->execute([$statusId]);
            $position = (int) $positionStmt->fetchColumn();
            $stmt = db()->prepare('INSERT INTO tasks (project_id, status_id, title, description, priority, due_date, created_by, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$projectId, $statusId, $title, $description, $priority, $dueDate ?: null, $user['id'], $position]);
            $taskId = (int) db()->lastInsertId();

            log_task_activity($taskId, $user['id'], 'created_task', "Task '{$title}' was created.");

            $assigneeSync = sync_task_assignees($taskId, $_POST['assignees'] ?? null, $projectId, $user['id']);
            $tagIds = normalize_tag_ids($_POST['tags'] ?? null);
            if ($tagIds) {
                sync_task_tags($taskId, $tagIds, $projectId);
            }
            if (!empty($assigneeSync['added'])) {
                notify_users(
                    $assigneeSync['added'],
                    'task_assigned',
                    [
                        'task_id' => $taskId,
                        'title' => $title,
                        'project_id' => $projectId,
                    ]
                );
                // Invia email a tutti gli assegnatari aggiunti
                $assignedByEmail = $user['email'] ?? 'noreply@wine2digital.com';
                foreach ($assigneeSync['added'] as $assignedUserId) {
                    send_task_assigned_email((int) $assignedUserId, $taskId, $projectId, $assignedByEmail);
                }
            }
            notify_project_members(
                $projectId,
                'task_created',
                [
                    'task_id' => $taskId,
                    'title' => $title,
                    'project_id' => $projectId,
                ],
                [
                    'exclude' => [$user['id']],
                    'roles' => ['owner', 'collaborator'],
                ]
            );
            json_response(true, ['id' => $taskId]);
        } catch (PDOException $e) {
            json_response(false, null, 'DB error: ' . $e->getMessage());
        }
        break;

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_GET['id'] ?? 0);
        
        // Fetch the full task before any changes
        $stmt = db()->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $oldTask = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$oldTask) {
            json_response(false, null, 'Task not found');
        }
        ensure_project_access($user, (int) $oldTask['project_id'], false);
        
        // Custom permission check: Allow if Manager/Owner/Collaborator OR if Assignee
        $projectRole = project_user_role($user, (int) $oldTask['project_id']);
        $canManageProject = in_array($projectRole, ['admin', 'manager', 'owner', 'collaborator'], true);
        
        $isAssignee = false;
        if (!$canManageProject) {
            $checkAssignee = db()->prepare('SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ?');
            $checkAssignee->execute([$taskId, $user['id']]);
            $isAssignee = (bool) $checkAssignee->fetchColumn();
        }

        if (!$canManageProject && !$isAssignee) {
             json_response(false, null, 'Insufficient permissions');
        }

        $fields = ['title', 'description', 'priority', 'due_date', 'completed_at'];
        $updates = [];
        $params = [];
        $newValues = [];

        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                $value = $_POST[$field];
                 if ($field === 'due_date') {
                    $value = trim((string) $value);
                    $value = $value !== '' ? $value : null;
                } elseif ($value === '') {
                    $value = null;
                }
                $updates[] = "$field = ?";
                $params[] = $value;
                $newValues[$field] = $value;
            }
        }
        if (isset($_POST['status_id'])) {
            $newStatus = (int) $_POST['status_id'];
            ensure_status_in_project($newStatus, (int) $oldTask['project_id']);
            $updates[] = 'status_id = ?';
            $params[] = $newStatus;
            $newValues['status_id'] = $newStatus;
        }

        if ($updates) {
            $params[] = $taskId;
            $sql = 'UPDATE tasks SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);

            // Log field changes
            foreach($newValues as $field => $newValue) {
                if ($oldTask[$field] != $newValue) {
                    log_task_activity($taskId, $user['id'], "updated_{$field}", json_encode(['old' => $oldTask[$field], 'new' => $newValue]));
                }
            }
        }
        
        if (array_key_exists('tags', $_POST)) {
            // We need to fetch old tags to compare
            $oldTagsStmt = db()->prepare('SELECT tag_id FROM task_tags WHERE task_id = ?');
            $oldTagsStmt->execute([$taskId]);
            $oldTagIds = $oldTagsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $tagIds = normalize_tag_ids($_POST['tags']);
            sync_task_tags($taskId, $tagIds, (int) $oldTask['project_id']);
            
            if ($oldTagIds != $tagIds) {
                 log_task_activity($taskId, $user['id'], 'updated_tags', json_encode(['old' => $oldTagIds, 'new' => $tagIds]));
            }
        }

        if (array_key_exists('assignees', $_POST)) {
            $oldAssigneesStmt = db()->prepare('SELECT user_id FROM task_assignees WHERE task_id = ?');
            $oldAssigneesStmt->execute([$taskId]);
            $oldAssigneeIds = array_map('intval', $oldAssigneesStmt->fetchAll(PDO::FETCH_COLUMN));

            $assigneeSync = sync_task_assignees($taskId, $_POST['assignees'], (int) $oldTask['project_id'], $user['id']);

            if($oldAssigneeIds != $assigneeSync['current']) {
                 log_task_activity($taskId, $user['id'], 'updated_assignees', json_encode(['old' => $oldAssigneeIds, 'new' => $assigneeSync['current']]));
            }

            if (!empty($assigneeSync['added'])) {
                notify_users(
                    $assigneeSync['added'],
                    'task_assigned',
                    [
                        'task_id' => $taskId,
                        'title' => $oldTask['title'] ?? '',
                        'project_id' => (int) $oldTask['project_id'],
                    ]
                );
                // Invia email a tutti gli assegnatari aggiunti
                $assignedByEmail = $user['email'] ?? 'noreply@wine2digital.com';
                foreach ($assigneeSync['added'] as $assignedUserId) {
                    send_task_assigned_email((int) $assignedUserId, $taskId, (int) $oldTask['project_id'], $assignedByEmail);
                }
            }
        }
        
        json_response(true, ['id' => $taskId]);
        break;

    case 'move':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_POST['task_id'] ?? 0);
        $newStatusId = (int) ($_POST['status_id'] ?? 0);
        
        $stmt = db()->prepare('
            SELECT t.project_id, t.title, t.status_id as old_status_id, s.name as old_status_name
            FROM tasks t
            JOIN statuses s on s.id = t.status_id
            WHERE t.id = ?
        ');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();

        if (!$task) {
            json_response(false, null, 'Task not found');
        }
        $projectId = (int) $task['project_id'];
        ensure_project_access($user, $projectId, true);
        ensure_status_in_project($newStatusId, $projectId);

        $newStatusStmt = db()->prepare('SELECT name FROM statuses WHERE id = ?');
        $newStatusStmt->execute([$newStatusId]);
        $newStatusName = $newStatusStmt->fetchColumn();

        $positionStmt = db()->prepare('SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE status_id = ?');
        $positionStmt->execute([$newStatusId]);
        $position = (int) $positionStmt->fetchColumn();
        
        $stmt = db()->prepare('UPDATE tasks SET status_id = ?, position = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$newStatusId, $position, $taskId]);

        log_task_activity($taskId, $user['id'], 'moved_task', json_encode(['old' => $task['old_status_name'], 'new' => $newStatusName]));
        
        json_response(true, ['id' => $taskId]);
        break;

    case 'assign':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_POST['task_id'] ?? 0);
        $userId = (int) ($_POST['user_id'] ?? 0);
        $stmt = db()->prepare('SELECT project_id, title FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) {
            json_response(false, null, 'Task not found');
        }
        ensure_project_access($user, (int) $task['project_id'], true);
        $stmt = db()->prepare('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)');
        $stmt->execute([$taskId, $userId]);
        
        // Verifica se l'assegnazione è stata effettivamente aggiunta
        $checkStmt = db()->prepare('SELECT COUNT(*) FROM task_assignees WHERE task_id = ? AND user_id = ?');
        $checkStmt->execute([$taskId, $userId]);
        if ($checkStmt->fetchColumn() > 0) {
            $userStmt = db()->prepare('SELECT name FROM users WHERE id = ?');
            $userStmt->execute([$userId]);
            $userName = $userStmt->fetchColumn();

            log_task_activity($taskId, $user['id'], 'assigned_task', "Assigned to {$userName}");

            // Invia notifica
            notify_users(
                [$userId],
                'task_assigned',
                [
                    'task_id' => $taskId,
                    'title' => $task['title'] ?? '',
                    'project_id' => (int) $task['project_id'],
                ]
            );
            // Invia email
            $assignedByEmail = $user['email'] ?? 'noreply@wine2digital.com';
            send_task_assigned_email($userId, $taskId, (int) $task['project_id'], $assignedByEmail);
        }
        
        json_response(true, ['task_id' => $taskId]);
        break;

    case 'unassign':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_POST['task_id'] ?? 0);
        $userId = (int) ($_POST['user_id'] ?? 0);

        // Fetch user name for logging before unassigning
        $userStmt = db()->prepare('SELECT name FROM users WHERE id = ?');
        $userStmt->execute([$userId]);
        $userName = $userStmt->fetchColumn();

        $stmt = db()->prepare('DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?');
        $stmt->execute([$taskId, $userId]);

        if ($userName) {
            log_task_activity($taskId, $user['id'], 'unassigned_task', "Unassigned from {$userName}");
        }

        json_response(true, ['task_id' => $taskId]);
        break;

    case 'mine':
        $stmt = db()->prepare(
            'SELECT t.*, p.name AS project_name, s.name AS status_name
             FROM tasks t
             JOIN task_assignees ta ON ta.task_id = t.id
             JOIN projects p ON p.id = t.project_id
             JOIN statuses s ON s.id = t.status_id
             WHERE ta.user_id = ?
             ORDER BY COALESCE(t.due_date, t.created_at) ASC'
        );
        $stmt->execute([$user['id']]);
        $tasks = $stmt->fetchAll();
        $taskIds = array_map(static fn ($task) => (int) $task['id'], $tasks);
        $tags = fetch_task_tags($taskIds);
        $assignees = fetch_task_assignees($taskIds);
        foreach ($tasks as &$task) {
            $taskId = (int) $task['id'];
            $task['tags'] = $tags[$taskId] ?? [];
            $task['assignees'] = $assignees[$taskId] ?? [];
        }
        json_response(true, $tasks);
        break;

    case 'complete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_POST['id'] ?? 0);
        if (!$taskId) {
            json_response(false, null, 'Task id required');
        }
        $stmt = db()->prepare('SELECT project_id, title FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) {
            json_response(false, null, 'Task not found');
        }
        ensure_project_access($user, (int) $task['project_id'], true);
        
        $isCompleting = ($_POST['completed'] ?? 'true') === 'true';

        if ($isCompleting) {
            // Check for incomplete prerequisites
            $prereqStmt = db()->prepare('
                SELECT t.id, t.title
                FROM task_dependencies td
                JOIN tasks t ON t.id = td.prerequisite_task_id
                WHERE td.dependent_task_id = ? AND t.completed_at IS NULL
            ');
            $prereqStmt->execute([$taskId]);
            $blockers = $prereqStmt->fetchAll(PDO::FETCH_ASSOC);

            if ($blockers) {
                json_response(false, ['blockers' => $blockers], 'Cannot complete task. It is blocked by incomplete tasks.');
            }
        }

        $completed = $isCompleting ? date('Y-m-d H:i:s') : null;
        $update = db()->prepare('UPDATE tasks SET completed_at = ?, updated_at = NOW() WHERE id = ?');
        $update->execute([$completed, $taskId]);

        $logAction = $completed ? 'completed_task' : 'reopened_task';
        log_task_activity($taskId, $user['id'], $logAction);

        $notificationType = $completed ? 'task_completed' : 'task_reopened';
        notify_project_members(
            (int) $task['project_id'],
            $notificationType,
                [
                    'task_id' => $taskId,
                    'title' => $task['title'] ?? '',
                    'completed_at' => $completed,
                ],
            [
                'exclude' => [$user['id']],
                'roles' => ['owner', 'collaborator'],
            ]
        );
        json_response(true, ['id' => $taskId, 'completed_at' => $completed]);
        break;

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int) ($_POST['id'] ?? 0);
        if (!$taskId) {
            json_response(false, null, 'Task id required');
        }
        $stmt = db()->prepare('SELECT project_id, title FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) {
            json_response(false, null, 'Task not found');
        }
        ensure_project_access($user, (int) $task['project_id'], true);
        
        log_task_activity($taskId, $user['id'], 'deleted_task', "Task '{$task['title']}' was deleted.");

        $deleteAssignees = db()->prepare('DELETE FROM task_assignees WHERE task_id = ?');
        $deleteAssignees->execute([$taskId]);
        $deleteTask = db()->prepare('DELETE FROM tasks WHERE id = ?');
        $deleteTask->execute([$taskId]);
        json_response(true, ['id' => $taskId]);
        break;

    case 'activity':
        $taskId = (int) ($_GET['id'] ?? 0);
        if (!$taskId) {
            json_response(false, null, 'Task ID required');
        }
        $stmt = db()->prepare('SELECT project_id FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) {
            json_response(false, null, 'Task not found');
        }
        ensure_project_access($user, (int) $task['project_id']);

        $activityStmt = db()->prepare('
            SELECT ta.*, u.name as user_name, u.avatar_url
            FROM task_activities ta
            LEFT JOIN users u ON u.id = ta.user_id
            WHERE ta.task_id = ?
            ORDER BY ta.created_at DESC
        ');
        $activityStmt->execute([$taskId]);
        $activities = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
        
        json_response(true, $activities);
        break;

    case 'add_dependency':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int)($_POST['task_id'] ?? 0);
        $prerequisiteId = (int)($_POST['prerequisite_id'] ?? 0);

        if (!$taskId || !$prerequisiteId || $taskId === $prerequisiteId) {
            json_response(false, null, 'Invalid task IDs provided.');
        }

        $taskStmt = db()->prepare('SELECT project_id, title FROM tasks WHERE id IN (?, ?)');
        $taskStmt->execute([$taskId, $prerequisiteId]);
        $tasks = $taskStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        if (count($tasks) !== 2) {
             json_response(false, null, 'One or both tasks not found.');
        }

        if ($tasks[$taskId]['project_id'] !== $tasks[$prerequisiteId]['project_id']) {
            json_response(false, null, 'Tasks must be in the same project.');
        }

        // Check for direct circular dependency
        $circularCheck = db()->prepare('SELECT 1 FROM task_dependencies WHERE dependent_task_id = ? AND prerequisite_task_id = ?');
        $circularCheck->execute([$prerequisiteId, $taskId]);
        if ($circularCheck->fetchColumn()) {
            json_response(false, null, 'Circular dependency detected.');
        }

        ensure_project_access($user, (int)$tasks[$taskId]['project_id'], true);

        $stmt = db()->prepare('INSERT IGNORE INTO task_dependencies (dependent_task_id, prerequisite_task_id) VALUES (?, ?)');
        $stmt->execute([$taskId, $prerequisiteId]);

        log_task_activity($taskId, $user['id'], 'added_dependency', "Task now depends on task #{$prerequisiteId} ('{$tasks[$prerequisiteId]['title']}')");

        json_response(true, ['status' => 'dependency added']);
        break;

    case 'remove_dependency':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(false, null, 'Invalid method');
        }
        $taskId = (int)($_POST['task_id'] ?? 0);
        $prerequisiteId = (int)($_POST['prerequisite_id'] ?? 0);

        if (!$taskId || !$prerequisiteId) {
            json_response(false, null, 'Invalid task IDs provided.');
        }
        
        $taskStmt = db()->prepare('SELECT project_id, title FROM tasks WHERE id = ?');
        $taskStmt->execute([$prerequisiteId]);
        $prerequisiteTask = $taskStmt->fetch();

        $stmt = db()->prepare('DELETE FROM task_dependencies WHERE dependent_task_id = ? AND prerequisite_task_id = ?');
        $stmt->execute([$taskId, $prerequisiteId]);

        if ($stmt->rowCount() > 0 && $prerequisiteTask) {
             log_task_activity($taskId, $user['id'], 'removed_dependency', "Task no longer depends on task #{$prerequisiteId} ('{$prerequisiteTask['title']}')");
        }

        json_response(true, ['status' => 'dependency removed']);
        break;

    default:
        json_response(false, null, 'Unknown action');
}
} catch (Throwable $e) {
    error_log('[tasks.php] Unhandled error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    json_response(false, null, 'Server error: ' . ($e->getMessage() ?: 'Unknown error'));
}
