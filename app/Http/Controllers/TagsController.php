<?php

namespace App\Http\Controllers;

use App\Models\Taxonomy;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TagsController extends Controller
{

    public function index()
    {
        $tags = Taxonomy::where(['type' => 'tag'])->paginate(10);
        return Inertia::render('Admin/Tag/Index', [
            'tags' => $tags
        ]);
    }

    public function submit(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'status' => 'required|string|max:50'
        ]);
        try {
            $tag = Taxonomy::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' =>  $validated['status'],
                'slug' => Str::slug($validated['title']),
                'parent_id' => 0,
                'type' => 'tag'
            ]);
            return response()->json([
                'success' => true,
                'message' => 'tag created successfully',
                'data' => $tag
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'failed to create tag' . $e
            ]);
        }
    }
    public function update(Request $request, $id){
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'status' => 'required|string|max:50'
        ]);
        try{
        $tag = Taxonomy::findOrFail($id);
        $tag->update([
            'title'=>$validated['title'],
            'description'=> $validated['description'],
            'status' => $validated['status']
        ]);
         return response()->json([
                'success' => true,
                'message' => 'tag uploded successfully',
                'data' => $tag
            ]);
        } 
        catch(Exception $e){
 return response()->json([
                 'success' => false,
                'message' => 'failed to upload tag' . $e
            ]);
        }
    }
}
