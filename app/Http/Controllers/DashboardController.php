<?php
namespace App\Http\Controllers;

use Inertia\Inertia;

class DashboardController extends Controller{
  public function dashboard(){
    return Inertia::render('Admin/Dashboard');
  }
}