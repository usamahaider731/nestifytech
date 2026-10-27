<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GiftCardController extends Controller
{
    /** List all gift cards */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'all');

        $query = DB::table('gift_cards')
            ->leftJoin('users', 'gift_cards.issued_to_user_id', '=', 'users.id')
            ->select(
                'gift_cards.*',
                'users.name as issued_to_name',
                'users.email as issued_to_email'
            )
            ->orderByDesc('gift_cards.id');

        if ($status !== 'all' && in_array($status, ['active', 'inactive', 'exhausted'])) {
            $query->where('gift_cards.status', $status);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('gift_cards.code', 'like', "%{$search}%")
                    ->orWhere('gift_cards.note', 'like', "%{$search}%");
            });
        }

        $cards = $query->paginate(15)->withQueryString();

        $stats = [
            'total'         => DB::table('gift_cards')->count(),
            'active'        => DB::table('gift_cards')->where('status', 'active')->count(),
            'exhausted'     => DB::table('gift_cards')->where('status', 'exhausted')->count(),
            'total_balance' => (float) DB::table('gift_cards')->where('status', 'active')->sum('remaining_balance'),
        ];

        $users = DB::table('users')->select('id', 'name', 'email')->orderBy('name')->limit(200)->get();

        return Inertia::render('Admin/GiftCards/Index', [
            'cards'   => $cards,
            'stats'   => $stats,
            'users'   => $users,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /** Create a new gift card */
    public function store(Request $request)
    {
        $request->validate([
            'code'               => 'nullable|string|max:50|unique:gift_cards,code',
            'initial_balance'    => 'required|numeric|min:1',
            'status'             => 'required|in:active,inactive',
            'expires_at'         => 'nullable|date',
            'issued_to_user_id'  => 'nullable|integer|exists:users,id',
            'note'               => 'nullable|string|max:255',
            'quantity'           => 'nullable|integer|min:1|max:100',
        ]);

        $quantity = max(1, intval($request->input('quantity', 1)));
        $now = now();

        for ($i = 0; $i < $quantity; $i++) {
            $code = $quantity === 1 && $request->filled('code')
                ? strtoupper($request->input('code'))
                : 'GC-' . strtoupper(Str::random(8));

            DB::table('gift_cards')->insert([
                'code'               => $code,
                'initial_balance'    => $request->input('initial_balance'),
                'remaining_balance'  => $request->input('initial_balance'),
                'status'             => $request->input('status', 'active'),
                'expires_at'         => $request->input('expires_at'),
                'issued_to_user_id'  => $request->input('issued_to_user_id'),
                'note'               => $request->input('note'),
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);
        }

        $msg = $quantity > 1 ? "{$quantity} gift cards generated!" : 'Gift card created!';
        return redirect()->back()->with('success', $msg);
    }

    /** Update a gift card */
    public function update(Request $request, $id)
    {
        $card = DB::table('gift_cards')->find($id);
        abort_if(!$card, 404);

        $request->validate([
            'status'             => 'required|in:active,inactive,exhausted',
            'remaining_balance'  => 'required|numeric|min:0',
            'expires_at'         => 'nullable|date',
            'issued_to_user_id'  => 'nullable|integer|exists:users,id',
            'note'               => 'nullable|string|max:255',
        ]);

        DB::table('gift_cards')->where('id', $id)->update([
            'status'             => $request->input('status'),
            'remaining_balance'  => $request->input('remaining_balance'),
            'expires_at'         => $request->input('expires_at'),
            'issued_to_user_id'  => $request->input('issued_to_user_id'),
            'note'               => $request->input('note'),
            'updated_at'         => now(),
        ]);

        return redirect()->back()->with('success', 'Gift card updated!');
    }

    /** Delete a gift card */
    public function destroy($id)
    {
        DB::table('gift_cards')->where('id', $id)->delete();
        return redirect()->back()->with('success', 'Gift card deleted!');
    }

    /**
     * Generate a unique gift card code
     */
    public function generateCode()
    {
        do {
            $code = 'GC-' . strtoupper(Str::random(8));
        } while (DB::table('gift_cards')->where('code', $code)->exists());

        return response()->json([
            'success' => true,
            'code'    => $code,
        ]);
    }

    /**
     * API: validate a gift card code for checkout
     * Returns remaining balance if valid.
     */
    public function validateCode(Request $request)
    {
        $request->validate(['code' => 'required|string']);
        $code = strtoupper(trim($request->input('code')));

        $card = DB::table('gift_cards')->where('code', $code)->first();

        if (!$card) {
            return response()->json(['success' => false, 'message' => 'Gift card not found.'], 404);
        }

        if ($card->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'This gift card is ' . $card->status . '.'], 422);
        }

        if ($card->expires_at && now()->gt($card->expires_at)) {
            return response()->json(['success' => false, 'message' => 'This gift card has expired.'], 422);
        }

        if ($card->issued_to_user_id && auth()->check() && $card->issued_to_user_id != auth()->id()) {
            return response()->json(['success' => false, 'message' => 'This gift card is assigned to another user.'], 403);
        }

        return response()->json([
            'success'           => true,
            'code'              => $card->code,
            'remaining_balance' => (float) $card->remaining_balance,
            'expires_at'        => $card->expires_at,
            'message'           => 'Gift card applied! Balance: PKR ' . number_format($card->remaining_balance, 2),
        ]);
    }
}
