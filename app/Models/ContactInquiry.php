<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactInquiry extends Model
{
    use HasFactory;

    protected $table = 'contact_inquiries';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'status',
        'priority',
        'is_starred',
        'assigned_to',
        'ip_address',
        'user_agent',
        'admin_notes',
        'admin_reply',
        'replied_at',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_starred'  => 'boolean',
    ];
}
