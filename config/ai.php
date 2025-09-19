<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Provider
    |--------------------------------------------------------------------------
    |
    | This value determines which AI service will be used for generating
    | responses. Supported providers: "gemini", "openai"
    | You can set different providers for each persona.
    |
    */

    'provider' => env('AI_PROVIDER', 'gemini'),

    /*
    |--------------------------------------------------------------------------
    | Persona-specific AI Providers
    |--------------------------------------------------------------------------
    |
    | Configure different AI providers for each persona type.
    | If not specified, will fallback to the default provider above.
    |
    */

    'persona_providers' => [
        'engineer' => env('AI_PROVIDER_ENGINEER', env('AI_PROVIDER', 'gemini')),
        'drafter' => env('AI_PROVIDER_DRAFTER', env('AI_PROVIDER', 'gemini')),
        'esr' => env('AI_PROVIDER_ESR', env('AI_PROVIDER', 'gemini')),
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
    | OpenAI API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for OpenAI's GPT models.
    | Get your API key from: https://platform.openai.com/api-keys
    |
    */

    'openai_api_key' => env('OPENAI_API_KEY'),
    'openai_model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),

    /*
    |--------------------------------------------------------------------------
    | Model Configuration per Persona
    |--------------------------------------------------------------------------
    |
    | Configure different AI models for each persona type.
    | This allows fine-tuning model selection based on task complexity.
    |
    */

    'openai_models' => [
        'engineer' => env('OPENAI_MODEL_ENGINEER', env('OPENAI_MODEL', 'gpt-4o')),
        'drafter' => env('OPENAI_MODEL_DRAFTER', env('OPENAI_MODEL', 'gpt-4o')),
        'esr' => env('OPENAI_MODEL_ESR', env('OPENAI_MODEL', 'gpt-4o')),
    ],

    'gemini_models' => [
        'engineer' => env('GEMINI_MODEL_ENGINEER', 'gemini-2.5-pro'), // Latest stable model
        'drafter' => env('GEMINI_MODEL_DRAFTER', 'gemini-2.5-pro'),  // Latest stable model
        'esr' => env('GEMINI_MODEL_ESR', 'gemini-2.5-pro'),      // Latest stable model
    ],

];