<?php
class AnnouncementModel extends Model
{
    protected $table = 'announcements';
    protected $primaryKey = 'id';
    protected $fillable = [
        'created_by',
        'title',
        'description',
        'target_role',
        'expiry_date',
        'created_at'
    ];

    // Get all announcements with optional role filtering
    public function getAllByRole($role = null)
    {
        $query = $this->db->table($this->table)
            ->join('users', 'announcements.created_by = users.id')
            ->select('announcements.*, CONCAT(users.first_name, " ", users.last_name) as author_name');

        if ($role) {
            $now = date('Y-m-d H:i:s');
            $query->where("(target_role IS NULL OR target_role = ? OR ? = 'admin')", [$role, $role])
                ->where("(expiry_date IS NULL OR expiry_date > ?)", [$now]);
        }

        $query->order_by('created_at', 'DESC');
        return $query->get_all();
    }


    public function insertAnnouncement($data)
    {
        $data['created_at'] = date('Y-m-d H:i:s');
        return $this->insert($data);
    }

}
