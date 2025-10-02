<?php

namespace App\Orchid\Layouts;

use App\Models\WorkType;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class WorkTypeListLayout extends Table
{
    /**
     * Data source.
     *
     * The name of the key to fetch it from the query.
     * The results of which will be elements of the table.
     *
     * @var string
     */
    protected $target = 'work_types';

    /**
     * Get the table cells to be displayed.
     *
     * @return TD[]
     */
    protected function columns(): iterable
    {
        return [
            TD::make('id', 'ID')
                ->sort()
                ->cantHide()
                ->width('80px'),

            TD::make('key', 'Key')
                ->sort()
                ->cantHide()
                ->render(function (WorkType $type) {
                    return Link::make($type->key)
                        ->route('platform.work-types.edit', $type->id);
                }),

            TD::make('work_direction', 'Direction')
                ->render(function (WorkType $type) {
                    return $type->workDirection->getLocalizedName('en');
                }),

            TD::make('icon', 'Icon')
                ->render(function (WorkType $type) {
                    if ($type->icon) {
                        $iconMap = [
                            'construction' => '🏗️',
                            'home' => '🏠',
                            'plumbing' => '🔧',
                            'electrical' => '⚡',
                            'painting' => '🎨',
                            'cleaning' => '🧹',
                            'gardening' => '🌱',
                            'repair' => '🔨',
                            'design' => '📐',
                            'renovation' => '🏘️',
                            'bathroom' => '🚿',
                            'kitchen' => '🍳',
                            'flooring' => '🪟',
                            'roofing' => '🏠',
                            'hvac' => '🌡️',
                            'security' => '🔒',
                            'moving' => '📦',
                            'furniture' => '🪑',
                            'lighting' => '💡',
                            'windows' => '🪟',
                            'doors' => '🚪',
                            'tiles' => '🧱',
                            'wallpaper' => '🖼️',
                            'carpet' => '🪚',
                            'marble' => '⚪',
                            'wood' => '🌳',
                            'metal' => '⚙️',
                            'glass' => '🔍',
                            'stone' => '🪨',
                        ];
                        $emoji = $iconMap[$type->icon] ?? $type->icon;
                        return "<span style='font-size: 24px;'>{$emoji}</span>";
                    }
                    return '<span style="color: #ccc;">No icon</span>';
                })
                ->width('80px'),

            TD::make('name', 'Name')
                ->render(function (WorkType $type) {
                    $names = [];
                    foreach ($type->name as $locale => $name) {
                        $names[] = "<strong>$locale:</strong> $name";
                    }
                    return implode('<br>', $names);
                }),

            TD::make('sort_order', 'Sort Order')
                ->sort()
                ->width('120px'),

            TD::make('is_active', 'Status')
                ->render(function (WorkType $type) {
                    return $type->is_active 
                        ? '<span class="badge bg-success">Active</span>'
                        : '<span class="badge bg-danger">Inactive</span>';
                })
                ->width('100px'),

            TD::make('created_at', 'Created')
                ->render(function (WorkType $type) {
                    return $type->created_at->format('d.m.Y H:i');
                })
                ->sort()
                ->width('150px'),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (WorkType $type) {
                    return DropDown::make()
                        ->icon('bs.three-dots-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.work-types.edit', $type->id)
                                ->icon('bs.pencil'),

                            Button::make(__('Delete'))
                                ->icon('bs.trash3')
                                ->confirm(__('Are you sure you want to delete this work type?'))
                                ->method('remove')
                                ->parameters([
                                    'id' => $type->id,
                                ]),
                        ]);
                }),
        ];
    }
}