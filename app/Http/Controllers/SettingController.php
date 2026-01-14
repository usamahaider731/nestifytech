<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Taxonomy;
use App\Models\TaxonomyMeta;
use GuzzleHttp\Promise\Create;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

use function PHPUnit\Framework\isEmpty;

class SettingController extends Controller
{
    protected $data;
    protected $file;
    public function __construct()
    {

        $this->file = public_path('data/setting.json');
        $path = File::exists($this->file) ? File::get($this->file) : '{}';
        $this->data = json_decode($path, true);
        $this->delete_null_tax();
        // $this->updateLocationData();
    }
    public function setting(Request $request)
    {
        $type = $this->data[$request->type];
        return Inertia::render('Admin/Setting/Setting', [
            'type' => $type,
            'name' => $request->type
        ]);
    }
    public function delete_null_tax()
    {
        $free_tax =   Taxonomy::where(['type' => null])->get();
        if (count($free_tax) == 0) {
            foreach ($free_tax as $key => $value) {
                TaxonomyMeta::where(['taxonomy_id' => $value->id])->delete();
                $value->delete();
            }
        }
    }
    public function updateCountry()
    {
        $file = public_path('data/countries.json');
        $countriesData = File::exists($file) ? File::get($file) : [];
        $countriesData = json_decode($countriesData, true);
        $countries = Taxonomy::where('type', 'country')->get();
        if (count($countries) == 0) {
            if (count($countries) !== count($countriesData)) {


                foreach ($countriesData as $value) {
                    $country = Taxonomy::updateOrCreate([
                        'title' => $value['name'],

                        'type' => 'country'
                    ], [
                        'parent_id' => 0,
                        'status' => 'publish',
                        'slug' => Str::slug($value['name'])
                    ]);
                    foreach ($value as $key => $val) {
                        if ($key == 'name' || $key === 'subregion' || $key == 'subregion_id' || $key == 'translations' || $key == 'region_id' || $key == 'region' || $key == 'iso2' || $key == 'iso3') {
                            continue;
                        }
                        $countryMeta = TaxonomyMeta::updateOrCreate(
                            [
                                'taxonomy_id' => $country->id,
                                'key' => $key
                            ],
                            [
                                'value' => is_array($val) ? json_encode($val) : $val
                            ]
                        );
                    }
                }
            }
        }
    }
    public function translations(Request $request)
    {
        $locale = $request->get('locale', 'en'); // or whatever language admin selects
        $path = resource_path("lang/{$locale}/{$locale}.json");
        if (!file_exists($path)) {
            file_put_contents($path, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        $translations = json_decode(file_get_contents($path), true);
        return inertia::render('Admin/Setting/Translations', compact('translations'));
    }
    public function updateData()
    {
        $this->updateLocationData();
    }
    public function updateTranslation(Request $request)
    {
        $translations = $request->all();
        $filePath = resource_path('lang/en/en.json');
        file_put_contents($filePath, json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    public function settingUpdate(Request $request)
    {
        $currentSettings = File::exists($this->file)
            ? json_decode(File::get($this->file), true)
            : [];
        if (!isset($currentSettings[$request->type])) {
            $currentSettings[$request->type] = [];
        }
        if ($request->type === 'site') {
            $this->updateCountry();
        }
        foreach ($request->all() as $key => $value) {
            if (in_array($key, ['_token', '_method', 'type'])) {
                continue;
            }
            if (isset($currentSettings[$request->type][$key])) {
                $settingItem = $currentSettings[$request->type][$key];

                if ($settingItem['type'] === 'image') {
                    if ($request->hasFile($key)) {

                        // Delete old file if exists
                        if (!empty($settingItem['value']) && file_exists(public_path('storage/uploads/image/' . $settingItem['value']))) {
                            unlink(public_path('storage/uploads/image/' . $settingItem['value']));
                        }

                        // Store file in public/storage/uploads/image
                        $file = $request->file($key);
                        $filename = time() . '_' . preg_replace(
                            '/[^a-zA-Z0-9-_]/',
                            '',
                            md5($currentSettings['site']['name']['value'] ?? 'site')
                        ) . '_' . $key . '.' . $file->getClientOriginalExtension();

                        $file->move(public_path('storage/uploads/image'), $filename);

                        // Save filename only
                        $settingItem['value'] = $filename;
                    }
                } elseif ($settingItem['type'] === 'text' && isset($settingItem['depend_on']) && isset($settingItem['meta_value'])) {
                    $vtrv = $settingItem['depend_on'];
                    $depend = $this->data[$request->type][$vtrv]['value'];
                    $ftrs = Taxonomy::where(['title' => $depend, 'type' => $vtrv])->first();
                    $strv =  TaxonomyMeta::where(['taxonomy_id' => $ftrs->id, 'key' => $settingItem['meta_value']])->first();
                    $settingItem['value'] = $strv['value'];
                } else {
                    // Update non-image values
                    $settingItem['value'] = $value;
                }

                // Save updated item back
                $currentSettings[$request->type][$key] = $settingItem;
            }
        }



        File::put($this->file, json_encode($currentSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // If the update is for site settings, update states and cities
        if ($request->type === 'site') {
            $this->updateLocationData();
        }

        return redirect()->back()->with('success', $request->type . ' settings updated successfully.');
    }


    public function updateLocationData()
    {
       
        $this->processStates();
        $this->processCities();
    }
    public function  backendcolors(): Response
    {
        $settings = $this->data['backend-color'];

        $css = ":root {\n";

        foreach ($settings as $key => $value) {

            $css .= "  --{$key}: {$value['value']};\n";
        }

        $css .= "}\n";

        return response($css, 200)->header('Content-Type', 'text/css');
    }
    public function  colors(): Response
    {
        $settings = $this->data['color'];

        $css = ":root {\n";

        foreach ($settings as $key => $value) {

            $css .= "  --{$key}: {$value['value']};\n";
        }

        $css .= "}\n";

        return response($css, 200)->header('Content-Type', 'text/css');
    }
    protected function processStates()
    {

        $countryName = $this->data['site']['country']['value'];
        if (!$countryName) {
            return;
        }
        $country = Taxonomy::where(['type' => 'country', 'title' => $countryName])->with('meta')->first();
        $country_id = array_filter($country->meta->toArray(), function ($item) {
            return $item['key'] === 'id';
        });
        $country_id = $country_id[0]['value'];
        $state = public_path('data/states.json');
        File::exists($state) && $dataState = File::get($state);
        $stateData = json_decode($dataState);
        $states = array_filter($stateData, function ($item) use ($country_id) {

            return $item->country_id == $country_id;
        });
        $rst = Taxonomy::where('type', 'state')->get();
        if (count($rst) > 0) {
            foreach ($rst as $key) {
                if ($key->parent_id != $country->id) {
                    $key->delete();
                }
            }
        } else {

            foreach ($states as $value) {
                $state = Taxonomy::create([
                    'title' => $value->name,
                    'slug' => Str::slug($value->name),
                    'description' => Null,
                    'type' => 'state',
                    'parent_id' => $country->id,
                    'status' => 'publish'
                ]);
                foreach ($value as $key => $val) {
                    if ($key == 'name') {
                        continue;
                    }
                    TaxonomyMeta::create([
                        'taxonomy_id' => $state->id,
                        'key' =>  $key,
                        'value' => is_array($val) ?  json_encode($val) : $val
                    ]);
                }
            }
        }
    }
    protected function processCities()
    {
        $countryName = $this->data['site']['country']['value'];
        if (!$countryName) {
            return;
        }
        // dd('zzz');
        $country = Taxonomy::where(['type' => 'country', 'title' => $countryName])->first();
        if (!$country) return;

        $cityPath = public_path('data/cities.json');
        if (!File::exists($cityPath)) return;
        $dataCity = File::get($cityPath);

        $cityData = json_decode($dataCity, true); // Flat array of cities
        $cities = Taxonomy::where(['type' => 'city'])->with('meta')->get();
        if (count($cities) > 0) {
            foreach ($cities as $key => $city) {
                $country_name = get_meta($city->meta, 'country_name');

                if ($country_name == $countryName) {
                    return;
                } else {
                    $city->delete();
                }
            }
            $cities_s = Taxonomy::where(['type' => 'city'])->with('meta')->get();
            if (count($cities_s) == 0) {
                $states = Taxonomy::where('type', 'state')->with('meta')->get();
                foreach ($states as $k => $state) {
                    $state_id = get_meta($state->meta, 'id');
                    $citie = array_filter($cityData, function ($item) use ($state_id) {
                        return $item->state_id == $state_id;
                    });
                    dd($citie);
                }
            }
        } else {
            $states = Taxonomy::where('type', 'state')->with('meta')->get();
            foreach ($states as $k => $state) {
                $state_id = get_meta($state->meta, 'id');

                $citie = array_filter($cityData, function ($item) use ($state_id) {
                    return $item['state_id'] == $state_id;
                });
                foreach ($citie as $key_ => $c) {
                    $cit = Taxonomy::create([
                        'parent_id' => $state->id,
                        'title' => $c['name'],
                        'slug' => Str::slug($c['name']),
                        'type' => 'city',
                        'status' => 'publish'
                    ]);
                    foreach ($c as $_key => $v) {
                        if ($_key == 'name') continue;
                        TaxonomyMeta::create([
                            'key' => $_key,
                            'value' => $v,
                            'taxonomy_id' => $cit->id
                        ]);
                    }
                }
            }
        }
        // $rst = Taxonomy::where(['type' => 'state', 'parent_id' => $country->id])->get();
        // $prevCities = Taxonomy::where(['type' => 'city'])->get();
        // foreach ($rst as $key) {
        //     if (count($prevCities) > 0) {

        //         foreach ($prevCities as $value) {

        //             if ($value->parent_id != $key->id) {
        //                 $value->delete();
        //             }
        //         }
        //     } else {
        //         foreach ($cityData as $value) {
        //             if ($value['country_name'] === $countryName && $value['state_name'] === $key->title) {
        //                 Taxonomy::create([
        //                     'title' => $value['name'],
        //                     'parent_id' => $key->id,
        //                     'type' => 'city',
        //                     'status' => 'publish',
        //                     'slug' => Str::slug($value['name']),
        //                     'description' => null
        //                 ]);
        //             }
        //         }
        //     }
        // }
        // foreach ($cityData as $city) {
        //     // Match city to state using state name
        //     if (!isset($states[$city['state_name']])) {
        //         continue;
        //     }
        //     $state = $states[$city['state_name']];

        //     $existing = Taxonomy::where([
        //         'type' => 'city',
        //         'title' => $city['name'],
        //         'parent_id' => $state->id
        //     ])->first();
        //     if (!$existing) {
        //         Taxonomy::create([
        //             'title' => $city['name'],
        //             'slug' => Str::slug($city['name']),
        //             'description' => null,
        //             'type' => 'city',
        //             'status' => 'publish',
        //             'parent_id' => $state->id
        //         ]);
        //     }
        // }

    }
}
