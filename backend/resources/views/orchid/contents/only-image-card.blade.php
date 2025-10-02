<div class="d-sm-flex flex-row flex-wrap align-items-center" style="min-width: 200px">
    @empty(!$image)
        <span class="thumb-lg avatar me-sm-3 ms-md-0 me-xl-3 d-none d-md-inline-block">
              <img src="{{ $image }}" class="bg-light">
            </span>
    @endempty
</div>
