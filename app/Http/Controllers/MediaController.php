<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class MediaController extends Controller
{
    public function thumbimageUrl($filename, $height, $width, $extension)
    {
        if ($filename) {
            $filename = pathinfo($filename, PATHINFO_FILENAME);
        }
        $thumbFile = "{$filename}_{$height}_{$width}.{$extension}";
        $thumbPath = public_path("storage/uploads/image/thumb/{$thumbFile}");
        $originalPath = public_path("storage/uploads/image/{$filename}.{$extension}");

        if (file_exists($thumbPath)) {
            return response()->file($thumbPath);
        }

        if (!file_exists($originalPath)) {
            abort(404, 'Original image not found');
        }

        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($originalPath);
            $image->scaleDown(width: $width, height: $height);

            if (!file_exists(dirname($thumbPath))) {
                mkdir(dirname($thumbPath), 0755, true);
            }

            $image->save($thumbPath);
            return response()->file($thumbPath);
        } catch (\Throwable $e) {
            report($e);
            abort(500, 'Unable to generate image thumbnail.');
        }
    }

    /**
     * Receive a single image file from an async upload (e.g. VariationsSelector),
     * persist it to storage/app/public/uploads/image, and return the filename.
     */
    public function uploadTemp(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:20480'], // 20 MB max
        ]);

        $file     = $request->file('image');
        $filename = time() . '_' . $file->getClientOriginalName();

        Storage::disk('public')->putFileAs('uploads/image', $file, $filename);

        return response()->json(['filename' => $filename]);
    }
}

