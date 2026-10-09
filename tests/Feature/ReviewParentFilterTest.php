<?php

namespace Tests\Feature;

use App\Http\Controllers\ModuleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ReviewParentFilterTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('reviews');
        Schema::create('reviews', function ($table) {
            $table->id();
            $table->unsignedBigInteger('post_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->tinyInteger('rating')->default(5);
            $table->text('comment')->nullable();
            $table->string('status')->default('pending');
            $table->string('type')->default('general');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->timestamps();
        });

        DB::table('reviews')->insert([
            ['id' => 1, 'post_id' => 10, 'user_id' => 1, 'rating' => 5, 'comment' => 'Main review', 'status' => 'approved', 'type' => 'general', 'parent_id' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'post_id' => 10, 'user_id' => 2, 'rating' => 4, 'comment' => 'Another main review', 'status' => 'approved', 'type' => 'general', 'parent_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'post_id' => 10, 'user_id' => 3, 'rating' => 3, 'comment' => 'Reply to review 1', 'status' => 'approved', 'type' => 'general', 'parent_id' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function test_it_defaults_to_top_level_reviews_when_no_parent_id_is_present(): void
    {
        $controller = app(ModuleController::class);
        $request = Request::create('/admin/reviews', 'GET');

        $method = new \ReflectionMethod($controller, 'applyReviewParentFilter');
        $method->setAccessible(true);

        $query = DB::table('reviews');
        $filtered = $method->invoke($controller, $query, $request, 'reviews', null);

        $this->assertEqualsCanonicalizing([1, 2], $filtered->pluck('id')->all());
    }

    public function test_it_filters_reply_reviews_for_a_selected_review_parent(): void
    {
        $controller = app(ModuleController::class);
        $request = Request::create('/admin/reviews/1', 'GET');

        $method = new \ReflectionMethod($controller, 'applyReviewParentFilter');
        $method->setAccessible(true);

        $query = DB::table('reviews');
        $filtered = $method->invoke($controller, $query, $request, 'reviews', 1);

        $this->assertSame([3], $filtered->pluck('id')->all());
    }
}
