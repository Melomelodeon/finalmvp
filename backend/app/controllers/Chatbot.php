<?php

class Chatbot extends Controller
{
    private $apiKey = "AIzaSyARAz7js-zr7niAtE6WGI-77Zjdaz2Kbt4";

    public function send()
    {
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