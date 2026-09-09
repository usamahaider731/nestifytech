<?php

namespace App\Http\Controllers;

use App\Support\ColorThemeHelper;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class SettingController extends Controller
{
    protected $data;
    protected $file;

    public function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/setting.json';
        $path = File::exists($this->file) ? File::get($this->file) : '{}';
        $this->data = json_decode($path, true);
        $this->delete_null_tax();
    }

    public function setting(Request $request)
    {
        $typePermissionMap = [
            'site' => 'setting-read',
            'font' => 'setting-read',
            'color' => 'setting-read',
            'backend-color' => 'setting-read',
            'ai' => 'setting-write',
        ];

        $permissionKey = strtolower($request->type);
        if (isset($typePermissionMap[$permissionKey])) {
            $requiredPermission = $typePermissionMap[$permissionKey];
            if (!in_array($requiredPermission, $request->user()->user_permissions ?? [])) {
                abort(403, 'Unauthorized action.');
            }
        }

        if (in_array($request->type, ['color', 'backend-color'], true)) {
            $this->ensureColorTypes($request->type);
        }

        $type = $this->data[$request->type];
        $colorPalettes = in_array($request->type, ['color', 'backend-color'], true)
            ? ColorThemeHelper::palettesFromRepeaterItems($type['color_types']['value'] ?? [])
            : [];

        return Inertia::render('Admin/Setting/Setting', [
            'type' => $type,
            'name' => $request->type,
            'colorPalettes' => $colorPalettes,
        ]);
    }

    public function delete_null_tax()
    {
        $free_tax = DB::table('taxonomies')->where(['type' => null])->get();
        if (count($free_tax) > 0) {
            foreach ($free_tax as $value) {
                DB::table('taxonomy_meta')->where(['taxonomy_id' => $value->id])->delete();
                DB::table('taxonomies')->where('id', $value->id)->delete();
            }
        }
    }

    public function updateCountry()
    {
        $file = $this->json_file_location . '/countries.json';
        $countriesData = File::exists($file) ? File::get($file) : [];
        $countriesData = json_decode($countriesData, true);
        $count = DB::table('taxonomies')->where('type', 'country')->count();

        if ($count == 0 && count($countriesData) > 0) {
            foreach ($countriesData as $value) {
                DB::table('taxonomies')->updateOrInsert([
                    'title' => $value['name'],
                    'type' => 'country'
                ], [
                    'parent_id' => 0,
                    'status' => 'publish',
                    'slug' => Str::slug($value['name'])
                ]);

                $country = DB::table('taxonomies')->where(['title' => $value['name'], 'type' => 'country'])->first();
                // ... (rest of the file remains the same except taxonomy -> taxonomies)

                foreach ($value as $key => $val) {
                    if (in_array($key, ['name', 'subregion', 'subregion_id', 'translations', 'region_id', 'region', 'iso2', 'iso3'])) {
                        continue;
                    }
                    DB::table('taxonomy_meta')->updateOrInsert(
                        ['taxonomy_id' => $country->id, 'key' => $key],
                        ['value' => is_array($val) ? json_encode($val) : $val]
                    );
                }
            }
        }
    }

    public function translations(Request $request)
    {
        $locale = $request->get('locale', 'en');
        $langPath = $this->json_file_location . '/lang';
        $path = $langPath . "/{$locale}_lang.json";

        if (!file_exists($path)) {
            if (!file_exists($langPath)) mkdir($langPath, 0755, true);
            file_put_contents($path, json_encode((object)[], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        $translations = json_decode(file_get_contents($path), true) ?: [];
        $languagesFile = $langPath . '/language.json';
        $languages = file_exists($languagesFile) ? json_decode(file_get_contents($languagesFile), true) : [];

        return Inertia::render('Admin/Setting/Translations', [
            'translations' => $translations,
            'languages' => $languages,
            'currentLocale' => $locale
        ]);
    }

    public function updateTranslation(Request $request)
    {
        $locale = $request->get('locale', 'en');
        $translations = $request->get('translations', []);
        $filePath = $this->json_file_location . "/lang/{$locale}_lang.json";

        file_put_contents($filePath, json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return redirect()->back()->with('success', 'Translations updated successfully.');
    }

    public function settingUpdate(Request $request)
    {
        $typePermissionMap = [
            'site' => 'setting-write',
            'font' => 'setting-write',
            'color' => 'setting-write',
            'backend-color' => 'setting-write',
            'ai' => 'setting-write',
        ];

        $permissionKey = strtolower($request->type);
        if (isset($typePermissionMap[$permissionKey])) {
            $requiredPermission = $typePermissionMap[$permissionKey];
            if (!in_array($requiredPermission, $request->user()->user_permissions ?? [])) {
                abort(403, 'Unauthorized action.');
            }
        }

        $currentSettings = File::exists($this->file) ? json_decode(File::get($this->file), true) : [];
        if (!isset($currentSettings[$request->type])) $currentSettings[$request->type] = [];

        if ($request->type === 'site') $this->updateCountry();

        if (in_array($request->type, ['color', 'backend-color'], true)) {
            $this->ensureColorTypes($request->type);
        }

        if (in_array($request->type, ['color', 'backend-color'], true) && $request->filled('color_type')) {
            $previousColorType = $currentSettings[$request->type]['color_type']['value'] ?? null;

            if ($request->color_type !== $previousColorType) {
                $colorTypes = $request->input('color_types');
                if (! is_array($colorTypes)) {
                    $colorTypes = $currentSettings[$request->type]['color_types']['value'] ?? [];
                }

                $palette = ColorThemeHelper::findPalette($colorTypes, $request->color_type);
                if ($palette) {
                    foreach ($palette as $colorKey => $colorValue) {
                        if (in_array($colorKey, ['label', 'swatch'], true)) {
                            continue;
                        }
                        if (isset($currentSettings[$request->type][$colorKey])) {
                            $currentSettings[$request->type][$colorKey]['value'] = $colorValue;
                        }
                    }
                    if (isset($currentSettings[$request->type]['color_type'])) {
                        $currentSettings[$request->type]['color_type']['value'] = $request->color_type;
                    }
                }
            }
        }

        foreach ($request->all() as $key => $value) {
            if (in_array($key, ['_token', '_method', 'type'])) continue;

            if (isset($currentSettings[$request->type][$key])) {
                $settingItem = $currentSettings[$request->type][$key];
                if ($settingItem['type'] === 'image' && $request->hasFile($key)) {
                    if (!empty($settingItem['value']) && Storage::disk('public')->exists('uploads/image/' . $settingItem['value'])) {
                        Storage::disk('public')->delete('uploads/image/' . $settingItem['value']);
                    }
                    $file = $request->file($key);
                    $filename = time() . '_' . md5($currentSettings['site']['name']['value'] ?? 'site') . '_' . $key . '.' . $file->getClientOriginalExtension();
                    Storage::disk('public')->putFileAs('uploads/image', $file, $filename);
                    $settingItem['value'] = $filename;
                } elseif ($settingItem['type'] === 'text' && isset($settingItem['depend_on']) && isset($settingItem['meta_value'])) {
                    $vtrv = $settingItem['depend_on'];
                    $depend = $currentSettings[$request->type][$vtrv]['value'] ?? null;

                    if ($depend) {
                        $ftrs = DB::table('taxonomies')->where(['title' => $depend, 'type' => $vtrv])->first();
                        $strv = $ftrs
                            ? DB::table('taxonomy_meta')->where([
                                'taxonomy_id' => $ftrs->id,
                                'key' => $settingItem['meta_value'],
                            ])->first()
                            : null;

                        if ($strv) {
                            $settingItem['value'] = $strv->value;
                        }
                    }
                } else {
                    $settingItem['value'] = $value;
                }
                $currentSettings[$request->type][$key] = $settingItem;
            }
        }
        File::put($this->file, json_encode($currentSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if ($request->type === 'site') {
            $this->data = $currentSettings;

            try {
                // States are small enough to sync during save; cities.json is ~50MB and must not block saves.
                $this->processStates();
            } catch (\Throwable $exception) {
                Log::error('Failed to sync states while saving site settings.', [
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return redirect()->back()->with('success', $request->type . ' settings updated successfully.');
    }

    public function importCities()
    {
        $this->data = json_decode(File::get($this->file), true) ?: [];

        try {
            $imported = $this->processCities();

            return redirect()->back()->with(
                'success',
                $imported
                    ? 'Cities imported successfully.'
                    : 'Cities are already imported for the selected country.'
            );
        } catch (\Throwable $exception) {
            Log::error('City import failed.', [
                'message' => $exception->getMessage(),
            ]);

            return redirect()->back()->with(
                'error',
                'City import failed. Check logs or increase PHP memory/time limits.'
            );
        }
    }

    public function updateActiveColors(Request $request)
    {
        $type = $request->type;
        if (! in_array($type, ['color', 'backend-color'], true)) {
            abort(404);
        }

        $typePermissionMap = [
            'color' => 'setting-write',
            'backend-color' => 'setting-write',
        ];

        $requiredPermission = $typePermissionMap[$type];
        if (! in_array($requiredPermission, $request->user()->user_permissions ?? [])) {
            abort(403, 'Unauthorized action.');
        }

        $currentSettings = File::exists($this->file) ? json_decode(File::get($this->file), true) : [];
        if (! isset($currentSettings[$type])) {
            abort(404);
        }

        $this->ensureColorTypes($type);

        if ($request->filled('color_type')) {
            $previousColorType = $currentSettings[$type]['color_type']['value'] ?? null;

            if ($request->color_type !== $previousColorType) {
                $colorTypes = $currentSettings[$type]['color_types']['value'] ?? [];
                $palette = ColorThemeHelper::findPalette($colorTypes, $request->color_type);

                if ($palette) {
                    foreach ($palette as $colorKey => $colorValue) {
                        if (in_array($colorKey, ['label', 'swatch'], true)) {
                            continue;
                        }
                        if (isset($currentSettings[$type][$colorKey])) {
                            $currentSettings[$type][$colorKey]['value'] = $colorValue;
                            $request->merge([$colorKey => $colorValue]);
                        }
                    }
                }
            }

            if (isset($currentSettings[$type]['color_type'])) {
                $currentSettings[$type]['color_type']['value'] = $request->color_type;
            }
        }

        foreach ($currentSettings[$type] as $key => $settingItem) {
            if (! is_array($settingItem) || ($settingItem['type'] ?? '') !== 'color') {
                continue;
            }

            if ($request->has($key)) {
                $currentSettings[$type][$key]['value'] = $request->input($key);
            }
        }

        File::put($this->file, json_encode($currentSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->data = $currentSettings;

        return response()->json([
            'success' => true,
            'colors' => $this->extractActiveColorValues($type),
        ]);
    }

    protected function extractActiveColorValues(string $section): array
    {
        $settings = $this->data[$section] ?? [];
        $colors = [];

        foreach ($settings as $key => $setting) {
            if (! is_array($setting) || ($setting['type'] ?? '') !== 'color') {
                continue;
            }
            $colors[$key] = $setting['value'] ?? '';
        }

        if (isset($settings['color_type']['value'])) {
            $colors['color_type'] = $settings['color_type']['value'];
        }

        return $colors;
    }

    public function updateLocationData(bool $importCities = false): void
    {
        $this->processStates();

        if ($importCities) {
            $this->processCities();
        }
    }

    public function backendcolors(): Response
    {
        $css = $this->buildColorCss('backend-color');

        return response($css, 200)
            ->header('Content-Type', 'text/css')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    public function colors(): Response
    {
        $css = $this->buildColorCss('color');

        return response($css, 200)
            ->header('Content-Type', 'text/css')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    public function publicColorThemes(): Response
    {
        $path = $this->file;
        $settings = File::exists($path) ? json_decode(File::get($path), true) : [];
        $colorSection = $settings['color'] ?? [];

        return response()->json([
            'themes' => $colorSection['color_types']['value'] ?? [],
            'active' => $colorSection['color_type']['value'] ?? '',
        ]);
    }

    protected function buildColorCss(string $section): string
    {
        $path = $this->file;
        $settings = File::exists($path) ? json_decode(File::get($path), true) : [];
        $sectionSettings = $settings[$section] ?? [];

        $css = ":root {\n";
        foreach ($sectionSettings as $key => $setting) {
            if (! is_array($setting) || ($setting['type'] ?? '') !== 'color') {
                continue;
            }

            $value = $setting['value'] ?? '';
            if (! is_string($value) || $value === '') {
                continue;
            }

            $css .= "  --{$key}: {$value};\n";
        }
        $css .= "}\n";

        return $css;
    }

    public function searchPages(): Response
    {
        $file = $this->json_file_location . '/search_pages.json';
        $data = File::exists($file) ? File::get($file) : '[]';
        return response($data, 200)->header('Content-Type', 'application/json');
    }

    protected function processStates()
    {
        $countryName = $this->data['site']['country']['value'] ?? null;
        if (!$countryName) return;

        $country = DB::table('taxonomies')->where(['type' => 'country', 'title' => $countryName])->first();
        if (!$country) return;
        // dd($countryName);

        $countryMeta = DB::table('taxonomy_meta')->where([
            'taxonomy_id' => $country->id,
            'key' => 'id',
        ])->first();

        $country_id = $countryMeta->value ?? null;
        if (! $country_id) {
            return;
        }

        $stateFile = $this->json_file_location . '/states.json';
        if (!File::exists($stateFile)) return;


        $exists = DB::table('taxonomies')->where(['type' => 'state', 'parent_id' => $country->id])->exists();
        if (!$exists) {

            $stateData = json_decode(File::get($stateFile));
            $states = array_filter($stateData, fn($item) => $item->country_id == $country_id);
            foreach ($states as $value) {
                $stateId = DB::table('taxonomies')->insertGetId([
                    'title' => $value->name,
                    'slug' => Str::slug($value->name),
                    'type' => 'state',
                    'parent_id' => $country->id,
                    'status' => 'publish'
                ]);
                foreach ($value as $key => $val) {
                    if ($key === 'name') continue;
                    DB::table('taxonomy_meta')->insert([
                        'taxonomy_id' => $stateId,
                        'key' => $key,
                        'value' => is_array($val) ? json_encode($val) : $val
                    ]);
                }
            }
        }
    }

    protected function processCities(): bool
    {
        $countryName = $this->data['site']['country']['value'] ?? null;
        if (! $countryName) {
            return false;
        }

        $country = DB::table('taxonomies')->where(['type' => 'country', 'title' => $countryName])->first();
        if (! $country) {
            return false;
        }

        if ($this->countryHasCities($country->id)) {
            return false;
        }

        $countryMeta = DB::table('taxonomy_meta')->where([
            'taxonomy_id' => $country->id,
            'key' => 'id',
        ])->first();

        $country_id = $countryMeta->value ?? null;
        if (! $country_id) {
            return false;
        }

        $cityPath = $this->json_file_location . '/cities.json';
        if (! File::exists($cityPath)) {
            return false;
        }

        $cityData = json_decode(File::get($cityPath));
        if (! is_array($cityData)) {
            return false;
        }

        $states = DB::table('taxonomies')->where(['type' => 'state', 'parent_id' => $country->id])->get();
        if ($states->isEmpty()) {
            return false;
        }

        $stateMap = [];
        foreach ($states as $state) {
            $stateMeta = DB::table('taxonomy_meta')->where([
                'taxonomy_id' => $state->id,
                'key' => 'id',
            ])->first();

            if ($stateMeta) {
                $stateMap[(string) $stateMeta->value] = $state->id;
            }
        }

        $imported = false;

        foreach ($cityData as $city) {
            if ((string) ($city->country_id ?? '') !== (string) $country_id) {
                continue;
            }

            $stateTaxonomyId = $stateMap[(string) ($city->state_id ?? '')] ?? null;
            if (! $stateTaxonomyId) {
                continue;
            }

            $cityId = DB::table('taxonomies')->insertGetId([
                'parent_id' => $stateTaxonomyId,
                'title' => $city->name,
                'slug' => Str::slug($city->name),
                'type' => 'city',
                'status' => 'publish',
            ]);

            foreach ((array) $city as $key => $value) {
                if ($key === 'name') {
                    continue;
                }

                DB::table('taxonomy_meta')->insert([
                    'key' => $key,
                    'value' => is_array($value) ? json_encode($value) : $value,
                    'taxonomy_id' => $cityId,
                ]);
            }

            $imported = true;
        }

        return $imported;
    }

    protected function countryHasCities(int $countryId): bool
    {
        return DB::table('taxonomies as city')
            ->join('taxonomies as state', 'city.parent_id', '=', 'state.id')
            ->where('city.type', 'city')
            ->where('state.type', 'state')
            ->where('state.parent_id', $countryId)
            ->exists();
    }

    protected function ensureColorTypes(string $section): void
    {
        if (! in_array($section, ['color', 'backend-color'], true)) {
            return;
        }

        $settings = File::exists($this->file) ? json_decode(File::get($this->file), true) : [];
        if (! isset($settings[$section])) {
            return;
        }

        $changed = false;

        if (! isset($settings[$section]['color_types'])) {
            $settings[$section]['color_types'] = [
                'label' => 'Color Themes',
                'type' => 'repeater',
                'value' => ColorThemeHelper::defaultsAsRepeaterItems($section),
                'fields' => ColorThemeHelper::repeaterFields($section),
            ];
            $changed = true;
        } else {
            if (empty($settings[$section]['color_types']['value'])) {
                $settings[$section]['color_types']['value'] = ColorThemeHelper::defaultsAsRepeaterItems($section);
                $changed = true;
            }
            if (empty($settings[$section]['color_types']['fields'])) {
                $settings[$section]['color_types']['fields'] = ColorThemeHelper::repeaterFields($section);
                $changed = true;
            }
        }

        if ($changed) {
            File::put($this->file, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            $this->data = $settings;
        }
    }
}
