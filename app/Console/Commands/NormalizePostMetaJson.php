<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class NormalizePostMetaJson extends Command
{
    protected $signature   = 'post-meta:normalize-json {--dry-run : Preview changes without writing}';
    protected $description = 'Normalize post_meta values for array-type keys (category, brand, tags, etc.) to consistently use JSON-encoded string arrays like ["28"].';

    /**
     * Meta keys whose values should always be a JSON-encoded array of string IDs.
     */
    protected array $arrayKeys = ['category', 'brand', 'tags', 'blog_category', 'category_id'];

    public function handle(): int
    {
        $dryRun  = $this->option('dry-run');
        $fixed   = 0;
        $skipped = 0;

        $rows = DB::table('post_meta')
            ->whereIn('key', $this->arrayKeys)
            ->get(['id', 'key', 'value']);

        foreach ($rows as $row) {
            $normalized = $this->normalizeValue($row->value);

            if ($normalized === $row->value) {
                $skipped++;
                continue;
            }

            $this->line(sprintf(
                '  [post_meta id=%d key=%s]  %s  →  %s',
                $row->id,
                $row->key,
                json_encode($row->value),
                $normalized
            ));

            if (! $dryRun) {
                DB::table('post_meta')->where('id', $row->id)->update(['value' => $normalized]);
            }

            $fixed++;
        }

        $mode = $dryRun ? ' (DRY RUN)' : '';
        $this->info("Done{$mode}: {$fixed} rows fixed, {$skipped} rows already correct.");

        return self::SUCCESS;
    }

    /**
     * Convert any stored format to a canonical JSON string array.
     *
     * Handled inputs:
     *   30            → ["30"]
     *   [30]          → ["30"]
     *   [30,31]       → ["30","31"]
     *   ["30"]        → ["30"]   (already good, kept as-is but trimmed)
     *   ["29\n"]      → ["29"]   (strip whitespace inside values)
     */
    protected function normalizeValue(string $value): string
    {
        $value = trim($value);

        // Try JSON decode first
        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            // Already JSON — normalise to array of trimmed strings
            $arr = is_array($decoded) ? $decoded : [$decoded];
        } else {
            // Plain value like "30" or "30,31"
            $arr = array_map('trim', explode(',', $value));
        }

        // Cast each element to a clean string ID (trim whitespace / newlines)
        $arr = array_values(array_filter(
            array_map(fn($v) => trim((string) $v), $arr),
            fn($v) => $v !== ''
        ));

        return json_encode($arr, JSON_UNESCAPED_UNICODE);
    }
}
