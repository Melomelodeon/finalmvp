<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

// Include composer autoloader for OpenWeatherMap library
require_once __DIR__ . '/../../vendor/autoload.php';

// Include WeatherService class
require_once __DIR__ . '/../libraries/WeatherService.php';

class WeatherController extends Controller
{
    private $weatherService;

    public function __construct()
    {
        parent::__construct();
        // Load the weather service using LavaLust's library system
        $this->call->library('WeatherService');
    }

    /**
     * Get current weather data
     * 
     * Endpoint: GET /api/weather/current
     * Query params: city (optional), units (optional), lang (optional)
     */
    public function getCurrentWeather()
    {
        try {
            // Set CORS headers for frontend access
            header('Access-Control-Allow-Origin: ' . getenv('FRONTEND_URL'));
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Content-Type: application/json');

            // Handle preflight OPTIONS request
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }

            // Get query parameters
            $city = $_GET['city'] ?? null;
            $units = $_GET['units'] ?? 'metric';
            $lang = $_GET['lang'] ?? 'en';

            // Get weather data
            $weatherData = $this->WeatherService->getCurrentWeather($city, $units, $lang);

            if ($weatherData['success']) {
                http_response_code(200);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Weather data retrieved successfully',
                    'weather' => $weatherData['data']
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => $weatherData['error'],
                    'code' => $weatherData['code'] ?? 500
                ]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to retrieve weather data: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get weather for multiple cities
     * 
     * Endpoint: POST /api/weather/multiple
     * Body: {"cities": ["Manila,PH", "Cebu,PH"], "units": "metric", "lang": "en"}
     */
    public function getMultipleCitiesWeather()
    {
        try {
            // Set CORS headers
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Content-Type: application/json');

            // Handle preflight OPTIONS request
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }

            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['cities']) || !is_array($input['cities'])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid input. Please provide cities array.'
                ]);
                return;
            }

            $cities = $input['cities'];
            $units = $input['units'] ?? 'metric';
            $lang = $input['lang'] ?? 'en';

            // Get weather data for all cities
            $weatherData = $this->WeatherService->getMultipleCitiesWeather($cities, $units, $lang);

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Weather data retrieved successfully',
                'weather' => $weatherData
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to retrieve weather data: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update API key configuration
     * 
     * Endpoint: POST /api/weather/config
     * Body: {"api_key": "your_api_key", "default_city": "Manila,PH"}
     */
    public function updateConfig()
    {
        try {
            // Set CORS headers
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Content-Type: application/json');

            // Handle preflight OPTIONS request
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }

            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON input.'
                ]);
                return;
            }

            // Update API key if provided
            if (isset($input['api_key'])) {
                $this->WeatherService->setApiKey($input['api_key']);
            }

            // Update default city if provided
            if (isset($input['default_city'])) {
                $this->WeatherService->setDefaultCity($input['default_city']);
            }

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Weather service configuration updated successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Health check endpoint for weather service
     * 
     * Endpoint: GET /api/weather/health
     */
    public function healthCheck()
    {
        // Set CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json');

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Weather service is running',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}