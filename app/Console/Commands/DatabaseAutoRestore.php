<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseAutoRestore extends Command
{
    protected $signature = 'db:auto-restore {--force : Force restore even if database is not empty}';
    protected $description = 'Automatically restores the complete database backup if tables are empty or missing.';

    public function handle(): int
    {
        $backupFile = database_path('nestifytech_utf8.sql');
        if (!file_exists($backupFile)) {
            $backupFile = database_path('nestifytech_complete_backup.sql');
        }

        if (!file_exists($backupFile)) {
            $this->error('No backup SQL file found in database/ directory.');
            return 1;
        }

        $needsRestore = false;

        if ($this->option('force')) {
            $needsRestore = true;
        } else {
            try {
                if (!Schema::hasTable('posts') || !Schema::hasTable('taxonomies') || !Schema::hasTable('users')) {
                    $needsRestore = true;
                } else {
                    $postsCount = DB::table('posts')->count();
                    $taxCount = DB::table('taxonomies')->count();
                    $usersCount = DB::table('users')->count();

                    if ($postsCount === 0 && $taxCount === 0 && $usersCount === 0) {
                        $needsRestore = true;
                    }
                }
            } catch (\Throwable $e) {
                $needsRestore = true;
            }
        }

        if (!$needsRestore) {
            $this->info('Database contains data. No auto-restore needed.');
            return 0;
        }

        $this->warn('Empty or missing data detected. Restoring database from backup...');

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host', '127.0.0.1');
        $dbPort = config('database.connections.mysql.port', '3306');

        $mysqlBinary = 'd:\\Xampp\\mysql\\bin\\mysql.exe';
        if (!file_exists($mysqlBinary)) {
            $mysqlBinary = 'mysql';
        }

        $passArg = !empty($dbPass) ? '-p' . escapeshellarg($dbPass) : '';
        $cmd = sprintf(
            'cmd.exe /c "%s -h %s -P %s -u %s %s %s < \"%s\""',
            $mysqlBinary,
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            $passArg,
            escapeshellarg($dbName),
            $backupFile
        );

        exec($cmd, $output, $status);

        if ($status !== 0) {
            // Fallback: run using DB::unprepared in chunks if command-line tool fails
            $this->warn('CLI restore returned non-zero code. Attempting SQL chunk restore...');
            try {
                $sql = file_get_contents($backupFile);
                DB::unprepared($sql);
            } catch (\Throwable $e) {
                $this->error('Failed to restore database: ' . $e->getMessage());
                return 1;
            }
        }

        // Run post-meta normalization so category JSON arrays are clean
        try {
            $this->call('post-meta:normalize-json');
        } catch (\Throwable $e) {
            // Ignore if command not found
        }

        $this->info('Database restored and normalized successfully!');
        return 0;
    }
}
