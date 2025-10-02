<?php

return [
    'directions' => [
        'repair_and_construction' => 'Repair and construction', //Ремонт и строительство
        'interior_design' => 'Interior design', //Дизайн интерьеров
        'architecture_interior_landscape' => 'Architecture, interior, landscape', //Архитектура, интерьер, ландшафт
        'cleaning' => 'Cleaning', //Клининг
    ],
    'types' => [
        'turnkey_renovation' => 'Turnkey renovation', //Ремонт под ключ
        'renovation_of_one_room' => 'Renovation of one room', //Ремонт одной комнаты
        'bathroom_renovation' => 'Bathroom renovation', //Ремонт ванной
        'handyman_by_hour' => 'Handyman by the hour', //Мастер на час
        'ceilings' => 'Ceilings', //Потолки
        'floors' => 'Floors', //Полы
        'tiling' => 'Tiling', //Плиточные работы
        'furniture_assembly_and_repair' => 'Furniture assembly and repair', //Сборка и ремонт мебели
        'installation_and_repair_of_doors_locks' => 'Installation and repair of doors, locks', //Установка и ремонт дверей, замков
        'windows_glazing_balconies' => 'Windows, glazing, balconies', //Окна, остекление, балконы
        'roofing_and_facade_works' => 'Roofing and facade works', //Кровельные и фасадные работы
        'heating_water_supply_sewerage' => 'Heating, water supply, sewerage', //Отопление, водоснабжение, канализация
        'insulation_works' => 'Insulation works', //Изоляционные работы
        'building_and_assembly_works' => 'Building and assembly works', //Строительно-монтажные работы
        'large_scale_construction' => 'Large-scale construction', //Крупное строительство
        'security_systems' => 'Security systems', //Охранные системы
        'lock_opening' => 'Lock opening', //Вскрытие замков
        'finishing_works' => 'Finishing works', //Отделочные работы
        'plumbing_works' => 'Plumbing works', //Сантехнические работы
        'electrical_works' => 'Electrical works', //Электромонтажные работы
        'repair_and_maintenance_of_air_conditioners' => 'Repair and maintenance of air conditioners', //Ремонт и обслуживание кондиционеров
        'other_repair_and_construction' => 'Other', //Другое
        'interior_design' => 'Interior design', //Дизайн интерьеров
        'architecture_interior_landscape' => 'Architecture, interior, landscape', //Архитектура, интерьер, ландшафт
        'maintenance_cleaning' => 'Maintenance cleaning', //Поддерживающая уборка
        'general_cleaning' => 'General cleaning', //Генеральная уборка
        'window_washing' => 'Window washing', //Мытье окон
        'taking_out_trash' => 'Taking out the trash', //Вынос мусора
        'ironing' => 'Ironing', //Глажение белья
        'dry_cleaning' => 'Dry cleaning', //Химчистка
        'work_in_garden_vegetable_garden_allotment' => 'Work in the garden, vegetable garden, allotment', //Работы в саду, огороде, на участке
        'other_cleaning' => 'Other', //Другое
    ],
    'validation' => [
        'required' => 'Settings required.',
        'array' => 'Settings must be an array.',
        '*.direction.required' => 'Direction is required.',
        '*.direction.string' => 'Direction must be a string.',
        '*.direction.in' => 'Unknown direction.',
        '*.types.required' => 'Types is required.',
        '*.types.array' => 'Types must be an array.',
        '*.types.*.required' => 'Type must be a string.',
        '*.types.*.string' => 'Type must be a string.',
        '*.types.*.in' => 'Unknown type.',
    ],
    'exceptions' => [
        'direction_not_found' => 'Work direction not found.',
        'type_not_found' => 'Work type not found.',
    ],
];
