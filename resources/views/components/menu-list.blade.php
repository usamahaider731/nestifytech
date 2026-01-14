<div class="absolute shadow-lg z-20 bg-white group-hover:block hidden top-full left-0 border-t-2 border-t-primary w-full">
    @foreach(get_taxonomy('category','parent_id',0) as $value)
    <div class="relative w-full nav-menu-list">
        <a class="flex w-full h-10 px-5 items-center justify-between">
            <span>{{$value->title}}</span>
            @if(count($value->allChildren) > 0)
            <i class="ri-arrow-right-s-line text-base"></i>
            @endif
        </a>
        @if(count($value->allChildren) > 0)
        <div class="absolute nav-menu-list-sub shadow-2xl flex-col w-64 border-t-2 border-primary hidden bg-white left-full top-0">
            @foreach($value->allChildren as $va)
            <div>
                <a class="flex w-full h-10 px-8 items-center justify-between">
                    <span>{{$va->title}}</span>
                </a>
            </div>
            @endforeach
        </div>
        @endif
    </div>
    @endforeach
</div>