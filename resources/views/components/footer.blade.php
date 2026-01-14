<footer class="bg-bg w-full flex flex-col">
    <div class="w-full pt-14.75 pb-15.5">
        <div class="container mx-auto flex px-3.75">
            <div class="w-2/5 px-3.75 flex flex-col">
                <a href="/">
                    {!! img_svg($setting['site']['dark_logo']['value']) !!}
                </a>
                <div class="flex gap-5 mt-5 items-center">
                    <i class="ri-customer-service-2-fill text-5xl text-primary"></i>
                    <div class="flex flex-col items-start gap-1">
                        <a class="text-xs font-normal text-res">Got Questions ? Call us 24/7</a>
                        <a class=" font-medium text-res text-xl">(800) 8001-8588, (6000) 874 548</a>
                    </div>
                </div>
                <div class="mt-10 flex flex-col">
                    <p class="text-res font-bold text-sm">Contact info</p>
                    <address class="text-sm font-normal text-res mt-0.5 normal">17 Princess Road, London, Greater London NW1 8JR, UK</address>
                </div>
                <div class="mt-8 flex items-center gap-3 text-res">
                    <a class="">
                        <i class="ri-facebook-circle-fill text-2xl cursor-pointer hover:!text-blue-500 text-text"></i>
                    </a>
                    <a class="">
                        <i class="ri-instagram-line text-2xl text-text cursor-pointer hover:!text-red-500"></i>
                    </a>
                    <a class="">
                        <i class="ri-twitter-x-fill text-2xl text-text cursor-pointer hover:!text-black"></i>
                    </a>
                    <a class="">
                        <i class="ri-whatsapp-line text-2xl text-text cursor-pointer hover:!text-green-500"></i>
                    </a>
                    <a class="">
                        <i class="ri-pinterest-line text-2xl text-text cursor-pointer hover:!text-red-600"></i>
                    </a>
                    <a class="">
                        <i class="ri-youtube-fill text-2xl text-text cursor-pointer hover:!text-red-600"></i>
                    </a>
                    <a class="">
                        <i class="ri-linkedin-fill text-2xl text-text cursor-pointer hover:!text-blue-400"></i>
                    </a>
                </div>
            </div>
            <div class="w-3/5 grid grid-cols-3">
                <div class="col-span-1 flex flex-col gap-6.25">
                    <h5 class="capitalize text-[18.288px] text-res font-bold">Find it Fast</h5>
                    <div class="flex flex-col gap-1.5">
                        @foreach(get_taxonomy('category','parent_id',0) as $value)
                        <a href="" class="font-normal text-sm leading-6 text-res">
                            {{$value->title}}
                        </a>
                        @endforeach
                    </div>
                </div>
                <div class="col-span-1 gap-1.5 flex flex-col pt-11.75">
                    <a href="" class="font-normal text-sm leading-6 text-res">About</a>
                    <a href="" class="font-normal text-sm leading-6 text-res">Contact</a>
                    <a href="" class="font-normal text-sm leading-6 text-res">Wishlist</a>
                    <a href="" class="font-normal text-sm leading-6 text-res">Compare</a>
                    <a href="" class="font-normal text-sm leading-6 text-res">FAQ</a>
                    <a href="" class="font-normal text-sm leading-6 text-res">Store Directory</a>
                </div>
                <div class="col-span-1 flex flex-col gap-6.25">
                    <h5 class="capitalize text-[18.288px] text-res font-bold">Customer Care</h5>
                    <div class="flex flex-col gap-1.5">
                        <a href="" class="font-normal text-sm leading-6 text-res">My Account</a>
                        <a href="" class="font-normal text-sm leading-6 text-res">Track your Order</a>
                        <a href="" class="font-normal text-sm leading-6 text-res">Customer Service</a>
                        <a href="" class="font-normal text-sm leading-6 text-res">Returns/Exchange</a>
                        <a href="" class="font-normal text-sm leading-6 text-res">FAQs</a>
                        <a href="" class="font-normal text-sm leading-6 text-res">Product Support</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="bg-accent w-full py-4">
        <div class="container mx-auto px-3.75 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <i class="ri-copyright-line text-lg"></i>
                <h2 class="text-sm font-normal text-text"><span class="font-bold">Nestify Tech</span> - All Rights Reserved</h2>
            </div>
            {!!img_svg('patment-icon1.webp','h-8 w-auto',false,'assets/image')!!}
        </div>
    </div>
</footer>