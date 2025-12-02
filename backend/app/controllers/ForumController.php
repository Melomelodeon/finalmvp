<?php
class ForumController extends Controller {
    public function __construct() {
        parent::__construct();

        // Load models
        $this->call->model("ForumModel");
        $this->call->model("ForumReplyModel");
        $this->call->model("ForumComment");

    }

    // ========== THREAD CRUD ==========

    // GET /api/forum/threads
public function threads()
{
    header('Content-Type: application/json');

    try {
        $threads = $this->ForumModel->db->table('forum_posts')
            ->join('users', 'forum_posts.user_id = users.id')
            ->select('forum_posts.*, users.first_name as created_by_name')
            ->order_by('forum_posts.created_at', 'DESC')
            ->get_all();

        foreach ($threads as &$t) {
            $answers = $this->ForumModel->db->table('forum_answers')
                ->where('post_id', $t['id'])
                ->get_all();

            $t['answer_count'] = count($answers);
        }

        echo json_encode($threads);

    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
// GET /api/forum/total-posts
public function total_posts() {
    header('Content-Type: application/json');

    try {
        $count = $this->ForumModel->db->table('forum_posts')->count();

        echo json_encode([
            'total_posts' => $count
        ]);

    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

public function get_thread($id) {
    header('Content-Type: application/json');

    try {
        $id = (int) $id;

        // Atomic increment of views using raw()
        $this->ForumModel->db->raw(
            "UPDATE forum_posts SET views = views + 1 WHERE id = ?",
            [$id]
        );

        // Fetch thread with creator info
        $threadResult = $this->ForumModel->db->table('forum_posts')
            ->join('users', 'forum_posts.user_id = users.id')
            ->select('forum_posts.*, users.first_name as created_by_name')
            ->where('forum_posts.id', $id)
            ->get_all();

        if (empty($threadResult)) {
            echo json_encode(['thread' => null, 'answers' => []]);
            return;
        }

        $thread = $threadResult[0];

        // Fetch answers with replier info
        $answers = $this->ForumReplyModel->db->table('forum_answers')
            ->join('users', 'forum_answers.user_id = users.id')
            ->select('forum_answers.*, users.first_name as replied_by_name')
            ->where('forum_answers.post_id', $id)
            ->order_by('forum_answers.votes', 'DESC')
            ->order_by('forum_answers.created_at', 'ASC')
            ->get_all();

        // Fetch comments for each answer
        foreach ($answers as &$answer) {
            $comments = $this->ForumComment->db->table('forum_comments')
                ->join('users', 'forum_comments.user_id = users.id')
                ->select('forum_comments.*, users.first_name as commented_by_name')
                ->where('forum_comments.answer_id', $answer['id'])
                ->order_by('forum_comments.created_at', 'ASC')
                ->get_all();

            $answer['comments'] = $comments ?: [];
        }

        // Count total answers for thread
        $thread['answer_count'] = count($answers);

        echo json_encode([
            'thread' => $thread,
            'answers' => $answers
        ]);

    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

    // POST /api/forum/thread
    public function create_thread() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }

        // Validation
        if (empty($data['user_id']) || empty($data['title']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id, title, and content are required']);
            return;
        }

        // Default fields
        $data['tags'] = $data['tags'] ?? '';
        $data['views'] = 0;
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = $data['created_at'];

        // Insert
        $thread_id = $this->ForumModel->insert($data);

        if ($thread_id) {
            echo json_encode([
                'message' => 'Thread created successfully',
                'thread_id' => $thread_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create thread']);
        }
    }

    // PUT /api/forum/thread/:id
    public function update_thread($id) {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            return;
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $result = $this->ForumModel->update($id, $data);

        if ($result) {
            echo json_encode(['message' => 'Thread updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update thread']);
        }
    }

    // DELETE /api/forum/thread/:id
    public function delete_thread($id) {
        $result = $this->ForumModel->delete($id);

        if ($result) {
            echo json_encode(['message' => 'Thread deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete thread']);
        }
    }

    // ========== REPLIES CRUD ==========

    // GET /api/forum/replies
    public function replies() {
        $reply = $this->ForumReplyModel->all();
        echo json_encode($reply);
    }

    // GET /api/forum/reply/:id
    public function get_reply($id) {
        $reply = $this->ForumReplyModel->find($id);

        if (!$reply) {
            http_response_code(404);
            echo json_encode(['error' => 'Reply not found']);
            return;
        }

        echo json_encode($reply);
    }
// POST /api/forum/reply
public function create_reply() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    if (empty($data['post_id']) || empty($data['user_id']) || empty($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'post_id, user_id, and content are required']);
        return;
    }

    $data['created_at'] = date('Y-m-d H:i:s');

    $reply_id = $this->ForumReplyModel->insert($data);

    if ($reply_id) {
        echo json_encode([
            'message' => 'Reply added successfully',
            'reply_id' => $reply_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add reply']);
    }
}

    // DELETE /api/forum/reply/:id
    public function delete_reply($id) {
        $result = $this->ForumReplyModel->delete($id);

        if ($result) {
            echo json_encode(['message' => 'Reply deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete reply']);
        }
    }

    // POST /api/forum/comment
public function create_comment() {
    header('Content-Type: application/json');

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    if (empty($data['answer_id']) || empty($data['user_id']) || empty($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'answer_id, user_id, and content are required']);
        return;
    }

    $data['created_at'] = date('Y-m-d H:i:s');

    $comment_id = $this->ForumComment->insert($data);

    if ($comment_id) {
        echo json_encode([
            'message' => 'Comment added successfully',
            'comment_id' => $comment_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add comment']);
    }
}
public function vote_answer($id, $type = 'up') {
    $answer = $this->ForumReplyModel->find($id);
    if (!$answer) {
        http_response_code(404);
        echo json_encode(['error' => 'Answer not found']);
        return;
    }

    $votes = $answer['votes'];
    $votes = $type === 'up' ? $votes + 1 : $votes - 1;

    $this->ForumReplyModel->update($id, ['votes' => $votes]);

    echo json_encode(['message' => 'Vote updated', 'votes' => $votes]);
}

}
