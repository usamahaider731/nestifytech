<?php

namespace App\Support;

use Illuminate\Support\Str;

class ColorThemeHelper
{
    public static function repeaterFields(string $section): array
    {
        $colorFields = [
            ['name' => 'key', 'label' => 'Theme Key', 'type' => 'text', 'placeholder' => 'e.g. red'],
            ['name' => 'label', 'label' => 'Theme Name', 'type' => 'text', 'placeholder' => 'e.g. Red'],
            ['name' => 'primary', 'label' => 'Primary', 'type' => 'color', 'value' => '#7367f0'],
            ['name' => 'secondary', 'label' => 'Secondary', 'type' => 'color', 'value' => '#7983a7'],
            ['name' => 'accent', 'label' => 'Accent', 'type' => 'color', 'value' => '#2f3349'],
            ['name' => 'res', 'label' => 'Res', 'type' => 'color', 'value' => '#b6bee3'],
            ['name' => 'bg', 'label' => 'Background', 'type' => 'color', 'value' => '#25293c'],
            ['name' => 'dynamic', 'label' => 'Dynamic', 'type' => 'color', 'value' => '#3a3d53'],
            ['name' => 'heading', 'label' => 'Heading', 'type' => 'color', 'value' => '#d0d4f1'],
            ['name' => 'permanent', 'label' => 'Permanent', 'type' => 'color', 'value' => '#434968'],
            ['name' => 'common', 'label' => 'Common', 'type' => 'color', 'value' => '#434968'],
        ];

        if ($section === 'color') {
            $colorFields[] = ['name' => 'text', 'label' => 'Text', 'type' => 'color', 'value' => '#7c7c7c'];
        }

        return $colorFields;
    }

    public static function defaultsAsRepeaterItems(string $section): array
    {
        $defaults = config("color_palettes.{$section}", []);

        if ($defaults === []) {
            $configPath = config_path('color_palettes.php');
            if (file_exists($configPath)) {
                $all = require $configPath;
                $defaults = $all[$section] ?? [];
            }
        }

        $items = [];

        foreach ($defaults as $key => $palette) {
            $item = [
                'key' => $key,
                'label' => $palette['label'] ?? Str::title($key),
            ];

            foreach (['primary', 'secondary', 'accent', 'res', 'bg', 'dynamic', 'heading', 'permanent', 'common', 'text'] as $field) {
                if (isset($palette[$field])) {
                    $item[$field] = $palette[$field];
                }
            }

            $items[] = $item;
        }

        return $items;
    }

    public static function palettesFromRepeaterItems(array $items): array
    {
        $palettes = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $key = self::resolveKey($item);
            if ($key === '') {
                continue;
            }

            $palettes[$key] = [
                'label' => $item['label'] ?? Str::title($key),
                'swatch' => $item['primary'] ?? '#000000',
                'primary' => $item['primary'] ?? '#000000',
                'secondary' => $item['secondary'] ?? '#7983a7',
                'accent' => $item['accent'] ?? '#2f3349',
                'res' => $item['res'] ?? '#b6bee3',
                'bg' => $item['bg'] ?? '#25293c',
                'dynamic' => $item['dynamic'] ?? '#3a3d53',
                'heading' => $item['heading'] ?? '#d0d4f1',
                'permanent' => $item['permanent'] ?? '#434968',
                'common' => $item['common'] ?? '#434968',
            ];

            if (isset($item['text'])) {
                $palettes[$key]['text'] = $item['text'];
            }
        }

        return $palettes;
    }

    public static function findPalette(array $items, string $key): ?array
    {
        $palettes = self::palettesFromRepeaterItems($items);

        return $palettes[$key] ?? null;
    }

    public static function resolveKey(array $item): string
    {
        $key = trim((string) ($item['key'] ?? ''));

        if ($key !== '') {
            return Str::slug($key);
        }

        return Str::slug((string) ($item['label'] ?? ''));
    }
}
