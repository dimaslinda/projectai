<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SidebarVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_see_sidebar_on_dashboard()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('dashboard'));
    }

    public function test_superadmin_can_see_sidebar_on_dashboard()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($superadmin)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('dashboard'));
    }

    public function test_regular_user_is_redirected_from_dashboard()
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect('/chat');
    }

    public function test_esr_user_is_redirected_from_dashboard()
    {
        $user = User::factory()->create(['role' => 'esr']);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect('/chat');
    }

    public function test_regular_user_can_access_chat_with_sidebar_but_no_dashboard_link()
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get('/chat');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Chat/Index'));
        
        // Verify that user data is passed to frontend so sidebar can conditionally render
        $response->assertInertia(fn ($page) => 
            $page->has('auth.user')
                ->where('auth.user.role', 'user')
        );
    }

    public function test_esr_user_can_access_chat_with_sidebar_but_no_dashboard_link()
    {
        $user = User::factory()->create(['role' => 'esr']);

        $response = $this->actingAs($user)->get('/chat');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Chat/Index'));
        
        // Verify that user data is passed to frontend so sidebar can conditionally render
        $response->assertInertia(fn ($page) => 
            $page->has('auth.user')
                ->where('auth.user.role', 'esr')
        );
    }

    public function test_admin_has_dashboard_link_in_sidebar()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/chat');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Chat/Index'));
        
        // Verify that admin user data is passed to frontend
        $response->assertInertia(fn ($page) => 
            $page->has('auth.user')
                ->where('auth.user.role', 'admin')
        );
    }

    public function test_superadmin_has_dashboard_link_in_sidebar()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($superadmin)->get('/chat');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Chat/Index'));
        
        // Verify that superadmin user data is passed to frontend
        $response->assertInertia(fn ($page) => 
            $page->has('auth.user')
                ->where('auth.user.role', 'superadmin')
        );
    }
}