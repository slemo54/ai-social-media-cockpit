<?php
require_once __DIR__ . '/../includes/bootstrap_v3.php';

// disable json_response exit for testing if possible, but we can't redefine it.
// We will just test the logic components.

echo "--- Setting up Test Data ---\n";

// 1. Create unique test user
$email = 'test_viewer_' . time() . '@example.com';
$stmt = db()->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')");
$stmt->execute(['Test Viewer', $email, password_hash('password', PASSWORD_DEFAULT)]);
$userId = db()->lastInsertId();
echo "Created User ID: $userId\n";

// 2. Create test project
$stmt = db()->prepare("INSERT INTO projects (name, owner_id, status) VALUES (?, ?, 'active')");
$stmt->execute(['Test Project Permissions', 1]); // Owner ID 1 (admin usually)
$projectId = db()->lastInsertId();
echo "Created Project ID: $projectId\n";

// 3. Add user as 'viewer' (assuming 'viewer' role exists/is handled)
// If 'viewer' role is not in enum, we might need to check role definitions.
// database/schema.sql doesn't show enums for project_members role, but usually it's text.
// Let's assume 'viewer' is valid as per previous exploration of ensure_project_access
$stmt = db()->prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'viewer')");
$stmt->execute([$projectId, $userId]);
echo "Added User as Viewer to Project\n";

// 4. Create Task
$stmt = db()->prepare("INSERT INTO tasks (project_id, status_id, title, created_by) VALUES (?, 1, 'Test Task', 1)");
$stmt->execute([$projectId]);
$taskId = db()->lastInsertId();
echo "Created Task ID: $taskId\n";

// 5. Assign User to Task
$stmt = db()->prepare("INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)");
$stmt->execute([$taskId, $userId]);
echo "Assigned User to Task\n";

echo "\n--- Verifying Permissions Logic ---\n";

// Simulating API logic
$user = ['id' => $userId, 'role' => 'user']; // Mock user object

// Logic 1: Current Check (Should Fail for Viewer)
// ensure_project_access($user, $projectId, true) calls project_membership_role
$role = project_membership_role($user, ['id' => $projectId, 'owner_id' => 1]);
echo "Detected Project Role: $role\n";

$canManageCurrent = in_array($role, ['admin', 'manager', 'owner', 'collaborator'], true); // Logic from ensure_project_access (viewer excluded)
if ($canManageCurrent) {
    echo "Current Logic: ALLOWED (Unexpected for Viewer)\n";
} else {
    echo "Current Logic: DENIED (Expected)\n";
}

// Logic 2: Proposed Check (Identify Assignee)
$isAssignee = false;
$stmt = db()->prepare('SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ?');
$stmt->execute([$taskId, $userId]);
$isAssignee = (bool) $stmt->fetchColumn();

echo "Is Assignee: " . ($isAssignee ? "YES" : "NO") . "\n";

if ($canManageCurrent || $isAssignee) {
    echo "Proposed Logic: ALLOWED (SUCCESS)\n";
} else {
    echo "Proposed Logic: DENIED (FAILURE)\n";
}

// Clean up? Maybe keep for manual check if needed, but better to clean up.
// Cleanup
db()->query("DELETE FROM tasks WHERE id = $taskId");
db()->query("DELETE FROM project_members WHERE project_id = $projectId");
db()->query("DELETE FROM projects WHERE id = $projectId");
db()->query("DELETE FROM users WHERE id = $userId");
echo "\nTest Data Cleaned Up.\n";
