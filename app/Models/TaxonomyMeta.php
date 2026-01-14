<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxonomyMeta extends Model{
   use HasFactory;
   public $table="taxonomy_meta";
   protected $fillable =[
      'id',
      'taxonomy_id',
      'value',
      'key'
   ];
    public $timestamps = false;
}