<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public $review_table = "reviews";
    // ====== ADMIN METHODS ======
    public function index($id = null)
    {
        $query = \App\Models\Review::query()->with(['user:id,name,email', 'post:id,title']);

        if ($id !== null && $id !== '' && $id !== '0') {
            $query->where('parent_id', (int) $id);
        } else {
            $query->where(function ($q) {
                $q->whereNull('parent_id')
                    ->orWhere('parent_id', 0)
                    ->orWhere('parent_id', '');
            });
        }

        $reviews = $query->latest()->get();

        return \Inertia\Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'selectedParentId' => $id !== null && $id !== '' ? (int) $id : null,
        ]);
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
            'rating'  => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'type' => 'required|in:general,verified',
            'parent_id' => 'nullable|integer'
        ]);

        $review = DB::table($this->review_table)->insert([
            'user_id' => auth()->id() ?? null,
            'post_id' => $request->post_id,
            'rating'  => $request->rating ?? 5,
            'comment' => $request->comment,
            'status'  => 'pending',
            'type' => $request->type,
            'parent_id' => $request->parent_id ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Review submitted successfully', 'review' => $review]);
    }

    public function productReviews($postId)
    {
        $userId = auth()->id();
        $likedReviews = [];
        $reportedReviews = [];
        if ($userId) {
            $meta = DB::table('user_meta')->where('user_id', $userId)->whereIn('key', ['liked_reviews', 'reported_reviews'])->get();
            foreach ($meta as $m) {
                if ($m->key === 'liked_reviews') {
                    $likedReviews = json_decode($m->value, true) ?: [];
                } elseif ($m->key === 'reported_reviews') {
                    $reportedReviews = json_decode($m->value, true) ?: [];
                }
            }
        }

        $reviews = DB::table($this->review_table)
            ->where('post_id', $postId)
            ->where('status', 'approved')
            ->where(function ($query) {
                $query->whereNull('parent_id')->orWhere('parent_id', 0);
            })
            ->orderBy($this->review_table.'.created_at', 'desc')
            ->get();
            
        $reviews->each(function ($review) use ($likedReviews, $reportedReviews) {
            $user = DB::table('users')->where('id', $review->user_id)->first();
            $review->user = $user ? [
                'name' => $user->name,
                'email' => $user->email
            ] : ['name' => 'Guest', 'email' => ''];
            
            $review->is_liked = in_array($review->id, $likedReviews);
            $review->is_reported = in_array($review->id, $reportedReviews);
            
            $review->replies = DB::table($this->review_table)
                ->where('parent_id', $review->id)
                ->where('status', 'approved')
                ->orderBy('created_at', 'asc')
                ->get();
                
            $review->replies->each(function ($reply) use ($likedReviews, $reportedReviews) {
                 $replyUser = DB::table('users')->where('id', $reply->user_id)->first();
                 $reply->user = $replyUser ? [
                     'name' => $replyUser->name,
                     'email' => $replyUser->email
                 ] : ['name' => 'Guest', 'email' => ''];
                 $reply->is_liked = in_array($reply->id, $likedReviews);
                 $reply->is_reported = in_array($reply->id, $reportedReviews);
            });
        });
        return response()->json($reviews);
    }
    public function like($id)
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Please login to like reviews.'], 401);
        }

        $meta = DB::table('user_meta')
            ->where('user_id', $userId)
            ->where('key', 'liked_reviews')
            ->first();

        if ($meta) {
            $likedReviews = json_decode($meta->value, true) ?: [];
            if (in_array($id, $likedReviews)) {
                $likedReviews = array_values(array_diff($likedReviews, [$id]));
                DB::table('user_meta')->where('id', $meta->id)->update([
                    'value' => json_encode($likedReviews),
                    'updated_at' => now()
                ]);
                DB::table($this->review_table)->where('id', $id)->decrement('likes');
                return response()->json(['success' => true, 'action' => 'unliked']);
            }
            $likedReviews[] = $id;
            DB::table('user_meta')->where('id', $meta->id)->update([
                'value' => json_encode($likedReviews),
                'updated_at' => now()
            ]);
        } else {
            DB::table('user_meta')->insert([
                'user_id' => $userId,
                'key' => 'liked_reviews',
                'value' => json_encode([$id]),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        DB::table($this->review_table)->where('id', $id)->increment('likes');
        return response()->json(['success' => true]);
    }

    public function report($id)
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Please login to report reviews.'], 401);
        }

        $meta = DB::table('user_meta')
            ->where('user_id', $userId)
            ->where('key', 'reported_reviews')
            ->first();

        if ($meta) {
            $reportedReviews = json_decode($meta->value, true) ?: [];
            if (in_array($id, $reportedReviews)) {
                $reportedReviews = array_values(array_diff($reportedReviews, [$id]));
                DB::table('user_meta')->where('id', $meta->id)->update([
                    'value' => json_encode($reportedReviews),
                    'updated_at' => now()
                ]);
                DB::table($this->review_table)->where('id', $id)->decrement('reports');
                return response()->json(['success' => true, 'action' => 'unreported']);
            }
            $reportedReviews[] = $id;
            DB::table('user_meta')->where('id', $meta->id)->update([
                'value' => json_encode($reportedReviews),
                'updated_at' => now()
            ]);
        } else {
            DB::table('user_meta')->insert([
                'user_id' => $userId,
                'key' => 'reported_reviews',
                'value' => json_encode([$id]),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        DB::table($this->review_table)->where('id', $id)->increment('reports');
        return response()->json(['success' => true]);
    }
}
