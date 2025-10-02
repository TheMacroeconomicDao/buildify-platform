@if(isset($report_data))
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">{{ $report_data['title'] ?? 'Report' }}</h4>
                <p class="text-muted mb-0">Period: {{ $report_data['period'] ?? 'Not specified' }}</p>
            </div>
            <div class="card-body">
                @if(isset($report_data['metrics']) && is_array($report_data['metrics']))
                    <div class="row">
                        @foreach($report_data['metrics'] as $label => $value)
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h3 class="text-primary mb-1">{{ $value }}</h3>
                                        <p class="text-muted mb-0 small">{{ $label }}</p>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="text-center py-5">
                        <div class="text-muted">
                            <i class="fas fa-chart-bar fa-3x mb-3"></i>
                            <h5>Select parameters and click "Generate Report"</h5>
                            <p>To view data, select report type and period</p>
                        </div>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>

@if(isset($report_data['details']))
<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Detailed Information</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                @foreach(array_keys($report_data['details'][0] ?? []) as $header)
                                    <th>{{ ucfirst($header) }}</th>
                                @endforeach
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($report_data['details'] ?? [] as $row)
                                <tr>
                                    @foreach($row as $cell)
                                        <td>{{ $cell }}</td>
                                    @endforeach
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endif

@else
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body text-center py-5">
                <div class="text-muted">
                    <i class="fas fa-file-alt fa-3x mb-3"></i>
                    <h5>Report Generator</h5>
                    <p>Select report type and period to generate statistics</p>
                </div>
            </div>
        </div>
    </div>
</div>
@endif
