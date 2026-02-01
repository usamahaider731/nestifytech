<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Roles;
use App\Models\Taxonomy;
use App\Models\User;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class UserController extends Controller
{
    public $file;
    public function __construct()
    {
         parent::__construct();
         $this->file = $this->json_file_location.'/Form.json';
    }
    public function users()
    {

        // Get online and recently active users
        $onlineUsers = User::online()->get();
        $recentlyActive = User::recentlyActive(30); // returns collection or query builder

        // Paginate all users
        $users = User::with('image')->paginate(15);

        // Get time ranges for weekly comparison
        $now = Carbon::now();
        $startOfThisWeek = $now->copy()->startOfWeek();
        $startOfLastWeek = $now->copy()->subWeek()->startOfWeek();
        $endOfLastWeek = $now->copy()->subWeek()->endOfWeek();

        // Count users
        $totalUsers = User::count();
        $thisWeekUsers = User::where('created_at', '>=', $startOfThisWeek)->count();
        $lastWeekUsers = User::whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])->count();
        $recentlyActiveCount = $recentlyActive->count();
        $onlineCount = $onlineUsers->count();

        // Calculate percentages
        $onlinePercentage = $totalUsers > 0 ? round(($onlineCount / $totalUsers) * 100) : 0;
        $activePercentage = $totalUsers > 0 ? round(($recentlyActiveCount / $totalUsers) * 100) : 0;

        $percentChange = 0;
        if ($lastWeekUsers > 0) {
            $percentChange = round((($thisWeekUsers - $lastWeekUsers) / $lastWeekUsers) * 100);
        } elseif ($thisWeekUsers > 0) {
            $percentChange = 100;
        }
        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'userStats' => [
                'total' => $totalUsers,
                'this_week' => $thisWeekUsers,
                'last_week' => $lastWeekUsers,
                'percent_change' => $percentChange,
                'online_count' => $onlineCount,
                'recently_active_count' => $recentlyActiveCount,
                'online_percentage' => $onlinePercentage,
                'active_percentage' => $activePercentage,
            ],
        ]);
    }
    public function userEdit(Request $request, $id)
    {
        $user = User::where(['id' => $id])->with('image')->first();
        $user->roles = is_string($user->roles) ? json_decode($user->roles, true) : $user->roles;

        $roles = Roles::where('status', 'publish')->get();
        $file = File::exists($this->file) ? File::get($this->file) : '';
        $data = json_decode($file, true);
        $user_rows = $data['user'];
        return inertia::render('Admin/Users/Edit', compact('user', 'roles', 'user_rows'));
    }
    public function userEditSubmit(Request $request, $status)
    {
        $data = $request->all();
        $id = $data['id'];
        $user = User::where('id', $id)->first();
        if (!$user) {
            return redirect()->back()->with('error', 'User not found.');
        }
        if (isset($data['roles'])) {
            if (is_array($data['roles'])) {
                $roles = array_map(function($role) {
                    return (int)$role;
                }, $data['roles']);
                $data['roles'] = $roles;
            } else {
                $data['roles'] = $data['roles'];
            }
        } 
        else {
            $data['roles'] = [];
        }
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'active' => $data['active'] ?? false,
            'roles' => $data['roles'],
            'last_seen_at' => now(),
        ]);
        if (!is_null($data['image']) && isset($data['image']) && $data['image']) {
            $image = $data['image'];
            Media::handleImageUpload($image, $user, 'user');
        }        
        return redirect()->back()->with('success', 'User updated successfully.');
    }
    public function Role()
    {
        $roles = Roles::get();
        return inertia::render('Admin/Role/Index', compact('roles'));
    }
    public function RoleManage(Request $request)
    {
        $file = json_decode(File::get($this->file), true);
        $Data = $file['role'];
        $id = $request->id ?? null;
        $roles = null;
        if (!is_null($id)) {
            $roles = Roles::where('id', $id)->first();
            $roles->permission = json_decode($roles->permission, true); // ✅ decode to array
        }
        return inertia::render('Admin/Role/Create', compact('Data', 'id', 'roles'));
    }
    public function RoleDetail(Request $request, $id)
    {
        $role = Roles::where('id', $id)->first();
        $role->permission = json_decode($role->permission, true);
        $file = json_decode(File::get(), true);
        $data = $file['role'];
        return inertia::render('Admin/Role/Detail', compact('data', 'role'));
    }
    public function RoleSubmit(Request $request, $status)
    {
        $data = $request->all();
        $id = $request->input('id');
        $permissions = [];
        foreach ($data as $key => $value) {
            if (!in_array($key, ['title', 'id'])) {
                $permissions[$key] = $value ? 1 : 0;
            }
        }
        $permissions = json_encode($permissions);
        if ($id) {
            $role = Roles::find($id);
            $role->update([
                'title' => $request->title,
                'permission' => $permissions,
                'status' => $status,
            ]);
        } else {
            Roles::create([
                'title' => $request->title,
                'permission' => $permissions,
                'status' => $status,
            ]);
        }

        return redirect()->back()->with('success', 'Role saved successfully.');
    }
}
