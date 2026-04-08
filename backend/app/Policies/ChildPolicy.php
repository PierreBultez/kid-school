<?php

namespace App\Policies;

use App\Models\Child;
use App\Models\User;

class ChildPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin' || $user->family !== null;
    }

    public function view(User $user, Child $child): bool
    {
        return $this->ownsChild($user, $child);
    }

    public function create(User $user): bool
    {
        return $user->family !== null;
    }

    public function update(User $user, Child $child): bool
    {
        return $this->ownsChild($user, $child);
    }

    public function delete(User $user, Child $child): bool
    {
        return $this->ownsChild($user, $child);
    }

    public function restore(User $user, Child $child): bool
    {
        return $this->ownsChild($user, $child);
    }

    public function forceDelete(User $user, Child $child): bool
    {
        return $this->ownsChild($user, $child);
    }

    private function ownsChild(User $user, Child $child): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->family !== null && $child->family_id === $user->family->id;
    }
}
