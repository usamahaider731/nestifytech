<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class MediaController extends Controller
{
    public function thumbimageUrl(Request $request, $filename, $height, $width, $extension)
    {
        // dd($filename, $height, $width, $extension);
        $thumbFile = "{$filename}_{$height}_{$width}.{$extension}";
        $thumbPath = public_path("storage/uploads/image/thumb/{$thumbFile}");
        $originalPath = public_path("storage/uploads/image/{$filename}.{$extension}");
        if (file_exists($thumbPath)) {
            return response()->file($thumbPath);
        }
        if (!file_exists($originalPath)) {
            abort(404, 'Original image not found');
        }
        // ✅ Resize and save the thumbnail
        $manager = new ImageManager(new Driver());

        $image = $manager->read($originalPath);

        $image->resize($width, $height, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize(); // prevents upsizing
        });

        // Make sure thumb folder exists
        if (!file_exists(dirname($thumbPath))) {
            mkdir(dirname($thumbPath), 0755, true);
        }

        $image->save($thumbPath);

        return response()->file($thumbPath);
    }
}
