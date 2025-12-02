<?php

class Chatbot extends Controller
{
    private $apiKey;

    public function __construct()
    {
        parent::__construct();
        
        // Get Google AI API key from environment variable
        $this->apiKey = getenv('GOOGLE_AI_API_KEY');
        
        if (!$this->apiKey) {
            throw new Exception('Google AI API key not found in environment variables. Please set GOOGLE_AI_API_KEY.');
        }
    }

    public function send()
    {
        // Set CORS headers
        header("Access-Control-Allow-Origin: " . getenv('FRONTEND_URL'));
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Content-Type: application/json");

        $input = json_decode(file_get_contents("php://input"), true);
        $message = $input['message'] ?? '';

        if (!$message) {
            echo json_encode(["reply" => "No message provided"]);
            return;
        }

        // Correct updated endpoint
        $url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" . $this->apiKey;

        $data = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $message]
                    ]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_SSL_VERIFYPEER => false
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        // DEBUG OUTPUT
        echo json_encode([
            "raw" => $response
        ]);
    }
}