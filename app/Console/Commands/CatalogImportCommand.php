<?php

namespace App\Console\Commands;

use App\Services\CatalogJsonImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CatalogImportCommand extends Command
{
    protected $signature = 'catalog:import
        {--init-files : Write default JSON files (categories, brands, tags, 50+ products) to storage/app/import}
        {--path= : Custom import directory (default: storage/app/import)}
        {--user=1 : user_id for new products}
        {--force : Re-import products even if SKU exists (deletes existing row first)}';

    protected $description = 'Import categories, brands, tags, and products from JSON (storage/app/import)';

    public function handle(CatalogJsonImporter $importer): int
    {
        $dir = $this->option('path')
            ? base_path(trim($this->option('path'), '/\\'))
            : storage_path('app/import');

        if ($this->option('init-files')) {
            $this->writeDefaultJsonFiles($dir);
            $this->info('Wrote JSON templates to: ' . $dir);
            return self::SUCCESS;
        }

        if (!File::isDirectory($dir)) {
            $this->error('Import directory missing: ' . $dir);
            $this->line('Run: php artisan catalog:import --init-files');
            return self::FAILURE;
        }

        $userId = (int) $this->option('user');
        $importer->setBasePath($dir);

        $this->info('Importing from: ' . $dir);
        $stats = $importer->importAll($userId, skipExistingProducts: !$this->option('force'));

        $this->table(
            ['Metric', 'Count'],
            [
                ['Taxonomy rows processed (insert/resolve)', $stats['taxonomies']],
                ['Products imported', $stats['products']],
                ['Products skipped (existing SKU)', $stats['skipped_products']],
            ]
        );

        if (!empty($stats['errors'])) {
            foreach ($stats['errors'] as $err) {
                $this->error($err);
            }
            return self::FAILURE;
        }

        $this->info('Done.');
        return self::SUCCESS;
    }

    protected function writeDefaultJsonFiles(string $dir): void
    {
        File::ensureDirectoryExists($dir);

        $manifest = [
            'categories' => 'categories.json',
            'brands' => 'brands.json',
            'tags' => 'tags.json',
            'products' => 'products.json',
        ];
        File::put($dir . '/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");

        $categories = [
            ['title' => 'Electronics', 'slug' => 'electronics', 'description' => 'Devices and gadgets', 'image' => 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80'],
            ['title' => 'Phones', 'slug' => 'phones', 'parent_slug' => 'electronics', 'image' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
            ['title' => 'Laptops', 'slug' => 'laptops', 'parent_slug' => 'electronics', 'image' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
            ['title' => 'Audio', 'slug' => 'audio', 'parent_slug' => 'electronics', 'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
            ['title' => 'Wearables', 'slug' => 'wearables', 'parent_slug' => 'electronics', 'image' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
            ['title' => 'Accessories', 'slug' => 'accessories', 'parent_slug' => 'electronics', 'image' => 'https://images.unsplash.com/photo-1526733158173-e4073a726fa3?w=800&q=80'],
            ['title' => 'Home & Living', 'slug' => 'home-living', 'image' => 'https://images.unsplash.com/photo-1558882224-cca16273e1c1?w=800&q=80'],
            ['title' => 'Kitchen', 'slug' => 'kitchen', 'parent_slug' => 'home-living', 'image' => 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80'],
            ['title' => 'Furniture', 'slug' => 'furniture', 'parent_slug' => 'home-living', 'image' => 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80'],
        ];
        File::put($dir . '/categories.json', json_encode($categories, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");

        $brands = [
            ['title' => 'Nexus Labs', 'slug' => 'nexus-labs', 'image' => 'https://logo.clearbit.com/google.com'],
            ['title' => 'VoltGear', 'slug' => 'voltgear', 'image' => 'https://logo.clearbit.com/tesla.com'],
            ['title' => 'Pulse Audio', 'slug' => 'pulse-audio', 'image' => 'https://logo.clearbit.com/spotify.com'],
            ['title' => 'Orbit Mobile', 'slug' => 'orbit-mobile', 'image' => 'https://logo.clearbit.com/apple.com'],
            ['title' => 'Zenith Home', 'slug' => 'zenith-home', 'image' => 'https://logo.clearbit.com/ikea.com'],
            ['title' => 'Apex Tools', 'slug' => 'apex-tools', 'image' => 'https://logo.clearbit.com/dewalt.com'],
            ['title' => 'ClearView', 'slug' => 'clearview', 'image' => 'https://logo.clearbit.com/sony.com'],
            ['title' => 'SteelForm', 'slug' => 'steelform', 'image' => 'https://logo.clearbit.com/hermanmiller.com'],
        ];
        File::put($dir . '/brands.json', json_encode($brands, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");

        $tags = [
            ['title' => 'New', 'slug' => 'new'],
            ['title' => 'Sale', 'slug' => 'sale'],
            ['title' => 'Bestseller', 'slug' => 'bestseller'],
            ['title' => 'Limited', 'slug' => 'limited'],
            ['title' => 'Free shipping', 'slug' => 'free-shipping'],
            ['title' => 'Eco', 'slug' => 'eco'],
            ['title' => 'Gift idea', 'slug' => 'gift-idea'],
            ['title' => 'Pro', 'slug' => 'pro'],
        ];
        File::put($dir . '/tags.json', json_encode($tags, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");

        $products = $this->buildDemoProducts();
        File::put($dir . '/products.json', json_encode(['products' => $products], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function buildDemoProducts(): array
    {
        $cats = ['phones', 'laptops', 'audio', 'wearables', 'accessories', 'kitchen', 'furniture'];
        $brands = ['nexus-labs', 'voltgear', 'pulse-audio', 'orbit-mobile', 'zenith-home', 'apex-tools', 'clearview', 'steelform'];
        $tagSets = [
            ['new', 'sale'],
            ['bestseller'],
            ['new', 'free-shipping'],
            ['sale', 'gift-idea'],
            ['pro', 'limited'],
            ['eco'],
        ];

        $names = [
            'Smartphone X', 'Ultrabook Air', 'Noise-Cancel Headphones', 'Fitness Band', 'USB-C Hub',
            'Wireless Mouse', 'Mechanical Keyboard', 'Portable Speaker', 'Tablet Pro', 'Smart Watch',
            'LED Desk Lamp', 'Coffee Maker', 'Blender Set', 'Office Chair', 'Bookshelf Unit',
            'Monitor Stand', 'Webcam HD', 'Mic Studio', 'Power Bank', 'Car Charger',
            'Screen Protector', 'Phone Case', 'Laptop Sleeve', 'HDMI Cable', 'SSD Enclosure',
            'Router WiFi', 'Smart Plug', 'Air Purifier', 'Vacuum Mini', 'Electric Kettle',
            'Toaster Oven', 'Standing Desk', 'Gaming Mousepad', 'RGB Strip', 'Docking Station',
            'Earbuds Sport', 'Over-Ear Studio', 'Soundbar Mini', 'Projector Pico', 'NAS Home',
            'Security Cam', 'Doorbell Smart', 'Thermostat', 'Humidifier', 'Fan Tower',
            'Heater Ceramic', 'Iron Steam', 'Grill Electric', 'Mixer Hand', 'Food Processor',
        ];

        $imagePool = [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            'https://images.unsplash.com/photo-1526170315870-efffd0ad46b4?w=800&q=80',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
            'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
            'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        ];

        $out = [];
        for ($i = 1; $i <= 55; $i++) {
            $sku = sprintf('DEMO-%03d', $i);
            $title = $names[($i - 1) % count($names)] . ' #' . $i;
            $cat = $cats[($i - 1) % count($cats)];
            $brand = $brands[($i - 1) % count($brands)];
            $tags = $tagSets[($i - 1) % count($tagSets)];

            $base = 29 + ($i * 7 % 200);
            $sale = max(1, $base - (5 + ($i % 15)));

            $item = [
                'sku' => $sku,
                'title' => $title,
                'description' => '<p>Demo product for import. SKU <strong>' . $sku . '</strong>. Category <em>' . $cat . '</em>.</p>',
                'status' => 'publish',
                'image' => $imagePool[($i - 1) % count($imagePool)],
                'gallery' => [
                    $imagePool[($i) % count($imagePool)],
                    $imagePool[($i + 1) % count($imagePool)],
                ],
                'categories' => [$cat],
                'brand' => $brand,
                'tags' => $tags,
                'meta' => [
                    'first_price' => (string) $base,
                    'second_price' => (string) $sale,
                    'stock' => (string) (10 + ($i % 90)),
                    'seo_title' => $title . ' | Demo Store',
                    'seo_description' => 'Buy ' . $title . ' — demo catalog import.',
                ],
                'attributes' => [
                    [
                        'group' => 'General',
                        'attributes' => [
                            ['key' => 'Warranty', 'value' => ($i % 3 === 0 ? '24 months' : '12 months')],
                            ['key' => 'Country', 'value' => 'Importland'],
                        ],
                    ],
                    [
                        'group' => 'Specs',
                        'attributes' => [
                            ['key' => 'Weight', 'value' => sprintf('%.2f kg', 0.2 + ($i % 50) / 10)],
                            ['key' => 'Model Year', 'value' => (string) (2023 + ($i % 3))],
                        ],
                    ],
                ],
            ];

            if ($i % 3 === 0) {
                $item['variations'] = [
                    [
                        'price' => $sale,
                        'stock' => 5 + ($i % 20),
                        'image' => $imagePool[($i + 2) % count($imagePool)],
                        'options' => [
                            ['key' => 'Color', 'value' => $i % 2 === 0 ? 'Black' : 'White'],
                            ['key' => 'Size', 'value' => $i % 2 === 0 ? 'M' : 'L'],
                        ],
                    ],
                    [
                        'price' => $sale + 10,
                        'stock' => 3 + ($i % 10),
                        'image' => $imagePool[($i + 3) % count($imagePool)],
                        'options' => [
                            ['key' => 'Color', 'value' => 'Blue'],
                            ['key' => 'Size', 'value' => 'XL'],
                        ],
                    ],
                ];
            }

            $out[] = $item;
        }

        return $out;
    }
}
