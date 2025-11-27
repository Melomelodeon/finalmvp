<?php
class UserModel extends Model
{
    protected $table = 'users';
    protected $primary_key = 'id';

    function getActiveUserEmails($role)
    {
        $email = $this->db->table($this->table)
            ->select('email')
            ->where(['status' => 'active',
            'role' => $role])
            ->get_all();

        return $email;
    }
}