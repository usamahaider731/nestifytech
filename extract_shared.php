<?php
$combinations = [
    [
        'id' => 1,
        'attributes' => [
            ['key' => 'Size', 'value' => '39'],
            ['key' => 'Material', 'value' => 'Cotton']
        ]
    ],
    [
        'id' => 2,
        'attributes' => [
            ['key' => 'Size', 'value' => '40'],
            ['key' => 'Material', 'value' => 'Cotton']
        ]
    ],
    [
        'id' => 3,
        'attributes' => [
            ['key' => 'Size', 'value' => '41'],
            ['key' => 'Material', 'value' => 'Cotton']
        ]
    ]
];

if (!empty($combinations)) {
    $firstComboAttrs = $combinations[0]['attributes'];
    $sharedAttributes = [];

    foreach ($firstComboAttrs as $attr) {
        $isShared = true;
        foreach ($combinations as $combo) {
            $found = false;
            foreach ($combo['attributes'] as $cAttr) {
                if ($cAttr['key'] === $attr['key'] && $cAttr['value'] === $attr['value']) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $isShared = false;
                break;
            }
        }
        
        if ($isShared) {
            $sharedAttributes[] = $attr;
        }
    }

    // Remove shared attributes from all combos
    foreach ($combinations as &$combo) {
        $combo['attributes'] = array_filter($combo['attributes'], function($cAttr) use ($sharedAttributes) {
            foreach ($sharedAttributes as $sAttr) {
                if ($cAttr['key'] === $sAttr['key'] && $cAttr['value'] === $sAttr['value']) {
                    return false;
                }
            }
            return true;
        });
        $combo['attributes'] = array_values($combo['attributes']); // reindex
    }
}

echo "Shared:\n";
print_r($sharedAttributes);
echo "Combinations:\n";
print_r($combinations);

