<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * Library: MailerLib
 * 
 * Uses Resend HTTP API for email delivery (works on Render free tier).
 */

class MailerLib
{
    private $apiKey = 're_2jMnA7Si_5qmUbHGycYMAxFGgDP73tkZA';
    public $lastError = null;
    public $lastResponse = null;

    public function __construct()
    {
        // Library initialized
    }

    public function sendMail($email, $subject, $body)
    {
        $this->lastError = null;
        $this->lastResponse = null;

        $data = [
            'from'    => 'PeerConnect <onboarding@resend.dev>',
            'to'      => $email,
            'subject' => $subject,
            'html'    => $body,
        ];

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $this->lastResponse = $response;

        if ($curlError) {
            $this->lastError = "cURL error: " . $curlError;
            error_log("Resend cURL error: " . $curlError);
            return false;
        }

        if ($httpCode !== 200) {
            $this->lastError = "HTTP {$httpCode}: " . $response;
            error_log("Resend API error (HTTP {$httpCode}): " . $response);
            return false;
        }

        return true;
    }
}
