<?php

namespace App\Orchid\Layouts\Executor;

use App\Models\User;
use App\Models\UserWork;
use App\Models\WorkDirection;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Fields\Group;
use Orchid\Screen\Fields\Label;
use Orchid\Screen\Layouts\Rows;

class WorkLayout extends Rows
{
    public function __construct()
    {
        $this->title = __('User works');
    }

    /**
     * @var User|null
     */
    private ?User $executor = null;

    protected function fields(): iterable
    {
        $this->executor = $this->query->get('executor');

        $result = [];

        $executorWorks = [];
        if ($this->executor !== null) {
            $executorWorks = $this->executor->works()->get()->map(function (UserWork $work) {
                return $work->direction . '.' . $work->type;
            })->toArray();
        }

        $directions = WorkDirection::active()->ordered()->with('activeWorkTypes')->get();
        
        foreach ($directions as $direction) {
            $checkboxList = [];

            // Добавляем заголовок категории отдельно
            $result[] = Group::make([
                Label::make('category_' . $direction->key)
                    ->title($direction->getLocalizedName('en'))
                    ->value('')
            ])->fullWidth();

            foreach ($direction->activeWorkTypes as $workType) {
                $checkbox = Checkbox::make('works.' . $direction->key . '.' . $workType->key)
                    ->value(in_array($direction->key . '.' . $workType->key, $executorWorks))
                    ->placeholder($workType->getLocalizedName('en'))
                    ->sendTrueOrFalse();

                $checkboxList[] = $checkbox;
            }

            if (empty($checkboxList)) {
                continue;
            }

            // Разделяем чекбоксы на группы по 4 элемента для лучшего переноса
            $chunkedCheckboxes = array_chunk($checkboxList, 4);
            
            foreach ($chunkedCheckboxes as $chunk) {
                $result[] = Group::make($chunk)
                    ->fullWidth();
            }
        }

        return $result;
    }
}
