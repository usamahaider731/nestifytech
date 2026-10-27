<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PromotionRuleController extends Controller
{
    /* ─── Helper: active rules query ─────────────────────────────── */
    private function activeRulesQuery()
    {
        $now = now();
        return DB::table('promotions_and_tax_rules')
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            });
    }

    /** Display a listing of discount and tax rules. */
    public function index(Request $request)
    {
        $type   = $request->input('type', 'all');
        $status = $request->input('status', 'all');
        $search = $request->input('search');

        $query = DB::table('promotions_and_tax_rules')->orderByDesc('id');

        if ($type !== 'all' && in_array($type, ['discount', 'tax'])) {
            $query->where('type', $type);
        }
        if ($status !== 'all' && in_array($status, ['active', 'inactive'])) {
            $query->where('status', $status);
        }
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $rules = $query->paginate(15)->withQueryString();

        // Decode target_ids JSON for each rule
        $rules->getCollection()->transform(function ($rule) {
            $rule->target_ids = $rule->target_ids ? json_decode($rule->target_ids, true) : [];
            return $rule;
        });

        // Load available targets for the rule builder modal
        $categories  = DB::table('taxonomies')->where('type', 'category')->select('id', 'title')->orderBy('title')->get();
        $brands      = DB::table('taxonomies')->where('type', 'brand')->select('id', 'title')->orderBy('title')->get();
        $collections = DB::table('taxonomies')->where('type', 'collection')->select('id', 'title')->orderBy('title')->get();
        $products    = DB::table('posts')->where('type', 'product')->select('id', 'title', 'sku')->orderBy('title')->limit(300)->get();
        $users       = DB::table('users')->select('id', 'name', 'email')->orderBy('name')->limit(200)->get();

        // Use role titles as ids so they match auth.user.user_role (title strings)
        $dbRoles = DB::table('roles')->select('title')->orderBy('title')->get();
        $availableRoles = $dbRoles->map(fn ($role) => [
            'id' => $role->title,
            'title' => $role->title,
        ])->values()->all();

        if (empty($availableRoles)) {
            $availableRoles = [
                ['id' => 'Customer', 'title' => 'Customer'],
                ['id' => 'Administrator', 'title' => 'Administrator'],
                ['id' => 'Vendor', 'title' => 'Vendor'],
                ['id' => 'VIP Member', 'title' => 'VIP Member'],
            ];
        }

        $totalRules      = DB::table('promotions_and_tax_rules')->count();
        $activeDiscounts = DB::table('promotions_and_tax_rules')->where('type', 'discount')->where('status', 'active')->count();
        $activeTaxes     = DB::table('promotions_and_tax_rules')->where('type', 'tax')->where('status', 'active')->count();

        return Inertia::render('Admin/Promotions/Index', [
            'rules'   => $rules,
            'filters' => compact('type', 'status', 'search'),
            'stats'   => [
                'total_rules'      => $totalRules,
                'active_discounts' => $activeDiscounts,
                'active_taxes'     => $activeTaxes,
            ],
            'availableTargets' => compact('categories', 'brands', 'collections', 'products', 'users') + ['roles' => $availableRoles],
        ]);
    }

    /** Store a newly created rule. */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:discount,tax',
            'rate_type'   => 'required|in:percentage,fixed',
            'rate_value'  => 'required|numeric|min:0',
            'target_type' => 'required|in:all,product,category,brand,collection,user_role,user',
            'target_ids'  => 'nullable|array',
            'code'        => 'nullable|string|max:50',
            'min_spend'   => 'nullable|numeric|min:0',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'priority'    => 'nullable|integer',
            'status'      => 'required|in:active,inactive',
            'description' => 'nullable|string|max:1000',
        ]);

        DB::table('promotions_and_tax_rules')->insert([
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'rate_type'   => $validated['rate_type'],
            'rate_value'  => $validated['rate_value'],
            'target_type' => $validated['target_type'],
            'target_ids'  => json_encode($validated['target_ids'] ?? []),
            'code'        => $validated['code'] ?? null,
            'min_spend'   => $validated['min_spend'] ?? null,
            'start_date'  => $validated['start_date'] ?? null,
            'end_date'    => $validated['end_date'] ?? null,
            'priority'    => $validated['priority'] ?? 0,
            'status'      => $validated['status'],
            'description' => $validated['description'] ?? null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return redirect()->back()->with('success', 'Rule created successfully!');
    }

    /** Update the specified rule. */
    public function update(Request $request, $id)
    {
        abort_if(!DB::table('promotions_and_tax_rules')->where('id', $id)->exists(), 404);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:discount,tax',
            'rate_type'   => 'required|in:percentage,fixed',
            'rate_value'  => 'required|numeric|min:0',
            'target_type' => 'required|in:all,product,category,brand,collection,user_role,user',
            'target_ids'  => 'nullable|array',
            'code'        => 'nullable|string|max:50',
            'min_spend'   => 'nullable|numeric|min:0',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'priority'    => 'nullable|integer',
            'status'      => 'required|in:active,inactive',
            'description' => 'nullable|string|max:1000',
        ]);

        DB::table('promotions_and_tax_rules')->where('id', $id)->update([
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'rate_type'   => $validated['rate_type'],
            'rate_value'  => $validated['rate_value'],
            'target_type' => $validated['target_type'],
            'target_ids'  => json_encode($validated['target_ids'] ?? []),
            'code'        => $validated['code'] ?? null,
            'min_spend'   => $validated['min_spend'] ?? null,
            'start_date'  => $validated['start_date'] ?? null,
            'end_date'    => $validated['end_date'] ?? null,
            'priority'    => $validated['priority'] ?? 0,
            'status'      => $validated['status'],
            'description' => $validated['description'] ?? null,
            'updated_at'  => now(),
        ]);

        return redirect()->back()->with('success', 'Rule updated successfully!');
    }

    /** Toggle active/inactive status. */
    public function toggleStatus($id)
    {
        $rule = DB::table('promotions_and_tax_rules')->find($id);
        abort_if(!$rule, 404);

        $newStatus = $rule->status === 'active' ? 'inactive' : 'active';
        DB::table('promotions_and_tax_rules')->where('id', $id)->update([
            'status'     => $newStatus,
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Rule '{$rule->name}' is now {$newStatus}!");
    }

    /** Remove the specified rule. */
    public function destroy($id)
    {
        DB::table('promotions_and_tax_rules')->where('id', $id)->delete();
        return redirect()->back()->with('success', 'Rule deleted successfully!');
    }

    /**
     * Public API: returns all currently active discount & tax rules
     * for the frontend pricing engine (shared via Inertia + this endpoint).
     */
    public function activeRules()
    {
        $now   = now();
        $rules = DB::table('promotions_and_tax_rules')
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderByDesc('priority')
            ->get()
            ->map(function ($rule) {
                $rule->target_ids = $rule->target_ids ? json_decode($rule->target_ids, true) : [];
                return $rule;
            });

        return response()->json(['success' => true, 'rules' => $rules]);
    }
}
