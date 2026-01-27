<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

use function PHPUnit\Framework\isString;

class Media extends Model
{
  //
  use HasFactory;
  public $table = 'media';
  public $fillable = [
    'id',
    'filename',
    'parent_id',
    'type',
    'name'
  ];

  public $timestamps = false;
  // public function ImageUploads($request, $key, $value)
  // {
  //     $file = $request->file($key);
  //     if (!empty($value) && Storage::disk('public')->exists('uploads/image/' . $value)) {
  //         Storage::disk('public')->delete('uploads/image/' . $value);
  //     }
  //     $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9-_]/', '', md5()) . $key . '.' . $file->getClientOriginalExtension();
  //     $file->storeAs('uploads/image', $filename, 'public');
  //     $value = $filename;
  // }
  // public function UploadImage($image, $type, $parent)
  // {
  //     if (!empty($image) && Storage::disk('public')->exists('uploads/image/' . $image)) {
  //         Storage::disk('public')->delete('uploads/image/' . $image);
  //     }
  //     $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9-_]/', '', md5()) . $key . '.' . $image->getClientOriginalExtension();
  //     $file->storeAs('uploads/image', $filename, 'public');
  //     $value = $filename;
  // }
  public static function handleImageUpload($images, $parent, $type)
  {

    // Check if image is provided
    if (!$images) {
      return false;
    }
    if (!is_array($images)) {
      $images = [$images];
    }
    else{
      // dd($images);
    }
    // Delete existing image if parent exists
    if ($parent->id) {
      foreach ($images as $key => $value) {
        if(isString($value)){
          unset($images[$key]);
        }
      }
      self::deleteExecutingImage($parent->id, $type);
    }
    $filenames = [];
    foreach ($images as $key => $value) {
      if(isString($value)){
        $filenames[] = $value;
        continue;
      }
      $extension = $value->getClientOriginalExtension();
      $name = time() . uniqid('nestifytech') . md5($value->getClientOriginalName()) . preg_replace('/[^a-zA-Z0-9-_]/', '', md5($value->getClientOriginalName()));
      if ($extension == 'svg') {
        $filename = $name . '.svg';
      } else if ($extension == 'jpg' || $extension == 'png' || $extension == 'jpeg' || $extension == 'webp') {
        $filename = $name . '.jpg';
      } else {
        $filename = $name . '.' . $extension;
      }
      // Create image files
      self::normalImageCreatation($value, $filename);

      // Create or update media record
      Media::create(
        ['parent_id' => $parent->id, 
        'type' => $type,
        
          'filename' => $filename,
          'name' => $name
        ]
      );
      $filenames[] = $filename;
    }


    return $filenames;
  }
  public static function normalImageCreatation($image, $filename)
  {
    $destination = public_path('storage/uploads/image');
    $thumbDestination = public_path('storage/uploads/image/thumb');


    if (!file_exists($destination)) {
      mkdir($destination, 0755, true);
    }
    if (!file_exists($thumbDestination)) {
      mkdir($thumbDestination, 0755, true);
    }

    // Move the uploaded file
    $image->move($destination, $filename);

    // Skip resizing for SVG files
    if ($image->getClientOriginalExtension() !== 'svg') {
      $manager = new ImageManager(new Driver());

      // Read from the new location
      $thumb = $manager->read($destination . '/' . $filename);

      $thumb->resize(450, 450, function ($constraint) {
        $constraint->aspectRatio();
      });

      // Save thumbnail
      $thumb->save($thumbDestination . '/' . $filename);
    }

    return true;
  }
  public static function deleteExecutingImage($parent, $type)
  {
    $media = Media::where(['parent_id' => $parent, 'type' => $type])->get();

    if ($media->count() > 0) {
      foreach ($media as $mediaItem) {
        // Delete original image
        $originalPath = 'uploads/image/' . $mediaItem->filename;
        if (Storage::disk('public')->exists($originalPath)) {
          Storage::disk('public')->delete($originalPath);
        }

        // Delete thumbnail images
        $thumbPath = 'uploads/image/thumb/' . $mediaItem->filename;
        if (Storage::disk('public')->exists($thumbPath)) {
          Storage::disk('public')->delete($thumbPath);
        }

        // Delete all possible thumbnail variations
        $thumbDir = 'uploads/image/thumb/';
        $fileNameWithoutExt = pathinfo($mediaItem->filename, PATHINFO_FILENAME);
        $files = Storage::disk('public')->files($thumbDir);

        foreach ($files as $file) {
          if (strpos($file, $fileNameWithoutExt) === strlen($thumbDir)) {
            Storage::disk('public')->delete($file);
          }
        }

        // Delete the media record
        $mediaItem->delete();
      }
    }
  }
}
