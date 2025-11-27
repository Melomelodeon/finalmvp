<?php
class MentorshipController extends Controller {
    public function __construct() {
        parent::__construct();
        $this->call->model("MentorshipModel");
        $this->call->model("UserModel");
        header("Access-Control-Allow-Origin: https://finalmvp-frontend.onrender.com");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Content-Type: application/json");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    // Get all mentorships (Admin)
    public function index() {
        $mentorships = $this->MentorshipModel->all();
        echo json_encode($mentorships);
    }

    // Get mentorships for a specific user
    public function user($id) {
        $mentorships = $this->MentorshipModel->where("mentor_id = ? OR student_id = ?", [$id, $id]);
        echo json_encode($mentorships);
    }

    // Apply as mentee (user applies to a mentor)
    public function apply() {
        $data = $_POST;

        if (empty($data['mentor_id']) || empty($data['student_id'])) {
            echo json_encode(['error' => 'mentor_id and mentee_id are required']);
            return;
        }

        $data['status'] = 'Pending'; // default status for application
        $data['start_date'] = $data['start_date'] ?? date('Y-m-d');

        $this->MentorshipModel->insert($data);
        echo json_encode(['message' => 'Application submitted successfully']);
    }

 public function add() {
    // Read JSON from request body
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['mentor_id']) || empty($data['student_id'])) {
        echo json_encode(['error' => 'mentor_id and student_id are required']);
        return;
    }

    $data['status'] = $data['status'] ?? 'Pending';
    $data['start_date'] = $data['start_date'] ?? date('Y-m-d');
    $data['end_date'] = $data['end_date'] ?? null;

    $this->MentorshipModel->insert($data);

    echo json_encode(['message' => 'Mentorship added successfully']);
}
   public function update($id) {
    // Read JSON from request body
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    // Prepare update data based on add() fields
    $updateData = [
        'mentor_id'   => $data['mentor_id'] ?? null,
        'student_id'  => $data['student_id'] ?? null,
        'subject'     => $data['subject'] ?? null,
        'status'      => $data['status'] ?? null,
        'start_date'  => $data['start_date'] ?? null,
        'end_date'    => $data['end_date'] ?? null
    ];

    // Validate status
    $validStatuses = ['Active', 'Pending', 'Completed', 'Reject'];
    if (isset($updateData['status']) && !in_array($updateData['status'], $validStatuses)) {
        echo json_encode(['error' => 'Invalid status']);
        return;
    }

    // Remove null values
    $updateData = array_filter($updateData, fn($v) => $v !== null);

    // Update record
    $this->MentorshipModel->update($id, $updateData);

    echo json_encode(['message' => 'Mentorship updated successfully']);
}



    // Delete mentorship
    public function delete($mentorship_id) {
        $this->MentorshipModel->delete($mentorship_id);
        echo json_encode(['message' => 'Mentorship deleted successfully']);
    }

    // Get single mentorship by ID
    public function get_mentorship($id) {
        $mentorship = $this->MentorshipModel->find($id);
        echo json_encode($mentorship);
    }
public function getMentorships()
{
    header('Content-Type: application/json');

    try {
        error_log("getMentorships() called");

        // JOIN users to include mentee full name and profile picture
        $mentorships = $this->MentorshipModel->db
            ->table('mentorships AS m')
            ->select('m.*, CONCAT(u.first_name, " ", u.last_name) AS full_name, u.profile_image')
            ->join('users AS u', 'm.student_id = u.id')
            ->order_by('m.created_at', 'DESC')
            ->get_all();

        echo json_encode($mentorships ?: []); // fallback to empty array
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
public function getMentees() {
    header('Content-Type: application/json');

    try {
        $mentees = $this->UserModel->db
            ->table('users')
            ->where('role', 'Mentee')
            ->where('status', 'Active')
            ->order_by('date_joined', 'DESC')
            ->get_all();

        echo json_encode($mentees); // Return the full array
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}


}
