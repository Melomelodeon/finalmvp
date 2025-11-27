<?php


header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");


//  Handle preflight OPTIONS requests (important for React + Axios)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');


/**
 * ------------------------------------------------------------------
 * LavaLust - an opensource lightweight PHP MVC Framework
 * ------------------------------------------------------------------
 *
 * MIT License
 *
 * Copyright (c) 2020 Ronald M. Marasigan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package LavaLust
 * @author Ronald M. Marasigan <ronald.marasigan@yahoo.com>
 * @since Version 1
 * @link https://github.com/ronmarasigan/LavaLust
 * @license https://opensource.org/licenses/MIT MIT License
 */

/*
| -------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------
| Here is where you can register web routes for your application.
|
|
*/
$router->get('/', function() {
    echo json_encode(['message' => 'API is running!']);
});


// USERS ROUTES
$router->get('/api/users', 'UserController::index');
$router->get('/api/users/total', 'UserController::total_users');
$router->get('/api/users/totalmentor', 'UserController::total_mentor');
$router->get('/api/users/recent', 'UserController::recent');
$router->get('/api/users/distribution', 'UserController::distribution');
$router->get('/api/users/{id}', 'UserController::get_user');    
$router->post('/api/users', 'UserController::create');
$router->post('/api/users/{id}', 'UserController::update');
$router->delete('/api/users/{id}', 'UserController::delete');
// Auth
$router->post('/api/auth/login', 'UserController::login');
// Track profile visits


// MENTORSHIP ROUTES
$router->get('/api/mentorships', 'MentorshipController::index');                // Get all mentorships
$router->get('/api/mentorships/{id}', 'MentorshipController::get_mentorship');   // Get single mentorship
$router->post('/api/mentorships', 'MentorshipController::add');                 // Create a new mentorship
$router->put('/api/mentorships/{id}', 'MentorshipController::update');          // Update mentorship
$router->delete('/api/mentorships/{id}', 'MentorshipController::delete');       // Delete mentorship
// ---------- GROUP ROUTES ----------

// Groups CRUD
$router->get('/api/groups', 'GroupController::index');  
$router->get('/api/groups/total_groups', 'GroupController::total_groups');                   // Get all groups
$router->get('/api/groups/{id}', 'GroupController::get_group');           // Get single group
$router->post('/api/groups', 'GroupController::create');                  // Create a new group
$router->put('/api/groups/{id}', 'GroupController::update');              // Update group
$router->delete('/api/groups/{id}', 'GroupController::delete');           // Delete group
$router->get('/api/groups/view/{id}', 'GroupController::view'); 
$router->post('/api/groups/{id}/files', 'GroupController::upload_file'); // Upload file to group
$router->get('/api/groups/{id}/files', 'GroupController::list_files');

// Send message to group
$router->post('/api/groups/{id}/messages', 'GroupController::sendMessage');
$router->post('/api/sessions/{id}', 'GroupController::add_Session');
$router->post('/api/groups/{id}/join', 'GroupController::join');
$router->get('/api/forum/total-posts', 'ForumController::total_posts');
// Add session to group
$router->post('/api/groups/{id}/sessions', 'GroupController::addSession');
// Group Members
$router->get('/api/sessions/{id}', 'GroupController::get_sessions');

$router->get('/api/members', 'GroupController::all_members');          // Get all members
$router->get('/api/members/{id}', 'GroupController::get_member');
      // Get single member
$router->post('/api/members', 'GroupController::add_member');          // Add a member
$router->put('/api/members/{id}', 'GroupController::update_member');   // Update a member
$router->delete('/api/members/{id}', 'GroupController::remove_member'); // Remove a member
// Forum routes
$router->get('/api/forum/threads', 'ForumController::threads');
$router->get('/api/forum/thread/{id}', 'ForumController::get_thread');

$router->post('/api/forum/thread', 'ForumController::create_thread');
$router->delete('/api/forum/thread/{id}', 'ForumController::delete_thread');
$router->post('/api/forum/reply', 'ForumController::create_reply');
$router->get('/api/forum/reply', 'ForumController::reply');
$router->get('/api/forum/reply/{id}', 'ForumController::get_replies');
$router->delete('/api/forum/reply/{id}', 'ForumController::delete_reply');
$router->post('/api/forum/comment', 'ForumController::create_comment');
//menor
$router->get('/api/mentors/getMentors', 'UserController::getMentors');
//menor
$router->get('/api/mentors/getMentor', 'UserController::get_Mentors');

$router->post('/api/mentors/{id}/approve', 'UserController::approveMentor');
$router->post('/api/mentors/{id}/reject', 'UserController::rejectMentor');
// ---------- LOG ROUTES ----------
$router->get('/api/logs', 'LogController::index');                // Get all logs
$router->get('/api/logs/{id}', 'LogController::get');            // Get single log by ID
$router->get('/api/logs/user/{user_id}', 'LogController::byUser'); // Get logs for a specific user
$router->post('/api/logs/add', 'LogController::add');            // Add a new log (optional user_id, action, details, status)
// Announcements CRUD
// Example routes
$router->get('/api/announcements', 'AnnouncementController::index');
$router->post('/api/announcements', 'AnnouncementController::create');
$router->delete('/api/announcements/{id}', 'AnnouncementController::delete');
$router->get('/api/mentees', 'UserController::getMentees');
$router->get('/api/mentorship', 'MentorshipController::getMentorships');
$router->get('/api/mentee', 'MentorshipController::getMentees');//getting mentees for mentor

//USERAUTH
$router->get('/api/userauth', 'AuthController::authenticate');

$router->post('/chatbot/send', 'Chatbot::send');