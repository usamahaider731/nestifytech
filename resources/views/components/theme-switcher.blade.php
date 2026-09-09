@php
    $colorThemes = $setting['color']['color_types']['value'] ?? [];
    $activeColorType = $setting['color']['color_type']['value'] ?? '';
@endphp

@if (!empty($colorThemes))
    <div
        id="theme-switcher-root"
        data-themes='@json($colorThemes)'
        data-default="{{ $activeColorType }}"
    ></div>
@endif
