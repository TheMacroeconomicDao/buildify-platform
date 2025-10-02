<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Enums\Users\Type;
use Orchid\Platform\Models\Role;
use Illuminate\Console\Command;

class SetupAdminPermissions extends Command
{
    protected $signature = 'admin:setup-permissions';
    protected $description = 'Setup admin permissions for User Management';

    public function handle()
    {
        $admin = User::where('type', Type::Admin->value)->first();
        
        if (!$admin) {
            $this->error('No admin user found');
            return 1;
        }

        // Find or create admin role
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator']
        );

        // Add permissions to admin role
        $permissions = $adminRole->permissions ?? [];
        $permissions['platform.users.manage'] = true;
        $permissions['platform.systems.analytics'] = true;
        $permissions['platform.systems.reports'] = true;
        $permissions['platform.systems.notifications'] = true;
        $permissions['platform.systems.licenses'] = true;
        $permissions['platform.systems.complaints'] = true;
        $permissions['platform.systems.payments'] = true;
        $permissions['platform.systems.subscriptions'] = true;
        $permissions['platform.systems.orders'] = true;
        $permissions['platform.systems.orders.responses'] = true;
        $permissions['platform.systems.mediators'] = true;
        $permissions['platform.systems.executors'] = true;
        $permissions['platform.systems.customers'] = true;
        $permissions['platform.systems.banners'] = true;
        $permissions['platform.systems.work-directions'] = true;
        $permissions['platform.systems.work-types'] = true;
        $permissions['platform.systems.housing-options'] = true;
        
        $adminRole->permissions = $permissions;
        $adminRole->save();

        // Assign role to admin if not already assigned
        if (!$admin->roles->contains('slug', 'admin')) {
            $admin->roles()->attach($adminRole);
        }

        $this->info('Admin permissions have been set up successfully');
        $this->info('Admin: ' . $admin->email);
        $this->info('Role: ' . $adminRole->name);
        
        return 0;
    }
}
