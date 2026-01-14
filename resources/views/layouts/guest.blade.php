<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf_token" content="{{ csrf_token() }}" />
    <link rel="icon" type="image/png" href="{{ url('storage/upload/'.$settings->favicon['filename']) }}">
    <title>Laravel</title>
    <link rel="stylesheet" href="{{route('assets.colors')}}?ver={{$settings->version}}">
    @vite('resources/css/front.css')
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bokor&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Teko:wght@300..700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{url('assets/awesome/line awesome/css/line-awesome.min.css')}}">
    <link rel="stylesheet" href="{{url('assets/awesome/font awesome/css/font-awesome.min.css')}}">
    <script src="{{url('assets/jquery-3.7.1/jquery-3.7.1.js')}}"></script>
    <script src="{{url('assets/js/auth.js?v=time()')}}"></script>
    <script>
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf_token"]').attr('content')
            }
        });
    </script>
</head>
<body class="overflow-x-hidden">
    @yield('auth')
</body>
</html>