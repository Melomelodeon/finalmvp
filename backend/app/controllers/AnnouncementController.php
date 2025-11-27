<?php
class AnnouncementController extends Controller
{
    public function __construct()
    {
        parent::__construct();
        //cahnges
        $this->call->model(['AnnouncementModel', 'UserModel']);
        $this->call->library('MailerLib');

        // CORS headers
        header("Access-Control-Allow-Origin: http://localhost:5173");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Content-Type: application/json");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

    }

    // GET /api/announcements?role=student
    public function index()
    {
        $role = $_GET['role'] ?? null;
        try {
            $announcements = $this->AnnouncementModel->getAllByRole($role);
            echo json_encode($announcements);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        

    }

    // POST /api/announcements
    public function create()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || empty($input['created_by']) || empty($input['title']) || empty($input['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'created_by, title, and description are required']);
            return;
        }

        // Optional fields
        $data = [
            'created_by' => $input['created_by'],
            'title' => $input['title'],
            'description' => $input['description'],
            'target_role' => $input['target_role'] ?? null,
            'expiry_date' => $input['expiry_date'] ?? null,
            'created_at' => date('Y-m-d H:i:s')
        ];

        $id = $this->AnnouncementModel->insertAnnouncement($data);

        if ($id) {
            echo json_encode(['message' => 'Announcement created successfully', 'id' => $id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create announcement']);
        }

        //changes
        $emails = $this->UserModel->getActiveUserEmails($input['target_role']);

        echo json_encode($emails);
        if (!empty($emails)) {
            foreach ($emails as $row) {
                $message = <<<EOD
                <div style="background: linear-gradient(135deg, #60a5fa, #6366f1); border-radius:12px; padding:24px; color:#fff; text-align:center; margin-bottom:24px;">
                <img src="https://img.icons8.com/ios-filled/50/ffffff/megaphone.png" alt="Announcement" style="width:40px; height:40px; margin-bottom:12px;" />
                <h1 style="margin:0; font-size:22px;">{$input['title']}</h1>
                <p style="margin:8px 0 0; font-size:14px; color:#cbd5e1;">
                {$input['description']}
                </p>
                </div>
                EOD;

                $this->MailerLib->sendMail(
                    $row['email'],
                    $input['title'],
                    $message
                );
            }
        }

    }

    // DELETE /api/announcements/:id
    public function delete($id)
    {
        $result = $this->AnnouncementModel->delete($id);
        if ($result) {
            echo json_encode(['message' => 'Announcement deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete announcement']);
        }
    }
}
