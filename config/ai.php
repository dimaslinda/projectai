<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Provider
    |--------------------------------------------------------------------------
    |
    | This value determines which AI service will be used for generating
    | responses. Only Gemini is supported now.
    |
    */

    'provider' => env('AI_PROVIDER', 'gemini'),

    /*
    |--------------------------------------------------------------------------
    | Persona-specific AI Providers
    |--------------------------------------------------------------------------
    |
    | Configure different AI providers for each persona type.
    | All personas now use Gemini.
    |
    */

    'persona_providers' => [
        'engineer' => 'gemini',
        'drafter' => 'gemini',
        'esr' => 'gemini',
    ],

    /*
    |--------------------------------------------------------------------------
    | Gemini API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Google's Gemini AI service.
    | Get your API key from: https://makersuite.google.com/app/apikey
    |
    */

    'gemini_api_key' => env('GEMINI_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Model Configuration per Persona
    |--------------------------------------------------------------------------
    |
    | Configure different AI models for each persona type.
    |
    */

    'gemini_models' => [
        'engineer' => env('GEMINI_MODEL_ENGINEER', 'gemini-2.5-pro'),
        'drafter' => env('GEMINI_MODEL_DRAFTER', 'gemini-2.5-pro'),
        'esr' => env('GEMINI_MODEL_ESR', 'gemini-2.5-pro'),
    ],

];