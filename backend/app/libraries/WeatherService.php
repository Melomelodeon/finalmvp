<?php

class WeatherService
{
    private $apiKey;
    private $defaultCity;
    private $baseUrl;

    public function __construct()
    {
        // Get OpenWeatherMap API key from environment variable
        $this->apiKey = getenv('OPENWEATHERMAP_API_KEY');
        $this->defaultCity = 'Manila,PH'; // Default to Manila, Philippines
        $this->baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        if (!$this->apiKey) {
            throw new Exception('OpenWeatherMap API key not found in environment variables');
        }
    }

    /**
     * Get current weather data for a city
     * 
     * @param string $city City name (optional, defaults to Manila)
     * @param string $units Temperature units ('metric', 'imperial', 'kelvin')
     * @param string $lang Language code (default: 'en')
     * @return array Weather data or error message
     */
    public function getCurrentWeather($city = null, $units = 'metric', $lang = 'en')
    {
        try {
            $city = $city ?: $this->defaultCity;
            
            // Build API URL
            $url = $this->baseUrl . '/weather?' . http_build_query([
                'q' => $city,
                'appid' => $this->apiKey,
                'units' => $units,
                'lang' => $lang
            ]);
            
            // Make API call using cURL
            $response = $this->makeApiCall($url);
            
            if (!$response) {
                return [
                    'success' => false,
                    'error' => 'Failed to connect to weather service',
                    'code' => 500
                ];
            }
            
            $data = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [
                    'success' => false,
                    'error' => 'Invalid response from weather service',
                    'code' => 500
                ];
            }
            
            // Check for API errors
            if (isset($data['cod']) && $data['cod'] != 200) {
                return [
                    'success' => false,
                    'error' => $data['message'] ?? 'Weather API error',
                    'code' => $data['cod']
                ];
            }
            
            // Format the response data
            return [
                'success' => true,
                'data' => [
                    'city' => $data['name'],
                    'country' => $data['sys']['country'],
                    'temperature' => [
                        'current' => round($data['main']['temp'], 1),
                        'min' => round($data['main']['temp_min'], 1),
                        'max' => round($data['main']['temp_max'], 1),
                        'feels_like' => round($data['main']['feels_like'], 1),
                        'unit' => $units === 'imperial' ? '°F' : ($units === 'kelvin' ? 'K' : '°C')
                    ],
                    'humidity' => [
                        'value' => $data['main']['humidity'],
                        'unit' => '%'
                    ],
                    'pressure' => [
                        'value' => $data['main']['pressure'],
                        'unit' => 'hPa'
                    ],
                    'wind' => [
                        'speed' => $data['wind']['speed'] ?? 0,
                        'direction' => $data['wind']['deg'] ?? 0,
                        'unit' => $units === 'imperial' ? 'mph' : 'm/s'
                    ],
                    'clouds' => [
                        'value' => $data['clouds']['all'] ?? 0,
                        'unit' => '%'
                    ],
                    'weather' => [
                        'main' => $data['weather'][0]['main'],
                        'description' => $data['weather'][0]['description'],
                        'icon' => $data['weather'][0]['icon']
                    ],
                    'sun' => [
                        'sunrise' => date('H:i', $data['sys']['sunrise']),
                        'sunset' => date('H:i', $data['sys']['sunset'])
                    ],
                    'visibility' => ($data['visibility'] ?? 0) / 1000, // Convert to km
                    'last_update' => date('Y-m-d H:i:s', $data['dt']),
                    'icon_url' => "https://openweathermap.org/img/w/{$data['weather'][0]['icon']}.png"
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'General error: ' . $e->getMessage(),
                'code' => 500
            ];
        }
    }

    /**
     * Make API call using cURL
     * 
     * @param string $url API endpoint URL
     * @return string|false Response body or false on failure
     */
    private function makeApiCall($url)
    {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_USERAGENT => 'WeatherWidget/1.0',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            error_log("cURL Error: " . $error);
            return false;
        }
        
        if ($httpCode >= 400) {
            error_log("HTTP Error: " . $httpCode);
            return false;
        }
        
        return $response;
    }

    /**
     * Get weather for multiple cities
     * 
     * @param array $cities Array of city names
     * @param string $units Temperature units
     * @param string $lang Language code
     * @return array Weather data for all cities
     */
    public function getMultipleCitiesWeather($cities, $units = 'metric', $lang = 'en')
    {
        $results = [];
        
        foreach ($cities as $city) {
            $results[$city] = $this->getCurrentWeather($city, $units, $lang);
        }
        
        return $results;
    }

    /**
     * Set API key dynamically
     * 
     * @param string $apiKey OpenWeatherMap API key
     * @return void
     */
    public function setApiKey($apiKey)
    {
        $this->apiKey = $apiKey;
    }

    /**
     * Set default city
     * 
     * @param string $city Default city name
     * @return void
     */
    public function setDefaultCity($city)
    {
        $this->defaultCity = $city;
    }
}