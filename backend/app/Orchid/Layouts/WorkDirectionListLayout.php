<?php

namespace App\Orchid\Layouts;

use App\Models\WorkDirection;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class WorkDirectionListLayout extends Table
{
    /**
     * Data source.
     *
     * The name of the key to fetch it from the query.
     * The results of which will be elements of the table.
     *
     * @var string
     */
    protected $target = 'work_directions';

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
                ->render(function (WorkDirection $direction) {
                    return Link::make($direction->key)
                        ->route('platform.work-directions.edit', $direction->id);
                }),

            TD::make('icon', 'Icon')
                ->render(function (WorkDirection $direction) {
                    if ($direction->icon) {
                        $iconMap = [
                            'construction' => '🏗️',
                            'home' => '🏠',
                            'repair' => '🔨',
                            'design' => '📐',
                            'cleaning' => '🧹',
                            'gardening' => '🌱',
                            'moving' => '📦',
                            'security' => '🔒',
                            'technology' => '💻',
                            'automotive' => '🚗',
                            'beauty' => '💅',
                            'education' => '📚',
                            'health' => '⚕️',
                            'business' => '💼',
                            'entertainment' => '🎭',
                        ];
                        $emoji = $iconMap[$direction->icon] ?? $direction->icon;
                        return "<span style='font-size: 24px;'>{$emoji}</span>";
                    }
                    return '<span style="color: #ccc;">No icon</span>';
                })
                ->width('80px'),

            TD::make('name', 'Name')
                ->render(function (WorkDirection $direction) {
                    $names = [];
                    foreach ($direction->name as $locale => $name) {
                        $names[] = "<strong>$locale:</strong> $name";
                    }
                    return implode('<br>', $names);
                }),

            TD::make('work_types_count', 'Types Count')
                ->render(function (WorkDirection $direction) {
                    return $direction->work_types_count ?? 0;
                }),

            TD::make('sort_order', 'Sort Order')
                ->sort()
                ->width('120px'),

            TD::make('is_active', 'Status')
                ->render(function (WorkDirection $direction) {
                    return $direction->is_active 
                        ? '<span class="badge bg-success">Active</span>'
                        : '<span class="badge bg-danger">Inactive</span>';
                })
                ->width('100px'),

            TD::make('created_at', 'Created')
                ->render(function (WorkDirection $direction) {
                    return $direction->created_at->format('d.m.Y H:i');
                })
                ->sort()
                ->width('150px'),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (WorkDirection $direction) {
                    return DropDown::make()
                        ->icon('bs.three-dots-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.work-directions.edit', $direction->id)
                                ->icon('bs.pencil'),

                            Button::make(__('Delete'))
                                ->icon('bs.trash3')
                                ->confirm(__('Are you sure you want to delete this work direction?'))
                                ->method('remove')
                                ->parameters([
                                    'id' => $direction->id,
                                ]),
                        ]);
                }),
        ];
    }
}