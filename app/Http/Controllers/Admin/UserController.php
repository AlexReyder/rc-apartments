<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $authUser */
        $authUser = $request->user();

        $superadminCount = User::query()
            ->where('role', User::ROLE_SUPERADMIN)
            ->count();

        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'created_at'])
            ->visibleFor($authUser)
            ->orderByRaw(
                "case when role = ? then 0 else 1 end",
                [User::ROLE_SUPERADMIN],
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(function (User $user) use ($authUser, $superadminCount) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'can_delete' => ! $authUser->is($user)
                        && $authUser->canManageRole($user->role)
                        && ! ($user->isSuperadmin() && $superadminCount <= 1),
                ];
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $authUser */
        $authUser = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'role' => ['required', 'string', Rule::in($authUser->manageableRoles())],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'],
            'email_verified_at' => now(),
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', "Пользователь {$validated['name']} создан.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        /** @var User $authUser */
        $authUser = $request->user();

        if ($authUser->is($user)) {
            return redirect()
                ->route('admin.users.index')
                ->with('error', 'Нельзя удалить самого себя.');
        }

        if (! $authUser->canManageRole($user->role)) {
            return redirect()
                ->route('admin.users.index')
                ->with('error', 'Недостаточно прав для удаления этого пользователя.');
        }

        if (
            $user->isSuperadmin()
            && User::query()->where('role', User::ROLE_SUPERADMIN)->count() <= 1
        ) {
            return redirect()
                ->route('admin.users.index')
                ->with('error', 'Нельзя удалить последнего superadmin.');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', "Пользователь {$userName} удалён.");
    }
}