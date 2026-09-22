<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public $review_table = "reviews";
    // ====== ADMIN METHODS ======
    public function index()
    {
        $reviews = \App\Models\Review::with(['user:id,name,email', 'post:id,title'])->latest()->get();
        return \Inertia\Inertia::render('Admin/Reviews/Index', ['reviews' => $reviews]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:pending,approved,rejected']);
        $review = \App\Models\Review::findOrFail($id);
        $review->update(['status' => $request->status]);
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        \App\Models\Review::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    // ====== FRONTEND API METHODS ======
    public function store(Request $request)
    {
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'type' => 'required|in:general,verified'
        ]);

        $review = DB::table($this->review_table)->insert([
            'user_id' => auth()->id() ?? null,
            'post_id' => $request->post_id,
            'rating'  => $request->rating,
            'comment' => $request->comment,
            'status'  => 'pending',
            'type' => $request->type
        ]);
        return response()->json(['message' => 'Review submitted successfully', 'review' => $review]);
    }

    public function productReviews($postId)
    {
        $reviews = \App\Models\Review::where('post_id', $postId)
            ->where('status', 'approved')
            ->with('user:id,name')
            ->latest()
            ->paginate(10);
            
        return response()->json($reviews);
    }
}
