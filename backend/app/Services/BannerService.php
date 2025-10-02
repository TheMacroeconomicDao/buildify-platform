<?php
namespace App\Services;

use App\Models\Banner;
use Illuminate\Support\Facades\Storage;

class BannerService
{
    public function getAllBanners()
    {
        return Banner::with('image')->orderBy('id', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'image' => $item->image_url,
                'status' => $item->status,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });
    }

    public function getBannerById($id)
    {
        return Banner::findOrFail($id);
    }

    public function createBanner(array $data)
    {
        if (isset($data['image'])) {
            $data['image'] = $data['image']->store('banners', 'public');
        }

        return Banner::create($data);
    }

    public function updateBanner($id, array $data)
    {
        $banner = Banner::findOrFail($id);

        if (isset($data['image'])) {
            Storage::delete('public/' . $banner->image);
            $data['image'] = $data['image']->store('banners', 'public');
        }

        $banner->update($data);
        return $banner;
    }

    public function deleteBanner($id)
    {
        $banner = Banner::findOrFail($id);
        Storage::delete('public/' . $banner->image);
        $banner->delete();
    }
}
