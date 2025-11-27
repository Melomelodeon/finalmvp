<?php


class UserController extends Controller {
    public function __construct() {
        parent::__construct();
        $this->call->model("UserModel");

        //changes
        $this->call->library('MailerLib');
    }

    // Get all users
    public function index() {
        $users = $this->UserModel->all();
        echo json_encode($users);
    }
public function total_users() {
    $users = $this->UserModel->all();
    $total = count($users); // get total users
    echo json_encode(['total' => $total]);
}
public function total_mentor() {
    $total_mentors = $this->db
        ->table('users')
        ->select_count('*', 'total')
        ->where('role', 'Mentor') 
        ->get();

    echo json_encode($total_mentors);
}
   public function recent()
    {
        $recentUsers = $this->db
            ->table('users')
            ->order_by('created_at', 'DESC')
            ->limit(3)
            ->get_all(); // returns array

        echo json_encode($recentUsers);
    }
public function distribution()
    {
        $distribution = $this->db
            ->table('users')
            ->select('role')
            ->select_count('*', 'count')
            ->group_by('role')
            ->get_all(); // returns array of role + count

      

        echo json_encode($distribution);
    }
    // Get single user by ID
    public function get_user($id) {
        $user = $this->UserModel->find($id);
        echo json_encode($user);
    }

    // Create a new user
    public function create() {
        // Validate required fields
        if (empty($_POST['first_name']) || empty($_POST['last_name']) || 
            empty($_POST['email']) || empty($_POST['username']) || 
            empty($_POST['password'])) {
            echo json_encode(['error' => 'Please fill all required fields']);
            return;
        }

        // Handle file upload
        $profileImage = null;
        if (!empty($_FILES['profile_image']['name'])) {
            $uploadDir = ROOT_DIR . 'public/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $filename = time() . "_" . basename($_FILES['profile_image']['name']);
            $target = $uploadDir . $filename;
            
            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
                $profileImage = "http://localhost:3000/public/uploads/" . $filename;
            }
        }

        $this->UserModel->insert([
            'first_name'    => $_POST['first_name'],
            'last_name'     => $_POST['last_name'],
            'email'         => $_POST['email'],
            'username'      => $_POST['username'],
            'password_hash' => password_hash($_POST['password'], PASSWORD_BCRYPT),
            'skills'        => $_POST['skills'] ?? '',
            'role'          => $_POST['role'] ?? 'Mentee',
            'bio'           => $_POST['bio'] ?? null,
            'profile_image' => $profileImage,
            'date_joined'   => date('Y-m-d H:i:s'),
            'status'        => $_POST['status'] ?? 'Active'
        ]);
        
        echo json_encode(['message' => 'User added successfully']);
    }

    // Update user
    public function update($id) {
        // Get existing profile image if no new file uploaded
        $profileImage = $_POST['profile_image_old'] ?? null;
        
        if (!empty($_FILES['profile_image']['name'])) {
            $uploadDir = ROOT_DIR . 'public/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $filename = time() . "_" . basename($_FILES['profile_image']['name']);
            $target = $uploadDir . $filename;
            
            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
                $profileImage = "http://localhost:3000/public/uploads/" . $filename;
            }
        }

        $data = [
            'first_name'    => $_POST['first_name'] ?? '',
            'last_name'     => $_POST['last_name'] ?? '',
            'email'         => $_POST['email'] ?? '',
            'username'      => $_POST['username'] ?? '',
            'skills'        => $_POST['skills'] ?? '',
            'role'          => $_POST['role'] ?? 'Mentee',
            'bio'           => $_POST['bio'] ?? null,
            'profile_image' => $profileImage,
            'status'        => $_POST['status'] ?? 'Active'
        ];

        // Only update password if provided
        if (!empty($_POST['password'])) {
            $data['password_hash'] = password_hash($_POST['password'], PASSWORD_BCRYPT);
        }

        $this->UserModel->update($id, $data);
        
        echo json_encode(['message' => 'User updated successfully']);
    }

    // Delete a user
    public function delete($id) {
        $this->UserModel->delete($id);
        echo json_encode(['message' => 'User deleted successfully']);
    }

    // Login method - accepts JSON or form-data { email, password }
   public function login() {
    // Read input (support JSON payloads)
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? $_POST['email'] ?? null;
    $password = $input['password'] ?? $_POST['password'] ?? null;

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }

    // Find user by email
    $this->call->model('UserModel');
    $user = $this->UserModel->filter(['email' => $email])->get();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    // Verify password (passwords are stored in password_hash)
    if (!empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
        // Get user role (default to 'Mentee' if not set)
    
        $role = $user['role'] ?? 'Mentee';
        
        // remove sensitive data
        unset($user['password_hash']);

        // Optionally, generate a simple session token (replace with JWT in production)
        $token = base64_encode($user['id'] . ':' . time());



        echo json_encode([
            'message' => 'Login successful', 
            'user' => $user, 
            'role' => $role,
            'id' => $user['id'],
            'token' => $token
        ]);
        return;
    }

    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}
  // Get all mentors with pending status
public function getMentors() {
    header('Content-Type: application/json');

    try {
        // Log to check if function runs
        error_log("getMentors() called");
$mentors = $this->UserModel->db
    ->table('users')
    ->where('role', 'Mentor')
    ->where('status', 'Pending')
    ->order_by('date_joined', 'DESC')
    ->get_all();



        foreach ($mentors as &$mentor) {
            $mentor['subjects'] = explode(',', $mentor['skills'] ?? '');
        }

        echo json_encode($mentors);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
public function get_Mentors() {
    header('Content-Type: application/json');

    try {
        // Log to check if function runs
        error_log("getMentors() called");
$mentors = $this->UserModel->db
    ->table('users')
    ->where('role', 'Mentor')
    ->where('status', 'Active')
    ->order_by('date_joined', 'DESC')
    ->get_all();



        foreach ($mentors as &$mentor) {
            $mentor['subjects'] = explode(',', $mentor['skills'] ?? '');
        }

        echo json_encode($mentors);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

public function getMentees() {
    header('Content-Type: application/json');

    try {
        // Log to check if function runs
        error_log("getMentors() called");
$mentees = $this->UserModel->db
    ->table('users')
    ->where('role', 'Mentee')
    ->where('status', 'Active')
    ->order_by('date_joined', 'DESC')
    ->get_all();

  $total_mentees = count($mentees);


        echo json_encode($total_mentees);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
// Approve mentor (set status to Active)
public function approveMentor($id) {
    header('Content-Type: application/json');

    $user = $this->UserModel->find($id);
    if (!$user) {
        echo json_encode(['error' => 'Mentor not found']);
        return;
    }

    // Update mentor status to Active
    $this->UserModel->update($id, ['status' => 'Active']);
    echo json_encode(['message' => 'Mentor approved successfully']);

    //changes
     $approvedMessage = <<<'EOD'
            <div style="background:#f8fafc; font-family:Arial, sans-serif; padding:24px; max-width:600px; margin:auto; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                <div style="background: linear-gradient(135deg, #60a5fa, #6366f1); border-radius:12px; padding:24px; color:#fff; text-align:center; margin-bottom:24px;">
                    <img src="https://img.icons8.com/ios-filled/50/ffffff/checked--v1.png" alt="Approved" style="width:40px; height:40px; margin-bottom:12px;" />
                    <h1 style="margin:0; font-size:22px;">You're officially a PeerConnect Mentor!</h1>
                    <p style="margin:8px 0 0; font-size:14px; color:#cbd5e1;">
                        Your application has been approved — welcome to a community where experience drives impact.
                    </p>
                </div>

                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                    <p style="font-size:15px; color:#1f2937; margin:0 0 16px;">
                        We’re excited to have you on board. As a PeerConnect mentor, you’ll empower others through meaningful conversations, actionable advice, and ongoing support. Here’s how to get started:
                    </p>

                    <div style="display:flex; align-items:flex-start; margin-bottom:16px;">
                        <div style="width:32px; height:32px; background:#e0f2fe; color:#60a5fa; font-weight:bold; border-radius:50%; text-align:center; line-height:32px; margin-right:12px;">1</div>
                        <div>
                            <strong style="color:#111827;">Set up your mentor profile</strong>
                            <div style="color:#475569; font-size:13px;">Add your bio, expertise, and availability to help us match you with the right peers.</div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:flex-start; margin-bottom:16px;">
                        <div style="width:32px; height:32px; background:#e0f2fe; color:#60a5fa; font-weight:bold; border-radius:50%; text-align:center; line-height:32px; margin-right:12px;">2</div>
                        <div>
                            <strong style="color:#111827;">Launch your first study group</strong>
                            <div style="color:#475569; font-size:13px;">Choose a focus area like career growth or interview prep, and start building your learning circle.</div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:flex-start; margin-bottom:16px;">
                        <div style="width:32px; height:32px; background:#e0f2fe; color:#60a5fa; font-weight:bold; border-radius:50%; text-align:center; line-height:32px; margin-right:12px;">3</div>
                        <div>
                            <strong style="color:#111827;">Join the conversation</strong>
                            <div style="color:#475569; font-size:13px;">Engage in our forums to share insights, ask questions, and support fellow mentors and learners.</div>
                        </div>
                    </div>

                    <div style="text-align:center; margin-top:24px;">
                        <a href="http://temp-domain/" style="background-color:#6366f1; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">Sign In to Get Started</a>
                    </div>
                </div>

                <div style="text-align:center; color:#64748b; font-size:12px; margin-top:24px;">
                    You’re receiving this email because you applied to become a mentor on PeerConnect.<br>
                    © PeerConnect • Building growth through real conversation
                </div>
            </div>
            EOD;

    $this->MailerLib->sendMail($user['email'], "You're officially a PeerConnect Mentor!", $approvedMessage);
}


// Reject mentor (set status to Rejected)
public function rejectMentor($id) {
    header('Content-Type: application/json');

    $user = $this->UserModel->find($id);
    if (!$user) {
        echo json_encode(['error' => 'Mentor not found']);
        return;
    }

    // Update mentor status to Rejected
    $this->UserModel->update($id, ['status' => 'Rejected']);
    echo json_encode(['message' => 'Mentor rejected successfully']);
}

}