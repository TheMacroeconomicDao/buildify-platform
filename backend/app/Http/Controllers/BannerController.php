<?php

namespace App\Http\Controllers;


use App\Services\BannerService;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    protected BannerService $bannerService;

    public function __construct(BannerService $bannerService)
    {
        $this->bannerService = $bannerService;
    }

    public function index(): JsonResponse
    {
        $banners = $this->bannerService->getAllBanners();

        return response()->json([
            'success' => true,
            'result' => $banners,
        ]);
    }

    // public function store(Request $request)
    // {
    //     $request->validate([
    //         'name' => 'required|string|max:255',
    //         'description' => 'nullable|string',
    //         'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
    //         'status' => 'required|in:active,inactive',
    //     ]);

    //     $banner = $this->bannerService->createBanner($request->all());
    //     return response()->json($banner, 201);
    // }

    // public function show($id)
    // {
    //     $banner = $this->bannerService->getBannerById($id);
    //     return response()->json($banner);
    // }

    // public function update(Request $request, $id)
    // {
    //     $request->validate([
    //         'name' => 'sometimes|required|string|max:255',
    //         'description' => 'nullable|string',
    //         'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
    //         'status' => 'sometimes|required|in:active,inactive',
    //     ]);

    //     $banner = $this->bannerService->updateBanner($id, $request->all());
    //     return response()->json($banner);
    // }

    // public function destroy($id)
    // {
    //     $this->bannerService->deleteBanner($id);
    //     return response()->json(null, 204);
    // }
}
