<?php
class GroupController extends Controller {
    public function __construct() {
        parent::__construct();
        $this->call->model("GroupModel");
        $this->call->model("GroupMemberModel");
        $this->call->model("UserModel");
       $this->call->model("GroupFile");
       $this->call->model("GroupMessageModel");
       $this->call->model('GroupSessionModel');
    } 

    // ---------- Groups CRUD ----------
public function index() {

    try {
        $groups = $this->GroupModel->all();

        foreach ($groups as &$group) {
            $members = $this->GroupMemberModel->db->table('group_members')->where('group_id',
        $group['id'])->get_all();
            $group['member_count'] = count($members);

            $instructor = $this->UserModel->find($group['instructor_id']);
            $group['instructor_name'] = $instructor ? $instructor['first_name'] . ' ' . $instructor['last_name'] : '';
        }

        echo json_encode($groups);
    } catch (\Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
  

public function total_groups() {
    $groups = $this->GroupModel->all();
    $total = count($groups); // get total users
    echo json_encode(['total' => $total]);
}
    public function create()
{
    header('Content-Type: application/json');

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
error_log($input);

    if ($data === null) {
        echo json_encode(['error' => 'Invalid JSON']);
        http_response_code(400);
        return;
    }

    // Validate required fields
    if (empty($data['name']) || empty($data['subject']) || empty($data['instructor_id'])) {
        echo json_encode(['error' => 'name, subject, and instructor_id are required']);
        http_response_code(400);
        return;
    }

    // Step 1: Prepare group data
    $insertData = [
        'name' => $data['name'],
        'subject' => $data['subject'],
        'description' => $data['description'] ?? null,
        'instructor_id' => $data['instructor_id'],
        'status' => $data['status'] ?? 'active',
        'created_at' => date('Y-m-d H:i:s')
    ];

    // Step 2: Insert new group
    $groupId = $this->GroupModel->insert($insertData);

    // Step 3: Get logged-in user (sent from frontend, stored in localStorage)
    $user_id = $data['user_id'] ?? null; // frontend sends this

$user = $this->UserModel->find($user_id);
error_log(print_r($user, true));  //  Properly log array as string
// or
error_log(json_encode($user));     // Log as JSON string
    if ($user && in_array($user['role'], ['Admin', 'Mentor'])) {
        // Step 4: Auto-add to group_members
        $memberData = [
            'group_id' => $groupId,
            'user_id' => $user_id,
            'joined_at' => date('Y-m-d H:i:s')
        ];

       
        $this->GroupMemberModel->insert($memberData);
    }

    echo json_encode([
        'message' => 'Group created successfully',
        'group_id' => $groupId
    ]);
}

    public function update($group_id) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $updateData = [
            'name' => $data['name'] ?? null,
            'subject' => $data['subject'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? null
        ];

        $updateData = array_filter($updateData, fn($v) => $v !== null);

        $this->GroupModel->update($group_id, $updateData);
        echo json_encode(['message' => 'Group updated successfully']);
    }

    public function delete($group_id) {
        $this->GroupModel->delete($group_id);
        echo json_encode(['message' => 'Group deleted successfully']);
    }

    // ---------- Group Members CRUD ----------

public function get_member($group_id)
{
    header('Content-Type: application/json');

    try {
        // Get all members linked to this group
        $members = $this->GroupMemberModel->db
            ->table('group_members')
            ->where('group_id', $group_id)
            ->get_all();

        // Enrich each member with user info
        foreach ($members as &$member) {
            $user = $this->UserModel->find($member['user_id']);
            if ($user) {
                $member['name'] = $user['first_name'] . ' ' . $user['last_name'];
                $member['email'] = $user['email'];
                $member['role'] = $user['role'];
            } else {
                $member['name'] = 'Unknown';
                $member['email'] = '-';
                $member['role'] = 'Unknown';
            }
        }

        http_response_code(200);
        echo json_encode(['members' => $members]);

    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}


public function add_member() {
    header('Content-Type: application/json');

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }

        if (empty($data['group_id']) || empty($data['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'group_id and user_id are required']);
            return;
        }

        // Check if user is already in the group
        $exists = $this->GroupMemberModel->db
            ->table('group_members')
            ->where('group_id', $data['group_id'])
            ->where('user_id', $data['user_id'])
            ->get();

        if ($exists) {
            http_response_code(400);
            echo json_encode(['error' => 'User already joined this group']);
            return;
        }

        $insertData = [
            'group_id' => $data['group_id'],
            'user_id' => $data['user_id'],
            'role' => $data['role'] ?? 'Member',
            'joined_at' => date('Y-m-d H:i:s')
        ];

        error_log("Inserting member: " . json_encode($insertData));

        $member_id = $this->GroupMemberModel->insert($insertData);

        echo json_encode([
            'message' => 'Member added successfully',
            'group_member_id' => $member_id
        ]);

    } catch (\Exception $e) {
        error_log("Add member failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to add member',
            'details' => $e->getMessage()
        ]);
    }
}


    public function update_member($group_member_id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $role = $data['role'] ?? 'Member';
        $this->GroupMemberModel->update($group_member_id, ['role' => $role]);
        echo json_encode(['message' => 'Member role updated successfully']);
    }

    public function remove_member($group_member_id) {
        $this->GroupMemberModel->delete($group_member_id);
        echo json_encode(['message' => 'Member removed successfully']);
    }
   
public function view($group_id) {
    header('Content-Type: application/json');
    
    try {
        // Get group
        $group = $this->GroupModel->find($group_id);
        
        if (!$group) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }
        
        // Get members
        $members = $this->GroupMemberModel->db
            ->table('group_members')
            ->where('group_id', $group_id)
            ->get_all();
        
        // Enrich members with user info
        foreach ($members as &$member) {
            $user = $this->UserModel->find($member['user_id']);
            if ($user) {
                $member['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                $member['user_email'] = $user['email'];
                $member['user_role'] = $user['role'];
            }
        }
        
        // Get messages
        $messages = $this->GroupMessageModel->db
            ->table('group_messages')
            ->where('group_id', $group_id)
            ->get_all();
        
        // Enrich messages with user info
        foreach ($messages as &$msg) {
            $user = $this->UserModel->find($msg['user_id']);
            if ($user) {
                $msg['name'] = $user['first_name'] . ' ' . $user['last_name'];
                $msg['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
            } else {
                $msg['name'] = 'Unknown User';
                $msg['user_name'] = 'Unknown User';
            }
        }
        
        // Get files
        $files = $this->GroupFile->db
            ->table('group_files')
            ->where('group_id', $group_id)
            ->get_all();
        
        // Enrich files with user info
        foreach ($files as &$file) {
            $user = $this->UserModel->find($file['user_id']);
            if ($user) {
                $file['uploader_name'] = $user['first_name'] . ' ' . $user['last_name'];
            } else {
                $file['uploader_name'] = 'Unknown User';
            }
        }

        // Get sessions (NEW)
        $sessions = $this->db
            ->table('sessions')
            ->where('type', 'group') // optional if you’re using the "type" column
            ->where('reference_id', $group_id)
            ->get_all();

        // Enrich sessions with user info
        foreach ($sessions as &$session) {
            $user = $this->UserModel->find($session['user_id']);
            if ($user) {
                $session['created_by'] = $user['first_name'] . ' ' . $user['last_name'];
            } else {
                $session['created_by'] = 'Unknown User';
            }
        }

        //  Include sessions in response
        http_response_code(200);
        echo json_encode([
            'group' => $group,
            'members' => $members,
            'messages' => $messages,
            'files' => $files,
            'sessions' => $sessions, // added this
        ]);
        
    } catch (\Exception $e) {
        error_log("Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

    public function sendMessage($group_id) {
    header('Content-Type: application/json');
    
    try {
        // Get input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }
        
        // Validate required fields
        if (empty($data['user_id']) || empty($data['message'])) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id and message are required']);
            return;
        }
        
        // Check if group exists
        $group = $this->GroupModel->find($group_id);
        if (!$group) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }
        
        // Prepare message data
        $messageData = [
            'group_id' => $group_id,
            'user_id' => $data['user_id'],
            'message' => $data['message'],
            'attachment' => $data['attachment'] ?? null,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Insert message
        $messageId = $this->GroupMessageModel->insert($messageData);
        
        if (!$messageId) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send message']);
            return;
        }
        
        // Get user info for response
        $user = $this->UserModel->find($data['user_id']);
        
        // Return the new message with user info
        $newMessage = [
            'id' => $messageId,
            'group_id' => $group_id,
            'user_id' => $data['user_id'],
            'message' => $data['message'],
            'attachment' => $data['attachment'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'user_name' => $user ? $user['first_name'] . ' ' . $user['last_name'] : 'Unknown',
            'name' => $user ? $user['first_name'] . ' ' . $user['last_name'] : 'Unknown'
        ];
        
        http_response_code(201);
        echo json_encode([
            'message' => $newMessage,
            'success' => true
        ]);
        
    } catch (\Exception $e) {
        error_log("Error sending message: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

public function addSession($group_id) {
    header('Content-Type: application/json');

    try {
        if (!session_id()) session_start();

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }

        if (empty($data['title']) || empty($data['session_date']) || empty($data['duration'])) {
            http_response_code(400);
            echo json_encode(['error' => 'title, session_date, and duration are required']);
            return;
        }

        $group = $this->GroupModel->find($group_id);
        if (!$group) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }

        // Accept meeting_link from input, default to null
        $sessionData = [
            'type' => 'group',
            'reference_id' => $group_id,
            'user_id' => $data['user_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'session_date' => $data['session_date'],
            'duration' => $data['duration'],
            'meeting_link' => $data['meeting_link'] ?? null, // <-- allow custom link
            'reminder_sent' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

        $sessionId = $this->GroupSessionModel->insert($sessionData);

        if (!$sessionId) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create session']);
            return;
        }

        $newSession = array_merge(['id' => $sessionId], $sessionData);

        http_response_code(201);
        echo json_encode([
            'session' => $newSession,
            'success' => true
        ]);

    } catch (\Exception $e) {
        error_log("Error adding session: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
public function add_Session($group_id) {
    header('Content-Type: application/json');

    try {
        if (!session_id()) session_start();

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }

        if (empty($data['title']) || empty($data['session_date']) || empty($data['duration'])) {
            http_response_code(400);
            echo json_encode(['error' => 'title, session_date, and duration are required']);
            return;
        }

        $group = $this->GroupModel->find($group_id);
        if (!$group) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }

        // Accept meeting_link from input, default to null
        $sessionData = [
            'type' => 'group',
            'reference_id' => $group_id,
            'user_id' => $data['user_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'session_date' => $data['session_date'],
            'duration' => $data['duration'],
            'meeting_link' => $data['meeting_link'] ?? null, // <-- allow custom link
            'reminder_sent' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

       $sessionId = $this->GroupSessionModel->insert($sessionData);

if (!$sessionId) {
    error_log("Insert failed for group {$group_id}");
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create session']);
    return;
}


        $newSession = array_merge(['id' => $sessionId], $sessionData);

        http_response_code(201);
        echo json_encode([
            'session' => $newSession,
            'success' => true
        ]);

    } catch (\Exception $e) {
        error_log("Error adding session: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
public function get_sessions($group_id)
{
    header('Content-Type: application/json');

    try {
        $sessions = $this->GroupSessionModel->db
            ->table('sessions')
            ->where('reference_id', $group_id)
            ->get_all();

        http_response_code(200);
        echo json_encode(['sessions' => $sessions]);
    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

}
