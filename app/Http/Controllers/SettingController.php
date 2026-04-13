<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
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
            'site' => 'site-read',
            'font' => 'font-read',
            'color' => 'color-read',
            'backend-color' => 'color-read',
            'ai' => 'ai-write',
        ];
        
        $permissionKey = strtolower($request->type);
        if (isset($typePermissionMap[$permissionKey])) {
            $requiredPermission = $typePermissionMap[$permissionKey];
            if (!in_array($requiredPermission, $request->user()->user_permissions ?? [])) {
                abort(403, 'Unauthorized action.');
            }
        }

        $type = $this->data[$request->type];
        return Inertia::render('Admin/Setting/Setting', [
            'type' => $type,
            'name' => $request->type
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
            'site' => 'site-write',
            'font' => 'font-write',
            'color' => 'color-write',
            'backend-color' => 'color-write',
            'ai' => 'site-write',
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
                    $depend = $this->data[$request->type][$vtrv]['value'];
                    $ftrs = DB::table('taxonomies')->where(['title' => $depend, 'type' => $vtrv])->first();
                    $strv = DB::table('taxonomy_meta')->where(['taxonomy_id' => $ftrs->id, 'key' => $settingItem['meta_value']])->first();
                    $settingItem['value'] = $strv->value;
                } else {
                    $settingItem['value'] = $value;
                }
                $currentSettings[$request->type][$key] = $settingItem;
            }
        }
        File::put($this->file, json_encode($currentSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        if ($request->type === 'site') $this->updateLocationData();

        return redirect()->back()->with('success', $request->type . ' settings updated successfully.');
    }

    public function updateLocationData()
    {
        $this->processStates();
        $this->processCities();
    }

    public function backendcolors(): Response
    {
        $settings = $this->data['backend-color'];
        $css = ":root {\n";
        foreach ($settings as $key => $value) {
            $css .= "  --{$key}: {$value['value']};\n";
        }
        $css .= "}\n";
        return response($css, 200)->header('Content-Type', 'text/css');
    }

    public function colors(): Response
    {
        $settings = $this->data['color'];
        $css = ":root {\n";
        foreach ($settings as $key => $value) {
            $css .= "  --{$key}: {$value['value']};\n";
        }
        $css .= "}\n";
        return response($css, 200)->header('Content-Type', 'text/css');
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

        $country_meta = DB::table('taxonomy_meta')->where('taxonomy_id', $country->id)->get();
        $country_id = null;
        foreach($country_meta as $m) if($m->key === 'id') $country_id = $m->value;
        if (!$country_id) return;

        $stateFile = $this->json_file_location . '/states.json';
        if (!File::exists($stateFile)) return;
        
        $stateData = json_decode(File::get($stateFile));
        $states = array_filter($stateData, fn($item) => $item->country_id == $country_id);
        
        $exists = DB::table('taxonomies')->where(['type' => 'state', 'parent_id' => $country->id])->exists();
        if (!$exists) {
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

    protected function processCities()
    {
        $countryName = $this->data['site']['country']['value'] ?? null;
        if (!$countryName) return;

        $country = DB::table('taxonomies')->where(['type' => 'country', 'title' => $countryName])->first();
        if (!$country) return;

        $cityPath = $this->json_file_location . '/cities.json';
        if (!File::exists($cityPath)) return;
        
        $cityData = json_decode(File::get($cityPath), true);
        $hasCities = DB::table('taxonomies')->where('type', 'city')->exists();
        
        if (!$hasCities) {
            $states = DB::table('taxonomies')->where(['type' => 'state', 'parent_id' => $country->id])->get();
            foreach ($states as $state) {
                $state_meta = DB::table('taxonomy_meta')->where('taxonomy_id', $state->id)->get();
                $state_id = null;
                foreach($state_meta as $m) if($m->key === 'id') $state_id = $m->value;

                $cities = array_filter($cityData, fn($item) => $item['state_id'] == $state_id);
                foreach ($cities as $c) {
                    $citId = DB::table('taxonomies')->insertGetId([
                        'parent_id' => $state->id,
                        'title' => $c['name'],
                        'slug' => Str::slug($c['name']),
                        'type' => 'city',
                        'status' => 'publish'
                    ]);
                    foreach ($c as $key => $v) {
                        if ($key === 'name') continue;
                        DB::table('taxonomy_meta')->insert([
                            'key' => $key,
                            'value' => $v,
                            'taxonomy_id' => $citId
                        ]);
                    }
                }
            }
        }
    }
}
