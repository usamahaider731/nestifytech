<header class="w-full flex flex-col sticky top-0 left-0 z-40">
    <div class="bg-accent w-full">
        <div class="flex items-center container mx-auto px-3.75 justify-between">
            <ul class="py-1.75 text-res text-[13px] leading-5.5">
                <li>
                    <a href="">Welcome to Wordwide Electronic Store</a>
                </li>
            </ul>
            <ul class="py-1.75 flex items-center text-res gap-2 text-[13px] leading-5.5">
                <li class="text-res">
                    <a href="">
                        <i class="las la-map-marker mr-0.5 text-base"></i>
                        Store Locater
                    </a>
                </li>
                <li class="before:content-['|'] before:text-dynamic before:text-[13px]">

                    <a href="" class="pl-1">
                        <i class="las la-truck mr-0.5 text-base"></i>
                        Track your Order
                    </a>
                </li>
                <li class="before:content-['|'] before:text-dynamic before:text-[13px]">

                    <a href="" class="pl-1">
                        <i class="las la-shopping-bag mr-0.5 text-base"></i>
                        Shop
                    </a>
                </li>
                @auth
                <li class="before:content-['|'] before:text-dynamic before:text-[13px]">

                    <a href="" class="pl-1">
                        <i class="las la-user mr-0.5 text-base"></i>
                        My Account
                    </a>
                </li>
                @else
                <li class="before:content-['|'] before:text-dynamic before:text-[13px]">

                    <a href="{{route('login')}}" class="pl-1">
                        <i class="las la-user mr-0.5 text-base"></i>
                        Login
                    </a>
                </li>
                <li class="before:content-['|'] before:text-dynamic before:text-[13px]">

                    <a href="{{route('register')}}" class="pl-1">
                        <i class="las la-user-plus mr-0.5 text-base"></i>
                        Register
                    </a>
                </li>
                @endauth
            </ul>
        </div>
    </div>
    <div class="mb-2.5 border-b bg-white z-40 border-b-permanent h-21.25 w-full">
        <div class="container px-2.5 flex items-center justify-between mx-auto h-full">
            <div class="min-w-75 max-w-75 h-full flex relative items-center justify-between px-3.75">
                <a href="/">
                    {!! img_svg($setting['site']['dark_logo']['value']) !!}
                </a>
                <div class="w-fit h-full">
                    <div class="flex items-center justify-between h-full">
                        <div class="h-full pl-6.25 group flex items-center cursor-pointer">
                            <div class="flex font-bold items-center text-[15px] leading-6.25 text-res">
                                Categories
                                <i class="las la-angle-down ml-2.5 group-hover:rotate-180 duration-300 ease-in-out"></i>
                            </div>
                            <x-menu-list />
                        </div>
                    </div>
                </div>
            </div>
            <form class="px-3.75">
                <div class="h-10.25 relative flex flex-wrap items-stretch  w-128.25">
                    <div class="flex h-10.25">
                        <input type="text" placeholder="Search for Products" class="border-r-0 w-59 border-2 border-primary text-sm font-normal text-res focus:ring-0 focus:outline-0 py-1 px-7.5 rounded-l-3xl">
                    </div>
                    <div
                        x-data="{ label: null, id: null, setOption(id, label) { this.label = label; this.id = id; } }"
                        class="-ml-px border-y-2 w-53.5 border-primary h-full relative">
                        <x-select-dropdown triggerClass="flex py-1 pr-8.75 pl-3 h-full items-center justiy-between">
                            <x-slot name="trigger">
                                <input type="text" :value="label" placeholder="Select Category" readonly class="h-full text-sm font-medium text-res w-full border-0 focus:outline-0 focus:ring-0">
                                <i class="ri-expand-up-down-fill absolute top-1/2 right-5 text-res text-base -translate-y-1/2"></i>
                                <input type="hidden" name="category_id" :value="id">
                            </x-slot>
                            <x-slot name="content">
                                <div class="w-full flex flex-col">
                                    @foreach(get_taxonomy('category','parent_id',0) as $value)
                                    <div
                                        @click="setOption('{{ $value->id }}', '{{ $value->title }}')"
                                        class="h-10 w-full flex cursor-pointer hover:bg-accent duration-300 items-center justify-between px-3 text-sm font-normal text-res">
                                        {{ $value->title }}
                                    </div>
                                    @endforeach
                                </div>
                            </x-slot>
                        </x-select-dropdown>
                    </div>
                    <button class="rounded-r-full h-full px-4 cursor-pointer bg-primary border-2 border-primary text-white">
                        <i class="ri-search-line text-xl"></i>
                    </button>
                </div>
            </form>
            <div class="w-fit flex items-center gap-7">
                <div class="h-fit w-fit relative">
                    <i class="ri-repeat-2-fill text-xl"></i>
                    <span class="bg-primary absolute bottom-0.5 text-sm translate-1/2 right-0.5 size-5 flex items-center justify-center rounded-full">0</span>
                </div>
                <span class="h-fit w-fit">
                    <i class="ri-heart-line text-xl"></i>
                </span>
                <span class="h-fit w-fit">
                    <i class="ri-user-3-line text-xl"></i>
                </span>
                <div class="flex gap-1.5 items-center">
                    <div class="h-fit w-fit relative">
                        <i class="ri-shopping-bag-2-line text-xl"></i>
                        <span class="bg-primary absolute bottom-0.5 text-sm translate-1/2 right-0.5 size-5 flex items-center justify-center rounded-full">0</span>
                    </div>
                    <span class="text-base font-bold text-res">$000</span>
                </div>
            </div>
        </div>
    </div>
</header>