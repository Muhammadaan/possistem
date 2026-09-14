<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ResolvesBranch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ResolvesBranch;

    public function index(): Response
    {
        $branch = $this->resolveBranch(request());
        $today = now()->toDateString();

        $salesToday = Sale::forBranch($branch->id)->whereDate('sale_date', $today);
        $omzet = (float) $salesToday->sum('total');
        $profit = (float) SaleItem::whereIn('sale_id', Sale::forBranch($branch->id)->whereDate('sale_date', $today)->pluck('id'))->sum('profit');

        return Inertia::render('dashboard-pos', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'omzetToday' => $omzet,
            'profitToday' => $profit,
            'marginToday' => $omzet > 0 ? round($profit / $omzet * 100, 2) : 0,
            'lowStocks' => Product::forBranch($branch->id)->orderBy('stock')->limit(10)->get(),
        ]);
    }
}
