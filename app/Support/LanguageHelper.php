<?php

namespace App\Support;

class LanguageHelper
{
    public static function all(): array
    {
        $path = storage_path('app/data/lang/language.json');
        if (! file_exists($path)) {
            return [];
        }

        $languages = json_decode(file_get_contents($path), true) ?: [];

        return array_values(array_filter($languages, function ($language) {
            return ($language['active'] ?? false) === true || ($language['active'] ?? '') === 'true';
        }));
    }

    public static function translations(string $prefix): array
    {
        $prefix = preg_replace('/[^a-z0-9]/i', '', $prefix) ?: 'en';
        $path = storage_path("app/data/lang/{$prefix}_lang.json");
        if (! file_exists($path)) {
            return [];
        }

        return json_decode(file_get_contents($path), true) ?: [];
    }

    public static function resolve(?string $prefix): array
    {
        $languages = self::all();
        $current = collect($languages)->firstWhere('prefix', $prefix)
            ?? collect($languages)->first(function ($language) {
                return ($language['is_default'] ?? false) === true || ($language['is_default'] ?? '') === 'true';
            })
            ?? ($languages[0] ?? []);

        return [
            'languages' => $languages,
            'current' => $current,
            'translations' => $current ? self::translations($current['prefix']) : [],
        ];
    }
}
